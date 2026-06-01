from django.db import migrations


FIRST_NAMES = [
    "Ahmed",
    "Mohamed",
    "Nour",
    "Yassine",
    "Mariem",
    "Ines",
    "Amine",
    "Ons",
    "Sarra",
    "Aya",
    "Alaa",
    "Rania",
    "Khalil",
    "Walid",
    "Omar",
    "Hela",
    "Salma",
    "Rahma",
    "Dhia",
    "Bilel",
    "Hamza",
    "Aymen",
    "Aziz",
    "Marwa",
    "Lina",
    "Mouna",
    "Sami",
    "Karim",
    "Nesrine",
    "Amira",
    "Asma",
    "Tarek",
    "Firas",
    "Ghofrane",
    "Houssem",
    "Ibtissem",
    "Jihen",
    "Meriem",
    "Skander",
    "Yasmine",
]

LAST_NAMES = [
    "Ben Ali",
    "Trabelsi",
    "Ben Salah",
    "Mansouri",
    "Jaziri",
    "Bouazizi",
    "Ayadi",
    "Hammami",
    "Gharbi",
    "Khelifi",
    "Mejri",
    "Chaabane",
    "Ferjani",
    "Saidi",
    "Abidi",
    "Mahjoub",
    "Dridi",
    "Haddad",
    "Toumi",
    "Ben Amor",
    "Zoghlami",
    "Brahmi",
    "Jlassi",
    "Sassi",
    "Nefzi",
    "Masmoudi",
    "Kharrat",
    "Chebbi",
    "Miled",
    "Bouzidi",
    "Kooli",
    "Ben Hmida",
    "Karray",
    "Mnif",
    "Ghannouchi",
    "Rekik",
    "Ben Moussa",
    "Tlili",
    "Ben Youssef",
    "Cherif",
]

SITE_NAME_OFFSETS = {
    "Menzel Hayet": 0,
    "Messadine": 9,
    "Mateur 1": 18,
    "Mateur 2": 27,
}

SITE_PREFIXES = ["MH-", "MS-", "MT1-", "MT2-"]


def _build_name(site_name, index):
    site_offset = SITE_NAME_OFFSETS.get(site_name, 0)
    first_name = FIRST_NAMES[(index - 1 + site_offset) % len(FIRST_NAMES)]
    last_name = LAST_NAMES[((index - 1) * 3 + site_offset) % len(LAST_NAMES)]
    return first_name, last_name


def fix_generated_collaborator_names(apps, schema_editor):
    Collaborateur = apps.get_model("accounts", "Collaborateur")

    queryset = Collaborateur.objects.select_related("site").all().order_by("matricule")
    for collaborateur in queryset:
        matricule = str(collaborateur.matricule or "")
        if not any(matricule.startswith(prefix) for prefix in SITE_PREFIXES):
            continue

        site_name = getattr(getattr(collaborateur, "site", None), "nom", "") or ""
        if not site_name:
            continue

        if (
            not str(collaborateur.prenom or "").startswith("Collaborateur")
            and str(collaborateur.nom or "").strip().lower() != site_name.strip().lower()
        ):
            continue

        try:
            index = int(matricule.split("-")[-1])
        except (TypeError, ValueError):
            continue

        first_name, last_name = _build_name(site_name, index)
        collaborateur.prenom = first_name
        collaborateur.nom = last_name
        collaborateur.save(update_fields=["prenom", "nom"])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0008_seed_dashboard_infirmier_sites"),
    ]

    operations = [
        migrations.RunPython(fix_generated_collaborator_names, noop),
    ]
