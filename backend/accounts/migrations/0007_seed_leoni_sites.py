from django.db import migrations


def seed_leoni_sites(apps, schema_editor):
    Site = apps.get_model("accounts", "Site")

    for nom in ["Messadine", "Mateur 1", "Mateur 2"]:
        Site.objects.update_or_create(
            nom=nom,
            defaults={"localite": nom},
        )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0006_user_nom_ar"),
    ]

    operations = [
        migrations.RunPython(seed_leoni_sites, noop),
    ]
