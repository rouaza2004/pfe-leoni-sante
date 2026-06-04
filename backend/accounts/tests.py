from datetime import time, timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from appointments.models import Appointment
from medical.models import CertificatMedical, DemandeExamenLabo, DossierMedical, FicheAptitude

from .models import Collaborateur, Site, User


class RHKpiViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="rh",
            email="rh@example.com",
            password="password",
            role="RESPONSABLE_RH",
        )
        self.client.force_authenticate(self.user)

        self.today = timezone.localdate()
        self.site_a = Site.objects.create(nom="Menzel Hayet", localite="Monastir")
        self.site_b = Site.objects.create(nom="Mateur 1", localite="Bizerte")

        self.current = Collaborateur.objects.create(
            matricule="C001",
            nom="Actuel",
            prenom="Amina",
            departement="Production",
            site=self.site_a,
            actif=True,
        )
        self.old_visit = Collaborateur.objects.create(
            matricule="C002",
            nom="Ancien",
            prenom="Karim",
            departement="Qualite",
            site=self.site_a,
            actif=True,
        )
        self.missing_visit = Collaborateur.objects.create(
            matricule="C003",
            nom="Sans",
            prenom="Sarra",
            departement="Production",
            site=self.site_b,
            actif=True,
        )
        self.inactive = Collaborateur.objects.create(
            matricule="C004",
            nom="Inactif",
            prenom="Walid",
            departement="Qualite",
            site=self.site_b,
            actif=False,
        )

        DossierMedical.objects.create(collaborateur=self.current, statut="COMPLET")
        DossierMedical.objects.create(collaborateur=self.old_visit, statut="INCOMPLET")

        FicheAptitude.objects.create(
            collaborateur=self.current,
            type_examen="PERIODIQUE",
            aptitude="APTE_AMENAGEMENT",
            date_examen=self.today,
        )
        FicheAptitude.objects.create(
            collaborateur=self.old_visit,
            type_examen="PERIODIQUE",
            aptitude="APTE",
            date_examen=self.today - timedelta(days=370),
        )
        FicheAptitude.objects.create(
            collaborateur=self.inactive,
            type_examen="PERIODIQUE",
            aptitude="INAPTE_DEFINITIF",
            date_examen=self.today - timedelta(days=370),
        )

        Appointment.objects.create(
            collaborateur=self.current,
            type_medecin="TRAVAIL",
            date=self.today + timedelta(days=1),
            heure=time(9, 0),
            motif="Visite périodique",
            statut="PREVU",
        )
        Appointment.objects.create(
            collaborateur=self.old_visit,
            type_medecin="TRAVAIL",
            date=self.today - timedelta(days=1),
            heure=time(10, 0),
            motif="Visite passée",
            statut="TERMINE",
        )
        CertificatMedical.objects.create(
            collaborateur=self.current,
            nb_jours_repos=3,
            date_debut_repos=self.today,
        )
        DemandeExamenLabo.objects.create(collaborateur=self.current)

    def test_rh_kpis_are_computed_from_database_records(self):
        response = self.client.get("/api/rh/kpi/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        kpis = payload["kpis"]

        self.assertEqual(kpis["total_active_collaborators"], 4)
        self.assertEqual(kpis["new_operators_this_month"], 3)
        self.assertEqual(kpis["upcoming_medical_visits"], 1)
        self.assertEqual(kpis["overdue_medical_visits"], 0)
        self.assertEqual(kpis["active_sick_leaves"], 1)
        self.assertEqual(kpis["returns_expected_this_week"], 1)

        self.assertEqual(len(payload["new_operators"]), kpis["new_operators_this_month"])
        self.assertEqual(len(payload["upcoming_visits"]), kpis["upcoming_medical_visits"])
        self.assertEqual(len(payload["overdue_visits"]), kpis["overdue_medical_visits"])
        self.assertEqual(len(payload["active_sick_leaves"]), kpis["active_sick_leaves"])
        self.assertEqual(len(payload["returns_this_week"]), kpis["returns_expected_this_week"])

        by_site = {row["site"]: row for row in payload["collaborateurs_par_site"]}
        self.assertEqual(by_site["Menzel Hayet"]["total"], 2)
        self.assertEqual(by_site["Mateur 1"]["total"], 2)

        by_department = {row["departement"]: row for row in payload["collaborateurs_par_departement"]}
        self.assertEqual(by_department["Production"]["total"], 2)
        self.assertEqual(by_department["Qualite"]["total"], 2)

        operator_statuses = {row["matricule"]: row["statut"] for row in payload["new_operators"]}
        self.assertEqual(operator_statuses["C001"], "validated")
        self.assertEqual(operator_statuses["C002"], "sent_to_infirmary")
        self.assertEqual(operator_statuses["C003"], "pending")

    def test_non_rh_user_cannot_access_kpis(self):
        infirmier = User.objects.create_user(
            username="inf",
            email="inf@example.com",
            password="password",
            role="INFIRMIER",
        )
        self.client.force_authenticate(infirmier)

        response = self.client.get("/api/rh/kpi/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
