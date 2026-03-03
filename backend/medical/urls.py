from django.urls import path
from .views import (
    DossierByCollaborateurView,
    CreateFicheMedicaleView,
    CreateOrdonnanceView,
    CreateCertificatView,
)

urlpatterns = [
    path("dossier/<int:collaborateur_id>/", DossierByCollaborateurView.as_view()),
    path("fiches/", CreateFicheMedicaleView.as_view()),
    path("ordonnances/", CreateOrdonnanceView.as_view()),
    path("certificats/", CreateCertificatView.as_view()),
]