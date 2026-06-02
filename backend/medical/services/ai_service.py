import logging
import re
import unicodedata

from django.conf import settings

import google.generativeai as genai


logger = logging.getLogger(__name__)

# IA GEMINI
GEMINI_REQUEST_TIMEOUT_SECONDS = 30
GEMINI_FALLBACK_MODELS = [
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest",
    "gemini-pro",
]


class AIServiceConfigurationError(Exception):
    pass


class AIServiceRequestError(Exception):
    pass


class AIServiceQuotaError(Exception):
    def __init__(self, message, retry_after=None):
        super().__init__(message)
        self.retry_after = retry_after


ANALYSIS_TYPE_LABELS = {
    "accident": "Accident de travail",
    "symptomes": "Symptomes medicaux",
    "rapport_hsee": "Rapport HSEE",
    "general": "Recommandations generales",
}


def _mask_api_key(value):
    if not value:
        return "absente"
    if len(value) <= 8:
        return "detectee"
    return f"{value[:4]}...{value[-4:]}"


def _normalize_model_name(model_name):
    cleaned = (model_name or "").strip()
    if not cleaned:
        return ""
    if cleaned.startswith("models/"):
        return cleaned
    return f"models/{cleaned}"


def _plain_model_name(model_name):
    normalized = _normalize_model_name(model_name)
    return normalized.replace("models/", "", 1)


def _normalize_text(value):
    normalized = unicodedata.normalize("NFKD", value or "")
    return normalized.encode("ascii", "ignore").decode("ascii").lower()


def _build_prompt(description, analysis_type):
    type_label = ANALYSIS_TYPE_LABELS.get(analysis_type, "Analyse medicale")

    return f"""
Tu es un assistant IA medical et HSEE pour une plateforme de sante au travail.
Tu reponds uniquement en francais, avec un ton professionnel, prudent et structure.

Contexte :
- Type d'analyse : {type_label}
- Description :
{description}

Consignes :
- Ne jamais affirmer un diagnostic certain.
- Signaler clairement si une evaluation medicale humaine est necessaire.
- Donner des recommandations prudentes et concretement applicables.
- Si les informations sont insuffisantes, le dire explicitement.
- Utiliser des listes courtes et claires.

Format obligatoire :

Gravite
- ...

Risques
- ...

Recommandations medicales
- ...

Actions HSEE
- ...
""".strip()


def _extract_response_text(response):
    text = (getattr(response, "text", "") or "").strip()
    if text:
        return text

    candidates = getattr(response, "candidates", None) or []
    parts = []

    for candidate in candidates:
        content = getattr(candidate, "content", None)
        if not content:
            continue
        for part in getattr(content, "parts", []) or []:
            part_text = getattr(part, "text", "") or ""
            part_text = part_text.strip()
            if part_text:
                parts.append(part_text)

    return "\n\n".join(parts).strip()


def _build_gemini_error_details(exc):
    detail = str(exc).strip()
    return detail or exc.__class__.__name__


def _is_model_not_found_error(exc):
    details = _build_gemini_error_details(exc).lower()
    return "404" in details or "not found" in details or "is not supported for generatecontent" in details


def _is_quota_error(exc):
    details = _build_gemini_error_details(exc).lower()
    return (
        "429" in details
        or "quota exceeded" in details
        or "resource_exhausted" in details
        or "rate limit" in details
        or "retry in" in details
    )


def _extract_retry_after_seconds(details):
    match = re.search(r"retry in\s+(\d+(?:\.\d+)?)s", details, flags=re.IGNORECASE)
    if not match:
        return None

    try:
        return int(float(match.group(1)))
    except (TypeError, ValueError):
        return None


def _candidate_models():
    configured_model = getattr(settings, "GEMINI_MODEL", "gemini-2.0-flash").strip() or "gemini-2.0-flash"
    ordered = [configured_model, *GEMINI_FALLBACK_MODELS]
    deduped = []
    seen = set()

    for model_name in ordered:
        plain_name = _plain_model_name(model_name)
        if not plain_name or plain_name in seen:
            continue
        seen.add(plain_name)
        deduped.append(plain_name)

    return deduped


def list_available_models():
    # DEBUG TEMPORAIRE
    api_key = getattr(settings, "GEMINI_API_KEY", "").strip()
    if not api_key:
        raise AIServiceConfigurationError(
            "La cle GEMINI_API_KEY est absente. Impossible de lister les modeles Gemini."
        )

    genai.configure(api_key=api_key)

    available_models = []
    try:
        for model in genai.list_models():
            supported_methods = list(getattr(model, "supported_generation_methods", []) or [])
            if "generateContent" not in supported_methods:
                continue

            model_name = getattr(model, "name", "") or ""
            plain_name = _plain_model_name(model_name)
            available_models.append(plain_name)
    except Exception as exc:  # pragma: no cover
        details = _build_gemini_error_details(exc)
        logger.exception("[DEBUG TEMPORAIRE][IA GEMINI] Erreur listing modeles: %s", details)
        raise AIServiceRequestError(f"Impossible de lister les modeles Gemini: {details}") from exc

    logger.warning("[DEBUG TEMPORAIRE][IA GEMINI] Modeles disponibles generateContent: %s", available_models)
    return available_models


def _call_gemini_with_model(model_name, prompt):
    normalized_model_name = _normalize_model_name(model_name)
    model = genai.GenerativeModel(model_name=normalized_model_name)
    response = model.generate_content(
        prompt,
        request_options={"timeout": GEMINI_REQUEST_TIMEOUT_SECONDS},
    )
    analysis = _extract_response_text(response)

    if not analysis:
        feedback = getattr(response, "prompt_feedback", None)
        finish_reason = None
        candidates = getattr(response, "candidates", None) or []
        if candidates:
            finish_reason = getattr(candidates[0], "finish_reason", None)

        details = f"Le modele {_plain_model_name(model_name)} n'a retourne aucun texte exploitable."
        if finish_reason:
            details = f"{details} finish_reason={finish_reason}"
        if feedback:
            details = f"{details} prompt_feedback={feedback}"
        raise AIServiceRequestError(details)

    return analysis.strip(), _plain_model_name(model_name)


def _format_analysis(gravity, risks, medical_recommendations, hsee_actions):
    return "\n".join(
        [
            "Gravite",
            f"- {gravity}",
            "",
            "Risques",
            *[f"- {item}" for item in risks],
            "",
            "Recommandations medicales",
            *[f"- {item}" for item in medical_recommendations],
            "",
            "Actions HSEE",
            *[f"- {item}" for item in hsee_actions],
        ]
    ).strip()


def _build_default_fallback(description):
    return _format_analysis(
        "A evaluer selon les symptomes decrits et le contexte de travail.",
        [
            "Aggravation des symptomes si la situation n'est pas prise en charge rapidement.",
            "Complication medicale non detectee en l'absence d'evaluation clinique.",
            "Recurrence de l'incident si la cause organisationnelle n'est pas corrigee.",
        ],
        [
            "Mettre la personne au repos et evaluer les symptomes immediats.",
            "Orienter vers le service medical si la douleur persiste, s'aggrave ou si des signes inhabituels apparaissent.",
            "Surveiller l'evolution clinique dans les heures suivant l'incident.",
        ],
        [
            "Enregistrer l'evenement dans le registre d'accident ou d'incident.",
            "Verifier les conditions de travail, les procedures et les equipements utilises.",
            "Analyser la cause immediate et la cause racine pour prevenir une recurrence.",
        ],
    )


def _keyword_rules():
    return [
        {
            "keywords": ["brulure", "brulures", "brule"],
            "gravity": "Legere a moyenne selon l'etendue, la douleur et la profondeur de la lesion.",
            "risks": [
                "Infection locale.",
                "Douleur persistante ou aggravation de la brulure.",
                "Atteinte cutanee plus profonde si l'exposition s'est prolongee.",
            ],
            "medical": [
                "Refroidir rapidement la zone avec de l'eau temperee sans glace.",
                "Nettoyer delicatement et proteger avec un pansement adapte.",
                "Consulter le medecin si la douleur est importante, si des cloques apparaissent ou si la surface atteinte est etendue.",
            ],
            "hsee": [
                "Enregistrer l'accident et documenter les circonstances.",
                "Verifier le port et l'etat des EPI adaptes.",
                "Analyser la source de chaleur ou le geste ayant conduit a la brulure.",
            ],
        },
        {
            "keywords": ["chute", "tombe", "glissade", "trebuch"],
            "gravity": "Variable de legere a grave selon le traumatisme, la hauteur de chute et les zones touchees.",
            "risks": [
                "Traumatisme osteo-articulaire ou musculaire.",
                "Commotion ou traumatisme cranien si la tete a ete touchee.",
                "Aggravation retardee de douleurs ou de saignements internes.",
            ],
            "medical": [
                "Immobiliser si douleur importante ou suspicion de fracture.",
                "Surveiller les signes neurologiques, la douleur et les vertiges.",
                "Consulter rapidement un medecin en cas de douleur intense, perte de connaissance ou incapacite a se relever.",
            ],
            "hsee": [
                "Balancer et securiser la zone de chute si necessaire.",
                "Verifier l'etat du sol, l'eclairage et les obstacles.",
                "Controler l'application des consignes de circulation et de prevention des chutes.",
            ],
        },
        {
            "keywords": ["coupure", "plaie", "coup", "tranch"],
            "gravity": "Souvent legere a moyenne, mais potentiellement grave en cas de saignement abondant ou de plaie profonde.",
            "risks": [
                "Hemorragie ou saignement prolonge.",
                "Infection de la plaie.",
                "Atteinte tendineuse ou nerveuse selon la profondeur.",
            ],
            "medical": [
                "Comprimer la plaie en cas de saignement.",
                "Nettoyer et proteger avec un pansement sterile.",
                "Consulter un medecin si la plaie est profonde, souillee ou si le saignement persiste.",
            ],
            "hsee": [
                "Identifier l'outil, la machine ou l'arete responsable.",
                "Verifier l'etat des protections, l'entretien et le port des gants adaptes.",
                "Enregistrer l'evenement et corriger la situation dangereuse.",
            ],
        },
        {
            "keywords": ["malaise", "vertige", "evanoui", "syncope"],
            "gravity": "Potentiellement serieuse car la cause peut etre medicale, metabolique, cardiaque ou environnementale.",
            "risks": [
                "Perte de connaissance et chute secondaire.",
                "Recidive rapide du malaise.",
                "Cause medicale sous-jacente necessitant une evaluation urgente.",
            ],
            "medical": [
                "Allonger la personne dans un endroit securise et aere.",
                "Surveiller conscience, respiration et signes associes.",
                "Faire evaluer rapidement par un professionnel de sante, surtout si les symptomes persistent ou recidivent.",
            ],
            "hsee": [
                "Tracer l'incident et les conditions environnantes.",
                "Verifier chaleur, ventilation, charge de travail et exposition eventuelle.",
                "Analyser les facteurs organisationnels ou environnementaux contributifs.",
            ],
        },
        {
            "keywords": ["douleur", "douleurs", "courbature", "lombalgie"],
            "gravity": "A preciser selon l'intensite, la localisation, le mecanisme et la duree.",
            "risks": [
                "Aggravation fonctionnelle si l'activite continue sans adaptation.",
                "Trouble musculo-squelettique ou lesion sous-jacente.",
                "Recurrence si le facteur de risque n'est pas corrige.",
            ],
            "medical": [
                "Mettre au repos relatif et evaluer la zone douloureuse.",
                "Consulter le service medical si la douleur est intense, persistante ou avec limitation importante.",
                "Adapter temporairement les efforts ou les gestes contraignants si necessaire.",
            ],
            "hsee": [
                "Analyser le poste, les gestes repetitifs et les manutentions.",
                "Verifier l'ergonomie du poste et les aides mecaniques disponibles.",
                "Mettre en place des mesures de prevention adaptees au poste.",
            ],
        },
        {
            "keywords": ["inhalation", "fumee", "gaz", "vapeur"],
            "gravity": "Potentiellement moyenne a grave selon la substance, la duree d'exposition et les symptomes respiratoires.",
            "risks": [
                "Irritation respiratoire ou toxique.",
                "Aggravation rapide avec dyspnee ou toux persistante.",
                "Atteinte retardee selon la nature du produit inhale.",
            ],
            "medical": [
                "Eloigner immediatement de la source et mettre a l'air libre si possible.",
                "Surveiller respiration, toux, oppression thoracique et etat general.",
                "Consulter rapidement un medecin en cas de gene respiratoire, toux persistante ou symptomes neurologiques.",
            ],
            "hsee": [
                "Identifier la substance et verifier la fiche de donnees de securite.",
                "Controler ventilation, captage et confinement de la zone.",
                "Verifier l'usage des protections respiratoires et la procedure de manipulation.",
            ],
        },
        {
            "keywords": ["produit chimique", "chimique", "acide", "solvant"],
            "gravity": "Variable, potentiellement grave selon la nature du produit et la voie d'exposition.",
            "risks": [
                "Brulure chimique ou irritation severe.",
                "Atteinte oculaire, cutanee ou respiratoire.",
                "Complications retardees selon la toxicite du produit.",
            ],
            "medical": [
                "Rincer abondamment la zone exposee selon les consignes de securite du produit.",
                "Retirer les vetements contamines si necessaire avec precautions.",
                "Consulter rapidement le medecin et transmettre l'information sur le produit implique.",
            ],
            "hsee": [
                "Identifier le produit exact et recuperer la FDS.",
                "Verifier stockage, etiquetage et procedure de manipulation.",
                "Controler les EPI et la formation associee au risque chimique.",
            ],
        },
        {
            "keywords": ["accident grave", "grave", "hemorragie", "fracture", "amputation"],
            "gravity": "Grave a critique, necessitant une prise en charge medicale urgente.",
            "risks": [
                "Complication vitale ou fonctionnelle immediate.",
                "Aggravation rapide sans prise en charge urgente.",
                "Impact humain et organisationnel majeur.",
            ],
            "medical": [
                "Alerter immediatement les secours ou le service d'urgence.",
                "Appliquer les premiers secours adaptes sans retarder la prise en charge.",
                "Faire evaluer en urgence par un medecin ou une structure d'urgence.",
            ],
            "hsee": [
                "Securiser immediatement la zone et stopper l'activite si necessaire.",
                "Preserver les elements utiles a l'enquete interne.",
                "Declencher l'analyse approfondie de l'accident et les actions correctives prioritaires.",
            ],
        },
    ]


def _build_fallback_local_analysis(description):
    normalized_description = _normalize_text(description)
    selected_rule = None

    for rule in _keyword_rules():
        if any(keyword in normalized_description for keyword in rule["keywords"]):
            selected_rule = rule
            break

    if not selected_rule:
        return _build_default_fallback(description)

    return _format_analysis(
        selected_rule["gravity"],
        selected_rule["risks"],
        selected_rule["medical"],
        selected_rule["hsee"],
    )


def analyze_medical_text(description, analysis_type="accident"):
    # DEBUG TEMPORAIRE
    api_key = getattr(settings, "GEMINI_API_KEY", "").strip()
    configured_model = getattr(settings, "GEMINI_MODEL", "gemini-2.0-flash").strip() or "gemini-2.0-flash"

    logger.warning("[DEBUG TEMPORAIRE][IA GEMINI] Cle API detectee: %s", bool(api_key))
    logger.warning("[DEBUG TEMPORAIRE][IA GEMINI] Cle API masquee: %s", _mask_api_key(api_key))
    logger.warning("[DEBUG TEMPORAIRE][IA GEMINI] Modele configure: %s", configured_model)
    logger.warning("[DEBUG TEMPORAIRE][IA GEMINI] Fallback modeles: %s", _candidate_models())

    cleaned_description = (description or "").strip()
    if not cleaned_description:
        raise AIServiceRequestError("La description est vide.")

    if not api_key:
        raise AIServiceConfigurationError(
            "La cle GEMINI_API_KEY est absente. Configurez-la dans le fichier .env du backend."
        )

    prompt = _build_prompt(cleaned_description, analysis_type)
    genai.configure(api_key=api_key)

    exact_errors = []
    quota_errors = []
    available_models = []

    try:
        available_models = list_available_models()
    except Exception as exc:  # pragma: no cover
        logger.warning("[DEBUG TEMPORAIRE][IA GEMINI] Listing modeles indisponible: %s", exc)

    candidate_models = _candidate_models()
    if available_models:
        candidate_models = [model for model in candidate_models if model in available_models]
        if not candidate_models:
            raise AIServiceRequestError(
                "Aucun modele Gemini compatible avec generateContent n'est disponible parmi les modeles configures."
            )

    for model_name in candidate_models:
        try:
            logger.warning("[DEBUG TEMPORAIRE][IA GEMINI] Tentative avec modele: %s", model_name)
            analysis, used_model = _call_gemini_with_model(model_name, prompt)
            logger.warning("[DEBUG TEMPORAIRE][IA GEMINI] Modele utilise avec succes: %s", used_model)
            return {
                "analysis": analysis,
                "source": "gemini",
            }
        except AIServiceRequestError as exc:
            details = str(exc)
            logger.exception("[DEBUG TEMPORAIRE][IA GEMINI] Erreur Gemini: %s", details)
            exact_errors.append(f"{model_name}: {details}")
            break
        except Exception as exc:  # pragma: no cover
            details = _build_gemini_error_details(exc)
            logger.exception(
                "[DEBUG TEMPORAIRE][IA GEMINI] Echec modele %s: %s",
                model_name,
                details,
            )
            exact_errors.append(f"{model_name}: {details}")

            if _is_model_not_found_error(exc):
                continue

            if _is_quota_error(exc):
                quota_errors.append(
                    {
                        "model": model_name,
                        "details": details,
                        "retry_after": _extract_retry_after_seconds(details),
                    }
                )
                continue

            raise AIServiceRequestError(details) from exc

    if quota_errors:
        retry_after = next(
            (item["retry_after"] for item in quota_errors if item.get("retry_after") is not None),
            None,
        )
        logger.warning(
            "[DEBUG TEMPORAIRE][IA GEMINI] Quota depasse, bascule vers fallback local. retry_after=%s",
            retry_after,
        )
        fallback_analysis = _build_fallback_local_analysis(cleaned_description)
        return {
            "analysis": fallback_analysis,
            "source": "fallback_local",
        }

    error_message = "Aucun modele Gemini compatible n'a fonctionne."
    if exact_errors:
        error_message = f"{error_message} Details: {' | '.join(exact_errors)}"
    raise AIServiceRequestError(error_message)


def test_gemini_connection():
    # DEBUG TEMPORAIRE
    try:
        available_models = []
        try:
            available_models = list_available_models()
        except Exception as exc:
            logger.warning("[DEBUG TEMPORAIRE][IA GEMINI] Listing modeles KO: %s", exc)

        result = analyze_medical_text(
            "Brulure legere dans atelier cablage, rougeur locale sans perte de connaissance.",
            "accident",
        )
        logger.warning("[DEBUG TEMPORAIRE][IA GEMINI] Test connexion OK. source=%s", result["source"])
        return {
            "success": True,
            "model": getattr(settings, "GEMINI_MODEL", "gemini-2.0-flash"),
            "available_models": available_models,
            "source": result["source"],
            "analysis_preview": result["analysis"][:300],
        }
    except Exception as exc:  # pragma: no cover
        logger.exception("[DEBUG TEMPORAIRE][IA GEMINI] Test connexion KO: %s", exc)
        return {
            "success": False,
            "model": getattr(settings, "GEMINI_MODEL", "gemini-2.0-flash"),
            "available_models": [],
            "error": str(exc) or exc.__class__.__name__,
        }
