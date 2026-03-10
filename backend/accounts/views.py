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
from .permissions_map import ROLE_PERMISSIONS


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user
        role = getattr(u, "role", "") or ""
        permissions = ROLE_PERMISSIONS.get((role or "").upper(), [])

        return Response(
            {
                "id": str(u.id),
                "username": u.username,
                "role": role,
                "permissions": permissions,
            }
        )


class CollaborateurListAPIView(generics.ListAPIView):
    queryset = Collaborateur.objects.all().order_by("nom", "prenom")
    serializer_class = CollaborateurSerializer
    permission_classes = [IsAuthenticated, CanViewCollaborateurList]

    filter_backends = [SearchFilter]
    search_fields = ["nom", "prenom", "matricule", "email"]


class CollaborateurDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, CanViewCollaborateurList]

    def get(self, request, pk):
        collab = get_object_or_404(Collaborateur, pk=pk)
        return Response(CollaborateurSerializer(collab).data)

    def patch(self, request, pk):
        collab = get_object_or_404(Collaborateur, pk=pk)
        serializer = CollaborateurSerializer(collab, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class RHKpiView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user
        role = getattr(u, "role", "") or ""

        if (role or "").upper() not in ["ADMIN", "RESPONSABLE_RH"]:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        data = {
            "total_collaborateurs": 0,
            "visites_ce_mois": 0,
            "analyses_en_retard": 0,
            "aptitudes": {"apte": 0, "inapte": 0},
        }
        return Response(data)