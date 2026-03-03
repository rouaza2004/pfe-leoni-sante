from rest_framework.permissions import BasePermission
from accounts.permissions_map import ROLE_PERMISSIONS


class HasPermission(BasePermission):
    permission_name = None

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        role = (getattr(user, "role", "") or "").strip().upper()
        perms = ROLE_PERMISSIONS.get(role, [])

        return self.permission_name in perms