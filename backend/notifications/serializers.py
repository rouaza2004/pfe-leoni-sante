from rest_framework import serializers

from accounts.models import Collaborateur

from .models import Notification, SMSNotification


class NotificationSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source="get_type_display", read_only=True)
    rendez_vous_id = serializers.IntegerField(source="rendez_vous.id", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "title",
            "message",
            "type",
            "type_display",
            "is_read",
            "created_at",
            "rendez_vous_id",
        ]


class SMSNotificationSerializer(serializers.ModelSerializer):
    collaborateur_id = serializers.IntegerField(source="collaborateur.id", read_only=True)

    class Meta:
        model = SMSNotification
        fields = [
            "id",
            "collaborateur_id",
            "telephone",
            "message",
            "statut",
            "api_response",
            "created_at",
        ]


class SMSTestSerializer(serializers.Serializer):
    collaborateur_id = serializers.PrimaryKeyRelatedField(
        source="collaborateur",
        queryset=Collaborateur.objects.all(),
        required=False,
        allow_null=True,
    )
    phone = serializers.CharField(max_length=30)
    message = serializers.CharField()
