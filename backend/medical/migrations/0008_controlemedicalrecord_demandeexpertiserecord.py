from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("medical", "0007_accidenttravail_activite_lieu_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="ControleMedicalRecord",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("date", models.DateField()),
                ("matricule", models.CharField(blank=True, max_length=120, null=True)),
                ("segment", models.CharField(blank=True, max_length=120, null=True)),
                ("nom", models.CharField(blank=True, max_length=120, null=True)),
                ("prenom", models.CharField(blank=True, max_length=120, null=True)),
                ("repos_prescrit", models.CharField(blank=True, max_length=255, null=True)),
                ("avis_medecin_controleur", models.TextField(blank=True, null=True)),
                ("medecin_identifiant", models.CharField(blank=True, max_length=150, null=True)),
                ("statut", models.CharField(choices=[("EN_ATTENTE", "En attente"), ("VALIDE", "Valide"), ("REFUSE", "Refuse")], default="VALIDE", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="controles_medicaux_crees", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="DemandeExpertiseRecord",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("ville", models.CharField(blank=True, max_length=120, null=True)),
                ("date", models.DateField()),
                ("destinataire", models.TextField(blank=True, null=True)),
                ("nom", models.CharField(blank=True, max_length=120, null=True)),
                ("prenom", models.CharField(blank=True, max_length=120, null=True)),
                ("matricule_leoni", models.CharField(blank=True, max_length=120, null=True)),
                ("pieces_jointes", models.TextField(blank=True, null=True)),
                ("attachment_names", models.JSONField(blank=True, default=list)),
                ("aptitude_poste", models.CharField(blank=True, max_length=255, null=True)),
                ("autres_missions", models.TextField(blank=True, null=True)),
                ("medecin_identifiant", models.CharField(blank=True, max_length=150, null=True)),
                ("statut", models.CharField(choices=[("EN_ATTENTE", "En attente"), ("VALIDE", "Valide"), ("REFUSE", "Refuse")], default="VALIDE", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="demandes_expertise_creees", to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
