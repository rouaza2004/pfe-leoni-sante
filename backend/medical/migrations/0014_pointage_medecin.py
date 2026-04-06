from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("medical", "0013_ficheaptitude_conclusion_ficheaptitude_date_examen_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="PointageMedecin",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("date", models.DateField()),
                ("heure_arrivee", models.TimeField()),
                ("heure_depart", models.TimeField(blank=True, null=True)),
                (
                    "statut",
                    models.CharField(
                        choices=[
                            ("PRESENT", "Présent"),
                            ("ABSENT", "Absent"),
                            ("CONGE", "Congé"),
                            ("MISSION", "Mission"),
                        ],
                        default="PRESENT",
                        max_length=20,
                    ),
                ),
                ("note", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "medecin",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="pointages_medecin",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]
