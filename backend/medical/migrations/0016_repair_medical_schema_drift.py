import copy

from django.conf import settings
from django.db import migrations
from django.utils import timezone


def _table_columns(connection, table_name):
    with connection.cursor() as cursor:
        return {
            column.name
            for column in connection.introspection.get_table_description(cursor, table_name)
        }


def _add_field_if_missing(apps, schema_editor, model_name, field_name, default=None):
    model = apps.get_model("medical", model_name)
    field = copy.deepcopy(model._meta.get_field(field_name))
    table_name = model._meta.db_table

    if field.column in _table_columns(schema_editor.connection, table_name):
        return

    if default is not None:
        field.default = default

    schema_editor.add_field(model, field)


def repair_schema_drift(apps, schema_editor):
    accident_fields = [
        "created_by",
        "victime_salaire",
        "activite_service",
        "moment_travail",
        "arret_travail",
        "statut_declaration",
        "generated_at",
        "printed_at",
        "updated_at",
    ]
    for field_name in accident_fields:
        default = timezone.now if field_name == "updated_at" else None
        _add_field_if_missing(
            apps,
            schema_editor,
            "AccidentTravail",
            field_name,
            default=default,
        )

    stock_fields = [
        "libelle",
        "forme",
        "dosage",
        "categorie",
        "date_expiration",
        "description",
        "actif",
        "updated_at",
    ]
    for field_name in stock_fields:
        default = timezone.now if field_name == "updated_at" else None
        _add_field_if_missing(
            apps,
            schema_editor,
            "StockItem",
            field_name,
            default=default,
        )

    dossier_fields = [
        "groupe_sanguin",
        "allergies",
        "traitements_en_cours",
        "observations",
        "statut",
    ]
    for field_name in dossier_fields:
        _add_field_if_missing(apps, schema_editor, "DossierMedical", field_name)

    maladie_fields = [
        "created_by",
        "date_debut_exposition",
        "date_fin_exposition",
        "observations",
        "statut_declaration",
        "generated_at",
        "printed_at",
        "created_at",
        "updated_at",
    ]
    for field_name in maladie_fields:
        default = timezone.now if field_name in {"created_at", "updated_at"} else None
        _add_field_if_missing(
            apps,
            schema_editor,
            "MaladieProfessionnelle",
            field_name,
            default=default,
        )


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("medical", "0015_merge_20260406_1458"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(repair_schema_drift, migrations.RunPython.noop),
    ]
