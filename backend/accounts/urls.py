from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    MyTokenObtainPairView,
    MeView,
    CollaborateurListAPIView,
    RHKpiView,
)

urlpatterns = [
    path("auth/login/", MyTokenObtainPairView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path("me/", MeView.as_view(), name="me"),

    path("collaborateurs/", CollaborateurListAPIView.as_view(), name="collaborateurs"),

    path("rh/kpi/", RHKpiView.as_view(), name="rh-kpi"),
]