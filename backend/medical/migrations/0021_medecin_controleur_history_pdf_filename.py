from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("medical", "0020_incident_sans_bon_details"),
    ]

    operations = [
        migrations.AddField(
            model_name="controlemedicalrecord",
            name="pdf_filename",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="demandeexpertiserecord",
            name="pdf_filename",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
