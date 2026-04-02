from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("medical", "0011_bonchauffeur_suivitransferturgence_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="dossiermedical",
            name="groupe_sanguin",
            field=models.CharField(blank=True, max_length=5, null=True),
        ),
        migrations.AddField(
            model_name="dossiermedical",
            name="allergies",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="dossiermedical",
            name="traitements_en_cours",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="dossiermedical",
            name="observations",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="dossiermedical",
            name="statut",
            field=models.CharField(
                choices=[
                    ("COMPLET", "Complet"),
                    ("EN_COURS", "En cours"),
                    ("INCOMPLET", "Incomplet"),
                ],
                default="EN_COURS",
                max_length=20,
            ),
        ),
    ]
