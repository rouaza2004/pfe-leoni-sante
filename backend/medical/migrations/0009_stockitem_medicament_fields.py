from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("medical", "0008_declarations_status_and_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="stockitem",
            name="libelle",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="stockitem",
            name="forme",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="stockitem",
            name="dosage",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="stockitem",
            name="categorie",
            field=models.CharField(blank=True, max_length=120, null=True),
        ),
        migrations.AddField(
            model_name="stockitem",
            name="date_expiration",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="stockitem",
            name="description",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="stockitem",
            name="actif",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="stockitem",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
    ]
