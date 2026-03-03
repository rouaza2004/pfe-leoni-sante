from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Collaborateur
from .permissions_map import ROLE_PERMISSIONS

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        user = self.user

        # ✅ role = group name (مثلا MEDECIN_TRAITANT)
        group = user.groups.first()
        role = group.name if group else ""

        # ✅ add extra data in response
        data["role"] = role
        data["username"] = user.username

        # ✅ add claims in tokens too
        refresh = self.get_token(user)
        refresh["role"] = role
        refresh["username"] = user.username

        data["refresh"] = str(refresh)
        data["access"] = str(refresh.access_token)

        return data

class CollaborateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collaborateur
        fields = ["id", "matricule", "nom", "prenom", "email", "actif", "created_at"]