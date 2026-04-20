from django.contrib import admin
from django.urls import path, include
from medical.views import StatistiquesView
from medical.views import HSEEEnqueteListCreateView, HSEEEnquetesReceivedListView

urlpatterns = [

    path("admin/", admin.site.urls),


    path("api/statistiques/", StatistiquesView.as_view()),
    path("api/hsee/enquetes/", HSEEEnqueteListCreateView.as_view()),
    path("api/hsee/enquetes-received/", HSEEEnquetesReceivedListView.as_view()),
    path("api/", include("accounts.urls")),
    path("api/medical/", include("medical.urls")),
    path("api/appointments/", include("appointments.urls")),
    path("api/notifications/", include("notifications.urls")),

]
