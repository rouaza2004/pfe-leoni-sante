from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Collaborateur, Site, User


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token["role"] = getattr(user, "role", "") or ""
        token["username"] = user.username

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        user = self.user
        role = getattr(user, "role", "") or ""

        data["role"] = role
        data["username"] = user.username

        refresh = self.get_token(user)
        data["refresh"] = str(refresh)
        data["access"] = str(refresh.access_token)

        return data


class SiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Site
        fields = ["id", "nom", "localite"]

class CollaborateurSerializer(serializers.ModelSerializer):
    site = SiteSerializer(read_only=True)

    class Meta:
        model = Collaborateur
        fields = [
            "id",
            "matricule",
            "nom",
            "prenom",
            "email",
            "cin",
            "date_naissance",
            "telephone",
            "adresse",
            "poste",
            "departement",
            "actif",
            "created_at",
            "site",
        ]


class UserMedecinSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "full_name", "role", "nom_ar"]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username
