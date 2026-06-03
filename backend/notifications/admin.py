from django.contrib import admin

from .models import Notification, SMSNotification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "title", "type", "is_read", "created_at")
    list_filter = ("type", "is_read", "created_at")
    search_fields = ("title", "message", "user__username")


@admin.register(SMSNotification)
class SMSNotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "telephone", "statut", "collaborateur", "created_at")
    list_filter = ("statut", "created_at")
    search_fields = ("telephone", "message", "collaborateur__matricule", "collaborateur__nom", "collaborateur__prenom")
