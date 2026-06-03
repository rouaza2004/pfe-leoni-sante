from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer, SMSNotificationSerializer, SMSTestSerializer
from .services.sms_service import send_sms_notification


class NotificationListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user).order_by("-created_at")
        filter_type = request.query_params.get("filter", "all")

        if filter_type == "unread":
            notifications = notifications.filter(is_read=False)
        elif filter_type == "rendez-vous":
            notifications = notifications.filter(type=Notification.TYPE_RENDEZ_VOUS)
        elif filter_type == "documents":
            notifications = notifications.filter(type=Notification.TYPE_DOCUMENT)

        unread_count = Notification.objects.filter(
            user=request.user,
            is_read=False,
        ).count()

        return Response(
            {
                "notifications": NotificationSerializer(notifications, many=True).data,
                "unread_count": unread_count,
                "active_filter": filter_type,
            }
        )


class NotificationMarkAllReadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = Notification.objects.filter(
            user=request.user,
            is_read=False,
        ).update(is_read=True)
        return Response({"updated": updated, "unread_count": 0})


class SMSTestAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SMSTestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = send_sms_notification(
            serializer.validated_data["phone"],
            serializer.validated_data["message"],
            collaborateur=serializer.validated_data.get("collaborateur"),
        )
        sms_data = SMSNotificationSerializer(result["record"]).data

        payload = {
            "success": result["success"],
            "sms_notification": sms_data,
            "api_response": result.get("api_response"),
        }
        if result.get("error"):
            payload["error"] = result["error"]
            payload["detail"] = "TunisiaSMS request failed."

        response_status = status.HTTP_200_OK if result["success"] else status.HTTP_502_BAD_GATEWAY
        return Response(payload, status=response_status)
