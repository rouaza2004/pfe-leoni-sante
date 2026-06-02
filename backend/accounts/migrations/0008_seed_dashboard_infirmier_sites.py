from django.db import migrations


SITE_TARGETS = [
    {"nom": "Menzel Hayet", "localite": "Menzel Hayet", "target": 50, "prefix": "MH"},
    {"nom": "Messadine", "localite": "Messadine", "target": 100, "prefix": "MS"},
    {"nom": "Mateur 1", "localite": "Mateur 1", "target": 100, "prefix": "MT1"},
    {"nom": "Mateur 2", "localite": "Mateur 2", "target": 100, "prefix": "MT2"},
]

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


def _ensure_site(Site, nom, localite):
    existing = Site.objects.filter(nom__iexact=nom).order_by("id").first()
    if existing:
        if existing.localite != localite:
            existing.localite = localite
            existing.save(update_fields=["localite"])
        return existing
    return Site.objects.create(nom=nom, localite=localite)


def _normalize_menzel_hayet_site(Site, Collaborateur):
    menzel = Site.objects.filter(nom__iexact="Menzel Hayet").order_by("id").first()
    legacy_leoni = Site.objects.filter(nom__iexact="LEONI").order_by("id").first()

    if legacy_leoni and not menzel:
        legacy_leoni.nom = "Menzel Hayet"
        legacy_leoni.localite = "Menzel Hayet"
        legacy_leoni.save(update_fields=["nom", "localite"])
        return legacy_leoni

    if not menzel:
        menzel = Site.objects.create(nom="Menzel Hayet", localite="Menzel Hayet")

    if legacy_leoni and legacy_leoni.pk != menzel.pk:
        Collaborateur.objects.filter(site_id=legacy_leoni.pk).update(site_id=menzel.pk)
        legacy_leoni.delete()

    if menzel.localite != "Menzel Hayet":
        menzel.localite = "Menzel Hayet"
        menzel.save(update_fields=["localite"])

    return menzel


def _placeholder_payload(prefix, index, site):
    site_offset = SITE_NAME_OFFSETS.get(site.nom, 0)
    first_name = FIRST_NAMES[(index - 1 + site_offset) % len(FIRST_NAMES)]
    last_name = LAST_NAMES[((index - 1) * 3 + site_offset) % len(LAST_NAMES)]
    return {
        "matricule": f"{prefix}-{index:03d}",
        "nom": last_name,
        "prenom": first_name,
        "email": "",
        "telephone": "",
        "adresse": site.localite,
        "poste": "Operateur",
        "departement": "Production",
        "actif": True,
        "site": site,
    }


def seed_dashboard_infirmier_sites(apps, schema_editor):
    Site = apps.get_model("accounts", "Site")
    Collaborateur = apps.get_model("accounts", "Collaborateur")

    menzel = _normalize_menzel_hayet_site(Site, Collaborateur)

    sites = {"Menzel Hayet": menzel}
    for spec in SITE_TARGETS[1:]:
        sites[spec["nom"]] = _ensure_site(Site, spec["nom"], spec["localite"])

    for spec in SITE_TARGETS:
        site = sites[spec["nom"]]
        current_count = Collaborateur.objects.filter(site_id=site.pk).count()
        missing = spec["target"] - current_count
        if missing <= 0:
            continue

        next_index = 1
        created = 0
        while created < missing:
            matricule = f"{spec['prefix']}-{next_index:03d}"
            next_index += 1
            if Collaborateur.objects.filter(matricule=matricule).exists():
                continue
            Collaborateur.objects.create(**_placeholder_payload(spec["prefix"], next_index - 1, site))
            created += 1


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0007_seed_leoni_sites"),
    ]

    operations = [
        migrations.RunPython(seed_dashboard_infirmier_sites, noop),
    ]
