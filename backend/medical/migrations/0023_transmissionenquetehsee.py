from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("medical", "0022_seed_sent_hsee_enquetes"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="TransmissionEnqueteHSEE",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("numero_enquete", models.CharField(max_length=120)),
                ("type_enquete", models.CharField(max_length=120)),
                ("date_accident", models.DateField()),
                ("site", models.CharField(max_length=120)),
                ("responsable", models.CharField(max_length=255)),
                ("niveau_gravite", models.CharField(blank=True, max_length=50, null=True)),
                ("priorite", models.CharField(blank=True, max_length=50, null=True)),
                ("urgent", models.BooleanField(default=False)),
                ("commentaire_transmission", models.TextField()),
                ("document", models.FileField(blank=True, null=True, upload_to="hsee_transmissions/")),
                (
                    "transmission_status",
                    models.CharField(
                        choices=[
                            ("BROUILLON", "Brouillon"),
                            ("EN_ATTENTE", "En attente"),
                            ("VALIDEE", "Validée"),
                            ("REJETEE", "Rejetée"),
                        ],
                        default="BROUILLON",
                        max_length=20,
                    ),
                ),
                ("sent_to_hsee", models.BooleanField(default=False)),
                ("sent_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="transmissions_hsee_creees",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]
