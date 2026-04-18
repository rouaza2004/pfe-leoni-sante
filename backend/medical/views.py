from pathlib import Path
from io import BytesIO
import base64
import logging
import os
import tempfile
import random
import unicodedata
from datetime import date, timedelta
from django.conf import settings
from django.contrib.staticfiles import finders
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Sum, Count, Case, When, Value, CharField
from django.db.models.functions import ExtractMonth
from django.http import HttpResponse
from django.template.loader import render_to_string

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, A5, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from xhtml2pdf import pisa
from xhtml2pdf import files as xhtml_files
import arabic_reshaper
from bidi.algorithm import get_display

from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.serializers import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView

try:
    import openpyxl
except ImportError:  # pragma: no cover
    openpyxl = None

from accounts.models import Collaborateur, Site
from accounts.serializers import CollaborateurSerializer

from .models import (
    DossierMedical,
    ExamenInitial,
    ExamenUlterieur,
    PosteTravail,
    IncidentInfirmier,
    AccidentTravail,
    MaladieProfessionnelle,
    Vaccination,
    FicheMedicale,
    Ordonnance,
    CertificatMedical,
    StockItem,
    StockMovement,
    IncidentAvecBon,
    IncidentSansBon,
    FicheAptitude,
    DemandeExamenLabo,
    ExamenComplementaire,
    ControleMedicalRecord,
    DemandeExpertiseRecord,
    PointageMedecin,
    BonChauffeur,
    SuiviTransfertUrgence,
)

from .serializers import (
    DossierMedicalSerializer,
    ExamenInitialSerializer,
    ExamenUlterieurSerializer,
    PosteTravailSerializer,
    IncidentInfirmierSerializer,
    AccidentTravailSerializer,
    MaladieProfessionnelleSerializer,
    VaccinationSerializer,
    FicheMedicaleSerializer,
    OrdonnanceSerializer,
    CertificatMedicalSerializer,
    StockItemSerializer,
    StockMovementSerializer,
    IncidentAvecBonSerializer,
    IncidentSansBonSerializer,
    FicheAptitudeSerializer,
    DemandeExamenLaboSerializer,
    ExamenComplementaireSerializer,
    ControleMedicalRecordSerializer,
    DemandeExpertiseRecordSerializer,
    PointageMedecinSerializer,
    BonChauffeurSerializer,
    SuiviTransfertUrgenceSerializer,
)


def link_callback(uri, rel):
    if settings.STATIC_URL and uri.startswith(settings.STATIC_URL):
        path = finders.find(uri.replace(settings.STATIC_URL, ""))
        if path:
            return path
    if settings.MEDIA_URL and uri.startswith(settings.MEDIA_URL):
        path = os.path.join(settings.MEDIA_ROOT, uri.replace(settings.MEDIA_URL, ""))
        return path
    return uri


def require_medecin_travail(request):
    role = (getattr(request.user, "role", "") or "").strip().upper()
    if role not in ["MEDECIN_TRAVAIL", "ADMIN"]:
        raise PermissionDenied(
            "Seul le médecin du travail peut modifier le dossier médical."
        )


def ensure_temp_dir():
    temp_dir = Path(settings.BASE_DIR) / "tmp"
    temp_dir.mkdir(exist_ok=True)
    tempfile.tempdir = str(temp_dir)


def patch_xhtml2pdf_tempfile():
    if getattr(xhtml_files, "_patched_tempfile", False):
        return

    def get_named_tmp_file(self):
        data = self.get_data()
        tmp_file = tempfile.NamedTemporaryFile(suffix=self.suffix, delete=False)
        if data:
            tmp_file.write(data)
            tmp_file.flush()
            tmp_file.close()
            xhtml_files.files_tmp.append(tmp_file)
        if self.path is None:
            self.path = tmp_file.name
        return tmp_file

    xhtml_files.BaseFile.get_named_tmp_file = get_named_tmp_file
    xhtml_files._patched_tempfile = True


def shape_arabic(text: str) -> str:
    reshaped = arabic_reshaper.reshape(text)
    return get_display(reshaped)


def register_arabic_font():
    try:
        pdfmetrics.getFont("Amiri")
        return
    except Exception:
        pass
    font_path = finders.find("fonts/Amiri-Regular.ttf")
    if font_path:
        pdfmetrics.registerFont(TTFont("Amiri", font_path))

class FicheAptitudePdfView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, collaborateur_id, *args, **kwargs):
        collaborateur = get_object_or_404(Collaborateur, pk=collaborateur_id)
        dossier, created = DossierMedical.objects.get_or_create(collaborateur=collaborateur)
        serializer = DossierMedicalSerializer(dossier)
        return Response({"created": created, "dossier": serializer.data})


class DossierMedicalListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DossierMedicalSerializer
    queryset = DossierMedical.objects.select_related("collaborateur").all()


class DossierMedicalDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DossierMedicalSerializer
    queryset = DossierMedical.objects.select_related("collaborateur").all()


class CollaborateurMedListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CollaborateurSerializer
    queryset = Collaborateur.objects.all()


class CollaborateurMedDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CollaborateurSerializer
    queryset = Collaborateur.objects.all()


class NotImplementedAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return Response({"detail": "Endpoint non impl\u00e9ment\u00e9."}, status=status.HTTP_501_NOT_IMPLEMENTED)

    def post(self, request, *args, **kwargs):
        return Response({"detail": "Endpoint non impl\u00e9ment\u00e9."}, status=status.HTTP_501_NOT_IMPLEMENTED)

    def put(self, request, *args, **kwargs):
        return Response({"detail": "Endpoint non impl\u00e9ment\u00e9."}, status=status.HTTP_501_NOT_IMPLEMENTED)

    def patch(self, request, *args, **kwargs):
        return Response({"detail": "Endpoint non impl\u00e9ment\u00e9."}, status=status.HTTP_501_NOT_IMPLEMENTED)

    def delete(self, request, *args, **kwargs):
        return Response({"detail": "Endpoint non impl\u00e9ment\u00e9."}, status=status.HTTP_501_NOT_IMPLEMENTED)


class DossierByCollaborateurView(APIView):
    permission_classes = [IsAuthenticated]

    def get_dossier(self, collaborateur_id):
        collaborateur = get_object_or_404(Collaborateur, pk=collaborateur_id)
        dossier, _ = DossierMedical.objects.get_or_create(collaborateur=collaborateur)
        return dossier

    def get(self, request, collaborateur_id):
        dossier = self.get_dossier(collaborateur_id)
        return Response(DossierMedicalSerializer(dossier).data)

    def patch(self, request, collaborateur_id):
        dossier = self.get_dossier(collaborateur_id)
        serializer = DossierMedicalSerializer(dossier, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class DossierByMatriculeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, matricule):
        collaborateur = get_object_or_404(Collaborateur, matricule=matricule)
        dossier, _ = DossierMedical.objects.get_or_create(collaborateur=collaborateur)
        return Response(DossierMedicalSerializer(dossier).data)


class DossierAutofillOneView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, collaborateur_id):
        collaborateur = get_object_or_404(Collaborateur, pk=collaborateur_id)
        dossier, _ = DossierMedical.objects.get_or_create(collaborateur=collaborateur)

        updates = {}
        if not dossier.poste_travail_actuel and collaborateur.poste:
            updates["poste_travail_actuel"] = collaborateur.poste
        if not dossier.profession and collaborateur.poste:
            updates["profession"] = collaborateur.poste
        if not dossier.localite and getattr(collaborateur, "site", None):
            updates["localite"] = collaborateur.site.localite
        if not dossier.entreprise and getattr(collaborateur, "site", None):
            updates["entreprise"] = collaborateur.site.nom

        if updates:
            for field, value in updates.items():
                setattr(dossier, field, value)
            dossier.save(update_fields=[*updates.keys()])

        return Response(DossierMedicalSerializer(dossier).data)


class DossierAutofillView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = 0
        for collaborateur in Collaborateur.objects.select_related("site").all():
            dossier, _ = DossierMedical.objects.get_or_create(collaborateur=collaborateur)
            changes = {}
            if not dossier.poste_travail_actuel and collaborateur.poste:
                changes["poste_travail_actuel"] = collaborateur.poste
            if not dossier.profession and collaborateur.poste:
                changes["profession"] = collaborateur.poste
            if not dossier.localite and getattr(collaborateur, "site", None):
                changes["localite"] = collaborateur.site.localite
            if not dossier.entreprise and getattr(collaborateur, "site", None):
                changes["entreprise"] = collaborateur.site.nom
            if changes:
                for field, value in changes.items():
                    setattr(dossier, field, value)
                dossier.save(update_fields=[*changes.keys()])
                updated += 1

        return Response({"updated": updated})


class ExamenInitialCreateUpdateView(NotImplementedAPIView):
    pass


class VaccinationCreateView(NotImplementedAPIView):
    pass


class VaccinationDeleteView(NotImplementedAPIView):
    pass


class IncidentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = IncidentInfirmierSerializer
    queryset = IncidentInfirmier.objects.select_related("dossier__collaborateur").all()

    def get_queryset(self):
        return self.queryset.order_by("-date_incident", "-heure_incident")




class IncidentDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = IncidentInfirmierSerializer
    queryset = IncidentInfirmier.objects.select_related("dossier__collaborateur").all()


class IncidentAvecBonListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = IncidentAvecBonSerializer
    queryset = IncidentAvecBon.objects.all()

    def get_queryset(self):
        return self.queryset.order_by("-date_incident", "-created_at")




class IncidentAvecBonDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = IncidentAvecBonSerializer
    queryset = IncidentAvecBon.objects.all()




class IncidentSansBonListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = IncidentSansBonSerializer
    queryset = IncidentSansBon.objects.all()

    def get_queryset(self):
        return self.queryset.order_by("-created_at")




class IncidentSansBonDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = IncidentSansBonSerializer
    queryset = IncidentSansBon.objects.all()




class BonChauffeurListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BonChauffeurSerializer
    queryset = BonChauffeur.objects.all()

    def get_queryset(self):
        return self.queryset.order_by("-created_at")




class BonChauffeurDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BonChauffeurSerializer
    queryset = BonChauffeur.objects.all()




class SuiviTransfertUrgenceListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SuiviTransfertUrgenceSerializer
    queryset = SuiviTransfertUrgence.objects.all()

    def get_queryset(self):
        return self.queryset.order_by("-created_at")




class SuiviTransfertUrgenceDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SuiviTransfertUrgenceSerializer
    queryset = SuiviTransfertUrgence.objects.all()




class AccidentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AccidentTravailSerializer
    queryset = AccidentTravail.objects.select_related("dossier__collaborateur").all()

    def get_queryset(self):
        return self.queryset.order_by("-date_accident", "-created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)




class AccidentDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AccidentTravailSerializer
    queryset = AccidentTravail.objects.select_related("dossier__collaborateur").all()




class AccidentStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        qs = AccidentTravail.objects.select_related("dossier__collaborateur")

        total = qs.count()
        today_count = qs.filter(date_accident=today).count()
        this_month_count = qs.filter(date_accident__year=today.year, date_accident__month=today.month).count()
        sent_hsee = qs.filter(envoye_hsee=True).count()

        recent = qs.order_by("-date_accident", "-created_at")[:5]
        recent_data = AccidentTravailSerializer(recent, many=True).data

        return Response(
            {
                "total": total,
                "today": today_count,
                "this_month": this_month_count,
                "sent_hsee": sent_hsee,
                "recent": recent_data,
            }
        )




class AccidentSendToHSEEView(NotImplementedAPIView):
    pass


class HSEEAccidentsListView(NotImplementedAPIView):
    pass


class HSEEKpisView(NotImplementedAPIView):
    pass


class HSEETopCausesView(NotImplementedAPIView):
    pass


class HSEEAccidentsParSegmentView(NotImplementedAPIView):
    pass


class HSEEAccidentsParGraviteView(NotImplementedAPIView):
    pass


class HSEEAccidentsParMoisView(NotImplementedAPIView):
    pass


class HSEEPlanActionView(NotImplementedAPIView):
    pass


class MaladieCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MaladieProfessionnelleSerializer
    queryset = MaladieProfessionnelle.objects.select_related("dossier__collaborateur").all()

    def get_queryset(self):
        return self.queryset.order_by("-date_constat", "-created_at")

    def perform_create(self, serializer):
        serializer.save()




class MaladieDeleteView(generics.RetrieveDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MaladieProfessionnelleSerializer
    queryset = MaladieProfessionnelle.objects.select_related("dossier__collaborateur").all()




class PosteCreateView(NotImplementedAPIView):
    pass


class PosteDeleteView(NotImplementedAPIView):
    pass


class ExamenUlterieurCreateView(NotImplementedAPIView):
    pass


class ExamenUlterieurDeleteView(NotImplementedAPIView):
    pass


class FicheMedicaleByCollaborateurView(NotImplementedAPIView):
    pass


class OrdonnanceListCreateByCollaborateurView(NotImplementedAPIView):
    pass


class CertificatListCreateByCollaborateurView(NotImplementedAPIView):
    pass


class StockItemListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = StockItemSerializer
    queryset = StockItem.objects.all()

    def get_queryset(self):
        return self.queryset.order_by("nom")




class StockItemDetailAPIView(NotImplementedAPIView):
    pass


class StockMovementListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = StockMovementSerializer
    queryset = StockMovement.objects.select_related("stock_item").all()

    def get_queryset(self):
        return self.queryset.order_by("-created_at")


class StockDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        exp_soon_days = 90

        items = list(
            StockItem.objects.filter(type_article="MEDICAMENT", actif=True).values(
                "id",
                "categorie",
                "quantite",
                "seuil_critique",
                "date_expiration",
            )
        )

        def safe_int(value):
            try:
                return int(value or 0)
            except (TypeError, ValueError):
                return 0

        def days_until(exp_date):
            if not exp_date:
                return None
            return (exp_date - today).days

        stock_repartition = {"inStock": 0, "expSoon": 0, "low": 0, "expired": 0}
        expiration_buckets = {
            "expired": 0,
            "lt30": 0,
            "d30_90": 0,
            "d90_180": 0,
            "d180_365": 0,
            "gt365": 0,
        }

        total = len(items)
        disponibles = 0
        stock_alerts = 0
        exp_soon = 0

        category_map = {}
        for item in items:
            qty = safe_int(item.get("quantite"))
            seuil = safe_int(item.get("seuil_critique"))
            exp_date = item.get("date_expiration")
            days = days_until(exp_date)

            if qty > 0:
                disponibles += 1
            if qty == 0 or (qty > 0 and seuil > 0 and qty <= seuil):
                stock_alerts += 1

            expired = days is not None and days < 0
            expiring_soon = days is not None and 0 <= days <= exp_soon_days

            if expired:
                stock_repartition["expired"] += 1
            elif expiring_soon:
                stock_repartition["expSoon"] += 1
            elif qty > 0 and seuil > 0 and qty <= seuil:
                stock_repartition["low"] += 1
            else:
                stock_repartition["inStock"] += 1

            if expired or expiring_soon:
                exp_soon += 1

            if days is not None:
                if days < 0:
                    expiration_buckets["expired"] += 1
                elif days <= 30:
                    expiration_buckets["lt30"] += 1
                elif days <= 90:
                    expiration_buckets["d30_90"] += 1
                elif days <= 180:
                    expiration_buckets["d90_180"] += 1
                elif days <= 365:
                    expiration_buckets["d180_365"] += 1
                else:
                    expiration_buckets["gt365"] += 1

            cat = (item.get("categorie") or "Général").strip() or "Général"
            current = category_map.get(cat) or {"categorie": cat, "stock": 0, "seuil": 0}
            current["stock"] += qty
            current["seuil"] += seuil
            category_map[cat] = current

        taux = round((disponibles / total) * 100) if total else 0

        # Consumption trends (last 6 months, SORTIE only)
        now = timezone.localdate()

        def month_start(year, month, delta):
            target = month + delta
            year = year + (target - 1) // 12
            month = (target - 1) % 12 + 1
            return date(year, month, 1)

        months = [month_start(now.year, now.month, -i) for i in range(5, -1, -1)]

        month_keys = [f"{m.year}-{m.month:02d}" for m in months]
        month_labels = [
            ["janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"][m.month - 1]
            for m in months
        ]

        movements = (
            StockMovement.objects.filter(
                type_mouvement="SORTIE",
                created_at__date__gte=months[0],
                created_at__date__lte=now,
            )
            .select_related("stock_item")
            .only("stock_item__categorie", "created_at", "quantite")
        )

        cat_totals = {}
        for mv in movements:
            cat = (getattr(mv.stock_item, "categorie", None) or "Général").strip() or "Général"
            cat_totals[cat] = cat_totals.get(cat, 0) + safe_int(mv.quantite)

        categories = [c for c, _ in sorted(cat_totals.items(), key=lambda x: x[1], reverse=True)][:4]

        totals = {key: {cat: 0 for cat in categories} for key in month_keys}
        for mv in movements:
            mv_date = mv.created_at.date()
            key = f"{mv_date.year}-{mv_date.month:02d}"
            if key not in totals:
                continue
            cat = (getattr(mv.stock_item, "categorie", None) or "Général").strip() or "Général"
            if cat not in categories:
                continue
            totals[key][cat] += safe_int(mv.quantite)

        consumption_data = []
        for idx, key in enumerate(month_keys):
            row = {"month": month_labels[idx]}
            row.update(totals.get(key, {}))
            consumption_data.append(row)

        return Response(
            {
                "kpis": {
                    "total": total,
                    "taux": taux,
                    "stockAlerts": stock_alerts,
                    "expSoon": exp_soon,
                },
                "stockRepartition": stock_repartition,
                "expirationBuckets": expiration_buckets,
                "stockByCategory": sorted(
                    category_map.values(), key=lambda x: x["stock"], reverse=True
                )[:8],
                "consumption": {
                    "categories": categories,
                    "data": consumption_data,
                },
            }
        )


class PointageMedecinListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PointageMedecinSerializer
    queryset = PointageMedecin.objects.select_related("medecin").all()

    def get_queryset(self):
        qs = self.queryset.order_by("-date", "-created_at")
        date_param = self.request.query_params.get("date")
        view_mode = (self.request.query_params.get("view") or "day").lower()
        medecin_id = self.request.query_params.get("medecin")
        statut = self.request.query_params.get("statut")
        start_param = self.request.query_params.get("start")
        end_param = self.request.query_params.get("end")

        if medecin_id:
            qs = qs.filter(medecin_id=medecin_id)

        if statut:
            qs = qs.filter(statut=statut)

        def parse_date(value):
            try:
                return date.fromisoformat(value)
            except Exception:
                return None

        if start_param or end_param:
            start_date = parse_date(start_param) if start_param else None
            end_date = parse_date(end_param) if end_param else None
            if start_date and end_date:
                qs = qs.filter(date__range=(start_date, end_date))
            elif start_date:
                qs = qs.filter(date__gte=start_date)
            elif end_date:
                qs = qs.filter(date__lte=end_date)
            return qs

        if date_param:
            selected = parse_date(date_param)
            if selected:
                if view_mode == "week":
                    start_week = selected - timedelta(days=selected.weekday())
                    end_week = start_week + timedelta(days=6)
                    qs = qs.filter(date__range=(start_week, end_week))
                else:
                    qs = qs.filter(date=selected)
        return qs


class PointageMedecinDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PointageMedecinSerializer
    queryset = PointageMedecin.objects.select_related("medecin").all()


class PointageMedecinAnnualSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        year_param = request.query_params.get("year")
        medecin_id = request.query_params.get("medecin")

        try:
            year = int(year_param) if year_param else timezone.localdate().year
        except (TypeError, ValueError):
            year = timezone.localdate().year

        qs = PointageMedecin.objects.select_related("medecin").filter(date__year=year)
        if medecin_id:
            qs = qs.filter(medecin_id=medecin_id)

        total_pointages = qs.count()
        total_presents = qs.filter(statut="PRESENT").count()
        total_absents = qs.filter(statut="ABSENT").count()
        total_conges = qs.filter(statut="CONGE").count()
        total_missions = qs.filter(statut="MISSION").count()

        def minutes_between(arrivee, depart):
            if not arrivee or not depart:
                return 0
            start = arrivee.hour * 60 + arrivee.minute
            end = depart.hour * 60 + depart.minute
            return max(end - start, 0)

        total_minutes = 0
        monthly = {
            m: {
                "month": m,
                "label": "",
                "presents": 0,
                "absents": 0,
                "conges": 0,
                "missions": 0,
                "totalHeures": 0,
                "tauxPresence": 0,
            }
            for m in range(1, 13)
        }

        month_labels = [
            "Jan",
            "Fév",
            "Mar",
            "Avr",
            "Mai",
            "Juin",
            "Juil",
            "Août",
            "Sep",
            "Oct",
            "Nov",
            "Déc",
        ]

        for row in qs:
            m = row.date.month
            bucket = monthly[m]
            if row.statut == "PRESENT":
                bucket["presents"] += 1
            elif row.statut == "ABSENT":
                bucket["absents"] += 1
            elif row.statut == "CONGE":
                bucket["conges"] += 1
            elif row.statut == "MISSION":
                bucket["missions"] += 1

            minutes = minutes_between(row.heure_arrivee, row.heure_depart)
            total_minutes += minutes
            bucket["totalHeures"] += round(minutes / 60, 2) if minutes else 0

        monthly_summary = []
        for m in range(1, 13):
            bucket = monthly[m]
            bucket["label"] = month_labels[m - 1]
            month_total = (
                bucket["presents"]
                + bucket["absents"]
                + bucket["conges"]
                + bucket["missions"]
            )
            bucket["tauxPresence"] = (
                round((bucket["presents"] / month_total) * 100, 1)
                if month_total
                else 0
            )
            monthly_summary.append(bucket)

        taux_presence = (
            round((total_presents / total_pointages) * 100, 1)
            if total_pointages
            else 0
        )

        top_doctors = []
        if not medecin_id:
            top_rows = (
                PointageMedecin.objects.filter(date__year=year)
                .values(
                    "medecin_id",
                    "medecin__first_name",
                    "medecin__last_name",
                    "medecin__username",
                )
                .annotate(presents=Count("id", filter=Q(statut="PRESENT")))
                .order_by("-presents")[:5]
            )
            for item in top_rows:
                full_name = f"{item.get('medecin__first_name','')} {item.get('medecin__last_name','')}".strip()
                top_doctors.append(
                    {
                        "medecinId": item.get("medecin_id"),
                        "nom": full_name or item.get("medecin__username") or "",
                        "presents": item.get("presents") or 0,
                    }
                )

        return Response(
            {
                "year": year,
                "totalPointages": total_pointages,
                "totalPresents": total_presents,
                "totalAbsents": total_absents,
                "totalConges": total_conges,
                "totalMissions": total_missions,
                "totalHeures": round(total_minutes / 60, 2),
                "tauxPresence": taux_presence,
                "monthlySummary": monthly_summary,
                "topDoctors": top_doctors,
            }
        )





class DemandeExamenLaboListCreateByCollaborateurView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, collaborateur_id):
        collab = get_object_or_404(Collaborateur, pk=collaborateur_id)
        qs = DemandeExamenLabo.objects.filter(collaborateur=collab).order_by("-date")
        serializer = DemandeExamenLaboSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request, collaborateur_id):
        collab = get_object_or_404(Collaborateur, pk=collaborateur_id)
        serializer = DemandeExamenLaboSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user, collaborateur=collab)
        return Response(serializer.data, status=status.HTTP_201_CREATED)




class ExamenComplementaireListCreateByCollaborateurView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, collaborateur_id):
        collab = get_object_or_404(Collaborateur, pk=collaborateur_id)
        qs = ExamenComplementaire.objects.filter(collaborateur=collab).order_by("-date")
        serializer = ExamenComplementaireSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request, collaborateur_id):
        collab = get_object_or_404(Collaborateur, pk=collaborateur_id)
        serializer = ExamenComplementaireSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user, collaborateur=collab)
        exam = serializer.instance
        if request.query_params.get("pdf") == "1":
            pdf_bytes = generate_complementary_exam_pdf(exam)
            response = HttpResponse(pdf_bytes, content_type="application/pdf")
            response["Content-Disposition"] = f'inline; filename="examen_complementaire_{exam.id}.pdf"'
            return response
        return Response(serializer.data, status=status.HTTP_201_CREATED)




class FicheAptitudeListCreateByCollaborateurView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, collaborateur_id):
        collab = get_object_or_404(Collaborateur, pk=collaborateur_id)
        qs = FicheAptitude.objects.filter(collaborateur=collab).order_by("-date")
        serializer = FicheAptitudeSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request, collaborateur_id):
        collab = get_object_or_404(Collaborateur, pk=collaborateur_id)
        serializer = FicheAptitudeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user, collaborateur=collab)
        return Response(serializer.data, status=status.HTTP_201_CREATED)




class FicheAptitudeListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FicheAptitudeSerializer
    queryset = FicheAptitude.objects.select_related("collaborateur").all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)




class FicheAptitudeDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FicheAptitudeSerializer
    queryset = FicheAptitude.objects.select_related("collaborateur").all()




class ExamenLaboListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DemandeExamenLaboSerializer
    queryset = DemandeExamenLabo.objects.select_related("collaborateur").all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)




class ExamenLaboDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DemandeExamenLaboSerializer
    queryset = DemandeExamenLabo.objects.select_related("collaborateur").all()




class ExamenCompListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ExamenComplementaireSerializer
    queryset = ExamenComplementaire.objects.select_related("collaborateur").all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        exam = serializer.instance
        if request.query_params.get("pdf") == "1":
            pdf_bytes = generate_complementary_exam_pdf(exam)
            response = HttpResponse(pdf_bytes, content_type="application/pdf")
            response["Content-Disposition"] = f'inline; filename="examen_complementaire_{exam.id}.pdf"'
            return response
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)




class ExamenCompDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ExamenComplementaireSerializer
    queryset = ExamenComplementaire.objects.select_related("collaborateur").all()



def link_callback(uri, rel):
    if settings.STATIC_URL and uri.startswith(settings.STATIC_URL):
        path = finders.find(uri.replace(settings.STATIC_URL, ""))
        if path:
            return path
    if settings.MEDIA_URL and uri.startswith(settings.MEDIA_URL):
        path = os.path.join(settings.MEDIA_ROOT, uri.replace(settings.MEDIA_URL, ""))
        return path
    return uri


def require_medecin_travail(request):
    role = (getattr(request.user, "role", "") or "").strip().upper()
    if role not in ["MEDECIN_TRAVAIL", "ADMIN"]:
        raise PermissionDenied(
            "Seul le médecin du travail peut modifier le dossier médical."
        )


def ensure_temp_dir():
    temp_dir = Path(settings.BASE_DIR) / "tmp"
    temp_dir.mkdir(exist_ok=True)
    tempfile.tempdir = str(temp_dir)


def patch_xhtml2pdf_tempfile():
    if getattr(xhtml_files, "_patched_tempfile", False):
        return

    def get_named_tmp_file(self):
        data = self.get_data()
        tmp_file = tempfile.NamedTemporaryFile(suffix=self.suffix, delete=False)
        if data:
            tmp_file.write(data)
            tmp_file.flush()
            tmp_file.close()
            xhtml_files.files_tmp.append(tmp_file)
        if self.path is None:
            self.path = tmp_file.name
        return tmp_file

    xhtml_files.BaseFile.get_named_tmp_file = get_named_tmp_file
    xhtml_files._patched_tempfile = True


def shape_arabic(text: str) -> str:
    reshaped = arabic_reshaper.reshape(text)
    return get_display(reshaped)


def register_arabic_font():
    try:
        pdfmetrics.getFont("Amiri")
        return
    except Exception:
        pass
    font_path = finders.find("fonts/Amiri-Regular.ttf")
    if font_path:
        pdfmetrics.registerFont(TTFont("Amiri", font_path))






def generate_aptitude_fiche_pdf(fiche):
    import io
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.units import cm
    from reportlab.lib import colors

    def safe(value):
        return value or ""

    def fmt_date(value):
        return value.strftime("%d/%m/%Y") if value else ""

    def find_static_image(filename):
        static_path = Path(settings.BASE_DIR) / "static" / "images" / filename
        if static_path.exists():
            return str(static_path)
        found = finders.find(f"images/{filename}")
        return found

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=landscape(A4))
    width, height = landscape(A4)

    LEFT = 1.5 * cm
    RIGHT = width - 1.5 * cm
    CENTER = width / 2
    MED_BLUE = colors.HexColor("#004080")

    p.setStrokeColor(MED_BLUE)
    p.setFillColor(MED_BLUE)

    # ----- HEADER (Logos flanking text) -----
    y_header = height - 1.2 * cm

    # LEFT ISO Logo
    logo_path = find_static_image("tuv_cert.png")
    if logo_path and os.path.exists(logo_path):
        p.drawImage(
            logo_path,
            LEFT,
            y_header - 1.0 * cm,
            width=2.4 * cm,
            height=1.4 * cm,
            mask="auto",
            preserveAspectRatio=True,
        )

    # RIGHT Medical Logo
    logo2_path = find_static_image("logo_gmt_monastir.png")
    if logo2_path and os.path.exists(logo2_path):
        p.drawImage(
            logo2_path,
            RIGHT - 2.4 * cm,
            y_header - 1.0 * cm,
            width=2.4 * cm,
            height=1.4 * cm,
            mask="auto",
            preserveAspectRatio=True,
        )

    # Groupement Text (CENTER)
    p.setFont("Times-Bold", 12)
    p.drawCentredString(CENTER, y_header, "Groupement de Médecine")
    p.drawCentredString(CENTER, y_header - 0.4 * cm, "du travail de Monastir")
    p.setFont("Times-Bold", 9)
    p.drawCentredString(CENTER, y_header - 0.8 * cm, "Tél.: 73 508 100  Fax: 73 508 101")
    p.drawCentredString(CENTER, y_header - 1.2 * cm, "Certifié ISO 9001:2008")

    # Form ID Box (Top Right)
    p.setLineWidth(0.5)
    box_w, box_h = 2.8 * cm, 1.2 * cm
    p.rect(RIGHT - 0.5 * cm, height - 1.5 * cm, box_w, box_h, stroke=1, fill=0)
    p.setFont("Times-Bold", 8)
    p.drawCentredString(RIGHT + 0.9 * cm, height - 0.6 * cm, "FR - VME 15/01")
    matricule = safe(getattr(getattr(fiche, "collaborateur", None), "matricule", ""))
    p.drawString(RIGHT - 0.4 * cm, height - 1.3 * cm, f"Mle {matricule or '.......'}")

    # ----- TITLE & LEGAL TEXT -----
    y = height - 3.5 * cm
    p.setFont("Times-Bold", 14)
    p.drawCentredString(CENTER, y, "FICHE D'APTITUDE AU TRAVAIL")

    y -= 0.6 * cm
    p.setFont("Times-Bold", 8)
    disclaimer = (
        "En application des dispositions de l'article 11 du Décret n° 2000-1985 du 12 septembre 2000 "
        "portant organisation et du fonctionnement des services de médecine du travail"
    )
    p.drawCentredString(CENTER, y, disclaimer)

    # ----- 1- L'ENTREPRISE -----
    y -= 0.8 * cm
    p.setFont("Times-Bold", 11)
    p.drawString(LEFT, y, "1- L'ENTREPRISE :")
    p.line(LEFT, y - 1, LEFT + 3.8 * cm, y - 1)

    p.setFont("Times-Bold", 9)
    y -= 0.6 * cm
    p.drawString(
        LEFT + 0.5 * cm,
        y,
        "Raison sociale : ....................................................................................... Adresse : ...................................................................................",
    )
    p.drawString(LEFT + 3.0 * cm, y, safe(getattr(fiche, "entreprise", "")))
    p.drawString(CENTER + 3.5 * cm, y, safe(getattr(fiche, "adresse_entreprise", "")))

    y -= 0.5 * cm
    p.drawString(
        LEFT + 0.5 * cm,
        y,
        "Nature d'activité : .................................................................................................................................................................................",
    )
    p.drawString(LEFT + 3.2 * cm, y, safe(getattr(fiche, "nature_activite", "")))

    # ----- 2- LE TRAVAILLEUR -----
    y -= 0.8 * cm
    p.setFont("Times-Bold", 11)
    p.drawString(LEFT, y, "2- LE TRAVAILLEUR :")
    p.line(LEFT, y - 1, LEFT + 4.2 * cm, y - 1)

    p.setFont("Times-Bold", 9)
    y -= 0.6 * cm
    p.drawString(
        LEFT + 0.5 * cm,
        y,
        "Nom et Prénom : ..................................................................................... Date et lieu de naissance(Age) : ........................................",
    )
    p.drawString(LEFT + 3.0 * cm, y, safe(getattr(fiche, "nom_prenom", "")))
    p.drawString(CENTER + 3.5 * cm, y, safe(getattr(fiche, "date_lieu_naissance", "")))

    y -= 0.5 * cm
    p.drawString(
        LEFT + 0.5 * cm,
        y,
        "Adresse : .......................................................................................................... N°CNSS : ............................................................................",
    )
    p.drawString(LEFT + 2.0 * cm, y, safe(getattr(fiche, "adresse_travailleur", "")))
    p.drawString(CENTER + 3.2 * cm, y, safe(getattr(fiche, "cnss_travailleur", "")))

    y -= 0.5 * cm
    p.drawString(
        LEFT + 0.5 * cm,
        y,
        "Date de recrutement : ................................... Poste de travail : ................................... Qualifications professionnelles : .....................",
    )
    p.drawString(LEFT + 4.0 * cm, y, fmt_date(getattr(fiche, "date_recrutement", None)))
    p.drawString(CENTER - 0.2 * cm, y, safe(getattr(fiche, "poste_travail", "")))
    p.drawString(RIGHT - 4.5 * cm, y, safe(getattr(fiche, "qualifications_professionnelles", "")))

    # ----- 3- EXAMENS MÉDICAUX -----
    y -= 0.8 * cm
    p.setFont("Times-Bold", 11)
    p.drawString(LEFT, y, "3- EXAMENS MÉDICAUX :")
    p.line(LEFT, y - 1, LEFT + 4.8 * cm, y - 1)

    y -= 0.8 * cm
    vtype_code = safe(getattr(fiche, "type_examen", ""))
    types = [
        ("EMBAUCHE", "Embauche"),
        ("PERIODIQUE", "Périodique"),
        ("REPRISE", "Reprise"),
        ("SPONTANE", "Spontanée"),
    ]
    for i, (code, label) in enumerate(types):
        p.rect(CENTER - 6.5 * cm + i * 4.5 * cm, y - 3, 22, 18, stroke=1, fill=0)
        if vtype_code == code:
            p.drawString(CENTER - 6.35 * cm + i * 4.5 * cm, y + 2, "X")
        p.setFont("Times-Bold", 10)
        p.drawString(CENTER - 5.5 * cm + i * 4.5 * cm, y + 2, label)

    # ----- CONCLUSION SECTION -----
    y -= 1.0 * cm
    p.setFont("Times-Bold", 10)
    p.drawString(
        LEFT + 0.5 * cm,
        y,
        "Je soussigné (e) : .................................................................... médecin du travail, certifie que le travailleur surnommé est:",
    )
    p.drawString(LEFT + 3.5 * cm, y, safe(getattr(fiche, "medecin_travail", "")) or "...................")

    y -= 0.8 * cm
    conc = safe(getattr(fiche, "aptitude", ""))
    opts = [
        (
            "APTE",
            "Apte au poste ( préciser le poste de travail, les EPI et les recommandations spécifiques si nécessaires ) : .........................................................................................................................................",
        ),
        (
            "APTE_AMENAGEMENT",
            "Apte avec aménagement du poste ( à préciser) : .........................................................................................................................",
        ),
        (
            "INAPTE_TEMPORAIRE",
            "Inapte temporaire au poste (préciser la période) : ...........................................................................................................................",
        ),
        (
            "APTE_APRES_CHANGEMENT",
            "Apte après changement du poste(à préciser) : ..........................................................................................................................",
        ),
        (
            "INAPTE_DEFINITIF",
            "Inapte définitif à tout poste du travail dans l'entreprise :...........................................................................................................",
        ),
    ]

    for code, label in opts:
        p.rect(LEFT + 1.0 * cm, y - 3, 14, 14, stroke=1, fill=0)
        if conc == code:
            p.drawString(LEFT + 1.1 * cm, y, "X")
        p.setFont("Times-Bold", 9)
        p.drawString(LEFT + 1.8 * cm, y, label)
        y -= 0.8 * cm

    # Footer section
    y = 3.0 * cm
    p.setFont("Times-Bold", 9)
    p.drawString(
        LEFT,
        y,
        "Ce certificat doit être conservé dans le dossier administratif de l'intéressé chez son employeur",
    )

    p.setFont("Times-Bold", 11)
    p.drawRightString(RIGHT, y, "Date et Signature du médecin du travail")
    p.drawRightString(RIGHT, y - 0.7 * cm, f"Fait le {fmt_date(getattr(fiche, 'date_examen', None) or getattr(fiche, 'date', None))}")

    # Bottom Address Line
    p.setLineWidth(1.5)
    p.line(LEFT, 1.2 * cm, RIGHT, 1.2 * cm)
    p.setFont("Times-Roman", 8)
    footer_text = "Zone Industrielle Route de Khnis - Monastir-Boite Postale N° 41 - Poste Gare Monastir-5097"
    p.drawCentredString(CENTER, 0.8 * cm, footer_text)
    p.drawCentredString(CENTER, 0.4 * cm, "Tél.: 73 508 100 / Fax: 73 508 101")

    p.showPage()
    p.save()
    return buffer.getvalue()




def generate_lab_request_pdf(lab_req):
    import io
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A5
    from reportlab.lib.units import cm
    from reportlab.lib import colors

    def safe(value):
        return value or ""

    def fmt_date(value):
        return value.strftime("%d/%m/%Y") if value else ""

    def find_static_image(filename):
        static_path = Path(settings.BASE_DIR) / "static" / "images" / filename
        if static_path.exists():
            return str(static_path)
        found = finders.find(f"images/{filename}")
        return found

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A5)
    width, height = A5

    register_arabic_font()
    ARABIC_FONT = "Amiri" if "Amiri" in pdfmetrics.getRegisteredFontNames() else "Helvetica"

    LEFT = 1.0 * cm
    RIGHT = width - 1.0 * cm
    CENTER = width / 2
    MED_BLUE = colors.HexColor("#004080")

    p.setStrokeColor(MED_BLUE)
    p.setFillColor(MED_BLUE)

    # ----- TOP BAR -----
    y = height - 0.8 * cm
    p.setFont("Times-Roman", 9)
    p.drawString(LEFT, y, "N° du Labo ....................")

    # Boxed Form ID (Top Right)
    p.setLineWidth(0.5)
    box_w, box_h = 2.8 * cm, 0.6 * cm
    p.rect(RIGHT - box_w, y - 0.2 * cm, box_w, box_h, stroke=1, fill=0)
    p.setFont("Times-Roman", 8)
    p.drawCentredString(RIGHT - box_w / 2, y, "FR - VME - 06/02")

    y -= 0.8 * cm
    # Groupement de Médecine... (Left)
    p.setFont("Times-Bold", 9)
    p.drawString(LEFT, y, "Groupement de Médecine du Travail")

    # Arabic equivalent (Right)
    p.setFont(ARABIC_FONT, 10)
    p.drawRightString(RIGHT, y, shape_arabic("مجمع طب الشغل"))

    y -= 0.4 * cm
    p.setFont("Times-Roman", 9)
    p.drawString(LEFT, y, "Du Gouvernorat de Monastir")

    p.setFont(ARABIC_FONT, 10)
    p.drawRightString(RIGHT, y, shape_arabic("بولاية المنستير"))

    # Center Logo (Medical)
    y_logo = height - 1.8 * cm
    logo_path = find_static_image("logo_gmt_monastir.png")
    if logo_path and os.path.exists(logo_path):
        p.drawImage(logo_path, CENTER - 1.2 * cm, y_logo - 0.2 * cm, width=2.4 * cm, height=1.4 * cm, mask="auto", preserveAspectRatio=True)

    p.setFont("Times-Bold", 7)
    p.drawCentredString(CENTER, y_logo - 0.8 * cm, "Certifié ISO 9001 : 2008")

    # Serial Number (Right side)
    p.setFont("Times-Bold", 12)
    p.drawRightString(RIGHT, height - 3.2 * cm, f"N° {getattr(lab_req, 'id', 0):06d}")

    # ----- TITLE -----
    y = height - 4.0 * cm
    p.setFont("Times-Bold", 14)
    p.drawCentredString(CENTER, y, "DEMANDE D'EXAMENS DE LABORATOIRE")

    # ----- PATIENT INFO -----
    y -= 0.9 * cm
    p.setFont("Times-Roman", 10)

    # Line 1
    p.drawString(LEFT, y, "NOM ET PRÉNOM :")
    p.setFont("Times-Bold", 10)
    p.drawString(LEFT + 3.2 * cm, y, safe(getattr(lab_req, "nom_prenom", "")))

    p.setFont("Times-Roman", 10)
    p.drawString(RIGHT - 5.5 * cm, y, "ÂGE :")
    p.setFont("Times-Bold", 10)
    p.drawString(RIGHT - 4.5 * cm, y, safe(getattr(lab_req, "age", "")))

    p.setFont("Times-Roman", 10)
    p.drawString(RIGHT - 3.2 * cm, y, "Mle :")
    p.setFont("Times-Bold", 10)
    p.drawString(RIGHT - 2.4 * cm, y, safe(getattr(getattr(lab_req, "collaborateur", None), "matricule", "")))

    y -= 0.6 * cm
    # Line 2
    p.setFont("Times-Bold", 10)
    p.drawString(LEFT, y, "C.I.N :")
    p.drawString(LEFT + 1.5 * cm, y, safe(getattr(lab_req, "cin", "")))

    p.drawString(CENTER + 0.5 * cm, y, "GSM :")
    p.drawString(CENTER + 2.0 * cm, y, safe(getattr(lab_req, "gsm", "")))

    y -= 0.6 * cm
    # Line 3
    p.drawString(LEFT, y, "ENTREPRISE :")
    p.drawString(LEFT + 2.8 * cm, y, safe(getattr(lab_req, "entreprise", "")) or "LEONI")

    y -= 0.6 * cm
    p.drawString(LEFT, y, "POSTE DE TRAVAIL :")
    p.drawString(LEFT + 4.0 * cm, y, safe(getattr(lab_req, "poste_travail", "")))

    y -= 0.8 * cm
    # Renseignements cliniques
    p.setFont("Times-Bold", 10)
    p.drawString(LEFT, y, "RENSEIGNEMENTS CLINIQUES :")
    p.setFont("Times-Bold", 9)
    p.drawString(LEFT + 5.8 * cm, y, safe(getattr(lab_req, "renseignements_cliniques", "")) or "Néant")

    y -= 0.8 * cm
    # Exam section header
    p.setFont("Times-Bold", 11)
    p.drawString(LEFT, y, "EXAMENS DE LABORATOIRE :")
    p.setLineWidth(1)
    p.line(LEFT, y - 1, LEFT + 5.5 * cm, y - 1)

    y -= 0.8 * cm

    # Exams List
    exams = [
        ("glycemie", "GLYCÉMIE"),
        ("creatinine", "CRÉATININE"),
        ("nfs", "NFS"),
        ("vs", "VS"),
        ("transaminases", "TRANSAMINASES"),
        ("acide_urique", "ACIDE URIQUE"),
        ("triglycerides", "TRIGLYCÉRIDES"),
        ("cholestorol", "CHOLESTÉROL"),
        ("selle_parasitologie", "EXAMENS COPRO-PARASITOLOGIQUES DES SELLES"),
    ]

    for key, label in exams:
        p.setLineWidth(0.8)
        p.rect(LEFT + 0.5 * cm, y - 4, 12, 12, stroke=1, fill=0)
        if getattr(lab_req, key, False):
            p.setFont("Times-Bold", 11)
            p.drawString(LEFT + 0.65 * cm, y - 2, "X")

        p.setFont("Times-Bold", 10)
        p.drawString(LEFT + 1.2 * cm, y - 1, label)
        y -= 0.6 * cm

    # ----- NOTES -----
    y = 4.2 * cm
    p.setFont("Times-Bold", 9)
    p.drawString(LEFT, y, "NB: Pour effectuer les analyses de laboratoire, vous devez vous présenter")
    y -= 0.4 * cm
    p.drawString(LEFT + 0.5 * cm, y, "à jeun et avant 10h du matin.")

    y -= 1.0 * cm
    p.setFont(ARABIC_FONT, 16)
    p.drawCentredString(
        CENTER,
        y,
        shape_arabic(
            "لإجراء التحاليل المخبرية يجب الحضور صائما و قبل الساعة 10 صباحا"
        ),
    )

    # ----- Footer Fields -----
    y = 2.4 * cm
    p.setFont("Times-Bold", 10)
    p.drawRightString(RIGHT, y, "DATE : ...............................................")
    p.drawString(RIGHT - 4.5 * cm, y + 2, fmt_date(getattr(lab_req, "date", None)))

    y -= 0.7 * cm
    p.setFont("Times-Bold", 10)
    p.drawRightString(RIGHT, y, "CACHET ET SIGNATURE DU MÉDECIN DU TRAVAIL")

    # ----- BLUE FOOTER LINE -----
    p.setLineWidth(1.5)
    p.line(LEFT, 1.2 * cm, RIGHT, 1.2 * cm)

    # Footer Logo (ISO)
    logo2_path = find_static_image("tuv_cert.png")
    if logo2_path and os.path.exists(logo2_path):
        p.drawImage(logo2_path, LEFT, 0.4 * cm, width=1.2 * cm, height=0.7 * cm, mask="auto", preserveAspectRatio=True)

    p.setFont("Times-Roman", 8)
    footer_text = "Zone Industrielle Route de Khnis - Monastir-Boite Postale N° 41 - Poste Gare Monastir-5097"
    p.drawCentredString(CENTER, 0.8 * cm, footer_text)
    p.drawCentredString(CENTER, 0.4 * cm, "Tél.: 73 508 100 / Fax: 73 508 101")

    p.showPage()
    p.save()
    return buffer.getvalue()




def generate_complementary_exam_pdf(comp_req):
    import io
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A5
    from reportlab.lib.units import cm
    from reportlab.lib import colors

    def safe(value):
        return value or ""

    def fmt_date(value):
        return value.strftime("%d/%m/%Y") if value else ""

    def find_static_image(filename):
        static_path = Path(settings.BASE_DIR) / "static" / "images" / filename
        if static_path.exists():
            return str(static_path)
        found = finders.find(f"images/{filename}")
        return found

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A5)
    width, height = A5

    register_arabic_font()
    ARABIC_FONT = "Amiri" if "Amiri" in pdfmetrics.getRegisteredFontNames() else "Helvetica"

    LEFT = 1.0 * cm
    RIGHT = width - 1.0 * cm
    CENTER = width / 2
    MED_BLUE = colors.HexColor("#004080")

    p.setStrokeColor(MED_BLUE)
    p.setFillColor(MED_BLUE)

    # ----- TOP BAR -----
    y = height - 0.8 * cm
    p.setFont("Times-Roman", 9)
    p.drawString(LEFT, y, "N° du Labo ....................")

    # Boxed Form ID (Top Right)
    p.setLineWidth(0.5)
    box_w, box_h = 2.8 * cm, 0.6 * cm
    p.rect(RIGHT - box_w, y - 0.2 * cm, box_w, box_h, stroke=1, fill=0)
    p.setFont("Times-Roman", 8)
    p.drawCentredString(RIGHT - box_w / 2, y, "FR - VME - 03/03")

    y -= 0.8 * cm
    # Groupement de Médecine... (Left)
    p.setFont("Times-Bold", 9)
    p.drawString(LEFT, y, "Groupement de Médecine du travail")

    # Arabic equivalent (Right)
    p.setFont(ARABIC_FONT, 10)
    p.drawRightString(RIGHT, y, shape_arabic("مجمع طب الشغل"))

    y -= 0.4 * cm
    p.setFont("Times-Roman", 9)
    p.drawString(LEFT, y, "Du Gouvernorat de Monastir")

    p.setFont(ARABIC_FONT, 10)
    p.drawRightString(RIGHT, y, shape_arabic("بولاية المنستير"))

    # Center Logo (Medical)
    y_logo = height - 1.8 * cm
    logo_path = find_static_image("logo_gmt_monastir.png")
    if logo_path and os.path.exists(logo_path):
        p.drawImage(logo_path, CENTER - 1.2 * cm, y_logo - 0.2 * cm, width=2.4 * cm, height=1.4 * cm, mask="auto", preserveAspectRatio=True)

    p.setFont("Times-Bold", 7)
    p.drawCentredString(CENTER, y_logo - 0.8 * cm, "Certifié ISO 9001 : 2008")

    # Serial Number (Right side)
    p.setFont("Times-Bold", 12)
    p.drawRightString(RIGHT, height - 3.2 * cm, f"N°  {getattr(comp_req, 'id', 0):06d}")

    # ----- TITLE -----
    y = height - 4.0 * cm
    p.setFont("Times-Bold", 14)
    p.drawCentredString(CENTER, y, "DEMANDE D'EXAMENS COMPLÉMENTAIRES")

    # ----- PATIENT INFO -----
    y -= 0.9 * cm
    emp = getattr(comp_req, "collaborateur", None)
    p.setFont("Times-Roman", 10)

    # Line 1
    p.drawString(LEFT, y, "NOM ET PRENOM :")
    p.setFont("Times-Bold", 10)
    full_name = ""
    if emp:
        full_name = f"{emp.nom or ''} {emp.prenom or ''}".strip()
    p.drawString(LEFT + 3.2 * cm, y, safe(comp_req.nom_prenom or full_name))

    p.setFont("Times-Roman", 10)
    p.drawString(RIGHT - 5.5 * cm, y, "AGE :")
    p.setFont("Times-Bold", 10)
    p.drawString(RIGHT - 4.5 * cm, y, safe(comp_req.age))

    p.setFont("Times-Roman", 10)
    p.drawString(RIGHT - 3.2 * cm, y, "Mle :")
    p.setFont("Times-Bold", 10)
    p.drawString(RIGHT - 2.4 * cm, y, safe(getattr(emp, "matricule", "")))

    y -= 0.8 * cm
    # Line 2
    p.setFont("Times-Bold", 10)
    p.drawString(LEFT, y, "ENTREPRISE :")
    p.setFont("Times-Bold", 10)
    p.drawString(LEFT + 2.8 * cm, y, safe(comp_req.entreprise))

    p.setFont("Times-Bold", 10)
    p.drawString(CENTER + 0.5 * cm, y, "POSTE DE TRAVAIL :")
    p.setFont("Times-Bold", 10)
    p.drawString(CENTER + 4.5 * cm, y, safe(comp_req.poste_travail))

    y -= 0.8 * cm
    # Renseignements cliniques
    p.setFont("Times-Bold", 10)
    p.drawString(LEFT, y, "RENSEIGNEMENTS CLINIQUES :")
    p.setFont("Times-Bold", 9)
    clin_text = safe(comp_req.renseignements_cliniques) or "Néant"
    p.drawString(LEFT + 5.8 * cm, y, clin_text)

    y -= 1.0 * cm
    # Exam section header
    p.setFont("Times-Bold", 11)
    p.setLineWidth(1)
    p.drawString(LEFT, y, "RENSEIGNEMENTS COMPLEMENTAIRES :")
    p.line(LEFT, y - 1, LEFT + 7.5 * cm, y - 1)

    y -= 1.2 * cm

    # Exams List
    exams = [
        ("visiotest", "VISIOTEST :"),
        ("audiogramme", "AUDIOGRAMME :"),
        ("ecg", "ECG"),
        ("efr", "EFR :"),
    ]

    for key, label in exams:
        p.setLineWidth(0.8)
        p.rect(LEFT, y - 4, 16, 16, stroke=1, fill=0)
        if getattr(comp_req, key, False):
            p.setFont("Times-Bold", 14)
            p.drawString(LEFT + 0.15 * cm, y - 2, "X")

        p.setFont("Times-Bold", 11)
        p.drawString(LEFT + 0.8 * cm, y - 1, label)
        y -= 1.0 * cm

    # ----- Footer Fields -----
    y = 3 * cm
    p.setFont("Times-Bold", 10)
    current_date = fmt_date(getattr(comp_req, "date", None))
    p.drawRightString(RIGHT, y, "DATE : ...............................................")
    p.drawString(RIGHT - 4.5 * cm, y + 2, current_date)

    y -= 0.7 * cm
    p.setFont("Times-Bold", 10)
    p.drawRightString(RIGHT, y, "CACHET ET SIGNATURE DU MÉDECIN DU TRAVAIL")

    # ----- BLUE FOOTER LINE -----
    p.setLineWidth(1.5)
    p.line(LEFT, 1.2 * cm, RIGHT, 1.2 * cm)

    # Footer Logo (ISO)
    logo2_path = find_static_image("tuv_cert.png")
    if logo2_path and os.path.exists(logo2_path):
        p.drawImage(logo2_path, LEFT, 0.4 * cm, width=1.2 * cm, height=0.7 * cm, mask="auto", preserveAspectRatio=True)

    p.setFont("Times-Roman", 8)
    footer_text = "Zone Industrielle Route de Khnis - Monastir-Boite Postale N° 41 - Poste Gare Monastir-5097"
    p.drawCentredString(CENTER, 0.8 * cm, footer_text)
    p.drawCentredString(CENTER, 0.4 * cm, "Tél.: 73 508 100 / Fax: 73 508 101")

    p.showPage()
    p.save()
    return buffer.getvalue()


class FicheAptitudePdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        fiche = get_object_or_404(FicheAptitude, pk=pk)
        pdf_bytes = generate_aptitude_fiche_pdf(fiche)
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="fiche_aptitude_{pk}.pdf"'
        return response


class DemandeExamenLaboPdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        lab_req = get_object_or_404(DemandeExamenLabo, pk=pk)
        pdf_bytes = generate_lab_request_pdf(lab_req)
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="demande_labo_{pk}.pdf"'
        return response


class ExamenComplementairePdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        comp_req = get_object_or_404(ExamenComplementaire, pk=pk)
        pdf_bytes = generate_complementary_exam_pdf(comp_req)
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="examen_complementaire_{pk}.pdf"'
        return response


class DossierMedicalPdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        dossier = get_object_or_404(DossierMedical.objects.select_related("collaborateur"), pk=pk)
        collab = dossier.collaborateur

        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        margin = 2.0 * cm
        y = height - margin

        p.setFont("Times-Bold", 16)
        p.drawString(margin, y, "DOSSIER M?DICAL")
        y -= 1.0 * cm

        p.setFont("Times-Roman", 11)
        p.drawString(margin, y, f"Collaborateur : {collab.nom} {collab.prenom}")
        y -= 0.6 * cm
        p.drawString(margin, y, f"Matricule : {collab.matricule}")
        y -= 0.6 * cm
        p.drawString(margin, y, f"Entreprise : {dossier.entreprise or ''}")
        y -= 0.6 * cm
        p.drawString(margin, y, f"Localit? : {dossier.localite or ''}")
        y -= 0.6 * cm
        p.drawString(margin, y, f"Poste actuel : {dossier.poste_travail_actuel or ''}")

        p.showPage()
        p.save()
        response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="dossier_medical_{collab.matricule}.pdf"'
        return response



STATUS_LABELS = {
    "EN_ATTENTE": "En attente",
    "VALIDE": "Validés",
    "REFUSE": "Refusés",
}


def _empty_medecin_controleur_report_payload():
    return {
        "total_dossiers": 0,
        "total_controles": 0,
        "total_expertises": 0,
        "taux_validation": 0,
        "par_statut": {
            "En attente": 0,
            "Validés": 0,
            "Refusés": 0,
        },
        "par_type": {
            "Contrôle médical": 0,
            "Demande d'expertise": 0,
        },
        "par_mois": [],
        "par_gravite": {
            "Faible": 0,
            "Moyenne": 0,
            "Grave": 0,
            "Critique": 0,
        },
    }


def _infer_report_severity(record_type, record):
    text_parts = []

    if record_type == "controle":
        text_parts.extend(
            [
                getattr(record, "repos_prescrit", "") or "",
                getattr(record, "avis_medecin_controleur", "") or "",
            ]
        )
    else:
        text_parts.extend(
            [
                getattr(record, "aptitude_poste", "") or "",
                getattr(record, "autres_missions", "") or "",
                getattr(record, "pieces_jointes", "") or "",
                " ".join(getattr(record, "attachment_names", []) or []),
            ]
        )

    normalized = " ".join(text_parts).lower()

    if any(keyword in normalized for keyword in ["critique", "urgence", "urgent"]):
        return "Critique"
    if any(keyword in normalized for keyword in ["grave", "inapte", "hospital"]):
        return "Grave"
    if any(part.strip() for part in text_parts):
        return "Moyenne"
    return "Faible"


def _build_medecin_controleur_report_payload():
    try:
        ensure_medecin_controleur_history_tables()
        controles = list(ControleMedicalRecord.objects.all())
        expertises = list(DemandeExpertiseRecord.objects.all())
    except (OperationalError, ProgrammingError):
        logger.exception("Impossible de lire l'historique médecin contrôleur pour les statistiques.")
        payload = _empty_medecin_controleur_report_payload()
        payload["summary"] = {
            "total_dossiers": payload["total_dossiers"],
            "taux_validation": payload["taux_validation"],
            "total_controles": payload["total_controles"],
            "total_expertises": payload["total_expertises"],
        }
        payload["dossiers_par_type"] = [
            {"name": "Contrôle médical", "value": 0},
            {"name": "Demande d'expertise", "value": 0},
        ]
        payload["repartition_par_statut"] = [
            {"name": "En attente", "value": 0, "color": "#F59E0B"},
            {"name": "Validés", "value": 0, "color": "#2563EB"},
            {"name": "Refusés", "value": 0, "color": "#E11D48"},
        ]
        payload["accidents_par_gravite"] = [
            {"name": "Faible", "value": 0},
            {"name": "Moyenne", "value": 0},
            {"name": "Grave", "value": 0},
            {"name": "Critique", "value": 0},
        ]
        return payload

    total_controles = len(controles)
    total_expertises = len(expertises)
    total_dossiers = total_controles + total_expertises

    status_totals = {"En attente": 0, "Validés": 0, "Refusés": 0}
    for row in ControleMedicalRecord.objects.values("statut").annotate(total=Count("id")):
        status_totals[STATUS_LABELS.get(row["statut"], "En attente")] += row["total"]
    for row in DemandeExpertiseRecord.objects.values("statut").annotate(total=Count("id")):
        status_totals[STATUS_LABELS.get(row["statut"], "En attente")] += row["total"]

    validated_count = status_totals["Validés"]
    taux_validation = round((validated_count / total_dossiers) * 100) if total_dossiers else 0

    severity_totals = {"Faible": 0, "Moyenne": 0, "Grave": 0, "Critique": 0}
    for record in controles:
        severity_totals[_infer_report_severity("controle", record)] += 1
    for record in expertises:
        severity_totals[_infer_report_severity("expertise", record)] += 1

    month_labels = {
        1: "Jan",
        2: "Fév",
        3: "Mar",
        4: "Avr",
        5: "Mai",
        6: "Juin",
        7: "Juil",
        8: "Août",
        9: "Sep",
        10: "Oct",
        11: "Nov",
        12: "Déc",
    }
    monthly_counts = {}

    controle_rows = (
        ControleMedicalRecord.objects.annotate(month=ExtractMonth("date"))
        .values("month")
        .annotate(total=Count("id"))
        .order_by("month")
    )
    for row in controle_rows:
        month = row["month"]
        if month is None:
            continue
        label = month_labels.get(month, str(month))
        monthly_counts.setdefault(label, {"month": label, "controles": 0, "expertises": 0})
        monthly_counts[label]["controles"] = row["total"]

    expertise_rows = (
        DemandeExpertiseRecord.objects.annotate(month=ExtractMonth("date"))
        .values("month")
        .annotate(total=Count("id"))
        .order_by("month")
    )
    for row in expertise_rows:
        month = row["month"]
        if month is None:
            continue
        label = month_labels.get(month, str(month))
        monthly_counts.setdefault(label, {"month": label, "controles": 0, "expertises": 0})
        monthly_counts[label]["expertises"] = row["total"]

    par_statut = {
        "En attente": status_totals["En attente"],
        "Validés": status_totals["Validés"],
        "Refusés": status_totals["Refusés"],
    }
    par_type = {
        "Contrôle médical": total_controles,
        "Demande d'expertise": total_expertises,
    }
    par_gravite = {
        "Faible": severity_totals["Faible"],
        "Moyenne": severity_totals["Moyenne"],
        "Grave": severity_totals["Grave"],
        "Critique": severity_totals["Critique"],
    }
    par_mois = list(monthly_counts.values())

    return {
        "total_dossiers": total_dossiers,
        "total_controles": total_controles,
        "total_expertises": total_expertises,
        "taux_validation": taux_validation,
        "par_statut": par_statut,
        "par_type": par_type,
        "par_mois": par_mois,
        "par_gravite": par_gravite,
        "summary": {
            "total_dossiers": total_dossiers,
            "taux_validation": taux_validation,
            "total_controles": total_controles,
            "total_expertises": total_expertises,
        },
        "dossiers_par_type": [
            {"name": "Contrôle médical", "value": total_controles},
            {"name": "Demande d'expertise", "value": total_expertises},
        ],
        "repartition_par_statut": [
            {"name": "En attente", "value": status_totals["En attente"], "color": "#F59E0B"},
            {"name": "Validés", "value": status_totals["Validés"], "color": "#2563EB"},
            {"name": "Refusés", "value": status_totals["Refusés"], "color": "#E11D48"},
        ],
        "accidents_par_gravite": [
            {"name": "Faible", "value": severity_totals["Faible"]},
            {"name": "Moyenne", "value": severity_totals["Moyenne"]},
            {"name": "Grave", "value": severity_totals["Grave"]},
            {"name": "Critique", "value": severity_totals["Critique"]},
        ],
    }


class ControleMedicalRecordListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        require_medecin_controleur(request)
        ensure_medecin_controleur_history_tables()
        queryset = ControleMedicalRecord.objects.all().order_by("-date", "-created_at")
        return Response(
            ControleMedicalRecordSerializer(queryset, many=True).data,
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        require_medecin_controleur(request)
        try:
            ensure_medecin_controleur_history_tables()
            serializer = ControleMedicalRecordSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            record = serializer.save(created_by=request.user)
            return Response(
                ControleMedicalRecordSerializer(record).data,
                status=status.HTTP_201_CREATED,
            )
        except ValidationError as exc:
            logger.warning("Validation contrôle médical invalide: %s", exc.detail)
            return Response(
                {"detail": exc.detail, "code": "controle_medical_validation_failed"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            logger.exception("Erreur lors de l'enregistrement d'un contrôle médical.")
            return Response(
                {"detail": str(exc), "code": "controle_medical_save_failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class DemandeExpertiseRecordListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        require_medecin_controleur(request)
        ensure_medecin_controleur_history_tables()
        queryset = DemandeExpertiseRecord.objects.all().order_by("-date", "-created_at")
        return Response(
            DemandeExpertiseRecordSerializer(queryset, many=True).data,
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        require_medecin_controleur(request)
        try:
            ensure_medecin_controleur_history_tables()
            serializer = DemandeExpertiseRecordSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            record = serializer.save(created_by=request.user)
            return Response(
                DemandeExpertiseRecordSerializer(record).data,
                status=status.HTTP_201_CREATED,
            )
        except ValidationError as exc:
            logger.warning("Validation demande expertise invalide: %s", exc.detail)
            return Response(
                {"detail": exc.detail, "code": "demande_expertise_validation_failed"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            logger.exception("Erreur lors de l'enregistrement d'une demande d'expertise.")
            return Response(
                {"detail": str(exc), "code": "demande_expertise_save_failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class MedecinControleurReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        require_medecin_controleur(request)
        return Response(_build_medecin_controleur_report_payload(), status=status.HTTP_200_OK)


class StatistiquesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        require_medecin_controleur(request)
        return Response(_build_medecin_controleur_report_payload(), status=status.HTTP_200_OK)

class CertificatMedicalPdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        certificat = get_object_or_404(
            CertificatMedical.objects.select_related("collaborateur", "created_by"),
            pk=pk,
        )
        collab = certificat.collaborateur
        user = certificat.created_by

        medecin_nom = ""
        if user:
            full_name = f"{user.first_name or ''} {user.last_name or ''}".strip()
            medecin_nom = full_name or user.username

        context = {
            "arabic_medecine": shape_arabic("?? ???"),
            "date_du_jour": _fmt_date(date.today()),
            "medecin_nom": medecin_nom or "Docteur",
            "collaborateur_nom_complet": f"{collab.nom} {collab.prenom}",
            "nb_jours": certificat.nb_jours_repos,
            "date_debut_repos": _fmt_date(certificat.date_debut_repos),
        }

        html_string = render_to_string("medical/certificat_pdf.html", context)

        result = BytesIO()
        ensure_temp_dir()
        patch_xhtml2pdf_tempfile()
        pdf = pisa.CreatePDF(
            src=html_string,
            dest=result,
            encoding="utf-8",
            link_callback=link_callback,
        )

        if pdf.err:
            return Response(
                {"detail": "Erreur g?n?ration PDF certificat."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response = HttpResponse(result.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = (
            f'inline; filename="certificat_{collab.matricule}_{pk}.pdf"'
        )
        return response


class OrdonnancePdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        ordonnance = get_object_or_404(
            Ordonnance.objects.select_related("collaborateur", "created_by"),
            pk=pk,
        )
        collab = ordonnance.collaborateur
        user = ordonnance.created_by

        medecin_nom = ""
        if user:
            full_name = f"{user.first_name or ''} {user.last_name or ''}".strip()
            medecin_nom = full_name or user.username

        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        margin = 2.0 * cm
        y = height - margin

        p.setFont("Times-Bold", 16)
        p.drawString(margin, y, "ORDONNANCE")
        y -= 1.0 * cm

        p.setFont("Times-Roman", 11)
        p.drawString(margin, y, f"Patient : {collab.nom} {collab.prenom}")
        y -= 0.6 * cm
        p.drawString(margin, y, f"Matricule : {collab.matricule}")
        y -= 0.6 * cm
        p.drawString(margin, y, f"Date : {_fmt_date(ordonnance.date)}")
        y -= 0.6 * cm
        p.drawString(margin, y, f"M?decin : {medecin_nom}")
        y -= 0.9 * cm

        p.setFont("Times-Roman", 11)
        text = p.beginText(margin, y)
        text.setLeading(14)
        for line in (ordonnance.contenu or "").splitlines() or [""]:
            text.textLine(line)
        p.drawText(text)

        p.showPage()
        p.save()
        response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = (
            f'inline; filename="ordonnance_{collab.matricule}_{pk}.pdf"'
        )
        return response
def _fmt_date(value):
    return value.strftime("%d/%m/%Y") if value else ""


def _fmt_time(value):
    return value.strftime("%H:%M") if value else ""


class AccidentTravailPdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        accident = get_object_or_404(
            AccidentTravail.objects.select_related("dossier__collaborateur"),
            pk=pk,
        )

        collab = accident.dossier.collaborateur
        dossier = accident.dossier

        context = {
            "accident": accident,
            "collab": collab,
            "matricule": getattr(collab, "matricule", ""),
            "employeur_nom": accident.employeur_nom
            or getattr(dossier, "entreprise", "")
            or getattr(getattr(collab, "site", None), "nom", ""),
            "employeur_adresse": accident.employeur_adresse
            or getattr(dossier, "localite", "")
            or getattr(getattr(collab, "site", None), "localite", ""),
            "victime_nom": accident.victime_nom or getattr(collab, "nom", ""),
            "victime_prenom": accident.victime_prenom or getattr(collab, "prenom", ""),
            "victime_cin": accident.victime_cin or getattr(collab, "cin", ""),
            "victime_date_naissance": _fmt_date(
                accident.victime_date_naissance or getattr(collab, "date_naissance", None)
            ),
            "victime_adresse": accident.victime_adresse or getattr(collab, "adresse", ""),
            "date_accident": _fmt_date(accident.date_accident),
            "heure_accident": _fmt_time(accident.heure_accident),
            "horaire_debut": _fmt_time(accident.horaire_travail_debut),
            "horaire_fin": _fmt_time(accident.horaire_travail_fin),
            "date_arret": _fmt_date(accident.date_arret),
            "heure_arret": _fmt_time(accident.heure_arret),
            "rapport_police_date": _fmt_date(accident.rapport_police_date),
            "signature_date": _fmt_date(accident.signature_date),
        }

        html_string = render_to_string("medical/accident_travail_pdf.html", context)

        result = BytesIO()
        ensure_temp_dir()
        patch_xhtml2pdf_tempfile()
        pdf = pisa.CreatePDF(
            src=html_string,
            dest=result,
            encoding="utf-8",
            link_callback=link_callback,
        )

        if pdf.err:
            return Response(
                {"detail": "Erreur génération PDF accident du travail."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response = HttpResponse(result.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = (
            f'inline; filename="declaration_accident_{collab.matricule}.pdf"'
        )
        return response


class MaladieProfessionnellePdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        maladie = get_object_or_404(
            MaladieProfessionnelle.objects.select_related("dossier__collaborateur"),
            pk=pk,
        )
        collab = maladie.dossier.collaborateur
        dossier = maladie.dossier

        context = {
            "maladie": maladie,
            "collab": collab,
            "matricule": getattr(collab, "matricule", ""),
            "employeur_nom": maladie.employeur_nom
            or getattr(dossier, "entreprise", "")
            or getattr(getattr(collab, "site", None), "nom", ""),
            "employeur_adresse": maladie.employeur_adresse
            or getattr(dossier, "localite", "")
            or getattr(getattr(collab, "site", None), "localite", ""),
            "victime_nom": maladie.victime_nom or getattr(collab, "nom", ""),
            "victime_prenom": maladie.victime_prenom or getattr(collab, "prenom", ""),
            "victime_cin": maladie.victime_cin or getattr(collab, "cin", ""),
            "victime_date_naissance": _fmt_date(
                maladie.victime_date_naissance or getattr(collab, "date_naissance", None)
            ),
            "victime_adresse": maladie.victime_adresse or getattr(collab, "adresse", ""),
            "date_decouverte": _fmt_date(maladie.date_decouverte),
            "date_constat": _fmt_date(maladie.date_constat),
            "date_arret_exposition": _fmt_date(maladie.date_arret_exposition),
            "date_arret": _fmt_date(maladie.date_arret),
            "signature_date": _fmt_date(maladie.signature_date),
        }

        html_string = render_to_string("medical/maladie_professionnelle_pdf.html", context)

        result = BytesIO()
        ensure_temp_dir()
        patch_xhtml2pdf_tempfile()
        pdf = pisa.CreatePDF(
            src=html_string,
            dest=result,
            encoding="utf-8",
            link_callback=link_callback,
        )

        if pdf.err:
            return Response(
                {"detail": "Erreur génération PDF maladie professionnelle."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response = HttpResponse(result.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = (
            f'inline; filename="declaration_maladie_{collab.matricule}.pdf"'
        )
        return response
