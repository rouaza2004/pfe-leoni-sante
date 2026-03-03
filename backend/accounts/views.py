from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Collaborateur
from .permissions import CanViewCollaborateurList
from .serializers import CollaborateurSerializer, MyTokenObtainPairSerializer


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user
        return Response(
            {
                "id": str(u.id),
                "username": u.username,
                "role": getattr(u, "role", None),
            }
        )


class CollaborateurListAPIView(generics.ListAPIView):
    queryset = Collaborateur.objects.all().order_by("nom", "prenom")
    serializer_class = CollaborateurSerializer
    permission_classes = [IsAuthenticated, CanViewCollaborateurList]


class RHKpiView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = getattr(request.user, "role", None)
        if role not in ["ADMIN", "RESPONSABLE_RH"]:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        data = {
            "total_collaborateurs": 0,
            "visites_ce_mois": 0,
            "analyses_en_retard": 0,
            "aptitudes": {"apte": 0, "inapte": 0},
        }
        return Response(data)