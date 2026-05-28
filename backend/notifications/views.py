from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer, SMSNotificationSerializer, SMSTestSerializer
from .services.sms_service import send_sms_notification


class NotificationListAPIView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by("-created_at")


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
