from django.urls import path
from .views import (
    MyTokenObtainPairView,
    MeView,
    UserPasswordChangeAPIView,
    UserProfileAPIView,
    CollaborateurListAPIView,
    CollaborateurDetailAPIView,
    CollaborateurProfilAPIView,
    RHKpiView,
    MedecinListAPIView,
    SiteListAPIView,
    AdminUserListCreateAPIView,
    AdminUserDetailAPIView,
)

urlpatterns = [
    path("auth/login/", MyTokenObtainPairView.as_view(), name="login"),
    path("me/", MeView.as_view(), name="me"),
    path("profile/", UserProfileAPIView.as_view(), name="profile"),
    path("profile/password/", UserPasswordChangeAPIView.as_view(), name="profile-password"),
    path("collaborateurs/", CollaborateurListAPIView.as_view(), name="collaborateurs-list"),
    path("collaborateurs/<int:pk>/", CollaborateurDetailAPIView.as_view(), name="collaborateurs-detail"),
    path("collaborateurs/matricule/<str:matricule>/", CollaborateurProfilAPIView.as_view(), name="collaborateurs-profil-matricule"),
    path("sites/", SiteListAPIView.as_view(), name="sites-list"),
    path("users/", AdminUserListCreateAPIView.as_view(), name="users-list-create"),
    path("users/<int:pk>/", AdminUserDetailAPIView.as_view(), name="users-detail"),
    path("rh/kpi/", RHKpiView.as_view(), name="rh-kpi"),
    path("medecins/", MedecinListAPIView.as_view(), name="medecins-list"),
]
