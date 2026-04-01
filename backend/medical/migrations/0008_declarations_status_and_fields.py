from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
from django.utils import timezone


class Migration(migrations.Migration):

    dependencies = [
        ("medical", "0007_accidenttravail_activite_lieu_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="accidenttravail",
            name="created_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="accidents_travail_crees",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="accidenttravail",
            name="victime_salaire",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="accidenttravail",
            name="activite_service",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="accidenttravail",
            name="moment_travail",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="accidenttravail",
            name="arret_travail",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="accidenttravail",
            name="statut_declaration",
            field=models.CharField(
                choices=[
                    ("BROUILLON", "Brouillon"),
                    ("DECLAREE", "Déclarée"),
                    ("GENEREE", "Générée"),
                ],
                default="BROUILLON",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="accidenttravail",
            name="generated_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="accidenttravail",
            name="printed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="accidenttravail",
            name="updated_at",
            field=models.DateTimeField(default=timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="maladieprofessionnelle",
            name="created_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="maladies_professionnelles_creees",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="maladieprofessionnelle",
            name="date_debut_exposition",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="maladieprofessionnelle",
            name="date_fin_exposition",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="maladieprofessionnelle",
            name="observations",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="maladieprofessionnelle",
            name="statut_declaration",
            field=models.CharField(
                choices=[
                    ("BROUILLON", "Brouillon"),
                    ("DECLAREE", "Déclarée"),
                    ("GENEREE", "Générée"),
                ],
                default="BROUILLON",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="maladieprofessionnelle",
            name="generated_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="maladieprofessionnelle",
            name="printed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="maladieprofessionnelle",
            name="created_at",
            field=models.DateTimeField(default=timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="maladieprofessionnelle",
            name="updated_at",
            field=models.DateTimeField(default=timezone.now),
            preserve_default=False,
        ),
    ]
