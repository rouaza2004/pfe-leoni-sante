from django.urls import path
from .views import NotificationListAPIView, NotificationMarkAllReadAPIView

urlpatterns = [
    path("", NotificationListAPIView.as_view(), name="notifications-list"),
    path("mark-all-read/", NotificationMarkAllReadAPIView.as_view(), name="notifications-mark-all-read"),
]
