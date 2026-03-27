from pathlib import Path
from io import BytesIO
import base64
import os
import tempfile
import random
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
from reportlab.lib.pagesizes import A4
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
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Collaborateur, Site

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
    FicheAptitude,
    DemandeExamenLabo,
    ExamenComplementaire,
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
    FicheAptitudeSerializer,
    DemandeExamenLaboSerializer,
    ExamenComplementaireSerializer,
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

    def get(self, request, pk):
        fiche = get_object_or_404(FicheAptitude, pk=pk)

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = (
            f'inline; filename="fiche_aptitude_{fiche.collaborateur.matricule}.pdf"'
        )

        p = canvas.Canvas(response, pagesize=A4)
        width, height = A4

        margin = 1.2 * cm
        content_width = width - (2 * margin)

        def safe(value, fallback="-"):
            return value if value not in [None, ""] else fallback

        def draw_text(x, y, text, size=10, bold=False):
            p.setFillColor(colors.black)
            p.setFont("Helvetica-Bold" if bold else "Helvetica", size)
            p.drawString(x, y, str(text or ""))

        def draw_box(x, y_top, w, h, title=None):
            p.setLineWidth(1)
            p.rect(x, y_top - h, w, h)
            if title:
                draw_text(x + 0.25 * cm, y_top - 0.45 * cm, title, 11, True)

        def draw_checkbox(x, y, label, checked=False):
            size = 0.42 * cm
            p.rect(x, y - size + 2, size, size)

            if checked:
                p.setFont("Helvetica-Bold", 10)
                p.drawCentredString(x + size / 2, y - 1, "X")

            p.setFont("Helvetica", 9)
            p.drawString(x + 0.62 * cm, y, label)

        def wrap_lines(text, font_name="Helvetica", font_size=8, max_width=180):
            words = str(text or "-").split()
            lines = []
            current = ""

            for word in words:
                test = f"{current} {word}".strip()
                if p.stringWidth(test, font_name, font_size) <= max_width:
                    current = test
                else:
                    if current:
                        lines.append(current)
                    current = word

            if current:
                lines.append(current)

            return lines if lines else ["-"]

        def draw_field(x, y, label, value, value_x, max_width, size=8.5, max_lines=1):
            draw_text(x, y, f"{label} :", 8.5, True)
            lines = wrap_lines(value, "Helvetica", size, max_width)

            yy = y
            for line in lines[:max_lines]:
                draw_text(value_x, yy, line, size, False)
                yy -= 0.38 * cm

            return yy

        y = height - margin

        p.setLineWidth(1)
        p.rect(margin, margin, width - 2 * margin, height - 2 * margin)

        logo_path = Path(settings.BASE_DIR) / "static" / "images" / "logo_gmt_monastir.png"

        draw_text(margin + 0.1 * cm, y - 0.35 * cm, "Groupement de Médecine", 14, True)
        draw_text(margin + 0.9 * cm, y - 0.9 * cm, "du travail de Monastir", 14, True)
        draw_text(margin + 0.25 * cm, y - 1.45 * cm, "Tél.: 73 508 100 Fax: 73 508 101", 9, True)

        cert_x = margin + 0.4 * cm
        cert_y = y - 2.7 * cm
        p.rect(cert_x, cert_y, 1.8 * cm, 1.2 * cm)
        draw_text(cert_x + 0.35 * cm, cert_y + 0.62 * cm, "CERT", 11, True)
        draw_text(cert_x + 0.25 * cm, cert_y + 0.2 * cm, "ISO 9001", 7, True)

        if logo_path.exists():
            logo = ImageReader(str(logo_path))
            p.drawImage(
                logo,
                (width / 2) - 1.0 * cm,
                y - 2.2 * cm,
                width=2.0 * cm,
                height=1.4 * cm,
                preserveAspectRatio=True,
                mask="auto",
            )

        box_x = width - margin - 2.7 * cm
        box_y = y - 2.55 * cm
        p.rect(box_x, box_y, 2.4 * cm, 1.55 * cm)
        p.line(box_x, box_y + 0.75 * cm, box_x + 2.4 * cm, box_y + 0.75 * cm)
        draw_text(box_x + 0.28 * cm, box_y + 0.95 * cm, "FR - VME 15/01", 11, True)
        draw_text(box_x + 0.1 * cm, box_y + 0.12 * cm, "M", 12, True)
        draw_text(box_x + 0.42 * cm, box_y + 0.18 * cm, "le", 8, False)

        draw_text(width / 2 - 4.1 * cm, y - 3.45 * cm, "FICHE D’APTITUDE AU TRAVAIL", 18, True)

        p.setFont("Helvetica-Bold", 8.5)
        p.drawCentredString(
            width / 2,
            y - 3.95 * cm,
            "En application des dispositions de l’article 11 du Décret n° 2000-1985 du 12 septembre 2000"
        )
        p.drawCentredString(
            width / 2,
            y - 4.3 * cm,
            "portant organisation et du fonctionnement des services de médecine du travail"
        )

        p.line(margin, y - 4.7 * cm, width - margin, y - 4.7 * cm)
        y -= 5.0 * cm

        left_label_x = margin + 0.2 * cm
        left_value_x = margin + 3.0 * cm

        right_label_x = margin + 8.8 * cm
        right_value_x = margin + 11.5 * cm

        entreprise_h = 2.8 * cm
        draw_box(margin, y, content_width, entreprise_h, "1. L’ENTREPRISE")

        yy = y - 0.95 * cm

        draw_field(left_label_x, yy, "Raison sociale", fiche.entreprise, left_value_x, 4.0 * cm, max_lines=1)
        draw_field(right_label_x, yy, "Adresse", fiche.adresse_entreprise, right_value_x, 3.0 * cm, max_lines=2)

        yy -= 0.7 * cm

        draw_field(left_label_x, yy, "Nature d’activité", fiche.nature_activite, left_value_x, 4.0 * cm, max_lines=1)
        draw_field(right_label_x, yy, "N° CNSS", fiche.numero_cnss, right_value_x, 3.0 * cm, max_lines=1)

        y -= entreprise_h + 0.25 * cm
        travailleur_h = 4.6 * cm
        draw_box(margin, y, content_width, travailleur_h, "2. LE TRAVAILLEUR")

        yy = y - 0.95 * cm

        draw_field(left_label_x, yy, "Nom et prénom", fiche.nom_prenom, left_value_x, 4.0 * cm, max_lines=1)
        draw_field(right_label_x, yy, "Date et lieu naissance", fiche.date_lieu_naissance, right_value_x, 3.0 * cm, max_lines=1)

        yy -= 0.75 * cm

        draw_field(left_label_x, yy, "Adresse", fiche.adresse_travailleur, left_value_x, 4.0 * cm, max_lines=2)
        draw_field(right_label_x, yy, "Qualifications", fiche.qualifications_professionnelles, right_value_x, 3.0 * cm, max_lines=2)

        yy -= 1.0 * cm

        draw_field(left_label_x, yy, "N° CNSS", fiche.cnss_travailleur, left_value_x, 4.0 * cm, max_lines=1)
        draw_field(right_label_x, yy, "Poste de travail", fiche.poste_travail, right_value_x, 3.0 * cm, max_lines=2)

        yy -= 0.75 * cm

        date_recrutement = fiche.date_recrutement.strftime("%d/%m/%Y") if fiche.date_recrutement else "-"
        draw_field(left_label_x, yy, "Date de recrutement", date_recrutement, left_value_x, 4.0 * cm, max_lines=1)

        y -= travailleur_h + 0.25 * cm
        examens_h = 1.9 * cm
        draw_box(margin, y, content_width, examens_h, "3. EXAMENS MÉDICAUX")

        cy = y - 1.05 * cm
        draw_checkbox(margin + 0.30 * cm, cy, "Embauche", fiche.type_examen == "EMBAUCHE")
        draw_checkbox(margin + 3.80 * cm, cy, "Périodique", fiche.type_examen == "PERIODIQUE")
        draw_checkbox(margin + 7.60 * cm, cy, "Reprise", fiche.type_examen == "REPRISE")
        draw_checkbox(margin + 10.70 * cm, cy, "Spontané", fiche.type_examen == "SPONTANE")

        y -= examens_h + 0.25 * cm
        decision_h = 6.7 * cm
        draw_box(margin, y, content_width, decision_h, "4. DÉCISION MÉDICALE")

        recommandations = safe(fiche.recommandations, "")
        text_x = margin + 4.0 * cm

        rows = [
            ("Apte au poste", fiche.aptitude == "APTE"),
            ("Apte avec aménagement du poste", fiche.aptitude == "APTE_AMENAGEMENT"),
            ("Inapte temporaire au poste", fiche.aptitude == "INAPTE_TEMPORAIRE"),
            ("Apte après changement du poste", fiche.aptitude == "APTE_APRES_CHANGEMENT"),
            ("Inapte définitif", fiche.aptitude == "INAPTE_DEFINITIF"),
        ]

        row_y = y - 0.95 * cm
        for label, checked in rows:
            draw_checkbox(margin + 0.30 * cm, row_y, label, checked)

            if checked:
                lines = wrap_lines(recommandations, "Helvetica", 8, 245)
                txt_y = row_y
                for line in lines[:2]:
                    draw_text(text_x, txt_y, line, 8, False)
                    txt_y -= 0.34 * cm

            row_y -= 0.9 * cm

        footer_y = margin + 2.0 * cm
        pdf_date = fiche.date.strftime("%d/%m/%Y") if fiche.date else "-"

        draw_text(margin + 0.25 * cm, footer_y, f"Date : {pdf_date}", 10, False)
        draw_text(width - 5.5 * cm, footer_y + 0.1 * cm, "Médecin du travail", 10, True)
        draw_text(width - 5.5 * cm, footer_y - 0.95 * cm, "Signature et cachet", 9, False)
        p.rect(width - 5.7 * cm, footer_y - 1.7 * cm, 4.5 * cm, 1.6 * cm)

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


class AccidentListCreateView(generics.ListCreateAPIView):
    serializer_class = AccidentTravailSerializer
    permission_classes = [IsAuthenticated]
    queryset = AccidentTravail.objects.select_related("dossier__collaborateur").all().order_by(
        "-date_accident", "-id"
    )


class AccidentDetailView(generics.RetrieveDestroyAPIView):
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


class MaladieCreateView(generics.CreateAPIView):
    serializer_class = MaladieProfessionnelleSerializer
    permission_classes = [IsAuthenticated]
    queryset = MaladieProfessionnelle.objects.all()


class MaladieDeleteView(generics.DestroyAPIView):
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
