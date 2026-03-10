from django.urls import path
from .views import AppointmentListCreateAPIView, AppointmentDetailAPIView

urlpatterns = [
    path("rdv/", AppointmentListCreateAPIView.as_view(), name="rdv-list-create"),
    path("rdv/<int:pk>/", AppointmentDetailAPIView.as_view(), name="rdv-detail"),
]