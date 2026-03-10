from django.contrib import admin
from django.urls import path, include

urlpatterns = [

    path("admin/", admin.site.urls),

    path("api/", include("accounts.urls")),
    path("api/medical/", include("medical.urls")),
    path("api/appointments/", include("appointments.urls")),

]