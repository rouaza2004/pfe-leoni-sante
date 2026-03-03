from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


# ======================================
# Appointments (placeholder for now)
# ======================================
class AppointmentListAPIView(APIView):
    """
    Temporary endpoint for RDV (appointments).
    Later we will replace it with:
    - List/Create appointment
    - Update/Cancel
    - Calendar by collaborator
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # TODO: connect to Appointment model when you create it
        return Response([], status=status.HTTP_200_OK)