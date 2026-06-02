from pathlib import Path
from io import BytesIO
import base64
import logging
import os
import re
import tempfile
import random
import unicodedata
from datetime import date, datetime, timedelta
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.staticfiles import finders
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import OperationalError, ProgrammingError, connection, transaction
from django.db.models import Sum, Count, Case, When, Value, CharField, Q, F
from django.db.models.functions import ExtractMonth, ExtractYear
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
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.serializers import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView

try:
    import openpyxl
except ImportError:  # pragma: no cover
    openpyxl = None

from accounts.models import Collaborateur, Site
from accounts.serializers import CollaborateurSerializer
from notifications.models import Notification

from .models import (
    DossierMedical,
    ExamenInitial,
    ExamenUlterieur,
    PosteTravail,
    IncidentInfirmier,
    AccidentTravail,
    EnqueteInitialeAccident,
    MaladieProfessionnelle,
    Vaccination,
    FicheMedicale,
    Ordonnance,
    CertificatMedical,
    StockItem,
    StockMovement,
    IncidentAvecBon,
    IncidentSansBon,
    PointageMedecin,
    BonChauffeur,
    SuiviTransfertUrgence,
    PlanActionHSEE,
    TransmissionEnqueteHSEE,
    HSEEGeneratedReport,
    FicheAptitude,
    DemandeExamenLabo,
    ExamenComplementaire,
    ControleMedicalRecord,
    DemandeExpertiseRecord,
)

from .serializers import (
    DossierMedicalSerializer,
    ExamenInitialSerializer,
    ExamenUlterieurSerializer,
    PosteTravailSerializer,
    IncidentInfirmierSerializer,
    AccidentTravailSerializer,
    EnqueteInitialeAccidentSerializer,
    MaladieProfessionnelleSerializer,
    VaccinationSerializer,
    FicheMedicaleSerializer,
    OrdonnanceSerializer,
    CertificatMedicalSerializer,
    StockItemSerializer,
    StockMovementSerializer,
    IncidentAvecBonSerializer,
    IncidentSansBonSerializer,
    BonChauffeurSerializer,
    SuiviTransfertUrgenceSerializer,
    PointageMedecinSerializer,
    PlanActionHSEESerializer,
    AIAnalysisRequestSerializer,
    HSEEEnqueteSerializer,
    HSEETransmissionSerializer,
    HSEEReportTemplateSerializer,
    HSEEGeneratedReportSerializer,
    HSEEReportGenerateSerializer,
    FicheAptitudeSerializer,
    DemandeExamenLaboSerializer,
    ExamenComplementaireSerializer,
    ControleMedicalRecordSerializer,
    DemandeExpertiseRecordSerializer,
)
from .services import pdf_services as medical_pdf_services
from .services.pdf_services import (
    generate_aptitude_fiche_pdf,
    generate_certificate_pdf,
    generate_complementary_exam_pdf,
    generate_contre_visite_pdf,
    generate_dossier_medical_pdf,
    generate_expertise_pdf,
    generate_fiche_medicale_pdf,
    generate_lab_request_pdf,
    generate_occupational_disease_pdf,
    generate_voucher_pdf,
)
from .services.ai_service import (
    AIServiceConfigurationError,
    AIServiceRequestError,
    analyze_medical_text,
)

logger = logging.getLogger(__name__)

HSEE_MONTH_LABELS = {
    1: "Jan",
    2: "Fev",
    3: "Mar",
    4: "Avr",
    5: "Mai",
    6: "Juin",
    7: "Juil",
    8: "Aout",
    9: "Sep",
    10: "Oct",
    11: "Nov",
    12: "Dec",
}

LEGACY_SITE_MATRICULE_BASES = {
    "MH": 1683100000,
    "MS": 1683200000,
    "MT1": 1683300000,
    "MT2": 1683400000,
}


@api_view(["POST"])
# TEMPORAIRE : accès libre pour tests IA
@permission_classes([AllowAny])
def analyse_ai(request):
    serializer = AIAnalysisRequestSerializer(data=request.data)

    try:
        serializer.is_valid(raise_exception=True)
    except ValidationError as exc:
        description_errors = exc.detail.get("description") if isinstance(exc.detail, dict) else None
        if description_errors:
            return Response(
                {
                    "success": False,
                    "error": "Description vide.",
                    "details": description_errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        raise

    description = serializer.validated_data["description"]
    analysis_type = serializer.validated_data["type"]

    try:
        result = analyze_medical_text(description, analysis_type)
    except AIServiceConfigurationError as exc:
        return Response(
            {
                "success": False,
                "error": "Clé API Gemini absente ou configuration invalide.",
                "details": str(exc),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    except AIServiceRequestError as exc:
        return Response(
            {
                "success": False,
                "error": "Erreur Gemini",
                "details": str(exc),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    except Exception as exc:
        return Response(
            {
                "success": False,
                "error": "Erreur Gemini",
                "details": str(exc) or exc.__class__.__name__,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(
        {
            "success": True,
            "analysis": result["analysis"],
            "type": analysis_type,
            "source": result["source"],
        },
        status=status.HTTP_200_OK,
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


def require_medecin_controleur(request):
    role = (getattr(request.user, "role", "") or "").strip().upper()
    if role not in ["MEDECIN_CONTROLEUR", "ADMIN"]:
        raise PermissionDenied(
            "Seul le médecin contrôleur peut accéder à cet historique."
        )


def ensure_medecin_controleur_history_tables():
    existing_tables = connection.introspection.table_names()
    required_tables = [
        ControleMedicalRecord._meta.db_table,
        DemandeExpertiseRecord._meta.db_table,
    ]
    missing_tables = [table for table in required_tables if table not in existing_tables]

    if missing_tables:
        raise OperationalError(
            "Tables d'historique médecin contrôleur manquantes: "
            + ", ".join(missing_tables)
        )


def _normalize_hsee_period(value):
    period = (value or "6m").strip().lower()
    if period in {"6m", "6_mois", "6mois", "6-mois"}:
        return "6m"
    if period in {"12m", "12_mois", "12mois", "12-mois"}:
        return "12m"
    if period in {"annual", "annuel", "year", "yearly"}:
        return "annual"
    return "6m"


def _get_hsee_period_start(period):
    now = timezone.now().date()
    if period == "annual":
        return date(now.year, 1, 1)
    if period == "12m":
        return now - timedelta(days=365)
    return now - timedelta(days=183)


def _normalize_hsee_department(value):
    department = (value or "").strip()
    if not department or department.lower() in {"all", "tous", "tous les departements"}:
        return ""
    return department


def _normalize_site_filter(value):
    site = (value or "").strip()
    if not site or site.lower() in {"all", "tous", "tous les sites"}:
        return ""
    return site


def _normalize_collaborateur_lookup_matricule(value):
    raw = str(value or "").strip().upper()
    if not raw:
        return ""

    if re.fullmatch(r"\d{10}", raw):
        return raw

    legacy_match = re.fullmatch(r"(MH|MS|MT1|MT2)\s*-?\s*(\d{1,4})", raw)
    if legacy_match:
        prefix = legacy_match.group(1)
        index = int(legacy_match.group(2))
        return str(LEGACY_SITE_MATRICULE_BASES[prefix] + index)

    digits_only = re.sub(r"\D", "", raw)
    if re.fullmatch(r"\d{10}", digits_only):
        return digits_only

    return raw


def _find_collaborateur_for_enquete(matricule):
    raw = str(matricule or "").strip()
    normalized = _normalize_collaborateur_lookup_matricule(raw)
    attempts = [raw]
    if normalized and normalized not in attempts:
        attempts.append(normalized)

    for candidate in attempts:
        if not candidate:
            continue
        collaborateur = Collaborateur.objects.select_related("site").filter(matricule=candidate).first()
        if collaborateur:
            logger.info(
                "Enquete workflow: collaborator resolved for matricule lookup",
                extra={
                    "workflow": "enquete_initiale",
                    "raw_matricule": raw,
                    "resolved_matricule": collaborateur.matricule,
                    "collaborateur_id": collaborateur.id,
                    "site": getattr(getattr(collaborateur, "site", None), "nom", ""),
                },
            )
            return collaborateur

    logger.warning(
        "Enquete workflow: collaborator lookup failed",
        extra={
            "workflow": "enquete_initiale",
            "raw_matricule": raw,
            "normalized_matricule": normalized,
        },
    )
    raise ValidationError({"victime_matricule": "Collaborateur introuvable pour cette matricule."})


def _build_hsee_filter_meta(request):
    period = _normalize_hsee_period(request.query_params.get("period"))
    department = _normalize_hsee_department(request.query_params.get("department"))
    site = _normalize_site_filter(request.query_params.get("site"))
    return {
        "period": period,
        "department": department,
        "site": site,
        "start_date": _get_hsee_period_start(period),
    }


def _hsee_departments():
    values = set()

    for name in Collaborateur.objects.exclude(departement__isnull=True).exclude(departement__exact="").values_list("departement", flat=True):
        if name:
            values.add(name.strip())

    for name in AccidentTravail.objects.filter(enquete_initiale__sent_to_hsee=True).exclude(segment__isnull=True).exclude(segment__exact="").values_list("segment", flat=True):
        if name:
            values.add(name.strip())

    for name in AccidentTravail.objects.filter(enquete_initiale__sent_to_hsee=True).exclude(activite_service__isnull=True).exclude(activite_service__exact="").values_list("activite_service", flat=True):
        if name:
            values.add(name.strip())

    return sorted(values)


def _hsee_sites():
    values = set()
    for name in Site.objects.exclude(nom__isnull=True).exclude(nom__exact="").values_list("nom", flat=True):
        if name:
            values.add(name.strip())
    return sorted(values)


def _filter_accidents_queryset(start_date, department="", site=""):
    queryset = AccidentTravail.objects.filter(
        enquete_initiale__sent_to_hsee=True,
        date_accident__gte=start_date,
    )
    if department:
        queryset = queryset.filter(
            Q(segment__iexact=department)
            | Q(activite_service__iexact=department)
            | Q(dossier__collaborateur__departement__iexact=department)
        )
    if site:
        queryset = queryset.filter(dossier__collaborateur__site__nom__iexact=site)
    return queryset


def _get_accident_hsee_status(accident):
    enquete = getattr(accident, "enquete_initiale", None)
    if not enquete:
        return "Brouillon"
    if enquete.sent_to_hsee:
        return "Envoye HSEE"
    return enquete.get_statut_display()


def _filter_incidents_queryset(start_date, department="", site=""):
    queryset = IncidentInfirmier.objects.filter(date_incident__gte=start_date)
    if department:
        queryset = queryset.filter(
            Q(segment__iexact=department) | Q(dossier__collaborateur__departement__iexact=department)
        )
    if site:
        queryset = queryset.filter(dossier__collaborateur__site__nom__iexact=site)
    return queryset


def _filter_incidents_avec_bon_queryset(start_date, department="", site=""):
    queryset = IncidentAvecBon.objects.filter(date_incident__gte=start_date)
    if department:
        queryset = queryset.filter(destination__iexact=department)
    if site:
        queryset = queryset.filter(destination__iexact=site)
    return queryset


def _filter_incidents_sans_bon_queryset(start_date, department="", site=""):
    queryset = IncidentSansBon.objects.filter(created_at__date__gte=start_date)
    if department:
        queryset = queryset.filter(Q(segment__iexact=department) | Q(plant__iexact=department))
    if site:
        queryset = queryset.filter(site__iexact=site)
    return queryset


def _filter_transferts_queryset(start_date, department="", site=""):
    queryset = SuiviTransfertUrgence.objects.filter(date__gte=start_date)
    if department:
        queryset = queryset.filter(Q(plant__iexact=department) | Q(cost_center__iexact=department))
    if site:
        queryset = queryset.filter(plant__iexact=site)
    return queryset


def _filter_visites_queryset(start_date, department="", site=""):
    queryset = FicheAptitude.objects.filter(
        Q(date_examen__gte=start_date) | Q(date_examen__isnull=True, date__gte=start_date)
    )
    if department:
        queryset = queryset.filter(collaborateur__departement__iexact=department)
    if site:
        queryset = queryset.filter(collaborateur__site__nom__iexact=site)
    return queryset


def _filter_maladies_queryset(start_date, department="", site=""):
    queryset = MaladieProfessionnelle.objects.filter(date_decouverte__gte=start_date)
    if department:
        queryset = queryset.filter(
            Q(dossier__collaborateur__departement__iexact=department)
            | Q(victime_lieu_travail__iexact=department)
        )
    if site:
        queryset = queryset.filter(dossier__collaborateur__site__nom__iexact=site)
    return queryset


def _format_hsee_series(queryset, label_key, output_key="name", limit=None):
    rows = list(queryset[:limit] if limit else queryset)
    series = []
    for index, row in enumerate(rows):
        label = row.get(label_key) or "Non renseigne"
        series.append(
            {
                output_key: label,
                "value": row.get("value") or 0,
                "color": HSEE_CHART_COLORS[index % len(HSEE_CHART_COLORS)],
            }
        )
    return series


def _month_cursor(start_date, end_date):
    cursor = date(start_date.year, start_date.month, 1)
    end_cursor = date(end_date.year, end_date.month, 1)
    while cursor <= end_cursor:
        yield cursor
        if cursor.month == 12:
            cursor = date(cursor.year + 1, 1, 1)
        else:
            cursor = date(cursor.year, cursor.month + 1, 1)


def _build_hsee_dashboard_payload(request):
    filter_meta = _build_hsee_filter_meta(request)
    start_date = filter_meta["start_date"]
    department = filter_meta["department"]
    site = filter_meta["site"]

    accidents = _filter_accidents_queryset(start_date, department, site).select_related(
        "dossier__collaborateur",
        "enquete_initiale",
        "enquete_initiale__sent_to_hsee_by",
    )
    incidents = _filter_incidents_queryset(start_date, department, site)
    incidents_avec_bon = _filter_incidents_avec_bon_queryset(start_date, department, site)
    incidents_sans_bon = _filter_incidents_sans_bon_queryset(start_date, department, site)
    transferts = _filter_transferts_queryset(start_date, department, site)
    visites = _filter_visites_queryset(start_date, department, site)
    maladies = _filter_maladies_queryset(start_date, department, site)

    total_accidents = accidents.count()
    total_jours_perdus = accidents.aggregate(total=Sum("duree_arret")).get("total") or 0
    total_incidents = incidents.count() + incidents_avec_bon.count() + incidents_sans_bon.count()
    total_transferts = transferts.count()
    total_visites = visites.count()
    total_maladies = maladies.count()
    total_heures_reference = max(total_visites, 1) * 8

    accidents_by_department = (
        accidents.annotate(
            department_label=Case(
                When(activite_service__isnull=False, activite_service__gt="", then=F("activite_service")),
                When(segment__isnull=False, segment__gt="", then=F("segment")),
                default=Value("Non renseigne"),
                output_field=CharField(),
            )
        )
        .values("department_label")
        .annotate(value=Count("id"))
        .order_by("-value", "department_label")
    )

    lesion_types = (
        accidents.exclude(nature_lesion__isnull=True)
        .exclude(nature_lesion__exact="")
        .values("nature_lesion")
        .annotate(value=Count("id"))
        .order_by("-value", "nature_lesion")
    )

    injury_types = (
        accidents.exclude(siege_lesion__isnull=True)
        .exclude(siege_lesion__exact="")
        .values("siege_lesion")
        .annotate(value=Count("id"))
        .order_by("-value", "siege_lesion")
    )

    visit_types = (
        visites.exclude(type_examen__isnull=True)
        .exclude(type_examen__exact="")
        .values("type_examen")
        .annotate(value=Count("id"))
        .order_by("-value", "type_examen")
    )

    lost_days_raw = (
        accidents.annotate(year=ExtractYear("date_accident"), month=ExtractMonth("date_accident"))
        .values("year", "month")
        .annotate(value=Sum("duree_arret"))
        .order_by("year", "month")
    )
    current_year = timezone.now().date().year
    lost_days_map = {
        (row["year"], row["month"]): row.get("value") or 0
        for row in lost_days_raw
        if row.get("year") and row.get("month")
    }
    lost_days_series = [
        {
            "name": (
                HSEE_MONTH_LABELS.get(cursor.month, str(cursor.month))
                if cursor.year == current_year
                else f"{HSEE_MONTH_LABELS.get(cursor.month, str(cursor.month))} {str(cursor.year)[-2:]}"
            ),
            "value": lost_days_map.get((cursor.year, cursor.month), 0),
        }
        for cursor in _month_cursor(start_date, timezone.now().date())
    ]

    recent_accidents = []
    for accident in accidents.order_by("-date_accident", "-created_at")[:10]:
        collab = getattr(accident.dossier, "collaborateur", None)
        employee_name = " ".join(
            filter(
                None,
                [
                    getattr(collab, "prenom", "") or accident.victime_prenom or "",
                    getattr(collab, "nom", "") or accident.victime_nom or "",
                ],
            )
        ).strip()
        recent_accidents.append(
            {
                "id": f"AT-{accident.id:03d}",
                "date": accident.date_accident.strftime("%d/%m/%Y") if accident.date_accident else "",
                "employee": employee_name or "-",
                "department": accident.activite_service or accident.segment or getattr(collab, "departement", "") or "-",
                "nature": accident.nature_lesion or accident.cause or "-",
                "days": accident.duree_arret or 0,
                "status": _get_accident_hsee_status(accident),
            }
        )

    visit_type_labels = dict(FicheAptitude.TYPE_EXAMEN_CHOICES)

    return {
        "filters": {
            "period": filter_meta["period"],
            "department": department,
            "site": site,
            "departments": _hsee_departments(),
            "sites": _hsee_sites(),
        },
        "kpis": {
            "accidents_travail": total_accidents,
            "incidents": total_incidents,
            "taux_frequence_tf": round((total_accidents * 1000000) / total_heures_reference, 2),
            "taux_gravite_tg": round((total_jours_perdus * 1000) / total_heures_reference, 2),
            "jours_perdus": total_jours_perdus,
            "transferts_urgence": total_transferts,
            "visites_medicales": total_visites,
            "maladies_professionnelles": total_maladies,
        },
        "charts": {
            "accidents_by_department": _format_hsee_series(accidents_by_department, "department_label", "name"),
            "lesion_types": _format_hsee_series(lesion_types, "nature_lesion", "name", limit=6),
            "medical_visit_types": [
                {"name": visit_type_labels.get(row["type_examen"], row["type_examen"]), "value": row.get("value") or 0}
                for row in visit_types
            ],
            "injury_types": _format_hsee_series(injury_types, "siege_lesion", "name", limit=6),
            "lost_days_by_month": lost_days_series,
        },
        "recent_accidents": recent_accidents,
    }


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


def _fmt_pdf_date(value):
    if not value:
        return "-"
    try:
        return value.strftime("%d/%m/%Y")
    except Exception:
        return str(value)


def _fmt_pdf_time(value):
    if not value:
        return "-"
    try:
        return value.strftime("%H:%M")
    except Exception:
        return str(value)


def _fmt_pdf_datetime(value):
    if not value:
        return "-"
    try:
        return timezone.localtime(value).strftime("%d/%m/%Y %H:%M")
    except Exception:
        return str(value)


def _safe_pdf_filename(value):
    normalized = unicodedata.normalize("NFKD", str(value or ""))
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    cleaned = re.sub(r"[^A-Za-z0-9_-]+", "_", ascii_value).strip("_")
    return cleaned or "enquete"


def generate_enquete_initiale_pdf(enquete):
    collab = getattr(enquete.dossier, "collaborateur", None)
    temoins = enquete.temoins if isinstance(enquete.temoins, list) else []

    context = {
        "enquete": enquete,
        "collaborateur": collab,
        "accident": getattr(enquete, "accident", None),
        "temoins": temoins,
        "generated_at": _fmt_pdf_datetime(timezone.now()),
        "created_at": _fmt_pdf_datetime(enquete.created_at),
        "sent_to_hsee_at": _fmt_pdf_datetime(enquete.sent_to_hsee_at),
        "date_accident": _fmt_pdf_date(enquete.date_accident),
        "heure_accident": _fmt_pdf_time(enquete.heure_accident),
    }

    html_string = render_to_string("medical/enquete_initiale_accident_pdf.html", context)
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
        raise ValueError("Erreur generation PDF enquete initiale.")

    return result.getvalue()


def save_enquete_initiale_pdf(enquete, pdf_bytes):
    pdf_dir = Path(settings.BASE_DIR) / "tmp_pdf" / "enquetes-initiales"
    pdf_dir.mkdir(parents=True, exist_ok=True)
    victim_slug = _safe_pdf_filename(enquete.victime_matricule or enquete.victime_nom_prenom)
    filename = f"enquete_initiale_{enquete.pk}_{victim_slug}.pdf"
    file_path = pdf_dir / filename
    file_path.write_bytes(pdf_bytes)
    return file_path


def get_enquete_initiale_pdf_path(enquete):
    pdf_dir = Path(settings.BASE_DIR) / "tmp_pdf" / "enquetes-initiales"
    victim_slug = _safe_pdf_filename(enquete.victime_matricule or enquete.victime_nom_prenom)
    filename = f"enquete_initiale_{enquete.pk}_{victim_slug}.pdf"
    return pdf_dir / filename

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
    queryset = Collaborateur.objects.select_related("site").all()

    def get_queryset(self):
        queryset = super().get_queryset()
        site = _normalize_site_filter(self.request.query_params.get("site"))
        if site:
            queryset = queryset.filter(site__nom__iexact=site)
        return queryset.order_by("nom", "prenom")


class CollaborateurMedDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CollaborateurSerializer
    queryset = Collaborateur.objects.select_related("site").all()


def apply_dossier_autofill(dossier, collaborateur):
    updates = []

    if not dossier.entreprise and getattr(collaborateur, "site", None):
        dossier.entreprise = collaborateur.site.nom
        updates.append("entreprise")

    if not dossier.localite and getattr(collaborateur, "site", None):
        dossier.localite = collaborateur.site.localite
        updates.append("localite")

    if not dossier.profession and getattr(collaborateur, "poste", None):
        dossier.profession = collaborateur.poste
        updates.append("profession")

    if not dossier.poste_travail_actuel and getattr(collaborateur, "poste", None):
        dossier.poste_travail_actuel = collaborateur.poste
        updates.append("poste_travail_actuel")

    if updates:
        dossier.save(update_fields=updates)

    return dossier


class DossierByCollaborateurView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, collaborateur_id):
        collaborateur = get_object_or_404(Collaborateur, pk=collaborateur_id)
        dossier, _ = DossierMedical.objects.get_or_create(collaborateur=collaborateur)
        return dossier

    def get(self, request, collaborateur_id, *args, **kwargs):
        dossier = self.get_object(collaborateur_id)
        return Response(DossierMedicalSerializer(dossier).data)

    def patch(self, request, collaborateur_id, *args, **kwargs):
        dossier = self.get_object(collaborateur_id)
        serializer = DossierMedicalSerializer(dossier, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class DossierByMatriculeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, matricule, *args, **kwargs):
        collaborateur = get_object_or_404(Collaborateur, matricule=matricule)
        dossier, _ = DossierMedical.objects.get_or_create(collaborateur=collaborateur)
        return Response(DossierMedicalSerializer(dossier).data)


class DossierAutofillView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        updated = 0
        for collaborateur in Collaborateur.objects.select_related("site").all():
            dossier, _ = DossierMedical.objects.get_or_create(collaborateur=collaborateur)
            apply_dossier_autofill(dossier, collaborateur)
            updated += 1
        return Response({"updated": updated})


class DossierAutofillOneView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, collaborateur_id, *args, **kwargs):
        collaborateur = get_object_or_404(Collaborateur.objects.select_related("site"), pk=collaborateur_id)
        dossier, _ = DossierMedical.objects.get_or_create(collaborateur=collaborateur)
        apply_dossier_autofill(dossier, collaborateur)
        return Response(DossierMedicalSerializer(dossier).data)


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
        queryset = super().get_queryset()
        site = _normalize_site_filter(self.request.query_params.get("site"))
        if site:
            queryset = queryset.filter(dossier__collaborateur__site__nom__iexact=site)
        return queryset.order_by("-date_incident", "-heure_incident")




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
    queryset = AccidentTravail.objects.select_related(
        "dossier__collaborateur",
        "created_by",
        "enquete_initiale",
        "enquete_initiale__sent_to_hsee_by",
    ).all()

    def get_queryset(self):
        queryset = super().get_queryset()
        site = _normalize_site_filter(self.request.query_params.get("site"))
        if site:
            queryset = queryset.filter(dossier__collaborateur__site__nom__iexact=site)
        return queryset.order_by("-date_accident", "-created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)




class AccidentDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AccidentTravailSerializer
    queryset = AccidentTravail.objects.select_related(
        "dossier__collaborateur",
        "created_by",
        "enquete_initiale",
        "enquete_initiale__sent_to_hsee_by",
    ).all()




def _resolve_enquete_initiale_links(payload):
    matricule = str(payload.get("victime_matricule", "")).strip()
    collaborateur = _find_collaborateur_for_enquete(matricule)
    dossier, _ = DossierMedical.objects.get_or_create(collaborateur=collaborateur)

    accident_queryset = AccidentTravail.objects.filter(dossier=dossier)
    date_accident = payload.get("date_accident")
    if date_accident:
        accident_queryset = accident_queryset.filter(date_accident=date_accident)

    accident = accident_queryset.order_by("-date_accident", "-created_at").first()
    logger.info(
        "Enquete workflow: links resolved",
        extra={
            "workflow": "enquete_initiale",
            "collaborateur_id": collaborateur.id,
            "dossier_id": dossier.id,
            "accident_id": getattr(accident, "id", None),
            "matricule": collaborateur.matricule,
        },
    )
    return dossier, accident, collaborateur


class EnqueteInitialeAccidentListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        queryset = (
            EnqueteInitialeAccident.objects.select_related(
                "accident",
                "dossier__collaborateur",
                "created_by",
                "sent_to_hsee_by",
            )
            .order_by("-date_accident", "-created_at")
        )
        return Response(EnqueteInitialeAccidentSerializer(queryset, many=True).data)

    def post(self, request, *args, **kwargs):
        serializer = EnqueteInitialeAccidentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        dossier, accident, collaborateur = _resolve_enquete_initiale_links(serializer.validated_data)

        instance = serializer.save(
            dossier=dossier,
            accident=accident,
            created_by=request.user,
            statut="ENREGISTRE",
            victime_matricule=collaborateur.matricule,
            victime_nom_prenom=serializer.validated_data.get("victime_nom_prenom")
            or f"{collaborateur.nom} {collaborateur.prenom}".strip(),
            victime_numero_telephone=serializer.validated_data.get("victime_numero_telephone")
            or getattr(collaborateur, "telephone", ""),
            victime_appartenance=serializer.validated_data.get("victime_appartenance")
            or getattr(collaborateur, "departement", ""),
        )

        logger.info(
            "Enquete workflow: investigation created",
            extra={
                "workflow": "enquete_initiale",
                "enquete_id": instance.pk,
                "created_by_id": getattr(request.user, "id", None),
                "created_by_role": getattr(request.user, "role", ""),
                "collaborateur_id": collaborateur.id,
                "matricule": collaborateur.matricule,
                "accident_id": getattr(accident, "id", None),
                "statut": instance.statut,
            },
        )

        return Response(
            EnqueteInitialeAccidentSerializer(
                EnqueteInitialeAccident.objects.select_related(
                    "accident",
                    "dossier__collaborateur",
                    "created_by",
                    "sent_to_hsee_by",
                ).get(pk=instance.pk)
            ).data,
            status=status.HTTP_201_CREATED,
        )


class EnqueteInitialeAccidentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(
            EnqueteInitialeAccident.objects.select_related(
                "accident",
                "dossier__collaborateur",
                "created_by",
                "sent_to_hsee_by",
            ),
            pk=pk,
        )

    def get(self, request, pk, *args, **kwargs):
        return Response(EnqueteInitialeAccidentSerializer(self.get_object(pk)).data)

    def patch(self, request, pk, *args, **kwargs):
        instance = self.get_object(pk)
        serializer = EnqueteInitialeAccidentSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        dossier, accident, collaborateur = _resolve_enquete_initiale_links(
            {
                "victime_matricule": serializer.validated_data.get(
                    "victime_matricule", instance.victime_matricule
                ),
                "date_accident": serializer.validated_data.get(
                    "date_accident", instance.date_accident
                ),
            }
        )

        saved = serializer.save(
            dossier=dossier,
            accident=accident,
            statut="ENVOYE_HSEE" if instance.sent_to_hsee else "ENREGISTRE",
            victime_matricule=collaborateur.matricule,
            victime_nom_prenom=serializer.validated_data.get("victime_nom_prenom", instance.victime_nom_prenom)
            or f"{collaborateur.nom} {collaborateur.prenom}".strip(),
            victime_numero_telephone=serializer.validated_data.get(
                "victime_numero_telephone", instance.victime_numero_telephone
            )
            or getattr(collaborateur, "telephone", ""),
            victime_appartenance=serializer.validated_data.get(
                "victime_appartenance", instance.victime_appartenance
            )
            or getattr(collaborateur, "departement", ""),
        )
        logger.info(
            "Enquete workflow: investigation updated",
            extra={
                "workflow": "enquete_initiale",
                "enquete_id": saved.pk,
                "updated_by_id": getattr(request.user, "id", None),
                "updated_by_role": getattr(request.user, "role", ""),
                "collaborateur_id": collaborateur.id,
                "matricule": collaborateur.matricule,
                "accident_id": getattr(accident, "id", None),
                "statut": saved.statut,
                "sent_to_hsee": saved.sent_to_hsee,
            },
        )
        return Response(EnqueteInitialeAccidentSerializer(saved).data)


class EnqueteInitialeAccidentSendToHSEEView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        enquete = get_object_or_404(
            EnqueteInitialeAccident.objects.select_related(
                "accident",
                "dossier__collaborateur",
                "sent_to_hsee_by",
            ),
            pk=pk,
        )

        if enquete.sent_to_hsee:
            logger.info(
                "Enquete workflow: send skipped because already sent",
                extra={
                    "workflow": "enquete_initiale",
                    "enquete_id": enquete.pk,
                    "matricule": enquete.victime_matricule,
                },
            )
            return Response(EnqueteInitialeAccidentSerializer(enquete).data)

        try:
            pdf_bytes = generate_enquete_initiale_pdf(enquete)
            saved_pdf_path = save_enquete_initiale_pdf(enquete, pdf_bytes)
        except Exception as exc:
            logger.exception("Erreur generation PDF enquete initiale %s", pk)
            return Response(
                {"detail": str(exc) or "Erreur lors de la generation du PDF."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        enquete.sent_to_hsee = True
        enquete.sent_to_hsee_at = timezone.now()
        enquete.sent_to_hsee_by = request.user
        enquete.statut = "ENVOYE_HSEE"
        enquete.save(
            update_fields=[
                "sent_to_hsee",
                "sent_to_hsee_at",
                "sent_to_hsee_by",
                "statut",
                "updated_at",
            ]
        )

        data = EnqueteInitialeAccidentSerializer(enquete).data
        data["pdf_generated"] = True
        data["pdf_filename"] = saved_pdf_path.name
        data["pdf_path"] = str(saved_pdf_path)
        logger.info(
            "Enquete workflow: investigation sent to HSEE",
            extra={
                "workflow": "enquete_initiale",
                "enquete_id": enquete.pk,
                "matricule": enquete.victime_matricule,
                "sent_by_id": getattr(request.user, "id", None),
                "sent_by_role": getattr(request.user, "role", ""),
                "sent_to_hsee_at": enquete.sent_to_hsee_at.isoformat() if enquete.sent_to_hsee_at else "",
            },
        )
        return Response(data)


class EnqueteInitialeAccidentPdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        enquete = get_object_or_404(
            EnqueteInitialeAccident.objects.select_related(
                "accident",
                "dossier__collaborateur",
            ),
            pk=pk,
        )

        pdf_path = get_enquete_initiale_pdf_path(enquete)
        if pdf_path.exists():
            pdf_bytes = pdf_path.read_bytes()
        else:
            pdf_bytes = generate_enquete_initiale_pdf(enquete)
            pdf_path = save_enquete_initiale_pdf(enquete, pdf_bytes)

        disposition = "attachment" if request.query_params.get("download") == "1" else "inline"
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'{disposition}; filename="{pdf_path.name}"'
        return response


def _serialize_hsee_transmission_row(transmission):
    document_name = ""
    document_url = ""
    if getattr(transmission, "document", None):
        document_name = transmission.document.name.rsplit("/", 1)[-1]
        try:
            document_url = transmission.document.url
        except Exception:
            document_url = ""

    return {
        "id": transmission.id,
        "reference": transmission.numero_enquete,
        "type": transmission.type_enquete,
        "dateAccident": transmission.date_accident.isoformat() if transmission.date_accident else "",
        "site": transmission.site,
        "responsable": transmission.responsable,
        "gravity": transmission.niveau_gravite or "",
        "commentaire": transmission.commentaire_transmission or "",
        "priority": transmission.priorite or "",
        "urgent": bool(transmission.urgent),
        "status": transmission.get_transmission_status_display(),
        "statusCode": transmission.transmission_status,
        "documentName": document_name,
        "documentUrl": document_url,
        "sentAt": transmission.sent_at.isoformat() if transmission.sent_at else "",
        "createdAt": transmission.created_at.isoformat() if transmission.created_at else "",
        "updatedAt": transmission.updated_at.isoformat() if transmission.updated_at else "",
        "pdfUrl": f"/api/medical/hsee-transmissions/{transmission.pk}/pdf/",
    }


def _build_transmission_hsee_pdf(transmission):
    import io
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    y = height - 50

    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(40, y, "Transmission des enquetes HSEE")
    y -= 28

    rows = [
        ("Numero enquete", transmission.numero_enquete),
        ("Type d'enquete", transmission.type_enquete),
        ("Date accident", transmission.date_accident.strftime("%Y-%m-%d") if transmission.date_accident else ""),
        ("Site", transmission.site),
        ("Responsable", transmission.responsable),
        ("Niveau de gravite", transmission.niveau_gravite or ""),
        ("Priorite", transmission.priorite or ""),
        ("Urgent", "Oui" if transmission.urgent else "Non"),
        ("Statut", transmission.get_transmission_status_display()),
        ("Envoye a HSEE", "Oui" if transmission.sent_to_hsee else "Non"),
        ("Date d'envoi", transmission.sent_at.strftime("%Y-%m-%d %H:%M") if transmission.sent_at else ""),
        (
            "Document joint",
            transmission.document.name.rsplit("/", 1)[-1] if getattr(transmission, "document", None) else "",
        ),
    ]

    pdf.setFont("Helvetica", 11)
    for label, value in rows:
        pdf.drawString(40, y, f"{label} : {value or '-'}")
        y -= 18
        if y < 120:
            pdf.showPage()
            pdf.setFont("Helvetica", 11)
            y = height - 50

    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(40, y, "Commentaire de transmission")
    y -= 18
    pdf.setFont("Helvetica", 11)
    for line in (transmission.commentaire_transmission or "-").splitlines() or ["-"]:
        pdf.drawString(40, y, line[:110])
        y -= 16
        if y < 60:
            pdf.showPage()
            pdf.setFont("Helvetica", 11)
            y = height - 50

    pdf.save()
    return buffer.getvalue()


class HSEETransmissionListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, *args, **kwargs):
        queryset = TransmissionEnqueteHSEE.objects.order_by("-sent_at", "-created_at")
        logger.info(
            "HSEE transmission workflow: history retrieved",
            extra={
                "workflow": "hsee_transmission",
                "requested_by_id": getattr(request.user, "id", None),
                "requested_by_role": getattr(request.user, "role", ""),
                "count": queryset.count(),
            },
        )
        return Response([_serialize_hsee_transmission_row(item) for item in queryset])

    def post(self, request, *args, **kwargs):
        action = (request.data.get("action") or "save").strip().lower()
        is_submit = action == "transmit"
        document = request.FILES.get("document")

        payload = {
            "numero_enquete": (request.data.get("reference") or "").strip(),
            "type_enquete": (request.data.get("type") or "").strip(),
            "date_accident": request.data.get("dateAccident") or None,
            "site": (request.data.get("site") or "").strip(),
            "responsable": (request.data.get("responsable") or "").strip(),
            "niveau_gravite": (request.data.get("gravity") or "").strip(),
            "priorite": (request.data.get("priority") or "").strip(),
            "urgent": str(request.data.get("urgent") or "").strip().lower() in {"1", "true", "yes", "on"},
            "commentaire_transmission": (request.data.get("commentaire") or "").strip(),
            "transmission_status": "EN_ATTENTE" if is_submit else "BROUILLON",
            "sent_to_hsee": is_submit,
            "sent_at": timezone.now() if is_submit else None,
        }
        if document is not None:
            payload["document"] = document

        serializer = HSEETransmissionSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        transmission = serializer.save(created_by=request.user)

        logger.info(
            "HSEE transmission workflow: transmission created",
            extra={
                "workflow": "hsee_transmission",
                "transmission_id": transmission.pk,
                "reference": transmission.numero_enquete,
                "site": transmission.site,
                "status": transmission.transmission_status,
                "sent_to_hsee": transmission.sent_to_hsee,
                "created_by_id": getattr(request.user, "id", None),
                "created_by_role": getattr(request.user, "role", ""),
            },
        )
        if transmission.sent_to_hsee:
            logger.info(
                "HSEE transmission workflow: transmission submitted to HSEE",
                extra={
                    "workflow": "hsee_transmission",
                    "transmission_id": transmission.pk,
                    "reference": transmission.numero_enquete,
                    "sent_at": transmission.sent_at.isoformat() if transmission.sent_at else "",
                },
            )

        return Response(_serialize_hsee_transmission_row(transmission), status=status.HTTP_201_CREATED)


class HSEETransmissionDetailView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self, pk):
        return get_object_or_404(TransmissionEnqueteHSEE, pk=pk)

    def patch(self, request, pk, *args, **kwargs):
        transmission = self.get_object(pk)
        action = (request.data.get("action") or "").strip().lower()
        document = request.FILES.get("document")

        updates = {}
        field_map = {
            "reference": "numero_enquete",
            "type": "type_enquete",
            "dateAccident": "date_accident",
            "site": "site",
            "responsable": "responsable",
            "gravity": "niveau_gravite",
            "priority": "priorite",
            "commentaire": "commentaire_transmission",
        }
        for request_key, model_key in field_map.items():
            if request_key in request.data:
                updates[model_key] = request.data.get(request_key)
        if "urgent" in request.data:
            updates["urgent"] = str(request.data.get("urgent") or "").strip().lower() in {
                "1",
                "true",
                "yes",
                "on",
            }
        if document is not None:
            updates["document"] = document

        if action == "transmit":
            updates["transmission_status"] = "EN_ATTENTE"
            updates["sent_to_hsee"] = True
            updates["sent_at"] = timezone.now()
        elif action == "save":
            updates["transmission_status"] = "BROUILLON"
            updates["sent_to_hsee"] = False
            updates["sent_at"] = None
        elif action == "validate":
            updates["transmission_status"] = "VALIDEE"
        elif action == "reject":
            updates["transmission_status"] = "REJETEE"

        serializer = HSEETransmissionSerializer(transmission, data=updates, partial=True)
        serializer.is_valid(raise_exception=True)
        saved = serializer.save()

        logger.info(
            "HSEE transmission workflow: transmission updated",
            extra={
                "workflow": "hsee_transmission",
                "transmission_id": saved.pk,
                "reference": saved.numero_enquete,
                "status": saved.transmission_status,
                "sent_to_hsee": saved.sent_to_hsee,
                "updated_by_id": getattr(request.user, "id", None),
                "updated_by_role": getattr(request.user, "role", ""),
                "action": action or "edit",
            },
        )
        return Response(_serialize_hsee_transmission_row(saved))


class HSEETransmissionPdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        transmission = get_object_or_404(TransmissionEnqueteHSEE, pk=pk)
        pdf_bytes = _build_transmission_hsee_pdf(transmission)
        disposition = "attachment" if request.query_params.get("download") == "1" else "inline"
        filename = f"transmission_hsee_{transmission.pk}.pdf"
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'{disposition}; filename="{filename}"'
        return response


class HSEEEnquetesReceivedListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        site = _normalize_site_filter(request.query_params.get("site"))
        date_filter = (request.query_params.get("date") or "").strip()
        search = (request.query_params.get("q") or "").strip()

        enquete_queryset = (
            EnqueteInitialeAccident.objects.select_related(
                "accident",
                "dossier__collaborateur",
            )
            .filter(sent_to_hsee=True)
            .order_by("-sent_to_hsee_at", "-date_accident", "-created_at")
        )
        transmission_queryset = TransmissionEnqueteHSEE.objects.filter(sent_to_hsee=True).order_by(
            "-sent_at",
            "-date_accident",
            "-created_at",
        )

        initial_enquete_count = enquete_queryset.count()
        initial_transmission_count = transmission_queryset.count()

        if site:
            enquete_before = enquete_queryset.count()
            transmission_before = transmission_queryset.count()
            enquete_queryset = enquete_queryset.filter(dossier__collaborateur__site__nom__iexact=site)
            transmission_queryset = transmission_queryset.filter(site__iexact=site)
            logger.info(
                "HSEE received investigations: site filter applied",
                extra={
                    "workflow": "enquete_initiale_hsee_received",
                    "site": site,
                    "before_enquete_count": enquete_before,
                    "after_enquete_count": enquete_queryset.count(),
                    "before_transmission_count": transmission_before,
                    "after_transmission_count": transmission_queryset.count(),
                },
            )

        if date_filter:
            enquete_before = enquete_queryset.count()
            transmission_before = transmission_queryset.count()
            enquete_queryset = enquete_queryset.filter(date_accident=date_filter)
            transmission_queryset = transmission_queryset.filter(date_accident=date_filter)
            logger.info(
                "HSEE received investigations: date filter applied",
                extra={
                    "workflow": "enquete_initiale_hsee_received",
                    "date": date_filter,
                    "before_enquete_count": enquete_before,
                    "after_enquete_count": enquete_queryset.count(),
                    "before_transmission_count": transmission_before,
                    "after_transmission_count": transmission_queryset.count(),
                },
            )

        if search:
            enquete_before = enquete_queryset.count()
            transmission_before = transmission_queryset.count()
            enquete_queryset = enquete_queryset.filter(
                Q(victime_nom_prenom__icontains=search)
                | Q(victime_matricule__icontains=search)
                | Q(accident__nature_lesion__icontains=search)
                | Q(accident__cause__icontains=search)
                | Q(dossier__collaborateur__nom__icontains=search)
                | Q(dossier__collaborateur__prenom__icontains=search)
                | Q(dossier__collaborateur__matricule__icontains=search)
            )
            transmission_queryset = transmission_queryset.filter(
                Q(numero_enquete__icontains=search)
                | Q(type_enquete__icontains=search)
                | Q(site__icontains=search)
                | Q(responsable__icontains=search)
                | Q(commentaire_transmission__icontains=search)
            )
            logger.info(
                "HSEE received investigations: search filter applied",
                extra={
                    "workflow": "enquete_initiale_hsee_received",
                    "search": search,
                    "before_enquete_count": enquete_before,
                    "after_enquete_count": enquete_queryset.count(),
                    "before_transmission_count": transmission_before,
                    "after_transmission_count": transmission_queryset.count(),
                },
            )

        logger.info(
            "HSEE received investigations: retrieval started",
            extra={
                "workflow": "enquete_initiale_hsee_received",
                "requested_by_id": getattr(request.user, "id", None),
                "requested_by_role": getattr(request.user, "role", ""),
                "initial_enquete_count": initial_enquete_count,
                "initial_transmission_count": initial_transmission_count,
                "final_enquete_count": enquete_queryset.count(),
                "final_transmission_count": transmission_queryset.count(),
                "site": site,
                "date": date_filter,
                "search": search,
            },
        )

        records = []
        for enquete in enquete_queryset:
            collab = getattr(enquete.dossier, "collaborateur", None)
            records.append(
                {
                    "id": enquete.id,
                    "date": enquete.date_accident,
                    "collaborateur": enquete.victime_nom_prenom
                    or " ".join(
                        filter(
                            None,
                            [
                                getattr(collab, "nom", ""),
                                getattr(collab, "prenom", ""),
                            ],
                        )
                    ).strip(),
                    "matricule": enquete.victime_matricule or getattr(collab, "matricule", ""),
                    "site": getattr(getattr(collab, "site", None), "nom", "") or "",
                    "type_accident": getattr(enquete.accident, "nature_lesion", "")
                    or getattr(enquete.accident, "cause", "")
                    or "Accident",
                    "status": enquete.get_statut_display(),
                    "sent_to_hsee_at": enquete.sent_to_hsee_at,
                    "pdf_url": f"/api/medical/enquetes-initiales/{enquete.pk}/pdf/",
                    "detail": {
                        "lieu_accident": enquete.lieu_accident,
                        "heure_accident": enquete.heure_accident,
                        "circonstances_accident": enquete.circonstances_accident,
                        "siege_type_lesion": enquete.siege_type_lesion,
                        "lieu_transport_victime": enquete.lieu_transport_victime,
                        "victime_appartenance": enquete.victime_appartenance,
                        "victime_horaire_travail": enquete.victime_horaire_travail,
                    },
                    "_sort_datetime": enquete.sent_to_hsee_at or enquete.created_at,
                }
            )

        for transmission in transmission_queryset:
            document_name = ""
            if getattr(transmission, "document", None):
                document_name = transmission.document.name.rsplit("/", 1)[-1]
            records.append(
                {
                    "id": f"transmission-{transmission.id}",
                    "date": transmission.date_accident,
                    "collaborateur": transmission.responsable or transmission.numero_enquete,
                    "matricule": transmission.numero_enquete,
                    "site": transmission.site,
                    "type_accident": transmission.type_enquete,
                    "status": transmission.get_transmission_status_display(),
                    "sent_to_hsee_at": transmission.sent_at,
                    "pdf_url": f"/api/medical/hsee-transmissions/{transmission.pk}/pdf/",
                    "detail": {
                        "lieu_accident": transmission.site,
                        "heure_accident": "",
                        "circonstances_accident": transmission.commentaire_transmission,
                        "siege_type_lesion": transmission.niveau_gravite or "",
                        "lieu_transport_victime": document_name,
                        "victime_appartenance": transmission.site,
                        "victime_horaire_travail": (
                            f"{transmission.priorite or ''}{' - Urgent' if transmission.urgent else ''}".strip(" -")
                        ),
                    },
                    "_sort_datetime": transmission.sent_at or transmission.created_at,
                }
            )

        records.sort(
            key=lambda item: (
                item.get("_sort_datetime") or timezone.make_aware(datetime(1970, 1, 1)),
                item.get("date") or date(1970, 1, 1),
            ),
            reverse=True,
        )
        for item in records:
            item.pop("_sort_datetime", None)

        return Response(records)


class AccidentStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        qs = AccidentTravail.objects.select_related(
            "dossier__collaborateur",
            "enquete_initiale",
            "enquete_initiale__sent_to_hsee_by",
        )
        site = _normalize_site_filter(request.query_params.get("site"))
        if site:
            qs = qs.filter(dossier__collaborateur__site__nom__iexact=site)

        total = qs.count()
        today_count = qs.filter(date_accident=today).count()
        this_month_count = qs.filter(date_accident__year=today.year, date_accident__month=today.month).count()
        sent_hsee = qs.filter(enquete_initiale__sent_to_hsee=True).count()

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
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        return Response(
            {
                "detail": "L'envoi HSEE doit desormais etre effectue depuis l'enquete initiale."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class HSEEAccidentsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        filter_meta = _build_hsee_filter_meta(request)
        queryset = (
            _filter_accidents_queryset(
                filter_meta["start_date"],
                filter_meta["department"],
                filter_meta["site"],
            )
            .select_related(
                "dossier__collaborateur",
                "enquete_initiale",
                "enquete_initiale__sent_to_hsee_by",
            )
            .order_by("-date_accident", "-created_at")[:10]
        )
        return Response(AccidentTravailSerializer(queryset, many=True).data)


class HSEEKpisView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        filter_meta = _build_hsee_filter_meta(request)
        accidents = _filter_accidents_queryset(filter_meta["start_date"], filter_meta["department"])

        total_accidents = accidents.count()
        accidents_graves = accidents.filter(gravite="GRAVE").count()
        enquetes_en_cours = accidents.filter(statut_enquete="EN_COURS").count()
        zones_risque = (
            accidents.exclude(segment__isnull=True)
            .exclude(segment__exact="")
            .values("segment")
            .distinct()
            .count()
        )
        jours_perdus = accidents.aggregate(total=Sum("duree_arret")).get("total") or 0

        return Response(
            {
                "accidents_declares": total_accidents,
                "taux_frequence": total_accidents,
                "taux_gravite": accidents_graves,
                "jours_perdus": jours_perdus,
                "accidents_graves": accidents_graves,
                "enquetes_en_cours": enquetes_en_cours,
                "zones_risque": zones_risque,
            }
        )


class HSEETopCausesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        filter_meta = _build_hsee_filter_meta(request)
        queryset = (
            _filter_accidents_queryset(filter_meta["start_date"], filter_meta["department"])
            .exclude(cause__isnull=True)
            .exclude(cause__exact="")
            .values("cause")
            .annotate(value=Count("id"))
            .order_by("-value", "cause")[:5]
        )
        data = [
            {"label": row["cause"], "value": row["value"]}
            for row in queryset
        ]
        return Response(data)


class HSEEAccidentsParSegmentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        filter_meta = _build_hsee_filter_meta(request)
        queryset = (
            _filter_accidents_queryset(filter_meta["start_date"], filter_meta["department"])
            .exclude(segment__isnull=True)
            .exclude(segment__exact="")
            .values("segment")
            .annotate(value=Count("id"))
            .order_by("-value", "segment")
        )
        return Response(
            [{"label": row["segment"], "value": row["value"]} for row in queryset]
        )


class HSEEAccidentsParGraviteView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        filter_meta = _build_hsee_filter_meta(request)
        queryset = (
            _filter_accidents_queryset(filter_meta["start_date"], filter_meta["department"])
            .exclude(gravite__isnull=True)
            .exclude(gravite__exact="")
            .values("gravite")
            .annotate(value=Count("id"))
            .order_by("-value", "gravite")
        )
        data = []
        for row in queryset:
            label = dict(AccidentTravail.GRAVITE_CHOICES).get(row["gravite"], row["gravite"])
            data.append({"label": label, "value": row["value"]})
        return Response(data)


class HSEEAccidentsParMoisView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        filter_meta = _build_hsee_filter_meta(request)
        queryset = (
            _filter_accidents_queryset(filter_meta["start_date"], filter_meta["department"])
            .annotate(month=ExtractMonth("date_accident"))
            .values("month")
            .annotate(value=Count("id"))
            .order_by("month")
        )
        return Response(
            [{"label": row["month"], "value": row["value"]} for row in queryset]
        )


class HSEEDashboardDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return Response(_build_hsee_dashboard_payload(request))


class HSEEPlanActionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        queryset = PlanActionHSEE.objects.order_by("-created_at")[:10]
        return Response(PlanActionHSEESerializer(queryset, many=True).data)


class HSEEEnqueteListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        queryset = (
            EnqueteInitialeAccident.objects.select_related(
                "accident",
                "dossier__collaborateur",
                "created_by",
                "sent_to_hsee_by",
            )
            .filter(sent_to_hsee=True)
            .order_by("-date_accident", "-created_at")
        )

        records = []
        for enquete in queryset:
            collab = getattr(enquete.dossier, "collaborateur", None)
            records.append(
                {
                    "id": enquete.id,
                    "dossier": enquete.dossier_id,
                    "created_at": enquete.created_at,
                    "updated_at": enquete.updated_at,
                    "created_by_name": getattr(enquete.created_by, "username", "")
                    or getattr(enquete.created_by, "email", ""),
                    "collaborateur_nom": getattr(collab, "nom", ""),
                    "collaborateur_prenom": getattr(collab, "prenom", ""),
                    "matricule": enquete.victime_matricule,
                    "general": {
                        "victimeNom": enquete.victime_nom_prenom,
                        "victimeMatricule": enquete.victime_matricule,
                        "departement": enquete.victime_appartenance or getattr(collab, "departement", ""),
                        "posteShift": enquete.victime_horaire_travail or "",
                        "dateIncident": enquete.date_accident,
                        "heureIncident": enquete.heure_accident,
                        "lieuIncident": enquete.lieu_accident,
                        "descriptionIncident": enquete.circonstances_accident or "",
                    },
                    "lesion": {
                        "natureLesion": getattr(enquete.accident, "nature_lesion", "") or "",
                        "agentMateriel": getattr(enquete.accident, "agent_materiel", "") or "",
                        "causeIdentifiee": getattr(enquete.accident, "cause", "") or "",
                        "presenceStandard": getattr(enquete.accident, "presence_standard", "") or "",
                        "respectStandard": getattr(enquete.accident, "respect_standard", "") or "",
                        "actionImmediate": getattr(enquete.accident, "action_immediate", "") or "",
                        "siegeLesion": enquete.siege_type_lesion or getattr(enquete.accident, "siege_lesion", "") or "",
                    },
                    "causes": {
                        "why1": getattr(enquete.accident, "why1", "") or "",
                        "why2": getattr(enquete.accident, "why2", "") or "",
                        "why3": getattr(enquete.accident, "why3", "") or "",
                        "why4": getattr(enquete.accident, "why4", "") or "",
                        "why5": getattr(enquete.accident, "why5", "") or "",
                        "methode": getattr(enquete.accident, "ishikawa_methode", "") or "",
                        "mainDoeuvre": getattr(enquete.accident, "ishikawa_main_oeuvre", "") or "",
                        "materiel": getattr(enquete.accident, "ishikawa_materiel", "") or "",
                        "milieu": getattr(enquete.accident, "ishikawa_milieu", "") or "",
                        "matiere": getattr(enquete.accident, "ishikawa_matiere", "") or "",
                    },
                    "actions": [],
                }
            )

        return Response(records)

    def post(self, request, *args, **kwargs):
        serializer = HSEEEnqueteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        general = payload["general"]
        lesion = payload["lesion"]
        causes = payload["causes"]
        actions = payload.get("actions", [])

        matricule = str(general.get("victimeMatricule", "")).strip()
        collaborateur = get_object_or_404(Collaborateur, matricule=matricule)
        dossier, _ = DossierMedical.objects.get_or_create(collaborateur=collaborateur)

        victim_full_name = str(general.get("victimeNom", "")).strip()
        name_parts = victim_full_name.split()
        victime_prenom = name_parts[0] if name_parts else ""
        victime_nom = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

        statut_map = {
            "En attente": "PLANIFIE",
            "En cours": "EN_COURS",
            "Cloture": "TERMINE",
            "Clôturé": "TERMINE",
        }

        with transaction.atomic():
            accident = AccidentTravail.objects.create(
                dossier=dossier,
                created_by=request.user,
                victime_nom=victime_nom,
                victime_prenom=victime_prenom,
                victime_poste_accident=general.get("posteShift", ""),
                date_accident=general["dateIncident"],
                heure_accident=general["heureIncident"],
                lieu_accident=general.get("lieuIncident", ""),
                circonstances=general.get("descriptionIncident", ""),
                description_circonstances=general.get("descriptionIncident", ""),
                activite_service=general.get("departement", ""),
                cause=lesion["causeIdentifiee"],
                nature_lesion=lesion["natureLesion"],
                siege_lesion=lesion["siegeLesion"],
                agent_materiel=lesion.get("agentMateriel", ""),
                presence_standard=lesion.get("presenceStandard", ""),
                respect_standard=lesion.get("respectStandard", ""),
                action_immediate=lesion.get("actionImmediate", ""),
                why1=causes.get("why1", ""),
                why2=causes.get("why2", ""),
                why3=causes.get("why3", ""),
                why4=causes.get("why4", ""),
                why5=causes.get("why5", ""),
                ishikawa_methode=causes.get("methode", ""),
                ishikawa_main_oeuvre=causes.get("mainDoeuvre", ""),
                ishikawa_materiel=causes.get("materiel", ""),
                ishikawa_milieu=causes.get("milieu", ""),
                ishikawa_matiere=causes.get("matiere", ""),
                segment=general.get("departement", ""),
                envoye_hsee=True,
                statut_enquete="TERMINEE",
                statut_declaration="DECLAREE",
                generated_at=timezone.now(),
            )

            for action in actions:
                PlanActionHSEE.objects.create(
                    accident=accident,
                    zone=general.get("lieuIncident", "")
                    or general.get("departement", "")
                    or "Zone a preciser",
                    risque=lesion.get("causeIdentifiee", "")
                    or lesion.get("natureLesion", "")
                    or "Risque a preciser",
                    action=action.get("correctiveAction", ""),
                    responsable=action.get("responsable", ""),
                    delai=action.get("dateLimite"),
                    statut=statut_map.get(action.get("statut"), "PLANIFIE"),
                )

        created = (
            AccidentTravail.objects.select_related("dossier__collaborateur", "created_by")
            .prefetch_related("plans_action_hsee")
            .get(pk=accident.pk)
        )
        collab = created.dossier.collaborateur

        return Response(
            {
                "id": created.id,
                "dossier": created.dossier_id,
                "created_at": created.created_at,
                "updated_at": created.updated_at,
                "created_by_name": getattr(created.created_by, "username", "")
                or getattr(created.created_by, "email", ""),
                "collaborateur_nom": getattr(collab, "nom", "") or created.victime_nom or "",
                "collaborateur_prenom": getattr(collab, "prenom", "")
                or created.victime_prenom
                or "",
                "matricule": getattr(collab, "matricule", ""),
                "general": {
                    "victimeNom": " ".join(
                        filter(None, [created.victime_prenom, created.victime_nom])
                    ).strip(),
                    "victimeMatricule": getattr(collab, "matricule", ""),
                    "departement": created.activite_service or created.segment or "",
                    "posteShift": created.victime_poste_accident or "",
                    "dateIncident": created.date_accident,
                    "heureIncident": created.heure_accident,
                    "lieuIncident": created.lieu_accident,
                    "descriptionIncident": created.description_circonstances
                    or created.circonstances
                    or "",
                },
                "lesion": {
                    "natureLesion": created.nature_lesion,
                    "agentMateriel": created.agent_materiel or "",
                    "causeIdentifiee": created.cause,
                    "presenceStandard": created.presence_standard or "",
                    "respectStandard": created.respect_standard or "",
                    "actionImmediate": created.action_immediate or "",
                    "siegeLesion": created.siege_lesion,
                },
                "causes": {
                    "why1": created.why1 or "",
                    "why2": created.why2 or "",
                    "why3": created.why3 or "",
                    "why4": created.why4 or "",
                    "why5": created.why5 or "",
                    "methode": created.ishikawa_methode or "",
                    "mainDoeuvre": created.ishikawa_main_oeuvre or "",
                    "materiel": created.ishikawa_materiel or "",
                    "milieu": created.ishikawa_milieu or "",
                    "matiere": created.ishikawa_matiere or "",
                },
                "actions": [
                    {
                        "id": action.id,
                        "correctiveAction": action.action,
                        "responsable": action.responsable or "",
                        "dateLimite": action.delai,
                        "statut": action.statut,
                    }
                    for action in created.plans_action_hsee.all().order_by("created_at")
                ],
            },
            status=status.HTTP_201_CREATED,
        )


HSEE_REPORT_PERIOD_OPTIONS = [
    {"value": "this_month", "label": "Mois en cours"},
    {"value": "last_month", "label": "Mois précédent"},
    {"value": "current_quarter", "label": "Trimestre en cours"},
    {"value": "current_year", "label": "Année en cours"},
    {"value": "last_6_months", "label": "6 derniers mois"},
]

HSEE_REPORT_DETAIL_LEVELS = [
    {"value": "SYNTHETIC", "label": "Synthétique"},
    {"value": "STANDARD", "label": "Standard"},
    {"value": "DETAILED", "label": "Détaillé"},
]

HSEE_REPORT_TEMPLATES = [
    {
        "id": "accidents-monthly",
        "name": "Rapport Mensuel des Accidents de Travail",
        "description": "Synthèse des AT/MP du mois avec statistiques et analyses",
        "category": "Accidents",
        "icon_key": "accidents",
        "formats_supported": ["PDF", "EXCEL"],
        "sections_available": [
            {"value": "summary", "label": "Résumé exécutif"},
            {"value": "indicators", "label": "Indicateurs clés"},
            {"value": "analysis", "label": "Analyses détaillées"},
            {"value": "recommendations", "label": "Recommandations"},
        ],
    },
    {
        "id": "medical-visits",
        "name": "Bilan des Visites Médicales",
        "description": "Récapitulatif des visites médicales et aptitudes",
        "category": "Médical",
        "icon_key": "medical",
        "formats_supported": ["PDF", "EXCEL"],
        "sections_available": [
            {"value": "summary", "label": "Résumé exécutif"},
            {"value": "visit_types", "label": "Répartition par type"},
            {"value": "aptitude", "label": "Aptitudes"},
            {"value": "recommendations", "label": "Recommandations"},
        ],
    },
    {
        "id": "medical-stock",
        "name": "État des Stocks Médicaux",
        "description": "Inventaire complet des médicaments et équipements",
        "category": "Inventaire",
        "icon_key": "stock",
        "formats_supported": ["PDF", "EXCEL"],
        "sections_available": [
            {"value": "summary", "label": "Résumé exécutif"},
            {"value": "critical", "label": "Stocks critiques"},
            {"value": "expiration", "label": "Péremption"},
            {"value": "inventory", "label": "Inventaire détaillé"},
        ],
    },
    {
        "id": "risk-mapping",
        "name": "Cartographie et Évaluation des Risques",
        "description": "Analyse des risques professionnels identifiés",
        "category": "Risques",
        "icon_key": "risks",
        "formats_supported": ["PDF", "EXCEL"],
        "sections_available": [
            {"value": "summary", "label": "Résumé exécutif"},
            {"value": "risk_status", "label": "Statut des actions"},
            {"value": "critical", "label": "Risques critiques"},
            {"value": "actions", "label": "Plan d'action"},
        ],
    },
    {
        "id": "hsee-kpis",
        "name": "Tableau de Bord KPIs HSEE",
        "description": "Indicateurs de performance consolidés",
        "category": "KPIs",
        "icon_key": "kpis",
        "formats_supported": ["PDF", "EXCEL"],
        "sections_available": [
            {"value": "summary", "label": "Résumé exécutif"},
            {"value": "kpis", "label": "KPIs"},
            {"value": "trend", "label": "Tendance mensuelle"},
            {"value": "top_causes", "label": "Top causes"},
        ],
    },
    {
        "id": "comite-hse",
        "name": "Rapport Trimestriel COMITÉ HSE",
        "description": "Rapport complet pour réunion du comité",
        "category": "Personnalisé",
        "icon_key": "committee",
        "formats_supported": ["PDF", "EXCEL"],
        "sections_available": [
            {"value": "summary", "label": "Résumé exécutif"},
            {"value": "accidents", "label": "Synthèse accidents"},
            {"value": "actions", "label": "Actions HSEE"},
            {"value": "recommendations", "label": "Recommandations"},
        ],
    },
]


def _get_hsee_report_template(template_id):
    for template in HSEE_REPORT_TEMPLATES:
        if template["id"] == template_id:
            return template
    return None


def _current_month_range():
    today = timezone.localdate()
    start = date(today.year, today.month, 1)
    if today.month == 12:
        next_month = date(today.year + 1, 1, 1)
    else:
        next_month = date(today.year, today.month + 1, 1)
    return start, next_month - timedelta(days=1)


def _last_month_range():
    current_start, _ = _current_month_range()
    end = current_start - timedelta(days=1)
    start = date(end.year, end.month, 1)
    return start, end


def _current_quarter_range():
    today = timezone.localdate()
    quarter_start_month = ((today.month - 1) // 3) * 3 + 1
    start = date(today.year, quarter_start_month, 1)
    if quarter_start_month == 10:
        next_quarter = date(today.year + 1, 1, 1)
    else:
        next_quarter = date(today.year, quarter_start_month + 3, 1)
    return start, next_quarter - timedelta(days=1)


def _current_year_range():
    today = timezone.localdate()
    return date(today.year, 1, 1), date(today.year, 12, 31)


def _last_6_months_range():
    end = timezone.localdate()
    return end - timedelta(days=183), end


def _resolve_report_period(period_value):
    if period_value == "last_month":
        start, end = _last_month_range()
        label = "Mois précédent"
    elif period_value == "current_quarter":
        start, end = _current_quarter_range()
        quarter = ((start.month - 1) // 3) + 1
        label = f"T{quarter} {start.year}"
    elif period_value == "current_year":
        start, end = _current_year_range()
        label = str(start.year)
    elif period_value == "last_6_months":
        start, end = _last_6_months_range()
        label = "6 derniers mois"
    else:
        start, end = _current_month_range()
        label = start.strftime("%B %Y")
    return {"value": period_value or "this_month", "label": label, "start": start, "end": end}


def _apply_department_filter(queryset, department, fields):
    if not department:
        return queryset
    query = Q()
    for field in fields:
        query |= Q(**{f"{field}__iexact": department})
    return queryset.filter(query)


def _get_report_departments_options():
    options = [{"value": "", "label": "Tous les départements"}]
    options.extend({"value": item, "label": item} for item in _hsee_departments())
    return options


def _safe_report_filename(value):
    normalized = unicodedata.normalize("NFKD", str(value or ""))
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    cleaned = re.sub(r"[^A-Za-z0-9_-]+", "_", ascii_value).strip("_")
    return cleaned or "report"


def _report_storage_dir():
    directory = Path(settings.BASE_DIR) / "tmp_pdf" / "hsee-reports"
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def _save_report_bytes(reference, extension, content):
    filename = f"{_safe_report_filename(reference)}.{extension}"
    path = _report_storage_dir() / filename
    path.write_bytes(content)
    return str(path)


def _collect_report_dataset(template, period_meta, department):
    start = period_meta["start"]
    end = period_meta["end"]

    if template["id"] == "accidents-monthly":
        queryset = _apply_department_filter(
            AccidentTravail.objects.filter(
                enquete_initiale__sent_to_hsee=True,
                date_accident__gte=start,
                date_accident__lte=end,
            ).select_related("dossier__collaborateur"),
            department,
            ["segment", "activite_service", "dossier__collaborateur__departement"],
        ).order_by("-date_accident", "-created_at")
        rows = [
            {
                "Date": _fmt_date(item.date_accident),
                "Matricule": getattr(item.dossier.collaborateur, "matricule", ""),
                "Collaborateur": " ".join(
                    filter(
                        None,
                        [
                            getattr(item.dossier.collaborateur, "prenom", ""),
                            getattr(item.dossier.collaborateur, "nom", ""),
                        ],
                    )
                ).strip(),
                "Département": item.activite_service or item.segment or "",
                "Type": item.nature_lesion or item.cause or "Accident",
                "Gravité": item.get_gravite_display() if item.gravite else "Faible",
                "Jours perdus": item.duree_arret or 0,
            }
            for item in queryset[:150]
        ]
        total = queryset.count()
        days = queryset.aggregate(total=Sum("duree_arret")).get("total") or 0
        return {
            "summary": {
                "Total accidents": total,
                "Jours perdus": days,
                "Période": period_meta["label"],
                "Département": department or "Tous",
            },
            "rows": rows,
        }

    if template["id"] == "medical-visits":
        queryset = _apply_department_filter(
            FicheAptitude.objects.filter(
                Q(date_examen__gte=start, date_examen__lte=end)
                | Q(date_examen__isnull=True, date__gte=start, date__lte=end)
            ).select_related("collaborateur"),
            department,
            ["collaborateur__departement"],
        ).order_by("-date_examen", "-date")
        rows = [
            {
                "Date": _fmt_date(item.date_examen or item.date),
                "Matricule": getattr(item.collaborateur, "matricule", ""),
                "Collaborateur": item.nom_prenom
                or " ".join(filter(None, [getattr(item.collaborateur, "prenom", ""), getattr(item.collaborateur, "nom", "")])).strip(),
                "Type": item.get_type_examen_display(),
                "Aptitude": item.get_aptitude_display(),
                "Département": getattr(item.collaborateur, "departement", "") or "",
            }
            for item in queryset[:150]
        ]
        return {
            "summary": {
                "Total visites": queryset.count(),
                "Département": department or "Tous",
                "Période": period_meta["label"],
            },
            "rows": rows,
        }

    if template["id"] == "medical-stock":
        queryset = StockItem.objects.filter(actif=True).order_by("nom")
        rows = [
            {
                "Article": item.nom,
                "Type": item.get_type_article_display(),
                "Catégorie": item.categorie or "",
                "Quantité": item.quantite,
                "Seuil critique": item.seuil_critique,
                "Critique": "Oui" if item.quantite <= item.seuil_critique else "Non",
                "Expiration": _fmt_date(item.date_expiration),
            }
            for item in queryset[:200]
        ]
        critical = queryset.filter(quantite__lte=F("seuil_critique")).count()
        return {
            "summary": {
                "Articles actifs": queryset.count(),
                "Stocks critiques": critical,
                "Période": period_meta["label"],
            },
            "rows": rows,
        }

    if template["id"] == "risk-mapping":
        queryset = PlanActionHSEE.objects.select_related("accident").order_by("-created_at")
        if department:
            queryset = queryset.filter(
                Q(zone__iexact=department)
                | Q(accident__segment__iexact=department)
                | Q(accident__activite_service__iexact=department)
            )
        rows = [
            {
                "Zone": item.zone,
                "Risque": item.risque,
                "Action": item.action,
                "Responsable": item.responsable or "",
                "Délai": _fmt_date(item.delai),
                "Statut": item.get_statut_display(),
            }
            for item in queryset[:150]
        ]
        return {
            "summary": {
                "Actions HSEE": queryset.count(),
                "Planifiées": queryset.filter(statut="PLANIFIE").count(),
                "En cours": queryset.filter(statut="EN_COURS").count(),
                "Terminées": queryset.filter(statut="TERMINE").count(),
            },
            "rows": rows,
        }

    if template["id"] == "hsee-kpis":
        accidents = _apply_department_filter(
            AccidentTravail.objects.filter(
                enquete_initiale__sent_to_hsee=True,
                date_accident__gte=start,
                date_accident__lte=end,
            ),
            department,
            ["segment", "activite_service", "dossier__collaborateur__departement"],
        )
        jours_perdus = accidents.aggregate(total=Sum("duree_arret")).get("total") or 0
        accidents_by_month = (
            accidents.annotate(month=ExtractMonth("date_accident"), year=ExtractYear("date_accident"))
            .values("year", "month")
            .annotate(value=Count("id"))
            .order_by("year", "month")
        )
        rows = [
            {
                "Mois": f"{int(item['month']):02d}/{item['year']}",
                "Accidents": item["value"],
            }
            for item in accidents_by_month
        ]
        return {
            "summary": {
                "Accidents déclarés": accidents.count(),
                "Accidents graves": accidents.filter(gravite="GRAVE").count(),
                "Jours perdus": jours_perdus,
                "Période": period_meta["label"],
            },
            "rows": rows,
        }

    accidents = _apply_department_filter(
        AccidentTravail.objects.filter(
            enquete_initiale__sent_to_hsee=True,
            date_accident__gte=start,
            date_accident__lte=end,
        ),
        department,
        ["segment", "activite_service", "dossier__collaborateur__departement"],
    )
    actions = PlanActionHSEE.objects.select_related("accident").order_by("-created_at")
    rows = [
        {
            "Référence": f"AT-{item.id:04d}",
            "Date": _fmt_date(item.date_accident),
            "Type": item.nature_lesion or item.cause or "Accident",
            "Zone": item.activite_service or item.segment or "",
            "Statut enquête": item.get_statut_enquete_display(),
        }
        for item in accidents[:100]
    ]
    return {
        "summary": {
            "Accidents": accidents.count(),
            "Actions HSEE": actions.count(),
            "Période": period_meta["label"],
            "Département": department or "Tous",
        },
        "rows": rows,
    }


def _build_preview_pdf_bytes(title, reference, dataset, parameters):
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    margin = 20
    y = height - margin

    def draw_line(text, font="Helvetica", size=10, gap=15):
        nonlocal y
        if y < 40:
            pdf.showPage()
            y = height - margin
        pdf.setFont(font, size)
        pdf.drawString(margin, y, str(text)[:110])
        y -= gap

    draw_line("Rapport HSEE", "Helvetica-Bold", 18, 24)
    draw_line(title, "Helvetica-Bold", 14, 20)
    draw_line(f"Référence: {reference}", gap=14)
    draw_line(f"Période: {parameters.get('period_label', '')}", gap=14)
    draw_line(f"Département: {parameters.get('department') or 'Tous les départements'}", gap=14)
    draw_line(f"Niveau de détail: {parameters.get('detail_level') or 'Standard'}", gap=20)

    draw_line("Résumé", "Helvetica-Bold", 12, 18)
    for key, value in dataset.get("summary", {}).items():
        draw_line(f"- {key}: {value}")

    y -= 6
    draw_line("Données", "Helvetica-Bold", 12, 18)
    rows = dataset.get("rows", [])
    if not rows:
        draw_line("Aucune donnée disponible.")
    else:
        headers = list(rows[0].keys())
        draw_line(" | ".join(headers), "Helvetica-Bold", 9, 14)
        for row in rows[:60]:
            draw_line(" | ".join(str(row.get(header, "")) for header in headers), size=8, gap=12)

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


def _build_excel_report_bytes(dataset):
    if openpyxl is None:
        raise ValidationError({"detail": "Le support Excel n'est pas disponible sur le serveur."})

    workbook = openpyxl.Workbook()
    summary_sheet = workbook.active
    summary_sheet.title = "Résumé"
    summary_sheet.append(["Indicateur", "Valeur"])
    for key, value in dataset.get("summary", {}).items():
        summary_sheet.append([key, value])

    rows_sheet = workbook.create_sheet("Données")
    rows = dataset.get("rows", [])
    if rows:
        headers = list(rows[0].keys())
        rows_sheet.append(headers)
        for row in rows:
            rows_sheet.append([row.get(header, "") for header in headers])
    else:
        rows_sheet.append(["Aucune donnée disponible"])

    buffer = BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()


def _build_report_binary(template, dataset, parameters, reference):
    preview_bytes = _build_preview_pdf_bytes(template["name"], reference, dataset, parameters)
    if parameters["format"] == "EXCEL":
        main_bytes = _build_excel_report_bytes(dataset)
        mime_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        extension = "xlsx"
    else:
        main_bytes = preview_bytes
        mime_type = "application/pdf"
        extension = "pdf"
    return {
        "main_bytes": main_bytes,
        "preview_bytes": preview_bytes,
        "mime_type": mime_type,
        "extension": extension,
    }


def _build_hsee_report_stats():
    today = timezone.localdate()
    generated_queryset = HSEEGeneratedReport.objects.all()
    return {
        "total_generated": generated_queryset.count(),
        "total_scheduled": generated_queryset.filter(status="SCHEDULED").count(),
        "total_this_month": generated_queryset.filter(
            generated_at__year=today.year,
            generated_at__month=today.month,
        ).count(),
        "total_templates": len([item for item in HSEE_REPORT_TEMPLATES if item.get("active", True)]),
    }


def _serialize_hsee_templates():
    departments = _get_report_departments_options()
    payload = []
    for template in HSEE_REPORT_TEMPLATES:
        item = dict(template)
        item["active"] = template.get("active", True)
        item["detail_levels"] = HSEE_REPORT_DETAIL_LEVELS
        item["periods"] = HSEE_REPORT_PERIOD_OPTIONS
        item["departments"] = departments
        payload.append(item)
    return payload


def _build_generated_report_payload(validated_data, request_user):
    template = _get_hsee_report_template(validated_data["template_id"])
    if not template:
        raise ValidationError({"template_id": "Modèle de rapport introuvable."})

    period_meta = _resolve_report_period(validated_data["period"])
    department = (validated_data.get("department") or "").strip()
    detail_level = validated_data.get("detail_level") or "STANDARD"
    sections = validated_data.get("sections") or [
        item["value"] for item in template.get("sections_available", [])[:3]
    ]

    parameters = {
        "period": period_meta["value"],
        "period_label": period_meta["label"],
        "department": department,
        "detail_level": detail_level,
        "sections": sections,
        "format": validated_data["format"],
        "generated_by": validated_data.get("generated_by")
        or (request_user.get_full_name() or request_user.username),
    }
    dataset = _collect_report_dataset(template, period_meta, department)
    return template, period_meta, parameters, dataset


class HSEEReportsDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return Response(_build_hsee_report_stats())


class HSEEReportTemplatesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        payload = _serialize_hsee_templates()
        serializer = HSEEReportTemplateSerializer(payload, many=True)
        return Response(serializer.data)


class HSEEReportTemplateDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, template_id, *args, **kwargs):
        template = _get_hsee_report_template(template_id)
        if not template:
            return Response({"detail": "Modèle introuvable."}, status=status.HTTP_404_NOT_FOUND)
        payload = dict(template)
        payload["active"] = template.get("active", True)
        payload["detail_levels"] = HSEE_REPORT_DETAIL_LEVELS
        payload["periods"] = HSEE_REPORT_PERIOD_OPTIONS
        payload["departments"] = _get_report_departments_options()
        serializer = HSEEReportTemplateSerializer(payload)
        return Response(serializer.data)


class HSEEGeneratedReportsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        search = (request.query_params.get("search") or "").strip()
        queryset = HSEEGeneratedReport.objects.select_related("created_by", "sent_by").order_by(
            "-generated_at", "-created_at"
        )
        if search:
            queryset = queryset.filter(
                Q(reference__icontains=search)
                | Q(title__icontains=search)
                | Q(category__icontains=search)
                | Q(template_name__icontains=search)
            )
        return Response(HSEEGeneratedReportSerializer(queryset, many=True).data)


class HSEEGenerateReportView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = HSEEReportGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        template, period_meta, parameters, dataset = _build_generated_report_payload(
            serializer.validated_data,
            request.user,
        )

        report = HSEEGeneratedReport.objects.create(
            template_key=template["id"],
            template_name=template["name"],
            title=f"{template['name']} - {period_meta['label']}",
            category=template.get("category", ""),
            description=template.get("description", ""),
            output_format=serializer.validated_data["format"],
            period_value=period_meta["value"],
            period_label=period_meta["label"],
            department=parameters["department"],
            detail_level=parameters["detail_level"],
            sections=parameters["sections"],
            parameters=parameters,
            created_by=request.user,
            status="GENERATED",
        )

        binary = _build_report_binary(template, dataset, parameters, report.reference or f"RPT-{report.pk}")
        report.file_path = _save_report_bytes(report.reference, binary["extension"], binary["main_bytes"])
        report.preview_path = _save_report_bytes(f"{report.reference}_preview", "pdf", binary["preview_bytes"])
        report.mime_type = binary["mime_type"]
        report.file_size_bytes = len(binary["main_bytes"])

        if serializer.validated_data.get("send_email_after_generation"):
            report.status = "SENT"
            report.sent_at = timezone.now()
            report.sent_by = request.user
            recipients = get_user_model().objects.filter(role="AGENT_HSEE")
            for recipient in recipients:
                Notification.objects.create(
                    user=recipient,
                    title="Nouveau rapport HSEE",
                    message=f"Le rapport {report.reference} est disponible.",
                )

        report.save(
            update_fields=[
                "file_path",
                "preview_path",
                "mime_type",
                "file_size_bytes",
                "status",
                "sent_at",
                "sent_by",
                "updated_at",
            ]
        )

        return Response(HSEEGeneratedReportSerializer(report).data, status=status.HTTP_201_CREATED)


class HSEEPreviewReportPayloadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = HSEEReportGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        template, period_meta, parameters, dataset = _build_generated_report_payload(
            serializer.validated_data,
            request.user,
        )
        preview_bytes = _build_preview_pdf_bytes(
            template["name"],
            "PREVIEW",
            dataset,
            parameters,
        )
        response = HttpResponse(preview_bytes, content_type="application/pdf")
        response["Content-Disposition"] = 'inline; filename="preview_rapport_hsee.pdf"'
        return response


class HSEEGeneratedReportPreviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        report = get_object_or_404(HSEEGeneratedReport, pk=pk)
        path = Path(report.preview_path or "")
        if not path.exists():
            return Response({"detail": "Prévisualisation introuvable."}, status=status.HTTP_404_NOT_FOUND)
        response = HttpResponse(path.read_bytes(), content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="{_safe_report_filename(report.reference)}_preview.pdf"'
        return response


class HSEEGeneratedReportDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        report = get_object_or_404(HSEEGeneratedReport, pk=pk)
        path = Path(report.file_path or "")
        if not path.exists():
            return Response({"detail": "Fichier introuvable."}, status=status.HTTP_404_NOT_FOUND)
        extension = path.suffix or ".pdf"
        response = HttpResponse(path.read_bytes(), content_type=report.mime_type or "application/octet-stream")
        response["Content-Disposition"] = (
            f'attachment; filename="{_safe_report_filename(report.reference)}{extension}"'
        )
        return response


class HSEEGeneratedReportSendView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        report = get_object_or_404(HSEEGeneratedReport, pk=pk)
        recipients = get_user_model().objects.filter(role="AGENT_HSEE")
        for recipient in recipients:
            Notification.objects.create(
                user=recipient,
                title="Rapport HSEE envoyé",
                message=f"Le rapport {report.reference} a été partagé par {request.user.username}.",
            )
        report.status = "SENT"
        report.sent_at = timezone.now()
        report.sent_by = request.user
        report.save(update_fields=["status", "sent_at", "sent_by", "updated_at"])
        return Response(HSEEGeneratedReportSerializer(report).data)


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




class ExamenComplementaireListByDossierView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, dossier_id):
        dossier = get_object_or_404(DossierMedical, pk=dossier_id)
        qs = (
            ExamenComplementaire.objects.filter(collaborateur=dossier.collaborateur)
            .select_related("collaborateur")
            .order_by("-date", "-created_at")
        )
        serializer = ExamenComplementaireSerializer(qs, many=True)
        return Response(serializer.data)


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


generate_aptitude_fiche_pdf = medical_pdf_services.generate_aptitude_fiche_pdf
generate_lab_request_pdf = medical_pdf_services.generate_lab_request_pdf
generate_complementary_exam_pdf = medical_pdf_services.generate_complementary_exam_pdf


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


def _inline_pdf_response(pdf_bytes, filename):
    response = HttpResponse(pdf_bytes, content_type="application/pdf")
    response["Content-Disposition"] = f'inline; filename="{filename}"'
    return response


class DossierMedicalPdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        dossier = get_object_or_404(
            DossierMedical.objects.select_related("collaborateur__site"),
            pk=pk,
        )
        pdf_bytes = generate_dossier_medical_pdf(dossier)
        return _inline_pdf_response(
            pdf_bytes,
            f"dossier_medical_{dossier.collaborateur.matricule}.pdf",
        )


class FicheMedicalePdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, collaborateur_id):
        collaborateur = get_object_or_404(
            Collaborateur.objects.select_related("site"),
            pk=collaborateur_id,
        )
        fiche, _ = FicheMedicale.objects.get_or_create(collaborateur=collaborateur)
        pdf_bytes = generate_fiche_medicale_pdf(fiche)
        return _inline_pdf_response(
            pdf_bytes,
            f"fiche_medicale_{collaborateur.matricule}.pdf",
        )


class BonChauffeurPdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        bon = get_object_or_404(BonChauffeur, pk=pk)
        pdf_bytes = generate_voucher_pdf(bon)
        return _inline_pdf_response(
            pdf_bytes,
            f"bon_chauffeur_{bon.numero_ordre or bon.pk}.pdf",
        )


class ControleMedicalRecordPdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        require_medecin_controleur(request)
        ensure_medecin_controleur_history_tables()
        record = get_object_or_404(ControleMedicalRecord, pk=pk)
        pdf_bytes = generate_contre_visite_pdf(record)
        return _inline_pdf_response(
            pdf_bytes,
            f"controle_medical_{record.pk}.pdf",
        )


class DemandeExpertiseRecordPdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        require_medecin_controleur(request)
        ensure_medecin_controleur_history_tables()
        record = get_object_or_404(DemandeExpertiseRecord, pk=pk)
        pdf_bytes = generate_expertise_pdf(record)
        return _inline_pdf_response(
            pdf_bytes,
            f"demande_expertise_{record.pk}.pdf",
        )



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
        pdf_bytes = generate_certificate_pdf(certificat)
        return _inline_pdf_response(
            pdf_bytes,
            f"certificat_{certificat.collaborateur.matricule}_{pk}.pdf",
        )


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


def _fmt_datetime_as_date(value):
    return _fmt_date(value.date()) if value else ""


def _declaration_status_label(value):
    return {
        "BROUILLON": "Brouillon",
        "DECLAREE": "Declaree",
        "GENEREE": "Generee",
    }.get(value, value or "")


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
            "statut_declaration_display": _declaration_status_label(
                getattr(accident, "statut_declaration", "")
            ),
            "date_generation": _fmt_datetime_as_date(
                getattr(accident, "generated_at", None)
                or getattr(accident, "printed_at", None)
                or getattr(accident, "created_at", None)
            ),
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
        pdf_bytes = generate_occupational_disease_pdf(maladie)
        return _inline_pdf_response(
            pdf_bytes,
            f"declaration_maladie_{maladie.dossier.collaborateur.matricule}.pdf",
        )
