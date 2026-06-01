import re

from django.db import migrations


NUMERIC_BASE_BY_SITE = {
    "Menzel Hayet": 1683100000,
    "Messadine": 1683200000,
    "Mateur 1": 1683300000,
    "Mateur 2": 1683400000,
}

DEFAULT_BASE = 1683900000


def _is_valid_numeric_matricule(value):
    return bool(re.fullmatch(r"\d{10}", str(value or "")))


def _extract_index(value):
    match = re.search(r"(\d+)$", str(value or ""))
    if not match:
        return None
    try:
        return int(match.group(1))
    except (TypeError, ValueError):
        return None


def convert_collaborateur_matricules_numeric(apps, schema_editor):
    Collaborateur = apps.get_model("accounts", "Collaborateur")

    all_collaborateurs = list(
        Collaborateur.objects.select_related("site").all().order_by("site_id", "matricule", "id")
    )

    used = {
        str(collaborateur.matricule)
        for collaborateur in all_collaborateurs
        if _is_valid_numeric_matricule(collaborateur.matricule)
    }

    site_counters = {}

    for collaborateur in all_collaborateurs:
        current = str(collaborateur.matricule or "")
        if _is_valid_numeric_matricule(current):
            continue

        site_name = getattr(getattr(collaborateur, "site", None), "nom", "") or ""
        base = NUMERIC_BASE_BY_SITE.get(site_name, DEFAULT_BASE)

        extracted_index = _extract_index(current)
        if extracted_index is None:
            extracted_index = site_counters.get(site_name, 0) + 1

        candidate_number = base + extracted_index
        candidate = str(candidate_number)

        while candidate in used or not _is_valid_numeric_matricule(candidate):
            extracted_index += 1
            candidate_number = base + extracted_index
            candidate = str(candidate_number)

        collaborateur.matricule = candidate
        collaborateur.save(update_fields=["matricule"])
        used.add(candidate)
        site_counters[site_name] = extracted_index


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0009_fix_generated_collaborator_names"),
        ("medical", "0021_seed_other_sites_medical_profiles"),
    ]

    operations = [
        migrations.RunPython(convert_collaborateur_matricules_numeric, noop),
    ]
