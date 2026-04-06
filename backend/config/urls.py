from django.contrib import admin
from django.urls import path, include
from medical.views import StatistiquesView

urlpatterns = [

    path("admin/", admin.site.urls),


    path("api/statistiques/", StatistiquesView.as_view()),
    path("api/", include("accounts.urls")),
    path("api/medical/", include("medical.urls")),
    path("api/appointments/", include("appointments.urls")),
    path("api/notifications/", include("notifications.urls")),

]
