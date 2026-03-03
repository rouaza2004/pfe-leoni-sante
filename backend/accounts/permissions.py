from rest_framework.permissions import BasePermission

class CanViewCollaborateurList(BasePermission):
    allowed_roles = [
        "ADMIN",
        "INFIRMIER",
        "MEDECIN_TRAVAIL",
        "MEDECIN_TRAITANT",
        "MEDECIN_CONTROLEUR",
    ]

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return getattr(user, "role", None) in self.allowed_roles