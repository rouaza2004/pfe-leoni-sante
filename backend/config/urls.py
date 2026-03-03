from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
path("api/medical/", include("medical.urls")),
    # ✅ كل شي متاع accounts يولي تحت /api/
    path("api/", include("accounts.urls")),
]