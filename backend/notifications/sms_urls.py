from django.urls import path

from .views import SMSTestAPIView

urlpatterns = [
    path("test", SMSTestAPIView.as_view(), name="sms-test"),
    path("test/", SMSTestAPIView.as_view(), name="sms-test-slash"),
]
