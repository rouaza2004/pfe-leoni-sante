import io
import os
from decimal import Decimal
from pathlib import Path

import arabic_reshaper
from bidi.algorithm import get_display
from django.conf import settings
from django.contrib.staticfiles import finders
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, A5, landscape
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


# ============================================================================
# Constantes PDF
# ============================================================================

LEONI_BLUE = colors.HexColor("#004080")
FOOTER_ADDRESS = "Zone Industrielle Route de Khnis - Monastir-Boite Postale N° 41 - Poste Gare Monastir-5097"
FOOTER_CONTACT = "Tel.: 73 508 100 / Fax: 73 508 101"
DEFAULT_A5_LEFT = 1.0 * cm
DEFAULT_A5_RIGHT_OFFSET = 1.0 * cm
DEFAULT_A4_MARGIN = 2.5 * cm


# ============================================================================
# Helpers prives
# ============================================================================

def _safe(value):
    return str(value or "")


def _fmt_date(value):
    return value.strftime("%d/%m/%Y") if value else ""


def _fmt_time(value):
    return value.strftime("%H:%M") if value else ""


def _fmt_money(value):
    if value in (None, ""):
        return ""
    if isinstance(value, Decimal):
        return f"{value:.2f}"
    return str(value)


def _shape_arabic(text: str) -> str:
    reshaped = arabic_reshaper.reshape(text)
    return get_display(reshaped)


def _register_arabic_font():
    try:
        pdfmetrics.getFont("Amiri")
        return
    except KeyError:
        pass

    font_path = finders.find("fonts/Amiri-Regular.ttf")
    if font_path:
        pdfmetrics.registerFont(TTFont("Amiri", font_path))


def _get_arabic_font_name():
    _register_arabic_font()
    return "Amiri" if "Amiri" in pdfmetrics.getRegisteredFontNames() else "Helvetica"


def _draw_wrapped_lines(
    pdf,
    text,
    x,
    y,
    max_width,
    line_height=14,
    font_name="Helvetica",
    font_size=10,
    max_lines=None,
):
    pdf.setFont(font_name, font_size)
    words = (_safe(text).strip() or "").split()
    if not words:
        return y

    lines = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if pdf.stringWidth(candidate, font_name, font_size) <= max_width:
            current = candidate
            continue
        if current:
            lines.append(current)
        current = word

    if current:
        lines.append(current)

    if max_lines is not None:
        lines = lines[:max_lines]

    for line in lines:
        pdf.drawString(x, y, line)
        y -= line_height
    return y


def _find_static_image(filename):
    static_path = Path(settings.BASE_DIR) / "static" / "images" / filename
    if static_path.exists():
        return str(static_path)

    for candidate in (f"images/{filename}", f"medical/{filename}", filename):
        resolved = finders.find(candidate)
        if resolved:
            return resolved
    return None


def _draw_footer_line(pdf, left, right, y, line_width=1.5):
    pdf.setLineWidth(line_width)
    pdf.line(left, y, right, y)


def _draw_footer_contact(pdf, center, y_address, y_contact):
    pdf.setFont("Times-Roman", 8)
    pdf.drawCentredString(center, y_address, FOOTER_ADDRESS)
    pdf.drawCentredString(center, y_contact, FOOTER_CONTACT)


def _draw_signature(pdf, x, y, text, align="right", font_name="Times-Bold", font_size=10):
    pdf.setFont(font_name, font_size)
    if align == "center":
        pdf.drawCentredString(x, y, text)
    elif align == "left":
        pdf.drawString(x, y, text)
    else:
        pdf.drawRightString(x, y, text)


def _draw_simple_field(pdf, x, y, label, value, label_font="Times-Roman", value_font="Times-Bold", size=11):
    pdf.setFont(label_font, size)
    pdf.drawString(x, y, label)
    pdf.setFont(value_font, size)
    pdf.drawString(x + 4.2 * cm, y, _safe(value))


def _draw_common_gmt_header(pdf, width, height, form_code, arabic_font_name):
    left = DEFAULT_A5_LEFT
    right = width - DEFAULT_A5_RIGHT_OFFSET
    center = width / 2

    y = height - 0.8 * cm
    pdf.setFont("Times-Roman", 9)
    pdf.drawString(left, y, "N° du Labo ....................")

    box_w, box_h = 2.8 * cm, 0.6 * cm
    pdf.setLineWidth(0.5)
    pdf.rect(right - box_w, y - 0.2 * cm, box_w, box_h, stroke=1, fill=0)
    pdf.setFont("Times-Roman", 8)
    pdf.drawCentredString(right - box_w / 2, y, form_code)

    y -= 0.8 * cm
    pdf.setFont("Times-Bold", 9)
    pdf.drawString(left, y, "Groupement de Médecine du Travail")
    pdf.setFont(arabic_font_name, 10)
    pdf.drawRightString(right, y, _shape_arabic("مجمع طب الشغل"))

    y -= 0.4 * cm
    pdf.setFont("Times-Roman", 9)
    pdf.drawString(left, y, "Du Gouvernorat de Monastir")
    pdf.setFont(arabic_font_name, 10)
    pdf.drawRightString(right, y, _shape_arabic("بولاية المنستير"))

    logo_path = _find_static_image("logo_gmt_monastir.png")
    y_logo = height - 1.8 * cm
    if logo_path and os.path.exists(logo_path):
        pdf.drawImage(
            logo_path,
            center - 1.2 * cm,
            y_logo - 0.2 * cm,
            width=2.4 * cm,
            height=1.4 * cm,
            mask="auto",
            preserveAspectRatio=True,
        )

    pdf.setFont("Times-Bold", 7)
    pdf.drawCentredString(center, y_logo - 0.8 * cm, "Certifié ISO 9001 : 2008")
    return left, right, center


def _draw_iso_logo_footer(pdf, left, center):
    logo_path = _find_static_image("tuv_cert.png")
    if logo_path and os.path.exists(logo_path):
        pdf.drawImage(
            logo_path,
            left,
            0.4 * cm,
            width=1.2 * cm,
            height=0.7 * cm,
            mask="auto",
            preserveAspectRatio=True,
        )
    _draw_footer_contact(pdf, center, 0.8 * cm, 0.4 * cm)


def _build_placeholder_pdf(title, obj, field_pairs):
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    x = DEFAULT_A4_MARGIN
    y = height - 2.5 * cm

    pdf.setFont("Times-Bold", 16)
    pdf.drawCentredString(width / 2, y, title)
    y -= 1.2 * cm

    pdf.setFont("Times-Roman", 11)
    for label, value in field_pairs:
        pdf.drawString(x, y, f"{label} : {_safe(value)}")
        y -= 0.8 * cm

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


# ============================================================================
# PDF Examens
# ============================================================================

def generate_lab_request_pdf(lab_req):
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A5)
    width, height = A5
    arabic_font = _get_arabic_font_name()
    left, right, center = _draw_common_gmt_header(pdf, width, height, "FR - VME - 06/02", arabic_font)

    pdf.setStrokeColor(LEONI_BLUE)
    pdf.setFillColor(LEONI_BLUE)

    pdf.setFont("Times-Bold", 12)
    pdf.drawRightString(right, height - 3.2 * cm, f"N° {getattr(lab_req, 'id', 0):06d}")

    y = height - 4.0 * cm
    pdf.setFont("Times-Bold", 14)
    pdf.drawCentredString(center, y, "DEMANDE D'EXAMENS DE LABORATOIRE")

    y -= 0.9 * cm
    pdf.setFont("Times-Roman", 10)
    pdf.drawString(left, y, "NOM ET PRÉNOM :")
    pdf.setFont("Times-Bold", 10)
    pdf.drawString(left + 3.2 * cm, y, _safe(getattr(lab_req, "nom_prenom", "")))

    pdf.setFont("Times-Roman", 10)
    pdf.drawString(right - 5.5 * cm, y, "ÂGE :")
    pdf.setFont("Times-Bold", 10)
    pdf.drawString(right - 4.5 * cm, y, _safe(getattr(lab_req, "age", "")))

    pdf.setFont("Times-Roman", 10)
    pdf.drawString(right - 3.2 * cm, y, "Mle :")
    pdf.setFont("Times-Bold", 10)
    pdf.drawString(right - 2.4 * cm, y, _safe(getattr(getattr(lab_req, "collaborateur", None), "matricule", "")))

    y -= 0.6 * cm
    pdf.setFont("Times-Bold", 10)
    pdf.drawString(left, y, "C.I.N :")
    pdf.drawString(left + 1.5 * cm, y, _safe(getattr(lab_req, "cin", "")))
    pdf.drawString(center + 0.5 * cm, y, "GSM :")
    pdf.drawString(center + 2.0 * cm, y, _safe(getattr(lab_req, "gsm", "")))

    y -= 0.6 * cm
    pdf.drawString(left, y, "ENTREPRISE :")
    pdf.drawString(left + 2.8 * cm, y, _safe(getattr(lab_req, "entreprise", "")) or "LEONI")

    y -= 0.6 * cm
    pdf.drawString(left, y, "POSTE DE TRAVAIL :")
    pdf.drawString(left + 4.0 * cm, y, _safe(getattr(lab_req, "poste_travail", "")))

    y -= 0.8 * cm
    pdf.drawString(left, y, "RENSEIGNEMENTS CLINIQUES :")
    pdf.setFont("Times-Bold", 9)
    pdf.drawString(left + 5.8 * cm, y, _safe(getattr(lab_req, "renseignements_cliniques", "")) or "Néant")

    y -= 0.8 * cm
    pdf.setFont("Times-Bold", 11)
    pdf.drawString(left, y, "EXAMENS DE LABORATOIRE :")
    pdf.setLineWidth(1)
    pdf.line(left, y - 1, left + 5.5 * cm, y - 1)

    y -= 0.8 * cm
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
        pdf.setLineWidth(0.8)
        pdf.rect(left + 0.5 * cm, y - 4, 12, 12, stroke=1, fill=0)
        if getattr(lab_req, key, False):
            pdf.setFont("Times-Bold", 11)
            pdf.drawString(left + 0.65 * cm, y - 2, "X")

        pdf.setFont("Times-Bold", 10)
        pdf.drawString(left + 1.2 * cm, y - 1, label)
        y -= 0.6 * cm

    y = 4.2 * cm
    pdf.setFont("Times-Bold", 9)
    pdf.drawString(left, y, "NB: Pour effectuer les analyses de laboratoire, vous devez vous présenter")
    y -= 0.4 * cm
    pdf.drawString(left + 0.5 * cm, y, "à jeun et avant 10h du matin.")

    y -= 1.0 * cm
    pdf.setFont(arabic_font, 16)
    pdf.drawCentredString(center, y, _shape_arabic("لإجراء التحاليل المخبرية يجب الحضور صائما و قبل الساعة 10 صباحا"))

    y = 2.4 * cm
    pdf.setFont("Times-Bold", 10)
    pdf.drawRightString(right, y, "DATE : ...............................................")
    pdf.drawString(right - 4.5 * cm, y + 2, _fmt_date(getattr(lab_req, "date", None)))
    y -= 0.7 * cm
    pdf.setFont("Times-Bold", 10)
    pdf.drawRightString(right, y, "CACHET ET SIGNATURE DU MÉDECIN DU TRAVAIL")

    _draw_footer_line(pdf, left, right, 1.2 * cm)
    _draw_iso_logo_footer(pdf, left, center)

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


def generate_complementary_exam_pdf(comp_req):
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A5)
    width, height = A5
    arabic_font = _get_arabic_font_name()
    left, right, center = _draw_common_gmt_header(pdf, width, height, "FR - VME - 03/03", arabic_font)

    pdf.setStrokeColor(LEONI_BLUE)
    pdf.setFillColor(LEONI_BLUE)

    pdf.setFont("Times-Bold", 12)
    pdf.drawRightString(right, height - 3.2 * cm, f"N°  {getattr(comp_req, 'id', 0):06d}")

    y = height - 4.0 * cm
    pdf.setFont("Times-Bold", 14)
    pdf.drawCentredString(center, y, "DEMANDE D'EXAMENS COMPLÉMENTAIRES")

    y -= 0.9 * cm
    emp = getattr(comp_req, "collaborateur", None)
    full_name = f"{getattr(emp, 'nom', '') or ''} {getattr(emp, 'prenom', '') or ''}".strip()

    pdf.setFont("Times-Roman", 10)
    pdf.drawString(left, y, "NOM ET PRENOM :")
    pdf.setFont("Times-Bold", 10)
    pdf.drawString(left + 3.2 * cm, y, _safe(comp_req.nom_prenom or full_name))

    pdf.setFont("Times-Roman", 10)
    pdf.drawString(right - 5.5 * cm, y, "AGE :")
    pdf.setFont("Times-Bold", 10)
    pdf.drawString(right - 4.5 * cm, y, _safe(comp_req.age))

    pdf.setFont("Times-Roman", 10)
    pdf.drawString(right - 3.2 * cm, y, "Mle :")
    pdf.setFont("Times-Bold", 10)
    pdf.drawString(right - 2.4 * cm, y, _safe(getattr(emp, "matricule", "")))

    y -= 0.8 * cm
    pdf.setFont("Times-Bold", 10)
    pdf.drawString(left, y, "ENTREPRISE :")
    pdf.drawString(left + 2.8 * cm, y, _safe(comp_req.entreprise))
    pdf.drawString(center + 0.5 * cm, y, "POSTE DE TRAVAIL :")
    pdf.drawString(center + 4.5 * cm, y, _safe(comp_req.poste_travail))

    y -= 0.8 * cm
    pdf.drawString(left, y, "RENSEIGNEMENTS CLINIQUES :")
    pdf.drawString(left + 5.8 * cm, y, _safe(comp_req.renseignements_cliniques) or "Néant")

    y -= 1.0 * cm
    pdf.setFont("Times-Bold", 11)
    pdf.drawString(left, y, "RENSEIGNEMENTS COMPLEMENTAIRES :")
    pdf.setLineWidth(1)
    pdf.line(left, y - 1, left + 7.5 * cm, y - 1)

    y -= 1.2 * cm
    exams = [
        ("visiotest", "VISIOTEST :"),
        ("audiogramme", "AUDIOGRAMME :"),
        ("ecg", "ECG"),
        ("efr", "EFR :"),
    ]

    for key, label in exams:
        pdf.setLineWidth(0.8)
        pdf.rect(left, y - 4, 16, 16, stroke=1, fill=0)
        if getattr(comp_req, key, False):
            pdf.setFont("Times-Bold", 14)
            pdf.drawString(left + 0.15 * cm, y - 2, "X")

        pdf.setFont("Times-Bold", 11)
        pdf.drawString(left + 0.8 * cm, y - 1, label)
        y -= 1.0 * cm

    y = 3 * cm
    pdf.setFont("Times-Bold", 10)
    pdf.drawRightString(right, y, "DATE : ...............................................")
    pdf.drawString(right - 4.5 * cm, y + 2, _fmt_date(getattr(comp_req, "date", None)))
    y -= 0.7 * cm
    pdf.drawRightString(right, y, "CACHET ET SIGNATURE DU MÉDECIN DU TRAVAIL")

    _draw_footer_line(pdf, left, right, 1.2 * cm)
    _draw_iso_logo_footer(pdf, left, center)

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


# ============================================================================
# PDF Aptitude
# ============================================================================

def generate_aptitude_fiche_pdf(fiche):
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=landscape(A4))
    width, height = landscape(A4)

    left = 1.5 * cm
    right = width - 1.5 * cm
    center = width / 2

    pdf.setStrokeColor(LEONI_BLUE)
    pdf.setFillColor(LEONI_BLUE)

    y_header = height - 1.2 * cm
    logo_left = _find_static_image("tuv_cert.png")
    if logo_left and os.path.exists(logo_left):
        pdf.drawImage(logo_left, left, y_header - 1.0 * cm, width=2.4 * cm, height=1.4 * cm, mask="auto", preserveAspectRatio=True)

    logo_right = _find_static_image("logo_gmt_monastir.png")
    if logo_right and os.path.exists(logo_right):
        pdf.drawImage(
            logo_right,
            right - 2.4 * cm,
            y_header - 1.0 * cm,
            width=2.4 * cm,
            height=1.4 * cm,
            mask="auto",
            preserveAspectRatio=True,
        )

    pdf.setFont("Times-Bold", 12)
    pdf.drawCentredString(center, y_header, "Groupement de Médecine")
    pdf.drawCentredString(center, y_header - 0.4 * cm, "du travail de Monastir")
    pdf.setFont("Times-Bold", 9)
    pdf.drawCentredString(center, y_header - 0.8 * cm, "Tél.: 73 508 100  Fax: 73 508 101")
    pdf.drawCentredString(center, y_header - 1.2 * cm, "Certifié ISO 9001:2008")

    box_w, box_h = 2.8 * cm, 1.2 * cm
    pdf.setLineWidth(0.5)
    pdf.rect(right - 0.5 * cm, height - 1.5 * cm, box_w, box_h, stroke=1, fill=0)
    pdf.setFont("Times-Bold", 8)
    pdf.drawCentredString(right + 0.9 * cm, height - 0.6 * cm, "FR - VME 15/01")
    matricule = _safe(getattr(getattr(fiche, "collaborateur", None), "matricule", ""))
    pdf.drawString(right - 0.4 * cm, height - 1.3 * cm, f"Mle {matricule or '.......'}")

    y = height - 3.5 * cm
    pdf.setFont("Times-Bold", 14)
    pdf.drawCentredString(center, y, "FICHE D'APTITUDE AU TRAVAIL")
    y -= 0.6 * cm

    pdf.setFont("Times-Bold", 8)
    disclaimer = (
        "En application des dispositions de l'article 11 du Décret n° 2000-1985 du 12 septembre 2000 "
        "portant organisation et du fonctionnement des services de médecine du travail"
    )
    pdf.drawCentredString(center, y, disclaimer)

    y -= 0.8 * cm
    pdf.setFont("Times-Bold", 11)
    pdf.drawString(left, y, "1- L'ENTREPRISE :")
    pdf.line(left, y - 1, left + 3.8 * cm, y - 1)
    pdf.setFont("Times-Bold", 9)

    y -= 0.6 * cm
    pdf.drawString(
        left + 0.5 * cm,
        y,
        "Raison sociale : ....................................................................................... Adresse : ...................................................................................",
    )
    pdf.drawString(left + 3.0 * cm, y, _safe(getattr(fiche, "entreprise", "")))
    pdf.drawString(center + 3.5 * cm, y, _safe(getattr(fiche, "adresse_entreprise", "")))

    y -= 0.5 * cm
    pdf.drawString(
        left + 0.5 * cm,
        y,
        "Nature d'activité : .................................................................................................................................................................................",
    )
    pdf.drawString(left + 3.2 * cm, y, _safe(getattr(fiche, "nature_activite", "")))

    y -= 0.8 * cm
    pdf.setFont("Times-Bold", 11)
    pdf.drawString(left, y, "2- LE TRAVAILLEUR :")
    pdf.line(left, y - 1, left + 4.2 * cm, y - 1)
    pdf.setFont("Times-Bold", 9)

    y -= 0.6 * cm
    pdf.drawString(
        left + 0.5 * cm,
        y,
        "Nom et Prénom : ..................................................................................... Date et lieu de naissance(Age) : ........................................",
    )
    pdf.drawString(left + 3.0 * cm, y, _safe(getattr(fiche, "nom_prenom", "")))
    pdf.drawString(center + 3.5 * cm, y, _safe(getattr(fiche, "date_lieu_naissance", "")))

    y -= 0.5 * cm
    pdf.drawString(
        left + 0.5 * cm,
        y,
        "Adresse : .......................................................................................................... N°CNSS : ............................................................................",
    )
    pdf.drawString(left + 2.0 * cm, y, _safe(getattr(fiche, "adresse_travailleur", "")))
    pdf.drawString(center + 3.2 * cm, y, _safe(getattr(fiche, "cnss_travailleur", "")))

    y -= 0.5 * cm
    pdf.drawString(
        left + 0.5 * cm,
        y,
        "Date de recrutement : ................................... Poste de travail : ................................... Qualifications professionnelles : .....................",
    )
    pdf.drawString(left + 4.0 * cm, y, _fmt_date(getattr(fiche, "date_recrutement", None)))
    pdf.drawString(center - 0.2 * cm, y, _safe(getattr(fiche, "poste_travail", "")))
    pdf.drawString(right - 4.5 * cm, y, _safe(getattr(fiche, "qualifications_professionnelles", "")))

    y -= 0.8 * cm
    pdf.setFont("Times-Bold", 11)
    pdf.drawString(left, y, "3- EXAMENS MÉDICAUX :")
    pdf.line(left, y - 1, left + 4.8 * cm, y - 1)

    y -= 0.8 * cm
    vtype_code = _safe(getattr(fiche, "type_examen", ""))
    types = [
        ("EMBAUCHE", "Embauche"),
        ("PERIODIQUE", "Périodique"),
        ("REPRISE", "Reprise"),
        ("SPONTANE", "Spontanée"),
    ]
    for i, (code, label) in enumerate(types):
        pdf.rect(center - 6.5 * cm + i * 4.5 * cm, y - 3, 22, 18, stroke=1, fill=0)
        if vtype_code == code:
            pdf.drawString(center - 6.35 * cm + i * 4.5 * cm, y + 2, "X")
        pdf.setFont("Times-Bold", 10)
        pdf.drawString(center - 5.5 * cm + i * 4.5 * cm, y + 2, label)

    y -= 1.0 * cm
    pdf.setFont("Times-Bold", 10)
    pdf.drawString(
        left + 0.5 * cm,
        y,
        "Je soussigné (e) : .................................................................... médecin du travail, certifie que le travailleur surnommé est:",
    )
    pdf.drawString(left + 3.5 * cm, y, _safe(getattr(fiche, "medecin_travail", "")) or "...................")

    y -= 0.8 * cm
    aptitude = _safe(getattr(fiche, "aptitude", ""))
    options = [
        ("APTE", "Apte au poste ( préciser le poste de travail, les EPI et les recommandations spécifiques si nécessaires ) : ........................................................................................................................................."),
        ("APTE_AMENAGEMENT", "Apte avec aménagement du poste ( à préciser) : ........................................................................................................................."),
        ("INAPTE_TEMPORAIRE", "Inapte temporaire au poste (préciser la période) : ..........................................................................................................................."),
        ("APTE_APRES_CHANGEMENT", "Apte après changement du poste(à préciser) : .........................................................................................................................."),
        ("INAPTE_DEFINITIF", "Inapte définitif à tout poste du travail dans l'entreprise :..........................................................................................................."),
    ]

    for code, label in options:
        pdf.rect(left + 1.0 * cm, y - 3, 14, 14, stroke=1, fill=0)
        if aptitude == code:
            pdf.drawString(left + 1.1 * cm, y, "X")
        pdf.setFont("Times-Bold", 9)
        pdf.drawString(left + 1.8 * cm, y, label)
        y -= 0.8 * cm

    y = 3.0 * cm
    pdf.setFont("Times-Bold", 9)
    pdf.drawString(left, y, "Ce certificat doit être conservé dans le dossier administratif de l'intéressé chez son employeur")
    pdf.setFont("Times-Bold", 11)
    pdf.drawRightString(right, y, "Date et Signature du médecin du travail")
    pdf.drawRightString(right, y - 0.7 * cm, f"Fait le {_fmt_date(getattr(fiche, 'date_examen', None) or getattr(fiche, 'date', None))}")

    _draw_footer_line(pdf, left, right, 1.2 * cm)
    _draw_footer_contact(pdf, center, 0.8 * cm, 0.4 * cm)

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


# ============================================================================
# PDF Consultations
# ============================================================================

def generate_medical_consultation_pdf(consultation):
    field_pairs = [
        ("Date", _fmt_date(getattr(consultation, "date", None))),
        ("Matricule", getattr(consultation, "matricule", "")),
        ("Nom", getattr(consultation, "nom", "")),
        ("Prenom", getattr(consultation, "prenom", "")),
        ("Avis", getattr(consultation, "avis_medecin_controleur", "")),
    ]
    return _build_placeholder_pdf("CONSULTATION MEDICALE", consultation, field_pairs)


# ============================================================================
# PDF Certificats
# ============================================================================

def generate_certificate_pdf(certificat):
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A5)
    width, height = A5
    collaborateur = certificat.collaborateur

    medecin = ""
    if certificat.created_by:
        medecin = f"{certificat.created_by.first_name or ''} {certificat.created_by.last_name or ''}".strip()
        medecin = medecin or certificat.created_by.username

    pdf.setFont("Times-Bold", 14)
    pdf.drawString(1.2 * cm, height - 2.0 * cm, "Medecine Generale")
    pdf.drawRightString(width - 1.2 * cm, height - 2.0 * cm, "طب عام")
    pdf.drawString(1.2 * cm, height - 4.2 * cm, f"Menzel Hayet, le {_fmt_date(certificat.date)}")
    pdf.drawCentredString(width / 2, height - 6.5 * cm, "CERTIFICAT MEDICAL")

    y = height - 9.2 * cm
    leading = 0.85 * cm
    full_name = f"{collaborateur.nom} {collaborateur.prenom}".strip()

    pdf.setFont("Times-Roman", 14)
    pdf.drawString(1.2 * cm, y, f"Je soussigne, Docteur {medecin or 'Docteur'}, certifie avoir")
    y -= leading
    pdf.drawString(1.2 * cm, y, f"examine ce jour le(la) nomme(e) {full_name}")
    y -= leading

    if certificat.nb_jours_repos:
        pdf.drawString(1.2 * cm, y, "et constate que son etat de sante necessite")
        y -= leading
        pdf.drawString(1.2 * cm, y, f"un arret de travail de {certificat.nb_jours_repos} jours")
        y -= leading
        pdf.drawString(1.2 * cm, y, f"a dater du {_fmt_date(certificat.date_debut_repos)}")
        y -= leading
    else:
        pdf.drawString(1.2 * cm, y, "et certifie qu'il/elle a ete examine(e) au service medical.")
        y -= leading

    if certificat.contenu:
        y -= 0.4 * cm
        pdf.setFont("Times-Roman", 11)
        _draw_wrapped_lines(pdf, f"Note: {certificat.contenu}", 1.2 * cm, y, width - 2.4 * cm, max_lines=5)

    pdf.setFont("Times-Bold", 10)
    pdf.drawCentredString(width - 3.5 * cm, 3.5 * cm, "Cachet et Signature du Medecin")

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


def generate_traitant_cert_pdf(certificat):
    field_pairs = [
        ("Date", _fmt_date(getattr(certificat, "date", None))),
        ("Collaborateur", getattr(getattr(certificat, "collaborateur", None), "matricule", "")),
        ("Contenu", getattr(certificat, "contenu", "")),
        ("Repos", getattr(certificat, "nb_jours_repos", "")),
    ]
    return _build_placeholder_pdf("CERTIFICAT MEDECIN TRAITANT", certificat, field_pairs)


# ============================================================================
# PDF Dossiers
# ============================================================================

def generate_fiche_medicale_pdf(fiche):
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    collab = fiche.collaborateur

    pdf.setFont("Helvetica-Bold", 24)
    pdf.drawString(2 * cm, height - 3 * cm, "LEONI")
    pdf.setFont("Helvetica-Bold", 16)
    pdf.setFillColor(colors.darkblue)
    pdf.drawString(2.5 * cm, height - 4 * cm, "HSEE")
    pdf.setFillColor(colors.black)

    pdf.setLineWidth(2)
    pdf.setStrokeColor(colors.gray)
    pdf.roundRect(width - 8 * cm, height - 4.5 * cm, 6 * cm, 3 * cm, 10, stroke=1, fill=0)

    main_y = height - 12 * cm
    pdf.roundRect(1.5 * cm, main_y, width - 3 * cm, 7 * cm, 15, stroke=1, fill=0)

    text_y = height - 6 * cm
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(2 * cm, text_y, f"Nom et prenom : {collab.nom} {collab.prenom}")
    pdf.drawString(2 * cm, text_y - 1.5 * cm, f"Date et lieu de naissance : {_fmt_date(fiche.date_naissance)} - {_safe(fiche.lieu_naissance)}")
    pdf.drawString(2 * cm, text_y - 3.0 * cm, f"Adresse : {_safe(fiche.adresse or collab.adresse)}")
    pdf.drawString(2 * cm, text_y - 4.5 * cm, f"Tel : {_safe(fiche.telephone or collab.telephone)}")

    site_name = getattr(getattr(collab, "site", None), "nom", "")
    pdf.drawString(2 * cm, text_y - 6.0 * cm, f"Site : {_safe(site_name)}")
    pdf.drawString(width / 2 + 1.0 * cm, text_y - 6.0 * cm, f"Poste : {_safe(collab.poste)}")

    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(1.5 * cm, main_y - 2 * cm, "INFORMATIONS ADMINISTRATIVES")
    pdf.setFont("Helvetica", 10)
    pdf.drawString(2.0 * cm, main_y - 3 * cm, f"Matricule : {_safe(collab.matricule)}")
    pdf.drawString(8.5 * cm, main_y - 3 * cm, f"CIN : {_safe(collab.cin)}")
    pdf.drawString(2.0 * cm, main_y - 4 * cm, f"Email : {_safe(collab.email)}")
    pdf.drawString(8.5 * cm, main_y - 4 * cm, f"Departement : {_safe(collab.departement)}")

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


def generate_dossier_medical_pdf(dossier):
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=landscape(A4))
    width, height = landscape(A4)
    collab = dossier.collaborateur
    left = 1.5 * cm
    right = width / 2 + 0.8 * cm
    y_left = height - 2.0 * cm
    y_right = height - 2.0 * cm

    pdf.setFont("Times-Bold", 16)
    pdf.drawString(left, y_left, "DOSSIER MEDICAL")
    pdf.drawRightString(width - 1.5 * cm, y_right, f"Mle : {_safe(collab.matricule)}")
    y_left -= 1.2 * cm
    y_right -= 1.2 * cm

    left_fields = [
        ("Collaborateur", f"{collab.nom} {collab.prenom}"),
        ("Site", getattr(getattr(collab, "site", None), "nom", "")),
        ("Date de naissance", _fmt_date(collab.date_naissance)),
        ("Adresse", collab.adresse),
        ("Telephone", collab.telephone),
        ("Poste", collab.poste),
        ("Departement", collab.departement),
        ("Entreprise", dossier.entreprise),
        ("Localite", dossier.localite),
        ("Date recrutement", _fmt_date(dossier.date_recrutement)),
    ]

    pdf.setFont("Times-Roman", 10)
    for label, value in left_fields:
        pdf.drawString(left, y_left, f"{label} : {_safe(value)}")
        y_left -= 0.65 * cm

    pdf.setFont("Times-Bold", 11)
    pdf.drawString(right, y_right, "Informations medicales")
    y_right -= 0.8 * cm
    pdf.setFont("Times-Roman", 10)
    for label, value in [
        ("Groupe sanguin", dossier.groupe_sanguin),
        ("Allergies", dossier.allergies),
        ("Traitements en cours", dossier.traitements_en_cours),
        ("Observations", dossier.observations),
        ("Statut", dossier.statut),
    ]:
        pdf.drawString(right, y_right, f"{label} : {_safe(value)}")
        y_right -= 0.75 * cm

    y_right -= 0.3 * cm
    pdf.setFont("Times-Bold", 11)
    pdf.drawString(right, y_right, "Historique synthetique")
    y_right -= 0.8 * cm
    pdf.setFont("Times-Roman", 10)
    pdf.drawString(right, y_right, f"Accidents du travail : {dossier.accidents.count()}")
    y_right -= 0.6 * cm
    pdf.drawString(right, y_right, f"Maladies professionnelles : {dossier.maladies_professionnelles.count()}")
    y_right -= 0.6 * cm
    pdf.drawString(right, y_right, f"Examens ulterieurs : {dossier.examens_ulterieurs.count()}")

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


# ============================================================================
# PDF Maladies
# ============================================================================

def generate_chronic_disease_pdf(maladie):
    field_pairs = [
        ("Nom maladie", getattr(maladie, "nom_maladie", "")),
        ("Collaborateur", getattr(getattr(getattr(maladie, "dossier", None), "collaborateur", None), "matricule", "")),
        ("Observations", getattr(maladie, "observations", "")),
    ]
    return _build_placeholder_pdf("FICHE MALADIE CHRONIQUE", maladie, field_pairs)


def generate_occupational_disease_pdf(maladie):
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    x_margin = DEFAULT_A4_MARGIN
    collab = maladie.dossier.collaborateur

    pdf.setFont("Times-Bold", 12)
    pdf.drawCentredString(width / 2, height - 2.0 * cm, "SOCIETE LEONI WIRING SYSTEMS TUNISIA SARL")
    pdf.drawCentredString(width / 2, height - 2.5 * cm, "Service Sante & Securite")
    pdf.setFont("Times-Bold", 16)
    pdf.drawCentredString(width / 2, height - 4.5 * cm, "FICHE DE MALADIE PROFESSIONNELLE")
    pdf.line(x_margin, height - 5.0 * cm, width - x_margin, height - 5.0 * cm)

    pdf.setFont("Times-Roman", 10)
    pdf.drawString(x_margin, height - 5.7 * cm, f"Date de decouverte : {_fmt_date(maladie.date_decouverte)}")
    pdf.drawRightString(width - 2.5 * cm, height - 5.7 * cm, f"Date de constat : {_fmt_date(maladie.date_constat)}")

    y = height - 6.8 * cm
    pdf.setFont("Times-Bold", 12)
    pdf.drawString(x_margin, y, "INFORMATIONS COLLABORATEUR")
    y -= 1.0 * cm

    for label, value in [
        ("Matricule LEONI", collab.matricule),
        ("Nom & prenom", f"{collab.nom} {collab.prenom}"),
        ("Poste actuel", collab.poste),
        ("Site", getattr(getattr(collab, "site", None), "nom", "")),
        ("Maladie", maladie.nom_maladie),
        ("Agent causal", maladie.agent_causal),
        ("Numero tableau", maladie.numero_tableau),
        ("Duree arret", maladie.duree_arret),
        ("IPP", maladie.ipp),
        ("Statut declaration", maladie.statut_declaration),
    ]:
        _draw_simple_field(pdf, x_margin, y, f"{label} :", value)
        y -= 0.7 * cm

    if maladie.observations:
        y -= 0.3 * cm
        pdf.setFont("Times-Bold", 11)
        pdf.drawString(x_margin, y, "Observations :")
        y -= 0.6 * cm
        _draw_wrapped_lines(pdf, maladie.observations, x_margin + 0.3 * cm, y, width - 2 * x_margin, max_lines=6)

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


# ============================================================================
# PDF Controle et Expertise
# ============================================================================

def generate_contre_visite_pdf(record):
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A5)
    width, height = A5

    pdf.setFont("Times-Bold", 14)
    pdf.drawCentredString(width / 2, height - 2.0 * cm, "Controle medical")

    x_labels = 2.0 * cm
    y = height - 4.0 * cm
    line_h = 0.9 * cm

    pdf.setFont("Times-Roman", 11)
    pdf.drawString(x_labels, y, f"Le : {_fmt_date(getattr(record, 'date', None))}")
    y -= line_h

    pdf.drawString(x_labels, y, "Matricule :")
    pdf.setFont("Times-Bold", 11)
    pdf.drawString(x_labels + 2.5 * cm, y, _safe(record.matricule))

    pdf.setFont("Times-Roman", 11)
    pdf.drawString(width / 2 + 0.3 * cm, y, "Segment :")
    pdf.setFont("Times-Bold", 11)
    pdf.drawString(width / 2 + 2.3 * cm, y, _safe(record.segment))
    y -= line_h

    pdf.setFont("Times-Roman", 11)
    pdf.drawString(x_labels, y, "Nom :")
    pdf.setFont("Times-Bold", 11)
    pdf.drawString(x_labels + 2.5 * cm, y, _safe(record.nom))
    y -= line_h

    pdf.setFont("Times-Roman", 11)
    pdf.drawString(x_labels, y, "Prenom :")
    pdf.setFont("Times-Bold", 11)
    pdf.drawString(x_labels + 2.5 * cm, y, _safe(record.prenom))
    y -= line_h

    pdf.setFont("Times-Roman", 11)
    pdf.drawString(x_labels, y, "Repos prescrit :")
    pdf.setFont("Times-Bold", 11)
    pdf.drawString(x_labels + 3.2 * cm, y, _safe(record.repos_prescrit))
    y -= 1.5 * cm

    pdf.setFont("Times-Roman", 11)
    pdf.drawString(x_labels, y, "Avis du medecin controleur :")
    y -= 0.8 * cm
    y = _draw_wrapped_lines(
        pdf,
        getattr(record, "avis_medecin_controleur", "") or "Aucun avis renseigne.",
        x_labels + 0.3 * cm,
        y,
        width - (2 * x_labels),
        line_height=14,
        font_name="Times-Bold",
        font_size=10,
        max_lines=6,
    )

    _draw_signature(pdf, width - 2.0 * cm, 4.5 * cm, "Cachet et signature")
    pdf.setLineWidth(0.5)
    pdf.line(1.5 * cm, 1.2 * cm, width - 1.5 * cm, 1.2 * cm)
    pdf.setFont("Times-Bold", 9)
    pdf.drawString(1.5 * cm, 0.8 * cm, "LEONI")
    pdf.drawRightString(width - 1.5 * cm, 0.8 * cm, "Service Medical")

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


def generate_expertise_pdf(record):
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    x_margin = DEFAULT_A4_MARGIN

    pdf.setFont("Times-Bold", 12)
    pdf.drawCentredString(width / 2, height - 2.0 * cm, "SOCIETE LEONI WIRING SYSTEMS TUNISIA SARL")
    pdf.setFont("Times-Roman", 11)
    pdf.drawRightString(width - 2.5 * cm, height - 3.5 * cm, f"Le : {_fmt_date(record.date)}")
    pdf.setFont("Times-Bold", 12)
    pdf.drawRightString(width - 2.5 * cm, height - 5.2 * cm, "DEMANDE D'EXPERTISE MEDICALE")

    y = height - 8.0 * cm
    pdf.setFont("Times-Roman", 11)
    pdf.drawString(x_margin, y, _safe(record.destinataire) or "Cher Confrere")
    y -= 1.0 * cm
    pdf.drawString(x_margin, y, "J'ai l'honneur de vous adresser pour expertise medicale :")
    y -= 1.1 * cm

    labels = [
        ("Nom :", record.nom),
        ("Prenom :", record.prenom),
        ("Matricule LEONI :", record.matricule_leoni),
    ]
    for label, value in labels:
        pdf.setFont("Times-Roman", 11)
        pdf.drawString(x_margin, y, label)
        pdf.setFont("Times-Bold", 11)
        pdf.drawString(x_margin + 4.2 * cm, y, _safe(value))
        y -= 0.7 * cm

    y -= 0.5 * cm
    pdf.setFont("Times-Bold", 12)
    pdf.drawString(x_margin, y, "Pieces jointes :")
    y -= 0.8 * cm
    y = _draw_wrapped_lines(
        pdf,
        record.pieces_jointes or ", ".join(record.attachment_names or []) or "Aucune piece jointe precisee.",
        x_margin + 0.4 * cm,
        y,
        width - 2 * x_margin,
        line_height=13,
        font_size=10,
        max_lines=4,
    )

    y -= 0.6 * cm
    pdf.setFont("Times-Bold", 12)
    pdf.drawString(x_margin, y, "Mission objet de l'expertise :")
    y -= 0.8 * cm

    mission_lines = [
        "Examiner l'interesse(e).",
        "Preciser si le repos prescrit est justifie par l'etat de sante actuel.",
        f"Aptitude au poste : {_safe(record.aptitude_poste)}" if record.aptitude_poste else "",
        f"Autres missions : {_safe(record.autres_missions)}" if record.autres_missions else "",
    ]
    for line in [item for item in mission_lines if item]:
        pdf.setFont("Times-Roman", 11)
        pdf.drawString(x_margin + 0.4 * cm, y, f"- {line}")
        y -= 0.7 * cm

    _draw_signature(pdf, width - 2.5 * cm, 3.0 * cm, "Cachet et signature")

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


# ============================================================================
# PDF Transport / orientation
# ============================================================================

def generate_voucher_pdf(voucher):
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A5)
    width, height = A5

    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(1 * cm, height - 1.5 * cm, "SERVICE MEDICAL")
    pdf.setFont("Helvetica", 9)
    pdf.drawString(1 * cm, height - 2 * cm, "LEONI")
    pdf.drawRightString(width - 1 * cm, height - 2 * cm, f"BON N° {_safe(voucher.numero_ordre)}")

    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawCentredString(width / 2, height - 3.5 * cm, "BON DE TRANSPORT / CONSULTATION")

    y = height - 5.0 * cm
    pdf.setFont("Helvetica", 10)
    pdf.drawString(1.5 * cm, y, f"Nom du malade : {_safe(voucher.nom_malade)}")
    pdf.drawString(width / 2 + 0.3 * cm, y, f"Matricule : {_safe(voucher.matricule)}")
    y -= 0.7 * cm
    pdf.drawString(1.5 * cm, y, f"Telephone : {_safe(voucher.telephone)}")
    pdf.drawString(width / 2 + 0.3 * cm, y, f"Date : {_fmt_date(voucher.date)}")
    y -= 0.7 * cm
    pdf.drawString(1.5 * cm, y, f"Heure : {_fmt_time(voucher.heure)}")
    pdf.drawString(width / 2 + 0.3 * cm, y, f"Chauffeur : {_safe(voucher.nom_chauffeur)}")
    y -= 0.7 * cm
    pdf.drawString(1.5 * cm, y, f"Hopital / Destination : {_safe(voucher.hopital)}")
    y -= 0.7 * cm
    pdf.drawString(1.5 * cm, y, f"Service / Plant : {_safe(voucher.service_plant)}")
    y -= 0.7 * cm
    pdf.drawString(1.5 * cm, y, f"Moyen de transport : {_safe(voucher.moyen_transport)}")
    y -= 0.7 * cm
    pdf.drawString(1.5 * cm, y, f"Accompagnant : {_safe(voucher.accompagnant)}")
    y -= 0.7 * cm
    pdf.drawString(1.5 * cm, y, f"Prime : {_fmt_money(voucher.montant_prime)}")
    y -= 1.0 * cm

    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(1.5 * cm, y, "Motif :")
    y -= 0.6 * cm
    _draw_wrapped_lines(pdf, voucher.motif, 1.7 * cm, y, width - 3.4 * cm, max_lines=5)

    pdf.setFont("Helvetica", 9)
    pdf.drawString(1.5 * cm, 2.0 * cm, f"Infirmier : {_safe(voucher.infirmier)}")
    pdf.drawRightString(width - 1.5 * cm, 2.0 * cm, f"Medecin : {_safe(voucher.medecin)}")

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


def generate_referral_pdf(referral):
    field_pairs = [
        ("Date", _fmt_date(getattr(referral, "date", None))),
        ("Destinataire", getattr(referral, "destinataire", "")),
        ("Nom", getattr(referral, "nom", "")),
        ("Prenom", getattr(referral, "prenom", "")),
        ("Matricule", getattr(referral, "matricule_leoni", "")),
    ]
    return _build_placeholder_pdf("LETTRE D'ORIENTATION", referral, field_pairs)


__all__ = [
    "generate_lab_request_pdf",
    "generate_complementary_exam_pdf",
    "generate_aptitude_fiche_pdf",
    "generate_contre_visite_pdf",
    "generate_expertise_pdf",
    "generate_medical_consultation_pdf",
    "generate_voucher_pdf",
    "generate_referral_pdf",
    "generate_certificate_pdf",
    "generate_traitant_cert_pdf",
    "generate_fiche_medicale_pdf",
    "generate_dossier_medical_pdf",
    "generate_chronic_disease_pdf",
    "generate_occupational_disease_pdf",
]
