import sys
from pathlib import Path

from backend.medical.pdf_headers import (
    GMT_ARABIC_FONT,
    GMT_LOGO_PATH,
    HEADER_COLOR,
    HEADER_H,
    _make_arabic_image,
    _register_arabic_font_for_reportlab,
    add_gmt_header_to_pdf,
    create_gmt_header_overlay,
    generate_gmt_test_pdf,
    process_gmt_header_folder,
)


LOGO_PATH = GMT_LOGO_PATH
ARABIC_FONT = GMT_ARABIC_FONT
create_header_overlay = create_gmt_header_overlay
add_header_to_pdf = add_gmt_header_to_pdf
process_folder = process_gmt_header_folder
generate_test_pdf = generate_gmt_test_pdf
make_arabic_image = _make_arabic_image


def main():
    args = sys.argv[1:]
    _register_arabic_font_for_reportlab()

    if len(args) == 0:
        path = generate_test_pdf()
        print(f"✅ Test généré: {path}")
        return

    if len(args) == 1:
        input_path = Path(args[0])
        if not input_path.exists():
            print(f"❌ Fichier introuvable: {input_path}")
            return
        output_path = input_path.with_name(input_path.stem + "_GMT.pdf")
        add_header_to_pdf(input_path, output_path)
        print(f"✅ Fichier traité: {output_path}")
        return

    if len(args) == 2:
        process_folder(args[0], args[1])
        return

    print("Usage:")
    print("  python backend/scripts/gmt_header.py")
    print("  python backend/scripts/gmt_header.py fichier.pdf")
    print("  python backend/scripts/gmt_header.py input_pdfs/ output_pdfs/")


if __name__ == "__main__":
    main()
