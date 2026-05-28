from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("medical", "0019_merge_20260424_1453"),
    ]

    operations = [
        migrations.AddField(
            model_name="incidentsansbon",
            name="date_incident",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="incidentsansbon",
            name="numero_assurance",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="incidentsansbon",
            name="destination",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="incidentsansbon",
            name="cause",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="incidentsansbon",
            name="lesion",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
