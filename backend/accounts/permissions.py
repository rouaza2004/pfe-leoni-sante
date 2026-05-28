from rest_framework.permissions import BasePermission

from .permissions_map import ROLE_PERMISSIONS

class CanViewCollaborateurList(BasePermission):
    permission_name = "VIEW_COLLABORATEURS"

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        role = (getattr(user, "role", "") or "").strip().upper()
        permissions = ROLE_PERMISSIONS.get(role, [])
        return self.permission_name in permissions
