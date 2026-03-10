from django.urls import path
from .views import (
    MyTokenObtainPairView,
    MeView,
    CollaborateurListAPIView,
    CollaborateurDetailAPIView,
    RHKpiView,
)

urlpatterns = [
    path("auth/login/", MyTokenObtainPairView.as_view(), name="login"),
    path("me/", MeView.as_view(), name="me"),

    path("collaborateurs/", CollaborateurListAPIView.as_view(), name="collaborateurs-list"),
    path("collaborateurs/<int:pk>/", CollaborateurDetailAPIView.as_view(), name="collaborateurs-detail"),

    path("rh/kpi/", RHKpiView.as_view(), name="rh-kpi"),
]