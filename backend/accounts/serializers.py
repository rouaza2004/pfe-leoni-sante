import re

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.crypto import get_random_string
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
    collaborateurs_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Site
        fields = ["id", "nom", "localite", "collaborateurs_count"]

    def validate_nom(self, value):
        nom = (value or "").strip()
        if not nom:
            raise serializers.ValidationError("Le nom du site est obligatoire.")

        queryset = Site.objects.filter(nom__iexact=nom)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Ce site existe deja.")

        return nom

    def validate_localite(self, value):
        localite = (value or "").strip()
        if not localite:
            raise serializers.ValidationError("La ville est obligatoire.")
        return localite

class CollaborateurSerializer(serializers.ModelSerializer):
    site = SiteSerializer(read_only=True)
    site_id = serializers.PrimaryKeyRelatedField(
        source="site",
        queryset=Site.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )
    site_label = serializers.SerializerMethodField()

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
            "site_id",
            "site_label",
        ]

    def get_site_label(self, obj):
        site = getattr(obj, "site", None)
        return getattr(site, "nom", "") or "Non défini"


class UserMedecinSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "full_name", "role", "nom_ar"]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class UserProfileSerializer(serializers.ModelSerializer):
    site = SiteSerializer(read_only=True)
    site_label = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "telephone",
            "date_naissance",
            "nom_ar",
            "role",
            "site",
            "site_label",
            "last_login",
            "date_joined",
        ]
        read_only_fields = [
            "id",
            "username",
            "full_name",
            "role",
            "site",
            "site_label",
            "last_login",
            "date_joined",
        ]

    def get_site_label(self, obj):
        site = getattr(obj, "site", None)
        return getattr(site, "nom", "") or "Non defini"

    def get_full_name(self, obj):
        return (obj.get_full_name() or obj.username or "").strip()

    def validate_first_name(self, value):
        first_name = (value or "").strip()
        if not first_name:
            raise serializers.ValidationError("Le nom est obligatoire.")
        return first_name

    def validate_last_name(self, value):
        last_name = (value or "").strip()
        if not last_name:
            raise serializers.ValidationError("Le prenom est obligatoire.")
        return last_name

    def validate_email(self, value):
        email = (value or "").strip().lower()
        if not email:
            raise serializers.ValidationError("L'email est obligatoire.")

        queryset = User.objects.filter(email__iexact=email)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Cet email existe deja.")
        return email

    def validate_telephone(self, value):
        telephone = (value or "").strip()
        if telephone and not re.fullmatch(r"\+?[0-9][0-9\s-]{7,19}", telephone):
            raise serializers.ValidationError("Veuillez saisir un numero de telephone valide.")
        return telephone

    def validate_nom_ar(self, value):
        return (value or "").strip()


class UserPasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Le mot de passe actuel est incorrect.")
        return value

    def validate(self, attrs):
        if attrs.get("new_password") != attrs.get("confirm_password"):
            raise serializers.ValidationError(
                {"confirm_password": "La confirmation ne correspond pas au nouveau mot de passe."}
            )

        user = self.context["request"].user
        try:
            validate_password(attrs["new_password"], user=user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"new_password": list(exc.messages)})

        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class UserAdminSerializer(serializers.ModelSerializer):
    site = SiteSerializer(read_only=True)
    site_id = serializers.PrimaryKeyRelatedField(
        source="site",
        queryset=Site.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )
    site_label = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "username",
            "email",
            "telephone",
            "date_naissance",
            "role",
            "is_active",
            "site",
            "site_id",
            "site_label",
            "full_name",
            "last_login",
            "date_joined",
        ]
        read_only_fields = ["id", "site", "site_label", "full_name", "last_login", "date_joined"]

    def get_site_label(self, obj):
        site = getattr(obj, "site", None)
        return getattr(site, "nom", "") or "Non défini"

    def get_full_name(self, obj):
        full_name = obj.get_full_name() or ""
        return full_name.strip() or obj.username

    def validate_username(self, value):
        username = (value or "").strip()
        queryset = User.objects.filter(username__iexact=username)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Ce username existe déjà.")
        return username

    def validate_email(self, value):
        email = (value or "").strip().lower()
        if not email:
            raise serializers.ValidationError("L'email est obligatoire.")
        queryset = User.objects.filter(email__iexact=email)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Cet email existe déjà.")
        return email

    def validate_telephone(self, value):
        telephone = (value or "").strip()
        if not telephone:
            raise serializers.ValidationError("Le numéro de téléphone est obligatoire.")
        if not re.fullmatch(r"\+?[0-9][0-9\s-]{7,19}", telephone):
            raise serializers.ValidationError("Veuillez saisir un numéro de téléphone valide.")
        return telephone

    def validate(self, attrs):
        attrs = super().validate(attrs)
        required_fields = {
            "first_name": "Le nom est obligatoire.",
            "last_name": "Le prénom est obligatoire.",
            "username": "Le username est obligatoire.",
            "email": "L'email est obligatoire.",
            "telephone": "Le numéro de téléphone est obligatoire.",
            "date_naissance": "La date de naissance est obligatoire.",
            "role": "Le rôle est obligatoire.",
        }

        if not self.instance:
            for field_name, message in required_fields.items():
                if not attrs.get(field_name):
                    raise serializers.ValidationError({field_name: message})
            if not attrs.get("site"):
                raise serializers.ValidationError({"site_id": "Le site est obligatoire."})

        if self.instance and "site" in attrs and not attrs.get("site"):
            raise serializers.ValidationError({"site_id": "Le site est obligatoire."})

        return attrs

    def create(self, validated_data):
        generated_password = get_random_string(
            8,
            allowed_chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789",
        )
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=generated_password,
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            telephone=validated_data.get("telephone"),
            date_naissance=validated_data.get("date_naissance"),
            site=validated_data.get("site"),
            role=validated_data["role"],
            is_active=validated_data.get("is_active", True),
        )
        user._generated_password = generated_password
        return user
