from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("medical", "0016_merge_20260408_0001"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="EnqueteInitialeAccident",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("victime_nom_prenom", models.CharField(max_length=255)),
                ("victime_matricule", models.CharField(max_length=50)),
                ("victime_numero_telephone", models.CharField(blank=True, max_length=30, null=True)),
                ("victime_appartenance", models.CharField(blank=True, max_length=255, null=True)),
                ("victime_horaire_travail", models.CharField(blank=True, max_length=255, null=True)),
                ("date_accident", models.DateField()),
                ("heure_accident", models.TimeField()),
                ("lieu_accident", models.CharField(max_length=255)),
                ("circonstances_accident", models.TextField()),
                ("siege_type_lesion", models.CharField(blank=True, max_length=255, null=True)),
                ("lieu_transport_victime", models.CharField(blank=True, max_length=255, null=True)),
                ("temoins", models.JSONField(blank=True, default=list)),
                ("statut", models.CharField(choices=[("BROUILLON", "Brouillon"), ("ENREGISTRE", "Enregistré"), ("ENVOYE_HSEE", "Envoyé HSEE")], default="BROUILLON", max_length=20)),
                ("sent_to_hsee", models.BooleanField(default=False)),
                ("sent_to_hsee_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("accident", models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="enquete_initiale", to="medical.accidenttravail")),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="enquetes_initiales_accident_creees", to=settings.AUTH_USER_MODEL)),
                ("dossier", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="enquetes_initiales_accident", to="medical.dossiermedical")),
                ("sent_to_hsee_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="enquetes_initiales_accident_envoyees", to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
