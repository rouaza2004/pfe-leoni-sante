from pathlib import Path
from io import BytesIO
import base64
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


def generate_aptitude_fiche_pdf(fiche, user=None):
    buffer = BytesIO()
    page_size = landscape(A5)
    p = canvas.Canvas(buffer, pagesize=page_size)
    width, height = page_size

    margin = 0.55 * cm
    content_width = width - (2 * margin)
    base_blue = colors.HexColor("#1a3c8f")

    register_arabic_font()

    def safe(value, fallback=""):
        return value if value not in [None, ""] else fallback

    def set_font(size):
        p.setFont("Amiri", size)

    def draw_text(x, y, text, size=7.2, bold=False, color=colors.black):
        p.setFillColor(color)
        set_font(size)
        p.drawString(x, y, str(text or ""))

    def draw_center(x, y, text, size=9.0, bold=True, color=base_blue):
        p.setFillColor(color)
        set_font(size)
        p.drawCentredString(x, y, str(text or ""))

    def dotted_line(x1, y1, x2, y2):
        p.setStrokeColor(base_blue)
        p.setLineWidth(0.55)
        p.setDash(1, 2)
        p.line(x1, y1, x2, y2)
        p.setDash()

    def fit_text(text, max_width, font_name="Amiri", font_size=7.0):
        if not text:
            return ""
        if p.stringWidth(text, font_name, font_size) <= max_width:
            return text
        trimmed = text
        suffix = "..."
        while trimmed and p.stringWidth(trimmed + suffix, font_name, font_size) > max_width:
            trimmed = trimmed[:-1]
        return trimmed + suffix

    def label_line(x, y, label, line_end, value=None, label_size=7.0, value_size=7.0):
        draw_text(x, y, label, label_size, True, base_blue)
        label_w = p.stringWidth(label, "Amiri", label_size)
        line_start = x + label_w + 0.12 * cm
        dotted_line(line_start, y - 0.08 * cm, line_end, y - 0.08 * cm)
        if value:
            max_w = max(0, line_end - line_start - 0.05 * cm)
            draw_text(
                line_start + 0.02 * cm,
                y,
                fit_text(value, max_w, "Amiri", value_size),
                value_size,
                False,
                colors.black,
            )

    def draw_checkbox(x, y, label, checked=False):
        size = 0.34 * cm
        p.setStrokeColor(base_blue)
        p.setLineWidth(0.8)
        p.rect(x, y - size + 1, size, size)
        if checked:
            p.setFillColor(base_blue)
            set_font(7.0)
            p.drawCentredString(x + size / 2, y - 1, "X")
        p.setFillColor(base_blue)
        set_font(7.0)
        p.drawString(x + 0.5 * cm, y, label)

    left = margin
    right = width - margin
    mid = left + content_width * 0.62
    y = height - margin

    logo_path = Path(settings.BASE_DIR) / "static" / "images" / "logo_gmt_monastir.png"
    tuv_path = Path(settings.BASE_DIR) / "static" / "images" / "tuv_cert.png"

    draw_text(left, y - 0.28 * cm, "Groupement de M?decine", 8.1, True, base_blue)
    draw_text(left, y - 0.58 * cm, "du travail de Monastir", 8.1, True, base_blue)
    draw_text(left, y - 0.88 * cm, "T?l.: 73 508 100 Fax: 73 508 101", 6.5, True, base_blue)

    if tuv_path.exists():
        cert = ImageReader(str(tuv_path))
        p.drawImage(
            cert,
            left + 0.05 * cm,
            y - 1.55 * cm,
            width=1.1 * cm,
            height=1.1 * cm,
            preserveAspectRatio=True,
            mask="auto",
        )

    if logo_path.exists():
        logo = ImageReader(str(logo_path))
        p.drawImage(
            logo,
            (width / 2) - 1.15 * cm,
            y - 1.65 * cm,
            width=2.3 * cm,
            height=1.4 * cm,
            preserveAspectRatio=True,
            mask="auto",
        )
        draw_text(width / 2 - 1.15 * cm, y - 1.9 * cm, "G.M.T MONASTIR", 5.9, True, base_blue)
        draw_text(width / 2 - 1.15 * cm, y - 2.15 * cm, "Certifi? ISO 9001:2008", 5.4, False, base_blue)

    # FR-VME box
    box_w, box_h = 2.2 * cm, 0.9 * cm
    box_x = right - box_w
    box_y = y - 1.2 * cm
    p.setStrokeColor(base_blue)
    p.setLineWidth(0.8)
    p.rect(box_x, box_y, box_w, box_h)
    p.line(box_x, box_y + box_h / 2, box_x + box_w, box_y + box_h / 2)
    draw_text(box_x + 0.16 * cm, box_y + 0.31 * cm, "FR - VME 15/01", 6.8, True, base_blue)
    draw_text(box_x + 0.16 * cm, box_y + 0.05 * cm, "Mle", 6.4, True, base_blue)
    draw_text(box_x + 0.5 * cm, box_y + 0.05 * cm, "............", 6.4, False, base_blue)

    title_y = y - 1.95 * cm
    draw_center(width / 2, title_y, "FICHE D?APTITUDE AU TRAVAIL", 9.2, True, base_blue)
    draw_center(
        width / 2,
        title_y - 0.32 * cm,
        "En application des dispositions de l?article 11 du D?cret n? 2000-1985 du 12 septembre 2000",
        6.1,
        True,
        base_blue,
    )
    draw_center(
        width / 2,
        title_y - 0.6 * cm,
        "portant organisation et du fonctionnement des services de m?decine du travail",
        6.1,
        True,
        base_blue,
    )

    y = title_y - 0.88 * cm

    # 1- L'ENTREPRISE
    draw_text(left, y, "1- L'ENTREPRISE :", 7.3, True, base_blue)
    y -= 0.42 * cm
    label_line(left, y, "Raison sociale :", mid - 0.18 * cm, safe(fiche.entreprise))
    label_line(mid + 0.18 * cm, y, "Adresse :", right, safe(fiche.adresse_entreprise))
    y -= 0.5 * cm
    label_line(left, y, "Nature d'activit? :", mid - 0.18 * cm, safe(fiche.nature_activite))
    label_line(mid + 0.18 * cm, y, "N? CNSS :", right, safe(fiche.numero_cnss))

    # 2- LE TRAVAILLEUR
    y -= 0.62 * cm
    draw_text(left, y, "2- LE TRAVAILLEUR :", 7.3, True, base_blue)
    y -= 0.42 * cm
    label_line(left, y, "Nom et Pr?nom :", mid - 0.18 * cm, safe(fiche.nom_prenom))
    label_line(mid + 0.18 * cm, y, "Date et lieu de naissance (Age) :", right, safe(fiche.date_lieu_naissance))
    y -= 0.5 * cm
    col1_end = left + content_width * 0.44
    col2_end = left + content_width * 0.62
    label_line(left, y, "Adresse :", col1_end, safe(fiche.adresse_travailleur))
    label_line(col1_end + 0.18 * cm, y, "N? CNSS :", col2_end, safe(fiche.cnss_travailleur))
    label_line(
        col2_end + 0.18 * cm,
        y,
        "Qualifications professionnelles :",
        right,
        safe(fiche.qualifications_professionnelles),
        label_size=6.5,
        value_size=6.5,
    )
    y -= 0.5 * cm
    date_recrutement = fiche.date_recrutement.strftime("%d/%m/%Y") if fiche.date_recrutement else ""
    label_line(left, y, "Date de recrutement :", mid - 0.18 * cm, date_recrutement)
    label_line(mid + 0.18 * cm, y, "Poste de travail :", right, safe(fiche.poste_travail))

    # 3- EXAMENS MEDICAUX
    y -= 0.62 * cm
    draw_text(left, y, "3- EXAMENS MEDICAUX :", 7.3, True, base_blue)
    y -= 0.42 * cm
    draw_checkbox(left + 0.2 * cm, y, "Embauche", fiche.type_examen == "EMBAUCHE")
    draw_checkbox(left + 3.05 * cm, y, "P?riodique", fiche.type_examen == "PERIODIQUE")
    draw_checkbox(left + 6.25 * cm, y, "Reprise", fiche.type_examen == "REPRISE")
    draw_checkbox(left + 9.15 * cm, y, "Spontan?e", fiche.type_examen == "SPONTANE")

    # Je soussign?
    y -= 0.62 * cm
    medecin_nom = safe(getattr(fiche, "medecin_travail", None), "")
    if not medecin_nom:
        medecin_nom = "Docteur"
        if user and getattr(user, "get_full_name", None):
            full_name = (user.get_full_name() or "").strip()
            medecin_nom = full_name if full_name else (user.username or "Docteur")

    draw_text(left, y, "Je soussign?(e) :", 6.9, True, base_blue)
    label_w = p.stringWidth("Je soussign?(e) :", "Amiri", 6.9)
    line_start = left + label_w + 0.12 * cm
    line_end = left + content_width * 0.45
    dotted_line(line_start, y - 0.08 * cm, line_end, y - 0.08 * cm)
    draw_text(
        line_start + 0.02 * cm,
        y,
        fit_text(medecin_nom, line_end - line_start - 0.05 * cm),
        6.9,
        False,
        colors.black,
    )
    draw_text(
        line_end + 0.18 * cm,
        y,
        "m?decin du travail, certifie que le travailleur surnomm? est :",
        6.5,
        False,
        base_blue,
    )

    # Decision lines
    y -= 0.55 * cm
    details_text = " - ".join(
        [
            t
            for t in [safe(getattr(fiche, "conclusion", None), ""), safe(fiche.recommandations, "")]
            if t
        ]
    )

    decisions = [
        (
            "Apte au poste ( pr?ciser le poste de travail, les EPI et les recommandations sp?cifiques si n?cessaires ) :",
            fiche.aptitude == "APTE",
        ),
        ("Apte avec am?nagement du poste (? pr?ciser) :", fiche.aptitude == "APTE_AMENAGEMENT"),
        ("Inapte temporaire au poste (pr?ciser la p?riode) :", fiche.aptitude == "INAPTE_TEMPORAIRE"),
        ("Apte apr?s changement du poste (? pr?ciser) :", fiche.aptitude == "APTE_APRES_CHANGEMENT"),
        ("Inapte d?finitif ? tout poste du travail dans l'entreprise :", fiche.aptitude == "INAPTE_DEFINITIF"),
    ]

    for label, checked in decisions:
        draw_checkbox(left, y, "", checked)
        label_x = left + 0.5 * cm
        draw_text(label_x, y, label, 6.5, False, base_blue)
        label_w = p.stringWidth(label, "Amiri", 6.5)
        line_start = label_x + label_w + 0.08 * cm
        line_end = right
        dotted_line(line_start, y - 0.08 * cm, line_end, y - 0.08 * cm)
        if checked and details_text:
            max_w = max(0, line_end - line_start - 0.05 * cm)
            draw_text(
                line_start + 0.02 * cm,
                y,
                fit_text(details_text, max_w, "Amiri", 6.5),
                6.5,
                False,
                colors.black,
            )
        y -= 0.42 * cm

    # Footer
    footer_y = margin + 0.25 * cm
    pdf_date = (
        fiche.date_examen.strftime("%d/%m/%Y")
        if getattr(fiche, "date_examen", None)
        else (fiche.date.strftime("%d/%m/%Y") if fiche.date else "")
    )
    draw_text(
        left,
        footer_y + 0.1 * cm,
        "Ce certificat doit ?tre conserv? dans le dossier administratif de l'int?ress? chez son employeur",
        6.1,
        False,
        base_blue,
    )
    draw_text(
        right - 5.0 * cm,
        footer_y + 0.18 * cm,
        "Date et Signature du m?decin du travail",
        6.1,
        True,
        base_blue,
    )
    draw_text(right - 5.0 * cm, footer_y - 0.05 * cm, f"Date : {pdf_date}", 6.1, False, base_blue)
    dotted_line(right - 5.0 * cm, footer_y - 0.18 * cm, right, footer_y - 0.18 * cm)

    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer

class FicheAptitudePdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        fiche = get_object_or_404(FicheAptitude, pk=pk)

        pdf_buffer = generate_aptitude_fiche_pdf(fiche, user=request.user)
        response = HttpResponse(pdf_buffer.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = (
            f'inline; filename="fiche_aptitude_{fiche.collaborateur.matricule}.pdf"'
        )
        return response


class DemandeExamenLaboPdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        demande = get_object_or_404(DemandeExamenLabo, pk=pk)

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="demande_labo_{demande.id}.pdf"'

        page_size = landscape(A5)
        p = canvas.Canvas(response, pagesize=page_size)
        width, height = page_size
        base_blue = colors.HexColor("#1a3c8f")
        margin = 0.8 * cm

        register_arabic_font()

        logo_path = Path(settings.BASE_DIR) / "static" / "images" / "logo_gmt_monastir.png"
        tuv_path = Path(settings.BASE_DIR) / "static" / "images" / "tuv_cert.png"

        def txt(x, y, value, size=8, bold=False, color=base_blue):
            p.setFillColor(color)
            p.setFont("Helvetica-Bold" if bold else "Helvetica", size)
            p.drawString(x, y, str(value or ""))

        def arabic_right(x, y, value, size=8):
            p.setFont("Amiri", size)
            p.setFillColor(base_blue)
            p.drawRightString(x, y, shape_arabic(value))

        def dotted_line(x1, y1, x2, y2):
            p.setStrokeColor(base_blue)
            p.setLineWidth(0.6)
            p.setDash(1, 2)
            p.line(x1, y1, x2, y2)
            p.setDash()

        # Header
        txt(margin, height - 1.0 * cm, "Groupement de Médecine du Travail", 8.5, True)
        txt(margin, height - 1.35 * cm, "Du Gouvernorat de Monastir", 8.5, True)

        if logo_path.exists():
            logo = ImageReader(str(logo_path))
            p.drawImage(
                logo,
                (width / 2) - 1.0 * cm,
                height - 2.0 * cm,
                width=2.0 * cm,
                height=1.4 * cm,
                preserveAspectRatio=True,
                mask="auto",
            )
            txt(width / 2 - 1.1 * cm, height - 2.2 * cm, "G.M.T MONASTIR", 6, True)
            txt(width / 2 - 1.1 * cm, height - 2.45 * cm, "Certifié ISO 9001:2008", 5.5, False)

        # FR-VME box
        box_w, box_h = 2.6 * cm, 1.0 * cm
        box_x = width - margin - box_w
        box_y = height - 1.4 * cm
        p.setStrokeColor(base_blue)
        p.rect(box_x, box_y, box_w, box_h)
        txt(box_x + 0.2 * cm, box_y + 0.32 * cm, "FR - VME - 06/02", 7.5, True)
        arabic_right(width - margin, height - 2.0 * cm, "مجمع طب الشغل", 8)
        arabic_right(width - margin, height - 2.35 * cm, "بولاية المنستير", 8)

        # N° du Labo + N°
        txt(margin, height - 2.2 * cm, "N° du Labo", 8, True)
        dotted_line(margin + 2.2 * cm, height - 2.23 * cm, margin + 6.5 * cm, height - 2.23 * cm)
        txt(width - margin - 3.2 * cm, height - 2.4 * cm, "N°", 9, True)
        txt(width - margin - 2.2 * cm, height - 2.4 * cm, f"{demande.id:06d}", 10, True)

        # Title
        txt(margin + 3.2 * cm, height - 3.0 * cm, "DEMANDE D’EXAMENS DE LABORATOIRE", 9.5, True)

        y = height - 3.6 * cm
        txt(margin, y, "NOM ET PRÉNOM :", 7.5, True)
        dotted_line(margin + 3.0 * cm, y - 0.05 * cm, width - margin - 8.0 * cm, y - 0.05 * cm)
        txt(width - margin - 7.5 * cm, y, "AGE :", 7.5, True)
        dotted_line(width - margin - 6.2 * cm, y - 0.05 * cm, width - margin - 3.5 * cm, y - 0.05 * cm)
        txt(width - margin - 3.2 * cm, y, "M° :", 7.5, True)
        dotted_line(width - margin - 2.3 * cm, y - 0.05 * cm, width - margin, y - 0.05 * cm)

        y -= 0.5 * cm
        txt(margin, y, "C.I.N :", 7.5, True)
        dotted_line(margin + 1.6 * cm, y - 0.05 * cm, margin + 6.0 * cm, y - 0.05 * cm)
        txt(margin + 6.4 * cm, y, "GSM :", 7.5, True)
        dotted_line(margin + 8.0 * cm, y - 0.05 * cm, width - margin - 6.5 * cm, y - 0.05 * cm)
        txt(width - margin - 6.1 * cm, y, "POSTE DE TRAVAIL :", 7.5, True)
        dotted_line(width - margin - 2.0 * cm, y - 0.05 * cm, width - margin, y - 0.05 * cm)

        y -= 0.5 * cm
        txt(margin, y, "ENTREPRISE :", 7.5, True)
        dotted_line(margin + 2.4 * cm, y - 0.05 * cm, width - margin, y - 0.05 * cm)

        y -= 0.5 * cm
        txt(margin, y, "RENSEIGNEMENTS CLINIQUES :", 7.5, True)
        dotted_line(margin + 4.5 * cm, y - 0.05 * cm, width - margin, y - 0.05 * cm)

        y -= 0.6 * cm
        txt(margin, y, "EXAMENS DE LABORATOIRE :", 7.5, True)

        # Checkboxes
        items = [
            ("GLYCEMIE", demande.glycemie),
            ("CREATININE", demande.creatinine),
            ("NFS", demande.nfs),
            ("VS", demande.vs),
            ("TRANSAMINASES", demande.transaminases),
            ("ACIDE URIQUE", demande.acide_urique),
            ("TRIGLYCERIDES", demande.triglycerides),
            ("CHOLESTEROL", demande.cholesterol),
            ("EXAMENS COPRO-PARASITOLOGIQUES DES SELLES", demande.examen_selles),
        ]
        y -= 0.4 * cm
        box_size = 0.35 * cm
        for label, checked in items:
            p.setStrokeColor(base_blue)
            p.rect(margin, y - box_size + 0.05 * cm, box_size, box_size)
            if checked:
                p.setFont("Helvetica-Bold", 8)
                p.drawString(margin + 0.08 * cm, y - 0.1 * cm, "X")
            txt(margin + 0.6 * cm, y, label, 7.5, False)
            y -= 0.45 * cm

        y -= 0.2 * cm
        txt(
            margin,
            y,
            "NB: Pour effectuer les analyses de laboratoire, vous devez vous présenter",
            6.5,
            False,
        )
        y -= 0.35 * cm
        txt(margin, y, "à jeun et avant 10h du matin.", 6.5, False)
        y -= 0.35 * cm
        arabic_right(width - margin, y, "لاجراء التحاليل المخبرية يجب الحضور صائما وقبل الساعة 10 صباحا", 7)

        y -= 0.6 * cm
        txt(width - margin - 4.5 * cm, y, "DATE:", 7.5, True)
        dotted_line(width - margin - 3.4 * cm, y - 0.05 * cm, width - margin, y - 0.05 * cm)
        txt(width - margin - 6.0 * cm, y - 0.5 * cm, "CACHET ET SIGNATURE DU MÉDECIN DU TRAVAIL", 6.5, True)

        # Footer with badge
        if tuv_path.exists():
            tuv = ImageReader(str(tuv_path))
            p.drawImage(tuv, margin, margin - 0.1 * cm, width=1.4 * cm, height=1.0 * cm, mask="auto")

        txt(margin + 1.8 * cm, margin + 0.55 * cm, "Groupement de Médecine du travail du Gouvernorat de Monastir", 6, False)
        txt(margin + 1.8 * cm, margin + 0.3 * cm, "Zone Industrielle Route de Khnis - Monastir", 6, False)
        txt(margin + 1.8 * cm, margin + 0.05 * cm, "Boîte Postale N° 41 - Poste Gare Monastir - 5079", 6, False)
        txt(margin + 1.8 * cm, margin - 0.2 * cm, "Tél: 73 508 100 / Fax: 73 508 101", 6, False)
        arabic_right(width - margin, margin + 0.05 * cm, "صندوق بريد رقم 41 - مركز بريد المحطة - المنستير - 5079", 6.5)
        arabic_right(width - margin, margin - 0.2 * cm, "هاتف: 73 508 100 / فاكس: 73 508 101", 6.5)

        p.showPage()
        p.save()
        return response


class ExamenComplementairePdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        examen = get_object_or_404(ExamenComplementaire, pk=pk)

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = (
            f'inline; filename="examen_complementaire_{examen.id}.pdf"'
        )

        page_size = landscape(A4)
        p = canvas.Canvas(response, pagesize=page_size)
        width, height = page_size
        base_blue = colors.HexColor("#1a3c8f")
        margin = 0.8 * cm
        register_arabic_font()

        logo_path = Path(settings.BASE_DIR) / "static" / "images" / "logo_gmt_monastir.png"
        tuv_path = Path(settings.BASE_DIR) / "static" / "images" / "tuv_cert.png"

        def safe(value, fallback=""):
            return value if value not in [None, ""] else fallback

        def txt(x, y, value, size=8, bold=False, color=base_blue):
            p.setFillColor(color)
            p.setFont("Helvetica-Bold" if bold else "Helvetica", size)
            p.drawString(x, y, str(value or ""))

        def centered(y, value, size=11, bold=True, color=base_blue):
            p.setFillColor(color)
            p.setFont("Helvetica-Bold" if bold else "Helvetica", size)
            p.drawCentredString(width / 2, y, str(value or ""))

        def arabic_right(x, y, value, size=8):
            p.setFont("Amiri", size)
            p.setFillColor(base_blue)
            p.drawRightString(x, y, shape_arabic(value))

        def dotted_line(x1, y1, x2, y2):
            p.setStrokeColor(base_blue)
            p.setLineWidth(0.6)
            p.setDash(1, 2)
            p.line(x1, y1, x2, y2)
            p.setDash()

        def wrap_text(value, max_width, font="Helvetica", size=8):
            words = str(value or "").split()
            lines = []
            current = ""
            for word in words:
                test = f"{current} {word}".strip()
                if p.stringWidth(test, font, size) <= max_width:
                    current = test
                else:
                    if current:
                        lines.append(current)
                    current = word
            if current:
                lines.append(current)
            return lines

        def draw_value_on_line(x, y, value, max_width, size=8):
            text_value = str(value or "")
            if not text_value:
                return
            while p.stringWidth(text_value, "Helvetica", size) > max_width and len(text_value) > 0:
                text_value = text_value[:-1]
            p.setFillColor(colors.black)
            p.setFont("Helvetica", size)
            p.drawString(x, y, text_value)

        def draw_checkbox(x, y, label, checked=False):
            size = 0.35 * cm
            p.setStrokeColor(base_blue)
            p.rect(x, y - size + 0.05 * cm, size, size)
            if checked:
                p.setFillColor(base_blue)
                p.setFont("Helvetica-Bold", 8)
                p.drawCentredString(x + size / 2, y - 0.1 * cm, "X")
            txt(x + 0.55 * cm, y, label, 7.5, False)

        right = width - margin

        # Header
        txt(margin, height - 1.0 * cm, "Groupement de Médecine", 9, True)
        txt(margin, height - 1.35 * cm, "du travail du Gouvernorat", 9, True)
        txt(margin, height - 1.7 * cm, "de Monastir", 9, True)

        if logo_path.exists():
            logo = ImageReader(str(logo_path))
            p.drawImage(
                logo,
                margin,
                height - 2.9 * cm,
                width=2.3 * cm,
                height=1.5 * cm,
                preserveAspectRatio=True,
                mask="auto",
            )
            txt(margin + 2.5 * cm, height - 2.2 * cm, "Certifié ISO 9001 : 2008", 6.5, False)

        box_w, box_h = 3.2 * cm, 0.9 * cm
        box_x = right - box_w
        box_y = height - 1.1 * cm
        p.setStrokeColor(base_blue)
        p.rect(box_x, box_y, box_w, box_h)
        txt(box_x + 0.3 * cm, box_y + 0.28 * cm, "FR - VME - 03/03", 7.5, True)
        arabic_right(right, height - 1.8 * cm, "")

        meta_y = height - 2.45 * cm
        txt(right - 6.0 * cm, meta_y, "N°", 8, True)
        dotted_line(right - 5.2 * cm, meta_y - 0.05 * cm, right - 3.2 * cm, meta_y - 0.05 * cm)
        draw_value_on_line(
            right - 5.1 * cm,
            meta_y - 0.2 * cm,
            f"{examen.id:06d}",
            1.7 * cm,
        )
        meta_y -= 0.45 * cm
        txt(right - 6.0 * cm, meta_y, "AGE", 8, True)
        dotted_line(right - 5.2 * cm, meta_y - 0.05 * cm, right - 3.2 * cm, meta_y - 0.05 * cm)
        draw_value_on_line(
            right - 5.1 * cm,
            meta_y - 0.2 * cm,
            safe(examen.age),
            1.7 * cm,
        )
        meta_y -= 0.45 * cm
        txt(right - 6.0 * cm, meta_y, "Mle", 8, True)
        dotted_line(right - 5.2 * cm, meta_y - 0.05 * cm, right - 3.2 * cm, meta_y - 0.05 * cm)
        draw_value_on_line(
            right - 5.1 * cm,
            meta_y - 0.2 * cm,
            safe(examen.cin),
            1.7 * cm,
        )

        # Body title
        centered(height - 3.4 * cm, "DEMANDE D’EXAMENS COMPLÉMENTAIRES", 12, True)

        y = height - 4.3 * cm
        txt(margin, y, "NOM ET PRÉNOM :", 8, True)
        line_start = margin + 3.4 * cm
        dotted_line(line_start, y - 0.05 * cm, right, y - 0.05 * cm)
        draw_value_on_line(
            line_start + 0.1 * cm,
            y - 0.2 * cm,
            safe(examen.nom_prenom),
            right - line_start - 0.2 * cm,
        )

        y -= 0.55 * cm
        txt(margin, y, "ENTREPRISE :", 8, True)
        entreprise_end = right - 7.0 * cm
        dotted_line(margin + 2.6 * cm, y - 0.05 * cm, entreprise_end, y - 0.05 * cm)
        draw_value_on_line(
            margin + 2.7 * cm,
            y - 0.2 * cm,
            safe(examen.entreprise),
            entreprise_end - (margin + 2.8 * cm),
        )

        poste_label_x = entreprise_end + 0.5 * cm
        txt(poste_label_x, y, "POSTE DE TRAVAIL :", 8, True)
        poste_line_start = poste_label_x + 3.7 * cm
        dotted_line(poste_line_start, y - 0.05 * cm, right, y - 0.05 * cm)
        draw_value_on_line(
            poste_line_start + 0.1 * cm,
            y - 0.2 * cm,
            safe(examen.poste_travail),
            right - poste_line_start - 0.2 * cm,
        )

        y -= 0.6 * cm
        txt(margin, y, "RENSEIGNEMENTS CLINIQUES :", 8, True)
        r_start = margin + 4.9 * cm
        line_gap = 0.5 * cm
        for i in range(3):
            line_y = y - (i * line_gap)
            dotted_line(r_start, line_y - 0.05 * cm, right, line_y - 0.05 * cm)

        r_lines = wrap_text(
            examen.renseignements_cliniques,
            right - r_start - 0.2 * cm,
            size=8,
        )
        for idx, line in enumerate(r_lines[:3]):
            draw_value_on_line(
                r_start + 0.1 * cm,
                y - (idx * line_gap) - 0.2 * cm,
                line,
                right - r_start - 0.3 * cm,
            )

        y = y - (3 * line_gap) - 0.3 * cm
        txt(margin, y, "RENSEIGNEMENTS COMPLÉMENTAIRES :", 8, True)
        y -= 0.45 * cm
        left_col_x = margin + 0.2 * cm
        right_col_x = (width / 2) + 1.0 * cm
        draw_checkbox(left_col_x, y, "VISIOTEST", examen.visiotest)
        draw_checkbox(right_col_x, y, "AUDIOGRAMME", examen.audiogramme)
        y -= 0.5 * cm
        draw_checkbox(left_col_x, y, "ECG", examen.ecg)
        draw_checkbox(right_col_x, y, "EFR", examen.efr)

        y -= 0.8 * cm
        txt(right - 6.0 * cm, y, "DATE:", 8, True)
        dotted_line(right - 4.9 * cm, y - 0.05 * cm, right, y - 0.05 * cm)
        draw_value_on_line(
            right - 4.8 * cm,
            y - 0.2 * cm,
            safe(examen.date),
            4.6 * cm,
        )
        txt(
            right - 8.6 * cm,
            y - 0.5 * cm,
            "CACHET ET SIGNATURE DU MÉDECIN DU TRAVAIL",
            7,
            True,
        )

        # Footer
        if tuv_path.exists():
            tuv = ImageReader(str(tuv_path))
            p.drawImage(
                tuv,
                margin,
                margin - 0.1 * cm,
                width=1.4 * cm,
                height=1.0 * cm,
                mask="auto",
            )

        txt(
            margin + 1.8 * cm,
            margin + 0.55 * cm,
            "Groupement de Médecine du travail du Gouvernorat de Monastir",
            6,
            False,
        )
        txt(
            margin + 1.8 * cm,
            margin + 0.3 * cm,
            "Zone Industrielle Route de Khnis - Monastir",
            6,
            False,
        )
        txt(
            margin + 1.8 * cm,
            margin + 0.05 * cm,
            "Boîte Postale N° 41 - Poste Gare Monastir - 5079",
            6,
            False,
        )
        txt(
            margin + 1.8 * cm,
            margin - 0.2 * cm,
            "Tél: 73 508 100 / Fax: 73 508 101",
            6,
            False,
        )
        arabic_right(width - margin, margin + 0.05 * cm, "")
        arabic_right(width - margin, margin - 0.2 * cm, "")

        p.showPage()
        p.save()
        return response


class DossierMedicalPdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        dossier = get_object_or_404(DossierMedical, pk=pk)
        collab = dossier.collaborateur

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename=\"dossier_medical_{collab.matricule}.pdf\"'

        page_size = landscape(A4)
        p = canvas.Canvas(response, pagesize=page_size)
        width, height = page_size
        base_blue = colors.HexColor("#1a3c8f")
        margin = 0.8 * cm
        register_arabic_font()

        logo_path = Path(settings.BASE_DIR) / "static" / "images" / "logo_gmt_monastir.png"
        tuv_path = Path(settings.BASE_DIR) / "static" / "images" / "tuv_cert.png"

        def txt(x, y, value, size=8, bold=False, color=base_blue):
            p.setFillColor(color)
            p.setFont("Helvetica-Bold" if bold else "Helvetica", size)
            p.drawString(x, y, str(value or ""))

        def dotted_line(x1, y1, x2, y2):
            p.setStrokeColor(base_blue)
            p.setLineWidth(0.6)
            p.setDash(1, 2)
            p.line(x1, y1, x2, y2)
            p.setDash()

        # Header
        if logo_path.exists():
            logo = ImageReader(str(logo_path))
            p.drawImage(
                logo,
                (width / 2) - 1.2 * cm,
                height - 2.2 * cm,
                width=2.4 * cm,
                height=1.6 * cm,
                preserveAspectRatio=True,
                mask="auto",
            )
        txt(width / 2 - 1.2 * cm, height - 2.35 * cm, "G.M.T MONASTIR", 8, True)
        txt(width / 2 - 1.5 * cm, height - 2.7 * cm, "Certifié ISO 9001 : 2008", 6.5, False)

        box_w, box_h = 3.0 * cm, 1.0 * cm
        box_x = width - margin - box_w
        box_y = height - 1.6 * cm
        p.setStrokeColor(base_blue)
        p.rect(box_x, box_y, box_w, box_h)
        txt(box_x + 0.35 * cm, box_y + 0.3 * cm, "FR - VME 14/01", 7.5, True)
        txt(box_x + 0.25 * cm, box_y - 0.2 * cm, "Mle ..........", 7.5, True)

        p.line(margin, height - 3.1 * cm, width - margin, height - 3.1 * cm)
        txt(width / 2 - 2.0 * cm, height - 3.7 * cm, "DOSSIER MEDICAL", 12, True)
        txt(margin, height - 4.2 * cm, "Entreprise :", 7.5, True)
        dotted_line(margin + 2.0 * cm, height - 4.22 * cm, width / 2 - 1.0 * cm, height - 4.22 * cm)
        txt(width / 2 + 0.5 * cm, height - 4.2 * cm, "Localité :", 7.5, True)
        dotted_line(width / 2 + 2.0 * cm, height - 4.22 * cm, width - margin, height - 4.22 * cm)

        # Photo box
        p.rect(width - margin - 3.0 * cm, height - 6.0 * cm, 2.6 * cm, 2.8 * cm)
        txt(width - margin - 2.2 * cm, height - 4.8 * cm, "Photo", 7.5, True)

        # Basic identity block
        y = height - 5.2 * cm
        txt(margin, y, "Nom et prénom :", 7.5, True)
        dotted_line(margin + 2.5 * cm, y - 0.05 * cm, width / 2 - 1.0 * cm, y - 0.05 * cm)
        txt(width / 2 + 0.5 * cm, y, "Matricule :", 7.5, True)
        dotted_line(width / 2 + 2.0 * cm, y - 0.05 * cm, width - margin - 3.2 * cm, y - 0.05 * cm)

        y -= 0.6 * cm
        txt(margin, y, "Date de recrutement :", 7.5, True)
        dotted_line(margin + 3.4 * cm, y - 0.05 * cm, width / 2 - 1.0 * cm, y - 0.05 * cm)
        txt(width / 2 + 0.5 * cm, y, "Poste :", 7.5, True)
        dotted_line(width / 2 + 1.6 * cm, y - 0.05 * cm, width - margin - 3.2 * cm, y - 0.05 * cm)

        y -= 0.6 * cm
        txt(margin, y, "Profession :", 7.5, True)
        dotted_line(margin + 2.0 * cm, y - 0.05 * cm, width / 2 - 1.0 * cm, y - 0.05 * cm)
        txt(width / 2 + 0.5 * cm, y, "Niveau d'études :", 7.5, True)
        dotted_line(width / 2 + 2.6 * cm, y - 0.05 * cm, width - margin, y - 0.05 * cm)

        # Footer with badge
        if tuv_path.exists():
            tuv = ImageReader(str(tuv_path))
            p.drawImage(tuv, margin, margin - 0.1 * cm, width=1.4 * cm, height=1.0 * cm, mask="auto")

        txt(margin + 1.8 * cm, margin + 0.55 * cm, "Groupement de Médecine du travail du Gouvernorat de Monastir", 6, False)
        txt(margin + 1.8 * cm, margin + 0.3 * cm, "Zone Industrielle Route de Khnis - Monastir", 6, False)
        txt(margin + 1.8 * cm, margin + 0.05 * cm, "Boîte Postale N° 41 - Poste Gare Monastir - 5079", 6, False)
        txt(margin + 1.8 * cm, margin - 0.2 * cm, "Tél: 73 508 100 / Fax: 73 508 101", 6, False)
        p.setFont("Amiri", 6.5)
        p.setFillColor(base_blue)
        p.drawRightString(width - margin, margin + 0.05 * cm, shape_arabic("صندوق بريد رقم 41 - مركز بريد المحطة - المنستير - 5079"))
        p.drawRightString(width - margin, margin - 0.2 * cm, shape_arabic("هاتف: 73 508 100 / فاكس: 73 508 101"))

        p.showPage()
        p.save()
        return response


class OrdonnancePdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        ordonnance = get_object_or_404(
            Ordonnance.objects.select_related("collaborateur", "created_by"),
            pk=pk,
        )

        collab = ordonnance.collaborateur

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="ordonnance_{collab.matricule}.pdf"'

        p = canvas.Canvas(response, pagesize=A4)
        width, height = A4

        margin = 2.2 * cm
        y = height - 2.6 * cm

        register_arabic_font()

        def txt(x, y_pos, value, size=12, bold=False):
            p.setFont("Times-Bold" if bold else "Times-Roman", size)
            p.setFillColor(colors.black)
            p.drawString(x, y_pos, str(value or ""))

        def right_txt(x, y_pos, value, size=12, bold=False):
            p.setFont("Times-Bold" if bold else "Times-Roman", size)
            p.setFillColor(colors.black)
            p.drawRightString(x, y_pos, str(value or ""))

        def arabic_right(x, y_pos, value, size=12):
            p.setFont("Amiri", size)
            p.setFillColor(colors.black)
            p.drawRightString(x, y_pos, shape_arabic(value))

        today = (
            ordonnance.date.strftime("%d/%m/%Y")
            if getattr(ordonnance, "date", None)
            else timezone.now().strftime("%d/%m/%Y")
        )

        doctor_name = "Docteur"
        if request.user and request.user.is_authenticated:
            full_name = (request.user.get_full_name() or "").strip()
            doctor_name = full_name if full_name else (request.user.username or "Docteur")
        elif getattr(ordonnance, "created_by", None):
            doctor_name = ordonnance.created_by.get_full_name() or ordonnance.created_by.username or "Docteur"

        # Header left
        txt(margin, y, "Docteur", 11, True)
        txt(margin, y - 14, doctor_name, 11, True)
        txt(margin, y - 28, "Médecine Générale", 10, False)

        # Header right (Arabic)
        arabic_right(width - margin, y, "الدكتور", 11)
        arabic_name = ""
        if request.user and request.user.is_authenticated:
            arabic_name = (request.user.nom_ar or "").strip()
        if arabic_name:
            arabic_right(width - margin, y - 14, arabic_name, 11)
        else:
            right_txt(width - margin, y - 14, doctor_name, 11, True)
        arabic_right(width - margin, y - 28, "طب عام", 11)

        # Date line with dotted fill
        y -= 1.7 * cm
        date_label = f"Menzel Hayet, le {today}"
        txt(margin, y, date_label, 11, False)

        # Content area
        y -= 2.0 * cm
        contenu = ordonnance.contenu or ""
        lines = contenu.split("\n") if contenu else []
        for line in lines:
            txt(margin, y, line, 12, False)
            y -= 0.9 * cm

        # Footer
        footer_y = 2.3 * cm
        p.line(margin, footer_y + 0.7 * cm, width - margin, footer_y + 0.7 * cm)
        txt(margin, footer_y, "Leoni Menzel Hayet", 11, True)
        right_txt(width - margin, footer_y, "Service Médical", 11, True)

        p.showPage()
        p.save()
        return response


class DemandeExamenLaboListCreateByCollaborateurView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, collaborateur_id):
        collaborateur = get_object_or_404(Collaborateur, id=collaborateur_id)
        qs = DemandeExamenLabo.objects.filter(collaborateur=collaborateur).order_by("-created_at")
        return Response(DemandeExamenLaboSerializer(qs, many=True).data, status=status.HTTP_200_OK)

    def post(self, request, collaborateur_id):
        collaborateur = get_object_or_404(Collaborateur, id=collaborateur_id)

        data = request.data.copy()
        data["collaborateur"] = collaborateur.id

        serializer = DemandeExamenLaboSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(created_by=request.user)

        return Response(DemandeExamenLaboSerializer(obj).data, status=status.HTTP_201_CREATED)


class ExamenComplementaireListCreateByCollaborateurView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, collaborateur_id):
        collaborateur = get_object_or_404(Collaborateur, id=collaborateur_id)
        qs = ExamenComplementaire.objects.filter(collaborateur=collaborateur).order_by("-created_at")
        return Response(ExamenComplementaireSerializer(qs, many=True).data, status=status.HTTP_200_OK)

    def post(self, request, collaborateur_id):
        collaborateur = get_object_or_404(Collaborateur, id=collaborateur_id)

        data = request.data.copy()
        data["collaborateur"] = collaborateur.id

        serializer = ExamenComplementaireSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(created_by=request.user)

        return Response(ExamenComplementaireSerializer(obj).data, status=status.HTTP_201_CREATED)


class FicheAptitudeListCreateByCollaborateurView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, collaborateur_id):
        collaborateur = get_object_or_404(Collaborateur, id=collaborateur_id)
        qs = FicheAptitude.objects.filter(collaborateur=collaborateur).order_by("-date", "-id")
        return Response(FicheAptitudeSerializer(qs, many=True).data, status=status.HTTP_200_OK)

    def post(self, request, collaborateur_id):
        collaborateur = get_object_or_404(Collaborateur, id=collaborateur_id)
        data = request.data.copy()
        data["collaborateur"] = collaborateur.id

        serializer = FicheAptitudeSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(created_by=request.user)
        return Response(FicheAptitudeSerializer(obj).data, status=status.HTTP_201_CREATED)


class FicheAptitudeListCreateView(generics.ListCreateAPIView):
    serializer_class = FicheAptitudeSerializer
    permission_classes = [IsAuthenticated]
    queryset = FicheAptitude.objects.all().order_by("-date", "-id")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class FicheAptitudeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FicheAptitudeSerializer
    permission_classes = [IsAuthenticated]
    queryset = FicheAptitude.objects.all()


class ExamenLaboListCreateView(generics.ListCreateAPIView):
    serializer_class = DemandeExamenLaboSerializer
    permission_classes = [IsAuthenticated]
    queryset = DemandeExamenLabo.objects.all().order_by("-date", "-id")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ExamenLaboDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DemandeExamenLaboSerializer
    permission_classes = [IsAuthenticated]
    queryset = DemandeExamenLabo.objects.all()


class ExamenCompListCreateView(generics.ListCreateAPIView):
    serializer_class = ExamenComplementaireSerializer
    permission_classes = [IsAuthenticated]
    queryset = ExamenComplementaire.objects.all().order_by("-date", "-id")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ExamenCompDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExamenComplementaireSerializer
    permission_classes = [IsAuthenticated]
    queryset = ExamenComplementaire.objects.all()


class DossierMedicalListCreateView(generics.ListCreateAPIView):
    serializer_class = DossierMedicalSerializer
    permission_classes = [IsAuthenticated]
    queryset = DossierMedical.objects.all().order_by("-created_at", "-id")


class DossierMedicalDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DossierMedicalSerializer
    permission_classes = [IsAuthenticated]
    queryset = DossierMedical.objects.all()


class CollaborateurMedListCreateView(generics.ListCreateAPIView):
    serializer_class = CollaborateurSerializer
    permission_classes = [IsAuthenticated]
    queryset = Collaborateur.objects.all().order_by("nom", "prenom")


class CollaborateurMedDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CollaborateurSerializer
    permission_classes = [IsAuthenticated]
    queryset = Collaborateur.objects.all()


class ExamenInitialCreateUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        require_medecin_travail(request)
        serializer = ExamenInitialSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def patch(self, request, pk=None):
        require_medecin_travail(request)
        if pk is None:
            return Response(
                {"detail": "PK manquant."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        obj = get_object_or_404(ExamenInitial, pk=pk)
        serializer = ExamenInitialSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class DossierByCollaborateurView(APIView):
    permission_classes = [IsAuthenticated]

    ALLOWED_READ_ROLES = [
        "INFIRMIER",
        "MEDECIN_TRAITANT",
        "MEDECIN_TRAVAIL",
        "MEDECIN_CONTROLEUR",
        "ADMIN",
    ]

    ALLOWED_EDIT_ROLES = [
        "MEDECIN_TRAVAIL",
        "ADMIN",
    ]

    def _get_user_role(self, request):
        return getattr(request.user, "role", None)

    def _get_or_create_dossier(self, collaborateur):
        dossier, _ = DossierMedical.objects.get_or_create(
            collaborateur=collaborateur,
            defaults={
                "entreprise": getattr(collaborateur.site, "nom", "")
                if getattr(collaborateur, "site", None)
                else "",
                "localite": getattr(collaborateur.site, "localite", "")
                if getattr(collaborateur, "site", None)
                else "",
            },
        )
        return dossier

    def get(self, request, collaborateur_id):
        role = self._get_user_role(request)
        if role not in self.ALLOWED_READ_ROLES:
            return Response(
                {"detail": "Accès non autorisé."},
                status=status.HTTP_403_FORBIDDEN,
            )

        collaborateur = get_object_or_404(Collaborateur, id=collaborateur_id)
        if role in self.ALLOWED_EDIT_ROLES:
            dossier = self._get_or_create_dossier(collaborateur)
        else:
            dossier = get_object_or_404(DossierMedical, collaborateur=collaborateur)

        return Response(
            DossierMedicalSerializer(dossier).data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request, collaborateur_id):
        role = self._get_user_role(request)
        if role not in self.ALLOWED_EDIT_ROLES:
            return Response(
                {"detail": "Seul le médecin du travail peut modifier le dossier médical."},
                status=status.HTTP_403_FORBIDDEN,
            )

        collaborateur = get_object_or_404(Collaborateur, id=collaborateur_id)
        dossier = self._get_or_create_dossier(collaborateur)

        serializer = DossierMedicalSerializer(
            dossier,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)


class DossierByMatriculeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, matricule):
        collab = get_object_or_404(
            Collaborateur.objects.select_related("site"),
            matricule=matricule,
        )
        dossier = DossierMedical.objects.filter(collaborateur=collab).first()
        if not dossier:
            dossier = DossierMedical.objects.create(
                collaborateur=collab,
                entreprise=getattr(collab.site, "nom", "") if collab.site else "",
                localite=getattr(collab.site, "localite", "") if collab.site else "",
            )
        return Response(DossierMedicalSerializer(dossier).data, status=status.HTTP_200_OK)


class DossierAutofillView(APIView):
    permission_classes = [IsAuthenticated]

    ALLOWED_EDIT_ROLES = [
        "MEDECIN_TRAVAIL",
        "ADMIN",
    ]

    def _get_user_role(self, request):
        return getattr(request.user, "role", None)

    def _rand_date(self, start_year=1980, end_year=None):
        end_year = end_year or date.today().year
        start = date(start_year, 1, 1)
        end = date(end_year, 12, 31)
        delta = (end - start).days
        return start + timedelta(days=random.randint(0, max(delta, 0)))

    def _autofill_collab(self, collab, postes_pool, departements_pool, sites_pool):
        changed = False

        if not collab.poste:
            collab.poste = random.choice(postes_pool)
            changed = True
        if not collab.departement:
            collab.departement = random.choice(departements_pool)
            changed = True
        if not collab.cin:
            collab.cin = str(random.randint(10000000, 99999999))
            changed = True
        if not collab.date_naissance:
            collab.date_naissance = self._rand_date(1960, 2004)
            changed = True
        if not collab.telephone:
            collab.telephone = "2" + str(random.randint(1000000, 9999999))
            changed = True
        if not collab.site and sites_pool:
            collab.site = random.choice(sites_pool)
            changed = True

        if changed:
            collab.save()

        dossier, _ = DossierMedical.objects.get_or_create(
            collaborateur=collab,
            defaults={
                "entreprise": getattr(collab.site, "nom", "") if collab.site else "LEONI",
                "localite": getattr(collab.site, "localite", "") if collab.site else "Menzel Hayet",
            },
        )

        dossier_changed = False
        if not dossier.entreprise:
            dossier.entreprise = getattr(collab.site, "nom", "") if collab.site else "LEONI"
            dossier_changed = True
        if not dossier.localite:
            dossier.localite = getattr(collab.site, "localite", "") if collab.site else "Menzel Hayet"
            dossier_changed = True
        if not dossier.profession:
            dossier.profession = collab.poste or random.choice(postes_pool)
            dossier_changed = True
        if not dossier.poste_travail_actuel:
            dossier.poste_travail_actuel = collab.poste or random.choice(postes_pool)
            dossier_changed = True
        if not dossier.date_recrutement:
            dossier.date_recrutement = self._rand_date(2015, date.today().year)
            dossier_changed = True

        if dossier_changed:
            dossier.save()

        return changed, dossier_changed


    def post(self, request):
        role = self._get_user_role(request)
        if role not in self.ALLOWED_EDIT_ROLES:
            return Response(
                {"detail": "Seul le médecin du travail peut modifier le dossier médical."},
                status=status.HTTP_403_FORBIDDEN,
            )

        postes_pool = list(
            Collaborateur.objects.exclude(poste__isnull=True).exclude(poste="").values_list("poste", flat=True)
        )
        departements_pool = list(
            Collaborateur.objects.exclude(departement__isnull=True).exclude(departement="").values_list("departement", flat=True)
        )
        sites_pool = list(Site.objects.all())

        if not postes_pool:
            postes_pool = ["Opérateur", "Technicien", "Superviseur", "Agent qualité"]
        if not departements_pool:
            departements_pool = ["Production", "Maintenance", "RH", "Qualité"]

        updated_collab = 0
        updated_dossier = 0

        for collab in Collaborateur.objects.select_related("site").all():
            collab_changed, dossier_changed = self._autofill_collab(
                collab, postes_pool, departements_pool, sites_pool
            )
            if collab_changed:
                updated_collab += 1
            if dossier_changed:
                updated_dossier += 1

        return Response(
            {
                "updated_collaborateurs": updated_collab,
                "updated_dossiers": updated_dossier,
            },
            status=status.HTTP_200_OK,
        )


class DossierAutofillOneView(DossierAutofillView):
    def post(self, request, collaborateur_id):
        require_medecin_travail(request)

        collab = get_object_or_404(
            Collaborateur.objects.select_related("site"),
            id=collaborateur_id,
        )

        postes_pool = list(
            Collaborateur.objects.exclude(poste__isnull=True).exclude(poste="").values_list("poste", flat=True)
        ) or ["Opérateur", "Technicien", "Superviseur", "Agent qualité"]
        departements_pool = list(
            Collaborateur.objects.exclude(departement__isnull=True).exclude(departement="").values_list("departement", flat=True)
        ) or ["Production", "Maintenance", "RH", "Qualité"]
        sites_pool = list(Site.objects.all())

        collab_changed, dossier_changed = self._autofill_collab(
            collab, postes_pool, departements_pool, sites_pool
        )

        return Response(
            {
                "updated_collaborateur": 1 if collab_changed else 0,
                "updated_dossier": 1 if dossier_changed else 0,
            },
            status=status.HTTP_200_OK,
        )


class VaccinationCreateView(generics.CreateAPIView):
    serializer_class = VaccinationSerializer
    permission_classes = [IsAuthenticated]
    queryset = Vaccination.objects.all()

    def perform_create(self, serializer):
        require_medecin_travail(self.request)
        serializer.save()


class VaccinationDeleteView(generics.DestroyAPIView):
    serializer_class = VaccinationSerializer
    permission_classes = [IsAuthenticated]
    queryset = Vaccination.objects.all()

    def perform_destroy(self, instance):
        require_medecin_travail(self.request)
        instance.delete()


class IncidentListCreateView(generics.ListCreateAPIView):
    serializer_class = IncidentInfirmierSerializer
    permission_classes = [IsAuthenticated]
    queryset = IncidentInfirmier.objects.select_related("dossier__collaborateur").all().order_by(
        "-date_incident", "-heure_incident", "-id"
    )


class IncidentDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = IncidentInfirmierSerializer
    permission_classes = [IsAuthenticated]
    queryset = IncidentInfirmier.objects.select_related("dossier__collaborateur").all()


class IncidentAvecBonListCreateView(generics.ListCreateAPIView):
    serializer_class = IncidentAvecBonSerializer
    permission_classes = [IsAuthenticated]
    queryset = IncidentAvecBon.objects.all().order_by("-created_at")


class IncidentAvecBonDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = IncidentAvecBonSerializer
    permission_classes = [IsAuthenticated]
    queryset = IncidentAvecBon.objects.all()


class IncidentSansBonListCreateView(generics.ListCreateAPIView):
    serializer_class = IncidentSansBonSerializer
    permission_classes = [IsAuthenticated]
    queryset = IncidentSansBon.objects.all().order_by("-created_at")


class IncidentSansBonDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = IncidentSansBonSerializer
    permission_classes = [IsAuthenticated]
    queryset = IncidentSansBon.objects.all()


class BonChauffeurListCreateView(generics.ListCreateAPIView):
    serializer_class = BonChauffeurSerializer
    permission_classes = [IsAuthenticated]
    queryset = BonChauffeur.objects.all().order_by("-numero_ordre", "-id")


class BonChauffeurDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BonChauffeurSerializer
    permission_classes = [IsAuthenticated]
    queryset = BonChauffeur.objects.all()


class SuiviTransfertUrgenceListCreateView(generics.ListCreateAPIView):
    serializer_class = SuiviTransfertUrgenceSerializer
    permission_classes = [IsAuthenticated]
    queryset = SuiviTransfertUrgence.objects.all().order_by("-date", "-id")


class SuiviTransfertUrgenceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SuiviTransfertUrgenceSerializer
    permission_classes = [IsAuthenticated]
    queryset = SuiviTransfertUrgence.objects.all()


class AccidentListCreateView(generics.ListCreateAPIView):
    serializer_class = AccidentTravailSerializer
    permission_classes = [IsAuthenticated]
    queryset = AccidentTravail.objects.select_related("dossier__collaborateur").all().order_by(
        "-date_accident", "-id"
    )


class AccidentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AccidentTravailSerializer
    permission_classes = [IsAuthenticated]
    queryset = AccidentTravail.objects.select_related("dossier__collaborateur").all()


class AccidentStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        month_start = today.replace(day=1)

        qs = (
            AccidentTravail.objects.select_related("dossier__collaborateur")
            .all()
            .order_by("-date_accident", "-id")
        )

        total = qs.count()
        today_count = qs.filter(date_accident=today).count()
        month_count = qs.filter(date_accident__gte=month_start, date_accident__lte=today).count()
        sent_hsee_count = qs.filter(envoye_hsee=True).count()

        recent_data = []
        for acc in qs[:5]:
            collaborateur = acc.dossier.collaborateur
            recent_data.append(
                {
                    "id": acc.id,
                    "date_accident": acc.date_accident,
                    "heure_accident": acc.heure_accident,
                    "cause": acc.cause,
                    "nature_lesion": acc.nature_lesion,
                    "siege_lesion": acc.siege_lesion,
                    "lieu_accident": acc.lieu_accident,
                    "envoye_hsee": acc.envoye_hsee,
                    "collaborateur_nom": collaborateur.nom,
                    "collaborateur_prenom": collaborateur.prenom,
                    "matricule": collaborateur.matricule,
                }
            )

        return Response(
            {
                "total": total,
                "today": today_count,
                "this_month": month_count,
                "sent_hsee": sent_hsee_count,
                "recent": recent_data,
            }
        )


class AccidentSendToHSEEView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        accident = get_object_or_404(AccidentTravail, pk=pk)
        accident.envoye_hsee = True
        accident.save(update_fields=["envoye_hsee"])

        return Response(
            {
                "detail": "Accident envoyé au responsable HSEE.",
                "envoye_hsee": True,
            },
            status=status.HTTP_200_OK,
        )


class HSEEAccidentsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = (
            AccidentTravail.objects.select_related("dossier__collaborateur")
            .all()
            .order_by("-date_accident", "-id")[:10]
        )
        data = AccidentTravailSerializer(qs, many=True).data
        return Response(data, status=status.HTTP_200_OK)


class HSEEKpisView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = AccidentTravail.objects.all()

        total_accidents = qs.count()
        jours_perdus = qs.aggregate(total=Sum("duree_arret"))["total"] or 0
        accidents_graves = qs.filter(duree_arret__gte=10).count()
        enquetes_en_cours = qs.filter(envoye_hsee=False).count()
        zones_risque = (
            qs.exclude(lieu_accident__isnull=True)
            .exclude(lieu_accident="")
            .values("lieu_accident")
            .distinct()
            .count()
        )

        taux_frequence = round(total_accidents * 0.27, 1)
        taux_gravite = round(jours_perdus * 0.02, 1)

        return Response(
            {
                "accidents_declares": total_accidents,
                "taux_frequence": taux_frequence,
                "taux_gravite": taux_gravite,
                "jours_perdus": jours_perdus,
                "accidents_graves": accidents_graves,
                "enquetes_en_cours": enquetes_en_cours,
                "zones_risque": zones_risque,
            },
            status=status.HTTP_200_OK,
        )


class HSEETopCausesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        rows = (
            AccidentTravail.objects.exclude(cause__isnull=True)
            .exclude(cause="")
            .values("cause")
            .annotate(value=Count("id"))
            .order_by("-value")[:5]
        )

        data = [{"label": row["cause"], "value": row["value"]} for row in rows]
        return Response(data, status=status.HTTP_200_OK)


class HSEEAccidentsParSegmentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        rows = (
            AccidentTravail.objects.annotate(
                segment_calcule=Case(
                    When(lieu_accident__isnull=True, then=Value("Non défini")),
                    When(lieu_accident="", then=Value("Non défini")),
                    default="lieu_accident",
                    output_field=CharField(),
                )
            )
            .values("segment_calcule")
            .annotate(value=Count("id"))
            .order_by("-value")
        )

        data = [{"segment": row["segment_calcule"], "value": row["value"]} for row in rows]
        return Response(data, status=status.HTTP_200_OK)


class HSEEAccidentsParGraviteView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        rows = (
            AccidentTravail.objects.annotate(
                gravite_calculee=Case(
                    When(duree_arret__gte=10, then=Value("Grave")),
                    When(duree_arret__gte=1, then=Value("Moyenne")),
                    default=Value("Faible"),
                    output_field=CharField(),
                )
            )
            .values("gravite_calculee")
            .annotate(value=Count("id"))
            .order_by("-value")
        )

        data = [{"name": row["gravite_calculee"], "value": row["value"]} for row in rows]
        return Response(data, status=status.HTTP_200_OK)


class HSEEAccidentsParMoisView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        month_names = {
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

        rows = (
            AccidentTravail.objects.annotate(month=ExtractMonth("date_accident"))
            .values("month")
            .annotate(accidents=Count("id"))
            .order_by("month")
        )

        data = [
            {
                "mois": month_names.get(row["month"], str(row["month"])),
                "accidents": row["accidents"],
            }
            for row in rows
            if row["month"] is not None
        ]

        return Response(data, status=status.HTTP_200_OK)


class HSEEPlanActionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = [
            {
                "id": 1,
                "zone": "Atelier câblage",
                "risque": "Sol glissant",
                "action": "Installer tapis antidérapants",
                "responsable": "HSEE + Maintenance",
                "delai": "15/03/2026",
                "statut": "En cours",
            },
            {
                "id": 2,
                "zone": "Maintenance",
                "risque": "Manipulation outil tranchant",
                "action": "Former les opérateurs et renforcer le port EPI",
                "responsable": "Chef atelier",
                "delai": "20/03/2026",
                "statut": "Planifié",
            },
            {
                "id": 3,
                "zone": "Magasin",
                "risque": "Chute d'objet",
                "action": "Réorganiser le stockage en hauteur",
                "responsable": "Logistique",
                "delai": "05/03/2026",
                "statut": "Terminé",
            },
        ]
        return Response(data, status=status.HTTP_200_OK)


class MaladieCreateView(generics.ListCreateAPIView):
    serializer_class = MaladieProfessionnelleSerializer
    permission_classes = [IsAuthenticated]
    queryset = MaladieProfessionnelle.objects.all()


class MaladieDeleteView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MaladieProfessionnelleSerializer
    permission_classes = [IsAuthenticated]
    queryset = MaladieProfessionnelle.objects.all()


class PosteCreateView(generics.CreateAPIView):
    serializer_class = PosteTravailSerializer
    permission_classes = [IsAuthenticated]
    queryset = PosteTravail.objects.all()

    def perform_create(self, serializer):
        require_medecin_travail(self.request)
        serializer.save()


class PosteDeleteView(generics.DestroyAPIView):
    serializer_class = PosteTravailSerializer
    permission_classes = [IsAuthenticated]
    queryset = PosteTravail.objects.all()

    def perform_destroy(self, instance):
        require_medecin_travail(self.request)
        instance.delete()


class ExamenUlterieurCreateView(generics.CreateAPIView):
    serializer_class = ExamenUlterieurSerializer
    permission_classes = [IsAuthenticated]
    queryset = ExamenUlterieur.objects.all()

    def perform_create(self, serializer):
        require_medecin_travail(self.request)
        serializer.save()


class ExamenUlterieurDeleteView(generics.DestroyAPIView):
    serializer_class = ExamenUlterieurSerializer
    permission_classes = [IsAuthenticated]
    queryset = ExamenUlterieur.objects.all()

    def perform_destroy(self, instance):
        require_medecin_travail(self.request)
        instance.delete()


class FicheMedicaleByCollaborateurView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, collaborateur_id):
        collaborateur = get_object_or_404(Collaborateur, id=collaborateur_id)

        role = (getattr(request.user, "role", "") or "").strip().upper()
        if role in ["MEDECIN_TRAVAIL", "ADMIN"]:
            fiche, _ = FicheMedicale.objects.get_or_create(
                collaborateur=collaborateur,
                defaults={
                    "date_naissance": None,
                    "lieu_naissance": "",
                    "adresse": "",
                    "telephone": "",
                },
            )
        else:
            fiche = get_object_or_404(FicheMedicale, collaborateur=collaborateur)

        return Response(FicheMedicaleSerializer(fiche).data, status=status.HTTP_200_OK)

    def patch(self, request, collaborateur_id):
        require_medecin_travail(request)
        collaborateur = get_object_or_404(Collaborateur, id=collaborateur_id)
        fiche, _ = FicheMedicale.objects.get_or_create(collaborateur=collaborateur)

        serializer = FicheMedicaleSerializer(fiche, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class OrdonnanceListCreateByCollaborateurView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, collaborateur_id):
        collaborateur = get_object_or_404(Collaborateur, id=collaborateur_id)
        qs = Ordonnance.objects.filter(collaborateur=collaborateur).order_by("-created_at")
        return Response(OrdonnanceSerializer(qs, many=True).data, status=status.HTTP_200_OK)

    def post(self, request, collaborateur_id):
        collaborateur = get_object_or_404(Collaborateur, id=collaborateur_id)
        data = request.data.copy()
        data["collaborateur"] = collaborateur.id

        serializer = OrdonnanceSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(created_by=request.user)

        return Response(OrdonnanceSerializer(obj).data, status=status.HTTP_201_CREATED)


class CertificatListCreateByCollaborateurView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, collaborateur_id):
        collaborateur = get_object_or_404(Collaborateur, id=collaborateur_id)
        qs = CertificatMedical.objects.filter(collaborateur=collaborateur).order_by("-created_at")
        return Response(CertificatMedicalSerializer(qs, many=True).data, status=status.HTTP_200_OK)

    def post(self, request, collaborateur_id):
        collaborateur = get_object_or_404(Collaborateur, id=collaborateur_id)
        data = request.data.copy()
        data["collaborateur"] = collaborateur.id

        serializer = CertificatMedicalSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(created_by=request.user)

        return Response(CertificatMedicalSerializer(obj).data, status=status.HTTP_201_CREATED)


class StockItemListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = StockItemSerializer
    permission_classes = [IsAuthenticated]
    queryset = StockItem.objects.all().order_by("nom")


class StockItemDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StockItemSerializer
    permission_classes = [IsAuthenticated]
    queryset = StockItem.objects.all()


class StockMovementListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated]
    queryset = StockMovement.objects.all().order_by("-created_at")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        movement = serializer.save()

        stock_item = movement.stock_item

        if movement.type_mouvement == "ENTREE":
            stock_item.quantite += movement.quantite
        elif movement.type_mouvement == "SORTIE":
            if movement.quantite > stock_item.quantite:
                movement.delete()
                return Response(
                    {"detail": "Quantité insuffisante en stock."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            stock_item.quantite -= movement.quantite

        stock_item.save()
        return Response(
            StockMovementSerializer(movement).data,
            status=status.HTTP_201_CREATED,
        )


class MedicamentImportAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if openpyxl is None:
            return Response(
                {"detail": "openpyxl is required. Install it with: pip install openpyxl"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        upload = request.FILES.get("file") or request.FILES.get("excel")
        if not upload:
            return Response(
                {"detail": "Aucun fichier fourni (champ attendu: file)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            wb = openpyxl.load_workbook(upload, data_only=True)
        except Exception as exc:  # pragma: no cover
            return Response(
                {"detail": f"Fichier Excel invalide: {exc}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = 0
        updated = 0
        skipped = 0
        processed = 0
        errors = []
        update_existing = str(request.data.get("mode", "")).lower() == "update"

        for sheet in wb.worksheets:
            rows = list(sheet.iter_rows(values_only=True))
            if not rows:
                continue

            # Always skip the first row (header)
            for row_idx, row in enumerate(rows[1:], start=2):
                try:
                    value = row[0] if row else None
                    if value in (None, ""):
                        skipped += 1
                        continue

                    nom = " ".join(str(value).strip().split())
                    nom = unicodedata.normalize("NFC", nom)
                    if not nom:
                        skipped += 1
                        continue

                    processed += 1
                    existing = (
                        StockItem.objects.filter(type_article="MEDICAMENT")
                        .filter(nom__iexact=nom)
                        .first()
                    )

                    if existing and not update_existing:
                        skipped += 1
                        continue

                    payload = {
                        "nom": nom,
                        "type_article": "MEDICAMENT",
                        "libelle": None,
                        "forme": None,
                        "dosage": None,
                        "categorie": "Général",
                        "unite": "unité",
                        "description": None,
                        "date_expiration": None,
                        "quantite": 0,
                        "seuil_critique": 5,
                        "actif": True,
                    }

                    if existing:
                        for field, val in payload.items():
                            if val is not None and getattr(existing, field, None) in (None, ""):
                                setattr(existing, field, val)
                        existing.save()
                        updated += 1
                    else:
                        StockItem.objects.create(**payload)
                        created += 1
                except Exception as exc:  # pragma: no cover
                    errors.append({"row": row_idx, "value": value, "error": str(exc)})

        return Response(
            {
                "inserted_count": created,
                "updated_count": updated,
                "skipped_count": skipped,
                "processed_count": processed,
                "error_count": len(errors),
                "errors": errors,
            },
            status=status.HTTP_200_OK,
        )


class CertificatMedicalPdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        cert = get_object_or_404(
            CertificatMedical.objects.select_related("collaborateur", "created_by"),
            pk=pk,
        )

        collab = cert.collaborateur

        medecin_nom = "Docteur"
        if request.user and request.user.is_authenticated:
            full_name = (request.user.get_full_name() or "").strip()
            medecin_nom = full_name if full_name else (request.user.username or "Docteur")
        elif getattr(cert, "created_by", None):
            full_name = (cert.created_by.get_full_name() or "").strip()
            medecin_nom = full_name if full_name else (cert.created_by.username or "Docteur")

        collaborateur_nom_complet = f"{getattr(collab, 'nom', '')} {getattr(collab, 'prenom', '')}".strip()

        context = {
            "date_du_jour": cert.date.strftime("%d/%m/%Y")
            if getattr(cert, "date", None)
            else timezone.now().strftime("%d/%m/%Y"),

            "medecin_nom": medecin_nom,
            "collaborateur_nom_complet": collaborateur_nom_complet,
            "nb_jours": getattr(cert, "nb_jours_repos", "") or "",
            "date_debut_repos": cert.date_debut_repos.strftime("%d/%m/%Y")
            if getattr(cert, "date_debut_repos", None)
            else "",
            "arabic_medecine": shape_arabic("طبّ عــام"),
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
                {"detail": "Erreur génération PDF certificat."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response = HttpResponse(result.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="certificat_{collab.matricule}.pdf"'
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
