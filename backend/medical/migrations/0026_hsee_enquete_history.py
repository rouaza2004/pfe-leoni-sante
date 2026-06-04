from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def _iso(value):
    if value is None:
        return ""
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def _full_name(*parts):
    return " ".join(str(part).strip() for part in parts if str(part or "").strip())


def _plans_for_accident(PlanActionHSEE, accident):
    if not accident:
        return []
    return [
        {
            "id": action.id,
            "correctiveAction": action.action or "",
            "responsable": action.responsable or "",
            "dateLimite": _iso(action.delai),
            "statut": action.statut or "",
        }
        for action in PlanActionHSEE.objects.filter(accident_id=accident.pk).order_by(
            "created_at",
            "id",
        )
    ]


def _detail_from_enquete(enquete, accident, collaborateur):
    return {
        "general": {
            "victimeNom": enquete.victime_nom_prenom or "",
            "victimeMatricule": enquete.victime_matricule or "",
            "departement": enquete.victime_appartenance
            or getattr(collaborateur, "departement", "")
            or "",
            "posteShift": enquete.victime_horaire_travail or "",
            "dateIncident": _iso(enquete.date_accident),
            "heureIncident": _iso(enquete.heure_accident),
            "lieuIncident": enquete.lieu_accident or "",
            "descriptionIncident": enquete.circonstances_accident or "",
        },
        "lesion": {
            "natureLesion": getattr(accident, "nature_lesion", "") or "",
            "agentMateriel": getattr(accident, "agent_materiel", "") or "",
            "causeIdentifiee": getattr(accident, "cause", "") or "",
            "presenceStandard": getattr(accident, "presence_standard", "") or "",
            "respectStandard": getattr(accident, "respect_standard", "") or "",
            "actionImmediate": getattr(accident, "action_immediate", "") or "",
            "siegeLesion": enquete.siege_type_lesion
            or getattr(accident, "siege_lesion", "")
            or "",
        },
        "causes": {
            "why1": getattr(accident, "why1", "") or "",
            "why2": getattr(accident, "why2", "") or "",
            "why3": getattr(accident, "why3", "") or "",
            "why4": getattr(accident, "why4", "") or "",
            "why5": getattr(accident, "why5", "") or "",
            "methode": getattr(accident, "ishikawa_methode", "") or "",
            "mainDoeuvre": getattr(accident, "ishikawa_main_oeuvre", "") or "",
            "materiel": getattr(accident, "ishikawa_materiel", "") or "",
            "milieu": getattr(accident, "ishikawa_milieu", "") or "",
            "matiere": getattr(accident, "ishikawa_matiere", "") or "",
        },
    }


def _detail_from_accident(accident, collaborateur):
    victime = _full_name(
        accident.victime_prenom or getattr(collaborateur, "prenom", ""),
        accident.victime_nom or getattr(collaborateur, "nom", ""),
    )
    matricule = getattr(collaborateur, "matricule", "") or f"AT-{accident.pk}"
    return {
        "general": {
            "victimeNom": victime,
            "victimeMatricule": matricule,
            "departement": accident.activite_service or accident.segment or "",
            "posteShift": accident.victime_poste_accident or "",
            "dateIncident": _iso(accident.date_accident),
            "heureIncident": _iso(accident.heure_accident),
            "lieuIncident": accident.lieu_accident or "",
            "descriptionIncident": accident.description_circonstances
            or accident.circonstances
            or "",
        },
        "lesion": {
            "natureLesion": accident.nature_lesion or "",
            "agentMateriel": accident.agent_materiel or "",
            "causeIdentifiee": accident.cause or "",
            "presenceStandard": accident.presence_standard or "",
            "respectStandard": accident.respect_standard or "",
            "actionImmediate": accident.action_immediate or "",
            "siegeLesion": accident.siege_lesion or "",
        },
        "causes": {
            "why1": accident.why1 or "",
            "why2": accident.why2 or "",
            "why3": accident.why3 or "",
            "why4": accident.why4 or "",
            "why5": accident.why5 or "",
            "methode": accident.ishikawa_methode or "",
            "mainDoeuvre": accident.ishikawa_main_oeuvre or "",
            "materiel": accident.ishikawa_materiel or "",
            "milieu": accident.ishikawa_milieu or "",
            "matiere": accident.ishikawa_matiere or "",
        },
    }


def backfill_hitory_enquete(apps, schema_editor):
    AccidentTravail = apps.get_model("medical", "AccidentTravail")
    EnqueteInitialeAccident = apps.get_model("medical", "EnqueteInitialeAccident")
    PlanActionHSEE = apps.get_model("medical", "PlanActionHSEE")
    HSEEEnqueteHistory = apps.get_model("medical", "HSEEEnqueteHistory")

    for enquete in (
        EnqueteInitialeAccident.objects.filter(sent_to_hsee=True)
        .select_related("accident", "dossier__collaborateur", "created_by")
        .order_by("created_at", "id")
    ):
        accident = enquete.accident
        dossier = enquete.dossier
        collaborateur = getattr(dossier, "collaborateur", None)
        detail = _detail_from_enquete(enquete, accident, collaborateur)
        general = detail["general"]
        lesion = detail["lesion"]

        HSEEEnqueteHistory.objects.get_or_create(
            enquete_initiale_id=enquete.pk,
            defaults={
                "accident_id": getattr(accident, "pk", None),
                "dossier_id": getattr(dossier, "pk", None),
                "created_by_id": enquete.created_by_id,
                "date": enquete.date_accident,
                "victime": general["victimeNom"] or "Victime non renseignee",
                "matricule": general["victimeMatricule"] or f"ENQ-{enquete.pk}",
                "departement": general["departement"],
                "nature": lesion["natureLesion"],
                "siege": lesion["siegeLesion"],
                "actions": _plans_for_accident(PlanActionHSEE, accident),
                "detail": detail,
            },
        )

    existing_accident_ids = set(
        HSEEEnqueteHistory.objects.exclude(accident_id__isnull=True).values_list(
            "accident_id",
            flat=True,
        )
    )
    for accident in (
        AccidentTravail.objects.filter(envoye_hsee=True)
        .exclude(id__in=existing_accident_ids)
        .select_related("dossier__collaborateur", "created_by")
        .order_by("created_at", "id")
    ):
        dossier = accident.dossier
        collaborateur = getattr(dossier, "collaborateur", None)
        detail = _detail_from_accident(accident, collaborateur)
        general = detail["general"]
        lesion = detail["lesion"]

        HSEEEnqueteHistory.objects.create(
            accident_id=accident.pk,
            dossier_id=getattr(dossier, "pk", None),
            created_by_id=accident.created_by_id,
            date=accident.date_accident,
            victime=general["victimeNom"] or "Victime non renseignee",
            matricule=general["victimeMatricule"] or f"AT-{accident.pk}",
            departement=general["departement"],
            nature=lesion["natureLesion"],
            siege=lesion["siegeLesion"],
            actions=_plans_for_accident(PlanActionHSEE, accident),
            detail=detail,
        )


class Migration(migrations.Migration):

    dependencies = [
        ("medical", "0025_backfill_hsee_history_enquetes"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="HSEEEnqueteHistory",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("date", models.DateField(db_index=True)),
                ("victime", models.CharField(max_length=255)),
                ("matricule", models.CharField(db_index=True, max_length=50)),
                ("departement", models.CharField(blank=True, default="", max_length=150)),
                ("nature", models.CharField(blank=True, default="", max_length=255)),
                ("siege", models.CharField(blank=True, default="", max_length=255)),
                ("actions", models.JSONField(blank=True, default=list)),
                ("detail", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "accident",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="hsee_history_records",
                        to="medical.accidenttravail",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="hsee_enquete_history_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "dossier",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="hsee_history_records",
                        to="medical.dossiermedical",
                    ),
                ),
                (
                    "enquete_initiale",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="hsee_history_records",
                        to="medical.enqueteinitialeaccident",
                    ),
                ),
            ],
            options={
                "db_table": "hitory_enquete",
                "ordering": ["-date", "-created_at"],
            },
        ),
        migrations.RunPython(backfill_hitory_enquete, migrations.RunPython.noop),
    ]
