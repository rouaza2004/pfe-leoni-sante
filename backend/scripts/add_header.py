from pathlib import Path

from backend.medical.pdf_headers import (
    ARABIC_TEXT,
    FRENCH_TEXT,
    add_generic_header_to_pdf,
    create_generic_header_overlay,
    process_generic_header_folder,
    resolve_arabic_font,
)


create_header_overlay = create_generic_header_overlay
add_header_to_pdf = add_generic_header_to_pdf
process_folder = process_generic_header_folder


def main():
    logo_path = Path("logo_gmt.png")
    input_folder = Path("input_pdfs")
    output_folder = Path("output_pdfs")
    font_name = resolve_arabic_font()
    process_folder(input_folder, output_folder, logo_path, font_name)
    print("✅ Traitement terminé !")


if __name__ == "__main__":
    main()
