from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("appointments", "0003_appointment_medecin"),
        ("notifications", "0002_smsnotification"),
    ]

    operations = [
        migrations.AddField(
            model_name="notification",
            name="type",
            field=models.CharField(
                choices=[
                    ("RENDEZ_VOUS", "Rendez-vous"),
                    ("DOCUMENT", "Document"),
                    ("ALERTE", "Alerte"),
                    ("SYSTEME", "Systeme"),
                ],
                default="SYSTEME",
                max_length=30,
            ),
        ),
        migrations.AddField(
            model_name="notification",
            name="rendez_vous",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="notifications",
                to="appointments.appointment",
            ),
        ),
    ]
