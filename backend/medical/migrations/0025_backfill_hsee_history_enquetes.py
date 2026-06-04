from datetime import time

from django.db import migrations
from django.utils import timezone


def backfill_hsee_history_enquetes(apps, schema_editor):
    AccidentTravail = apps.get_model("medical", "AccidentTravail")
    EnqueteInitialeAccident = apps.get_model("medical", "EnqueteInitialeAccident")

    existing_accident_ids = set(
        EnqueteInitialeAccident.objects.exclude(accident_id__isnull=True).values_list(
            "accident_id",
            flat=True,
        )
    )
    accidents = (
        AccidentTravail.objects.filter(envoye_hsee=True)
        .exclude(id__in=existing_accident_ids)
        .select_related("dossier__collaborateur", "created_by")
    )

    for accident in accidents:
        dossier = accident.dossier
        collaborateur = getattr(dossier, "collaborateur", None)
        full_name = " ".join(
            filter(
                None,
                [
                    accident.victime_prenom or getattr(collaborateur, "prenom", ""),
                    accident.victime_nom or getattr(collaborateur, "nom", ""),
                ],
            )
        ).strip()

        EnqueteInitialeAccident.objects.create(
            accident=accident,
            dossier=dossier,
            created_by=accident.created_by,
            sent_to_hsee_by=accident.created_by,
            victime_nom_prenom=full_name or "Victime non renseignee",
            victime_matricule=getattr(collaborateur, "matricule", "") or f"AT-{accident.pk}",
            victime_appartenance=accident.activite_service or accident.segment or "",
            victime_horaire_travail=accident.victime_poste_accident or "",
            date_accident=accident.date_accident,
            heure_accident=accident.heure_accident or time(0, 0),
            lieu_accident=accident.lieu_accident or "Lieu non renseigne",
            circonstances_accident=(
                accident.description_circonstances
                or accident.circonstances
                or "Circonstances non renseignees"
            ),
            siege_type_lesion=accident.siege_lesion or "",
            statut="ENVOYE_HSEE",
            sent_to_hsee=True,
            sent_to_hsee_at=accident.generated_at or accident.updated_at or timezone.now(),
        )


class Migration(migrations.Migration):

    dependencies = [
        ("medical", "0024_merge_20260603_0030"),
    ]

    operations = [
        migrations.RunPython(backfill_hsee_history_enquetes, migrations.RunPython.noop),
    ]
