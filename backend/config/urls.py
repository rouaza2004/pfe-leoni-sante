import os

from django.contrib import admin
from django.http import HttpResponse
from django.shortcuts import redirect
from django.urls import include, path, re_path
from medical.views import StatistiquesView, analyse_ai
from medical.views import HSEEEnqueteListCreateView, HSEEEnquetesReceivedListView


FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:5173").rstrip("/")


def frontend_redirect(request, path=""):
    target_path = f"/{path}" if path else ""
    target_url = f"{FRONTEND_URL}{target_path}"

    if request.META.get("QUERY_STRING"):
        target_url = f"{target_url}?{request.META['QUERY_STRING']}"

    return redirect(target_url, permanent=False)


def frontend_unavailable(_request):
    return HttpResponse(
        (
            "Le backend Django fonctionne, mais aucune route n'est definie a '/'. "
            f"Demarrez le frontend Vite puis ouvrez {FRONTEND_URL}."
        ),
        content_type="text/plain; charset=utf-8",
        status=200,
    )


urlpatterns = [

    path("admin/", admin.site.urls),


    path("api/statistiques/", StatistiquesView.as_view()),
    path("api/ai/analyse/", analyse_ai),
    path("api/hsee/enquetes/", HSEEEnqueteListCreateView.as_view()),
    path("api/hsee/enquetes-received/", HSEEEnquetesReceivedListView.as_view()),
    path("api/", include("accounts.urls")),
    path("api/medical/", include("medical.urls")),
    path("api/appointments/", include("appointments.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/sms/", include("notifications.sms_urls")),
    path("", frontend_redirect if os.getenv("DJANGO_REDIRECT_TO_FRONTEND", "1") == "1" else frontend_unavailable),
    re_path(
        r"^(?P<path>(?!api/|admin/).*)$",
        frontend_redirect if os.getenv("DJANGO_REDIRECT_TO_FRONTEND", "1") == "1" else frontend_unavailable,
    ),

]
