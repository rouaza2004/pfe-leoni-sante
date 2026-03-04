from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    # accounts API
    path("api/", include("accounts.urls")),

    # medical API
    path("api/medical/", include("medical.urls")),
]