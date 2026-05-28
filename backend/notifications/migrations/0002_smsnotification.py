from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0006_user_nom_ar"),
        ("notifications", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="SMSNotification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("telephone", models.CharField(max_length=30)),
                ("message", models.TextField()),
                ("statut", models.CharField(choices=[("SUCCESS", "Succès"), ("FAILED", "Échec")], max_length=20)),
                ("api_response", models.JSONField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "collaborateur",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="sms_notifications",
                        to="accounts.collaborateur",
                    ),
                ),
            ],
            options={
                "db_table": "sms_notifications",
                "ordering": ["-created_at"],
            },
        ),
    ]
