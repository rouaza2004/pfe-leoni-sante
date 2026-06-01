from datetime import date

from django.db import migrations


TARGET_SITES = {"Messadine", "Mateur 1", "Mateur 2"}

SITE_PREFIXES = {
    "Messadine": "MS",
    "Mateur 1": "MT1",
    "Mateur 2": "MT2",
}

SITE_ADDRESSES = {
    "Messadine": "Rue de l'Industrie, Zone industrielle Messadine, Sousse",
    "Mateur 1": "Avenue Habib Bourguiba, Zone industrielle Mateur 1, Bizerte",
    "Mateur 2": "Route de Bizerte, Parc d'activite Mateur 2, Bizerte",
}

SITE_DOCTORS = {
    "Messadine": "Dr Salma Ben Youssef",
    "Mateur 1": "Dr Hichem Trabelsi",
    "Mateur 2": "Dr Rym Gharbi",
}

POSTES = [
    "Operateur de production",
    "Controleur qualite",
    "Technicien maintenance",
    "Agent logistique",
    "Conducteur de ligne",
    "Magasinier",
    "Operateur coupe",
    "Operateur cablage",
]

DEPARTEMENTS = [
    "Production",
    "Qualite",
    "Maintenance",
    "Logistique",
    "Assemblage",
]

EDUCATION_LEVELS = [
    "Bac",
    "BTP electrique",
    "Formation professionnelle",
    "Technicien superieur",
    "Licence appliquee",
]

BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "O+", "O-"]

ALLERGY_VALUES = [
    "Aucune allergie connue",
    "Allergie saisonniere legere",
    "Sensibilite a la poussiere",
    "Allergie mineure aux acariens",
]

TREATMENT_VALUES = [
    "Aucun traitement chronique",
    "Supplementation en vitamine D",
    "Traitement ponctuel antalgique",
    "Suivi ORL saisonnier",
]

OBSERVATION_VALUES = [
    "Suivi medical regulier recommande.",
    "Bonne adaptation au poste actuel.",
    "Aptitude maintenue avec surveillance annuelle.",
    "Condition generale stable.",
]

MEDICAL_HISTORY_VALUES = [
    "Néant",
    "Lombalgie occasionnelle sans retentissement.",
    "Migraine episodique maitrisee.",
    "Allergie saisonniere sans traitement de fond.",
]

SURGICAL_HISTORY_VALUES = [
    "Néant",
    "Appendicectomie ancienne sans sequelle.",
    "Suture main droite ancienne.",
]

GYNECO_HISTORY_VALUES = [
    "Néant",
    "Cycle regulier, sans antecedent notable.",
    "Suivi gynecologique annuel regulier.",
]

FAMILY_HISTORY_VALUES = [
    "Néant",
    "Hypertension arterielle chez un parent au premier degre.",
    "Diabete type 2 familial controle.",
]

TOBACCO_VALUES = ["Non", "Occasionnel", "Ancien fumeur sevre"]
ALCOHOL_VALUES = ["Non", "Occasionnel"]
AUTOMEDICATION_VALUES = ["Non", "Ponctuelle"]

VISION_VALUES = ["10/10", "9/10", "8/10"]
AUDITION_VALUES = ["Normale", "Legere baisse sans gene"]
CLINICAL_VALUES = ["RAS", "Sans anomalie", "Normaux"]
ABDOMEN_VALUES = ["Souple", "Sans douleur", "RAS"]
EXAM_COMPLEMENT_VALUES = [
    "Aucun",
    "Bilan biologique annuel normal",
    "Radiographie de controle sans anomalie",
]
RESULT_VALUES = ["Normal", "Satisfaisant", "Compatible avec le poste"]
APTITUDE_VALUES = [
    ("APTE", "Apte au poste avec suivi annuel."),
    ("APTE_AVEC_CONDITION", "Apte avec port d'EPI et pauses regulieres."),
]
FOLLOWUP_CONCLUSIONS = [
    "RAS",
    "Etat stable, poursuite au meme poste.",
    "Aucun element contre-indiquant le maintien au poste.",
]


def _extract_index(matricule):
    try:
        return int(str(matricule).split("-")[-1])
    except (TypeError, ValueError):
        return 1


def _site_offset(site_name):
    return {"Messadine": 3, "Mateur 1": 11, "Mateur 2": 19}.get(site_name, 0)


def _pick(values, index, offset=0):
    return values[(index - 1 + offset) % len(values)]


def _birth_date(index, offset):
    year = 1978 + ((index + offset) % 23)
    month = ((index * 2 + offset) % 12) + 1
    day = ((index * 3 + offset) % 28) + 1
    return date(year, month, day)


def _hire_date(index, offset):
    year = 2016 + ((index + offset) % 9)
    month = ((index + offset * 2) % 12) + 1
    day = ((index * 2 + offset) % 28) + 1
    return date(year, month, day)


def _exam_initial_date(index, offset):
    year = 2023 + ((index + offset) % 2)
    month = ((index + offset) % 12) + 1
    day = ((index + offset * 3) % 28) + 1
    return date(year, month, day)


def _exam_followup_date(initial_date):
    month = initial_date.month + 6
    year = initial_date.year
    if month > 12:
        month -= 12
        year += 1
    day = min(initial_date.day, 28)
    return date(year, month, day)


def _cin_value(index, offset):
    return str(10000000 + offset * 1000 + index).zfill(8)


def _phone_value(index, offset):
    prefixes = ["20", "21", "22", "24", "25", "26", "27", "28", "29", "50", "51", "52", "53", "54", "55", "58", "90", "91", "92", "93", "94", "95", "96", "97", "98", "99"]
    prefix = prefixes[(index + offset) % len(prefixes)]
    suffix = str(100000 + offset * 173 + index * 37).zfill(6)[-6:]
    return f"{prefix}{suffix}"


def _email_value(prenom, nom, matricule):
    left = f"{str(prenom).strip().lower()}.{str(nom).strip().lower()}"
    left = (
        left.replace(" ", ".")
        .replace("'", "")
        .replace("é", "e")
        .replace("è", "e")
        .replace("à", "a")
        .replace("ù", "u")
        .replace("ï", "i")
    )
    return f"{left}.{str(matricule).lower()}@leoni.tn"


def seed_other_sites_medical_profiles(apps, schema_editor):
    Collaborateur = apps.get_model("accounts", "Collaborateur")
    DossierMedical = apps.get_model("medical", "DossierMedical")
    ExamenInitial = apps.get_model("medical", "ExamenInitial")
    ExamenUlterieur = apps.get_model("medical", "ExamenUlterieur")

    queryset = (
        Collaborateur.objects.select_related("site")
        .filter(site__nom__in=TARGET_SITES)
        .order_by("site__nom", "matricule", "id")
    )

    for collaborateur in queryset:
        site_name = getattr(getattr(collaborateur, "site", None), "nom", "") or ""
        if not site_name:
            continue

        index = _extract_index(collaborateur.matricule)
        offset = _site_offset(site_name)
        poste = _pick(POSTES, index, offset)
        departement = _pick(DEPARTEMENTS, index, offset)
        birth_date = _birth_date(index, offset)
        hire_date = _hire_date(index, offset)

        collaborateur.cin = _cin_value(index, offset)
        collaborateur.date_naissance = birth_date
        collaborateur.telephone = _phone_value(index, offset)
        collaborateur.adresse = SITE_ADDRESSES[site_name]
        collaborateur.email = _email_value(collaborateur.prenom, collaborateur.nom, collaborateur.matricule)
        collaborateur.poste = poste
        collaborateur.departement = departement
        collaborateur.actif = True
        collaborateur.save(
            update_fields=[
                "cin",
                "date_naissance",
                "telephone",
                "adresse",
                "email",
                "poste",
                "departement",
                "actif",
            ]
        )

        dossier, _ = DossierMedical.objects.get_or_create(collaborateur_id=collaborateur.id)
        dossier.entreprise = "LEONI"
        dossier.localite = site_name
        dossier.date_recrutement = hire_date
        dossier.niveau_etudes_diplomes = _pick(EDUCATION_LEVELS, index, offset)
        dossier.profession = poste
        dossier.poste_travail_actuel = poste
        dossier.groupe_sanguin = _pick(BLOOD_GROUPS, index, offset)
        dossier.allergies = _pick(ALLERGY_VALUES, index, offset)
        dossier.traitements_en_cours = _pick(TREATMENT_VALUES, index, offset)
        dossier.observations = _pick(OBSERVATION_VALUES, index, offset)
        dossier.statut = "COMPLET" if index % 3 else "EN_COURS"
        dossier.antecedents_medicaux = _pick(MEDICAL_HISTORY_VALUES, index, offset)
        dossier.antecedents_chirurgicaux = _pick(SURGICAL_HISTORY_VALUES, index, offset)
        dossier.antecedents_gynecologiques = _pick(GYNECO_HISTORY_VALUES, index, offset)
        dossier.antecedents_heredofamiliaux = _pick(FAMILY_HISTORY_VALUES, index, offset)
        dossier.tabac = _pick(TOBACCO_VALUES, index, offset)
        dossier.alcool = _pick(ALCOHOL_VALUES, index, offset)
        dossier.automedication = _pick(AUTOMEDICATION_VALUES, index, offset)
        dossier.save()

        exam_initial_date = _exam_initial_date(index, offset)
        aptitude, aptitude_text = APTITUDE_VALUES[(index + offset) % len(APTITUDE_VALUES)]
        examen_initial = ExamenInitial.objects.filter(dossier_id=dossier.id).first()
        if examen_initial is None:
            examen_initial = ExamenInitial(dossier_id=dossier.id)
        examen_initial.medecin_nom = SITE_DOCTORS[site_name]
        examen_initial.date_examen = exam_initial_date
        examen_initial.poids = 55 + ((index + offset) % 26)
        examen_initial.taille = 158 + ((index * 2 + offset) % 24)
        examen_initial.vision_od_pres = _pick(VISION_VALUES, index, offset)
        examen_initial.vision_od_loin = _pick(VISION_VALUES, index + 1, offset)
        examen_initial.vision_og_pres = _pick(VISION_VALUES, index + 2, offset)
        examen_initial.vision_og_loin = _pick(VISION_VALUES, index + 3, offset)
        examen_initial.audition_od = _pick(AUDITION_VALUES, index, offset)
        examen_initial.audition_og = _pick(AUDITION_VALUES, index + 1, offset)
        examen_initial.denture = _pick(CLINICAL_VALUES, index, offset)
        examen_initial.teguments = _pick(CLINICAL_VALUES, index + 1, offset)
        examen_initial.appareil_locomoteur = _pick(CLINICAL_VALUES, index + 2, offset)
        examen_initial.appareil_respiratoire = _pick(CLINICAL_VALUES, index + 3, offset)
        examen_initial.appareil_cardio_vasculaire = _pick(CLINICAL_VALUES, index + 4, offset)
        examen_initial.pouls = str(64 + ((index + offset) % 18))
        examen_initial.tension_arterielle = f"{11 + ((index + offset) % 3)}/{7 + ((index + offset) % 2)}"
        examen_initial.abdomen = _pick(ABDOMEN_VALUES, index, offset)
        examen_initial.appareil_genito_urinaire = _pick(CLINICAL_VALUES, index + 5, offset)
        examen_initial.glandes_endocrines = _pick(CLINICAL_VALUES, index + 6, offset)
        examen_initial.systeme_nerveux = _pick(CLINICAL_VALUES, index + 7, offset)
        examen_initial.examens_complementaires = _pick(EXAM_COMPLEMENT_VALUES, index, offset)
        examen_initial.resultat_examen = _pick(RESULT_VALUES, index, offset)
        examen_initial.aptitude = aptitude
        examen_initial.precision_aptitude = aptitude_text
        examen_initial.conclusion = aptitude_text
        examen_initial.save()

        if not ExamenUlterieur.objects.filter(dossier_id=dossier.id).exists():
            examen_ulterieur = ExamenUlterieur(
                dossier_id=dossier.id,
                type_examen="PERIODIQUE",
                date=_exam_followup_date(exam_initial_date),
                medecin_nom=SITE_DOCTORS[site_name],
                poste_travail=poste,
                poids=examen_initial.poids + ((index + offset) % 3),
                taille=examen_initial.taille,
                conclusion=_pick(FOLLOWUP_CONCLUSIONS, index, offset),
            )
            examen_ulterieur.save()


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0009_fix_generated_collaborator_names"),
        ("medical", "0020_incident_sans_bon_details"),
    ]

    operations = [
        migrations.RunPython(seed_other_sites_medical_profiles, noop),
    ]
