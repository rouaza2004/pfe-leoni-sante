from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("medical", "0009_stockitem_medicament_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="IncidentAvecBon",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("date_bon", models.DateField()),
                ("matricule", models.CharField(blank=True, max_length=50, null=True)),
                ("nom_prenom", models.CharField(blank=True, max_length=255, null=True)),
                ("telephone", models.CharField(blank=True, max_length=30, null=True)),
                ("numero_assurance", models.CharField(blank=True, max_length=100, null=True)),
                ("date_incident", models.DateField()),
                ("destination", models.CharField(blank=True, max_length=255, null=True)),
                ("infirmier", models.CharField(blank=True, max_length=120, null=True)),
                ("cause", models.CharField(blank=True, max_length=255, null=True)),
                ("lesion", models.CharField(blank=True, max_length=255, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name="IncidentSansBon",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("heure", models.TimeField(blank=True, null=True)),
                ("matricule", models.CharField(blank=True, max_length=50, null=True)),
                ("segment", models.CharField(blank=True, max_length=120, null=True)),
                ("plant", models.CharField(blank=True, max_length=50, null=True)),
                ("nom_prenom", models.CharField(blank=True, max_length=255, null=True)),
                ("poste", models.CharField(blank=True, max_length=255, null=True)),
                ("mode_lesion", models.CharField(blank=True, max_length=255, null=True)),
                ("agent_causal", models.CharField(blank=True, max_length=255, null=True)),
                ("telephone", models.CharField(blank=True, max_length=30, null=True)),
                ("infirmier", models.CharField(blank=True, max_length=120, null=True)),
                ("remarque", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]

