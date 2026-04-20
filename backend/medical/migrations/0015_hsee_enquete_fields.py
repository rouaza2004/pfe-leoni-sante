from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("medical", "0014_pointage_medecin"),
    ]

    operations = [
        migrations.AddField(
            model_name="accidenttravail",
            name="action_immediate",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="accidenttravail",
            name="agent_materiel",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="accidenttravail",
            name="ishikawa_main_oeuvre",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="accidenttravail",
            name="ishikawa_materiel",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="accidenttravail",
            name="ishikawa_matiere",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="accidenttravail",
            name="ishikawa_methode",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="accidenttravail",
            name="ishikawa_milieu",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="accidenttravail",
            name="presence_standard",
            field=models.CharField(blank=True, max_length=10, null=True),
        ),
        migrations.AddField(
            model_name="accidenttravail",
            name="respect_standard",
            field=models.CharField(blank=True, max_length=10, null=True),
        ),
        migrations.AddField(
            model_name="accidenttravail",
            name="why1",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="accidenttravail",
            name="why2",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="accidenttravail",
            name="why3",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="accidenttravail",
            name="why4",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="accidenttravail",
            name="why5",
            field=models.TextField(blank=True, null=True),
        ),
    ]
