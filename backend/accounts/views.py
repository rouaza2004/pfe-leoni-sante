from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.filters import SearchFilter
from rest_framework_simplejwt.views import TokenObtainPairView
from django.shortcuts import get_object_or_404

from .models import Collaborateur
from .permissions import CanViewCollaborateurList
from .serializers import CollaborateurSerializer, MyTokenObtainPairSerializer


# ===============================
# AUTH
# ===============================
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user
        # ⚠️ role هنا إذا عندك field role في user model
        return Response(
            {
                "id": str(u.id),
                "username": u.username,
                "role": getattr(u, "role", None),
            }
        )


# ===============================
# COLLABORATEURS
# ===============================
class CollaborateurListAPIView(generics.ListAPIView):
    """
    GET /api/collaborateurs/
    GET /api/collaborateurs/?search=ali
    """
    queryset = Collaborateur.objects.all().order_by("nom", "prenom")
    serializer_class = CollaborateurSerializer
    permission_classes = [IsAuthenticated, CanViewCollaborateurList]

    filter_backends = [SearchFilter]
    search_fields = ["nom", "prenom", "matricule", "email"]


class CollaborateurDetailAPIView(APIView):
    """
    GET /api/collaborateurs/<id>/
    """
    permission_classes = [IsAuthenticated, CanViewCollaborateurList]

    def get(self, request, pk):
        collab = get_object_or_404(Collaborateur, pk=pk)
        return Response(CollaborateurSerializer(collab).data)


# ===============================
# KPI RH (placeholder)
# ===============================
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