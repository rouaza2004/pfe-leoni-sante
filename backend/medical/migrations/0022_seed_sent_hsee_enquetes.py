from datetime import timedelta

from django.db import migrations
from django.utils import timezone


def seed_sent_hsee_enquetes(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    AccidentTravail = apps.get_model("medical", "AccidentTravail")
    EnqueteInitialeAccident = apps.get_model("medical", "EnqueteInitialeAccident")

    infirmier = (
        User.objects.filter(role="INFIRMIER").order_by("id").first()
        or User.objects.order_by("id").first()
    )

    accidents = list(
        AccidentTravail.objects.select_related("dossier__collaborateur__site")
        .order_by("-date_accident", "-id")[:2]
    )

    for index, accident in enumerate(accidents, start=1):
        collab = getattr(getattr(accident, "dossier", None), "collaborateur", None)
        if not collab:
            continue

        sent_at = timezone.now() - timedelta(days=index)
        defaults = {
            "dossier": accident.dossier,
            "created_by": infirmier,
            "sent_to_hsee_by": infirmier,
            "victime_nom_prenom": f"{collab.nom} {collab.prenom}".strip(),
            "victime_matricule": collab.matricule,
            "victime_numero_telephone": getattr(collab, "telephone", "") or "",
            "victime_appartenance": getattr(collab, "departement", "") or "",
            "victime_horaire_travail": "3x8",
            "date_accident": accident.date_accident,
            "heure_accident": getattr(accident, "heure_accident", None),
            "lieu_accident": getattr(accident, "lieu_accident", "") or getattr(collab, "site", None) and collab.site.nom or "",
            "circonstances_accident": getattr(accident, "description_circonstances", "") or getattr(accident, "circonstances", "") or "Accident transmis a HSEE pour suivi.",
            "siege_type_lesion": getattr(accident, "siege_lesion", "") or "",
            "lieu_transport_victime": getattr(accident, "transport_hopital", "") or "Infirmerie",
            "temoins": [],
            "statut": "ENVOYE_HSEE",
            "sent_to_hsee": True,
            "sent_to_hsee_at": sent_at,
        }

        EnqueteInitialeAccident.objects.update_or_create(
            accident_id=accident.id,
            defaults=defaults,
        )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("medical", "0021_seed_other_sites_medical_profiles"),
    ]

    operations = [
        migrations.RunPython(seed_sent_hsee_enquetes, noop),
    ]
