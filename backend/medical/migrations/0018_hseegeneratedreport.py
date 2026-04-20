from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("medical", "0017_enqueteinitialeaccident"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="HSEEGeneratedReport",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("template_key", models.CharField(max_length=80)),
                ("template_name", models.CharField(max_length=255)),
                ("title", models.CharField(max_length=255)),
                ("reference", models.CharField(blank=True, max_length=50, unique=True)),
                ("category", models.CharField(blank=True, max_length=120, null=True)),
                ("description", models.TextField(blank=True, null=True)),
                ("status", models.CharField(choices=[("GENERATED", "Genere"), ("SCHEDULED", "Planifie"), ("SENT", "Envoye")], default="GENERATED", max_length=20)),
                ("output_format", models.CharField(choices=[("PDF", "PDF"), ("EXCEL", "Excel")], default="PDF", max_length=10)),
                ("period_value", models.CharField(blank=True, max_length=50, null=True)),
                ("period_label", models.CharField(blank=True, max_length=120, null=True)),
                ("department", models.CharField(blank=True, max_length=150, null=True)),
                ("detail_level", models.CharField(blank=True, max_length=50, null=True)),
                ("sections", models.JSONField(blank=True, default=list)),
                ("parameters", models.JSONField(blank=True, default=dict)),
                ("file_path", models.CharField(blank=True, max_length=500, null=True)),
                ("preview_path", models.CharField(blank=True, max_length=500, null=True)),
                ("mime_type", models.CharField(blank=True, max_length=120, null=True)),
                ("file_size_bytes", models.PositiveBigIntegerField(default=0)),
                ("sent_at", models.DateTimeField(blank=True, null=True)),
                ("generated_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="hsee_reports_created", to=settings.AUTH_USER_MODEL)),
                ("sent_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="hsee_reports_sent", to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
