import os
import traceback
from io import BytesIO
from pathlib import Path
from urllib.request import urlretrieve

import arabic_reshaper
from bidi.algorithm import get_display
from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader, PdfWriter
from reportlab.lib.colors import Color, HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ARABIC_TEXT = "مجمع طب الشغل بولاية المنستير"
FRENCH_TEXT = "GMT Monastir"
GMT_LOGO_PATH = "gmt_logo.png"
GMT_ARABIC_FONT = "/usr/share/fonts/truetype/freefont/FreeSerif.ttf"
HEADER_COLOR = (0, 0, 128)
HEADER_H = 90


def _try_register_font(font_path: Path, font_name: str) -> bool:
    try:
        pdfmetrics.registerFont(TTFont(font_name, str(font_path)))
        return True
    except Exception:
        return False


def resolve_arabic_font() -> str:
    env_path = os.environ.get("ARABIC_FONT_PATH")
    if env_path and Path(env_path).exists():
        if _try_register_font(Path(env_path), "ArabicFont"):
            return "ArabicFont"

    candidates = [
        Path("NotoNaskhArabic-Regular.ttf"),
        Path("NotoNaskhArabic-Regular.ttf").resolve(),
        Path("fonts/NotoNaskhArabic-Regular.ttf"),
        Path("font/NotoNaskhArabic-Regular.ttf"),
        Path("assets/NotoNaskhArabic-Regular.ttf"),
        Path(r"C:\Windows\Fonts\NotoNaskhArabic-Regular.ttf"),
        Path(r"C:\Windows\Fonts\Arial.ttf"),
        Path(r"C:\Windows\Fonts\arial.ttf"),
    ]

    for path in candidates:
        if path.exists() and _try_register_font(path, "ArabicFont"):
            return "ArabicFont"

    ttf_url = (
        "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/"
        "NotoNaskhArabic/NotoNaskhArabic-Regular.ttf"
    )
    dest = Path("NotoNaskhArabic-Regular.ttf")
    try:
        print("Téléchargement de la police arabe (NotoNaskhArabic) ...")
        urlretrieve(ttf_url, dest)
        if dest.exists() and _try_register_font(dest, "ArabicFont"):
            return "ArabicFont"
    except Exception:
        pass

    print("⚠️  Police arabe introuvable. Installez une police TTF arabe et définissez ARABIC_FONT_PATH.")
    return "Helvetica"


def _reportlab_color(rgb):
    return Color(rgb[0] / 255.0, rgb[1] / 255.0, rgb[2] / 255.0)


def _make_arabic_image(text, font_size=11, width=300):
    reshaped = arabic_reshaper.reshape(text)
    bidi_text = get_display(reshaped)

    font = None
    if os.path.exists(GMT_ARABIC_FONT):
        try:
            font = ImageFont.truetype(GMT_ARABIC_FONT, font_size)
        except Exception:
            font = None
    if font is None:
        font = ImageFont.load_default()

    dummy = Image.new("RGBA", (width, 1), (0, 0, 0, 0))
    draw = ImageDraw.Draw(dummy)
    text_bbox = draw.textbbox((0, 0), bidi_text, font=font)
    text_w = text_bbox[2] - text_bbox[0]
    text_h = text_bbox[3] - text_bbox[1]
    height = max(text_h + 6, font_size + 6)

    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    x = max(width - text_w - 2, 0)
    draw.text((x, 2), bidi_text, font=font, fill=HEADER_COLOR)

    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf, (width, height)


def _register_arabic_font_for_reportlab():
    if os.path.exists(GMT_ARABIC_FONT):
        try:
            pdfmetrics.registerFont(TTFont("FreeSerif", GMT_ARABIC_FONT))
            return "FreeSerif"
        except Exception:
            pass
    return "Helvetica"


def create_generic_header_overlay(page_width, page_height, logo_path, font_name):
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=(page_width, page_height))

    try:
        logo_reader = ImageReader(logo_path)
        max_w, max_h = 120, 60
        iw, ih = logo_reader.getSize()
        scale = min(max_w / iw, max_h / ih)
        draw_w, draw_h = iw * scale, ih * scale
        c.drawImage(logo_reader, 20, page_height - 70, width=draw_w, height=draw_h, mask="auto")
    except Exception:
        print(f"⚠️  Logo introuvable ou illisible: {logo_path}")

    c.setStrokeColor(HexColor("#1a1a2e"))
    c.setLineWidth(0.8)
    c.line(20, page_height - 75, page_width - 20, page_height - 75)

    reshaped = arabic_reshaper.reshape(ARABIC_TEXT)
    bidi_text = get_display(reshaped)
    c.setFillColor(HexColor("#1a1a2e"))
    c.setFont(font_name, 15)
    x_right = page_width - 20
    y_top = page_height - 40
    c.drawRightString(x_right, y_top, bidi_text)
    c.setFont("Helvetica", 10)
    c.drawRightString(x_right, y_top - 16, FRENCH_TEXT)

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.getvalue()


def add_generic_header_to_pdf(input_path, output_path, logo_path, font_name):
    try:
        reader = PdfReader(str(input_path))
        if reader.is_encrypted:
            try:
                reader.decrypt("")
            except Exception:
                print(f"⚠️  PDF protégé, ignoré: {input_path}")
                return False
    except Exception:
        print(f"⚠️  PDF corrompu ou illisible, ignoré: {input_path}")
        return False

    writer = PdfWriter()
    for page in reader.pages:
        mediabox = page.mediabox
        overlay_bytes = create_generic_header_overlay(float(mediabox.width), float(mediabox.height), logo_path, font_name)
        overlay_page = PdfReader(BytesIO(overlay_bytes)).pages[0]
        page.merge_page(overlay_page)
        writer.add_page(page)

    with open(output_path, "wb") as handle:
        writer.write(handle)
    return True


def process_generic_header_folder(input_folder, output_folder, logo_path, font_name):
    input_folder = Path(input_folder)
    output_folder = Path(output_folder)
    output_folder.mkdir(parents=True, exist_ok=True)

    pdf_files = sorted(input_folder.glob("*.pdf"))
    if not pdf_files:
        print(f"⚠️  Aucun PDF trouvé dans {input_folder}")
        return

    for idx, pdf_path in enumerate(pdf_files, start=1):
        out_path = output_folder / pdf_path.name
        print(f"[{idx}/{len(pdf_files)}] Traitement: {pdf_path.name}")
        try:
            ok = add_generic_header_to_pdf(pdf_path, out_path, logo_path, font_name)
            if ok:
                print(f"   ✅ OK -> {out_path.name}")
        except Exception:
            print(f"   ⚠️  Erreur lors du traitement: {pdf_path.name}")
            traceback.print_exc(limit=1)


def create_gmt_header_overlay(page_width, page_height):
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=(page_width, page_height))
    blue = _reportlab_color(HEADER_COLOR)
    c.setStrokeColor(blue)
    c.setFillColor(blue)

    margin_x = 28
    top_y = page_height - 22
    header_width = page_width - 2 * margin_x
    col_w = header_width / 3.0
    left_x = margin_x
    center_x = margin_x + col_w
    right_x = margin_x + 2 * col_w

    c.setFont("Helvetica-Bold", 9)
    c.drawString(left_x, top_y - 6, "Groupement de Médecine")
    c.drawString(left_x, top_y - 18, "du travail de Monastir")
    c.setFont("Helvetica-Bold", 7.2)
    c.drawString(left_x, top_y - 30, "Tél.: 73 508 100 Fax: 73 508 101")

    cert_x = left_x
    cert_y = top_y - 70
    cert_w = 62
    cert_h = 36
    c.setLineWidth(0.9)
    c.rect(cert_x, cert_y, cert_w, cert_h, stroke=1, fill=0)
    c.setFont("Helvetica", 5.8)
    c.drawCentredString(cert_x + cert_w / 2, cert_y + 24, "TÜV Rheinland®")
    c.setFont("Helvetica-Bold", 7)
    c.drawCentredString(cert_x + cert_w / 2, cert_y + 13, "CERT")
    c.setFont("Helvetica", 5.8)
    c.drawCentredString(cert_x + cert_w / 2, cert_y + 5, "ISO 9001")

    logo_path = Path(GMT_LOGO_PATH)
    if logo_path.exists():
        try:
            logo = ImageReader(str(logo_path))
            iw, ih = logo.getSize()
            max_w, max_h = 95, 42
            scale = min(max_w / iw, max_h / ih)
            lw, lh = iw * scale, ih * scale
            c.drawImage(logo, center_x + (col_w - lw) / 2, top_y - 46, width=lw, height=lh, mask="auto")
        except Exception:
            pass

    arabic_img, (_, ah) = _make_arabic_image(ARABIC_TEXT, font_size=11, width=int(col_w))
    c.drawImage(ImageReader(arabic_img), center_x, top_y - 62, width=col_w, height=ah, mask="auto")
    c.setFont("Helvetica-Bold", 8.2)
    c.drawCentredString(center_x + col_w / 2, top_y - 70, "G.M.T MONASTIR")
    c.setFont("Helvetica", 6.4)
    c.drawCentredString(center_x + col_w / 2, top_y - 80, "Certifié ISO 9001:2008")

    box_w = 86
    box_h = 30
    box_x = right_x + col_w - box_w
    box_y = top_y - 34
    c.setLineWidth(0.9)
    c.rect(box_x, box_y, box_w, box_h, stroke=1, fill=0)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(box_x + box_w / 2, box_y + 18, "FR - VME 15/01")
    c.setFont("Helvetica", 8)
    c.drawCentredString(box_x + box_w / 2, box_y + 6, "Mle .............")

    title_y = top_y - 64
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(page_width / 2, title_y, "FICHE D'APTITUDE AU TRAVAIL")
    c.setFont("Helvetica", 6.5)
    c.drawCentredString(page_width / 2, title_y - 9, "En application des dispositions de l'article 11 du Décret n° 2000-1985 du 12 septembre 2000")
    c.drawCentredString(page_width / 2, title_y - 17, "portant organisation et du fonctionnement des services de médecine du travail")

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.getvalue()


def add_gmt_header_to_pdf(input_path, output_path):
    try:
        reader = PdfReader(str(input_path))
        if reader.is_encrypted:
            try:
                reader.decrypt("")
            except Exception:
                print(f"⚠️  PDF protégé, ignoré: {input_path}")
                return False
    except Exception:
        print(f"⚠️  PDF illisible/corrompu, ignoré: {input_path}")
        return False

    writer = PdfWriter()
    for page in reader.pages:
        overlay_bytes = create_gmt_header_overlay(float(page.mediabox.width), float(page.mediabox.height))
        overlay_page = PdfReader(BytesIO(overlay_bytes)).pages[0]
        page.merge_page(overlay_page)
        writer.add_page(page)

    with open(output_path, "wb") as handle:
        writer.write(handle)
    return True


def process_gmt_header_folder(input_folder, output_folder):
    input_folder = Path(input_folder)
    output_folder = Path(output_folder)
    output_folder.mkdir(parents=True, exist_ok=True)

    pdfs = sorted(input_folder.glob("*.pdf"))
    if not pdfs:
        print(f"⚠️  Aucun PDF trouvé dans {input_folder}")
        return

    ok_count = 0
    for index, pdf_path in enumerate(pdfs, start=1):
        print(f"[{index}/{len(pdfs)}] {pdf_path.name}")
        try:
            out_path = output_folder / pdf_path.name
            if add_gmt_header_to_pdf(pdf_path, out_path):
                ok_count += 1
                print(f"   ✅ OK -> {out_path.name}")
        except Exception:
            print(f"   ⚠️  Erreur sur {pdf_path.name}")
            traceback.print_exc(limit=1)
    print(f"Résumé: {ok_count}/{len(pdfs)} fichiers traités.")


def generate_gmt_test_pdf():
    base_pdf = "test_header_base.pdf"
    out_pdf = "test_header_gmt.pdf"
    c = canvas.Canvas(base_pdf, pagesize=(595, 842))
    c.setFont("Helvetica", 10)
    c.drawString(40, 700, "1 - L'ENTREPRISE : ..................................................")
    c.drawString(40, 670, "2 - LE TRAVAILLEUR : ................................................")
    c.drawString(40, 640, "3 - EXAMENS MEDICAUX : .............................................")
    c.showPage()
    c.save()
    add_gmt_header_to_pdf(base_pdf, out_pdf)
    return out_pdf

