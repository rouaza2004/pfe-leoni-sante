from django.conf import settings
from django.db import models

from accounts.models import Collaborateur


class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.title}"


class SMSNotification(models.Model):
    STATUT_SUCCESS = "SUCCESS"
    STATUT_FAILED = "FAILED"
    STATUT_CHOICES = [
      (STATUT_SUCCESS, "Succès"),
      (STATUT_FAILED, "Échec"),
    ]

    collaborateur = models.ForeignKey(
        Collaborateur,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sms_notifications",
    )
    telephone = models.CharField(max_length=30)
    message = models.TextField()
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES)
    api_response = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "sms_notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.telephone} - {self.statut}"
