from django.db import migrations


FIRST_NAMES = [
    "Ahmed", "Mohamed", "Yassine", "Amine", "Walid", "Omar", "Aymen", "Nour",
    "Mariem", "Asma", "Ines", "Sarra", "Rim", "Mouna", "Salma", "Ons",
    "Aya", "Alaa", "Rania", "Khalil", "Hela", "Rahma", "Dhia", "Bilel",
    "Hamza", "Aziz", "Marwa", "Lina", "Sami", "Karim", "Nesrine", "Amira",
    "Tarek", "Firas", "Ghofrane", "Houssem", "Ibtissem", "Jihen", "Meriem",
    "Skander", "Yasmine", "Rayed", "Nadia", "Racha", "Wiem", "Chaima",
    "Malek", "Sondos", "Hiba", "Ikram", "Farah", "Hanen", "Manel", "Rym",
    "Soumaya", "Aicha", "Safa", "Nourhene", "Kenza", "Eya", "Imen", "Nermine",
    "Abir", "Sirine", "Maram", "Meriam", "Noura", "Hichem", "Riadh", "Maher",
    "Anis", "Lotfi", "Zied", "Seif", "Seifeddine", "Ghassen", "Nidhal", "Montassar",
    "Bassem", "Hatem", "Atef", "Nizar", "Mehdi", "Wael", "Youssef", "Saber",
    "Kamel", "Adel", "Taha", "Rayen", "Rami", "Oussema", "Yacine", "Imed",
]

LAST_NAMES = [
    "Ben Ali", "Trabelsi", "Jaziri", "Ayadi", "Gharbi", "Ben Salem", "Hammami", "Ben Salah",
    "Abid", "Ferjani", "Bouazizi", "Jlassi", "Chaabane", "Khelifi", "Ayari", "Ben Amor",
    "Mansouri", "Saidi", "Mahjoub", "Dridi", "Haddad", "Toumi", "Zoghlami", "Brahmi",
    "Sassi", "Nefzi", "Masmoudi", "Kharrat", "Chebbi", "Bouzidi", "Kooli", "Ben Hmida",
    "Karray", "Mnif", "Ghannouchi", "Rekik", "Ben Moussa", "Tlili", "Ben Youssef", "Cherif",
    "Mejri", "Miled", "Abidi", "Hajji", "Kammoun", "Bouhlel", "Lajnef", "Ben Aissa",
    "Krid", "Baccar", "Smaoui", "Mabrouk", "Belhadj", "Guesmi", "Ennaifer", "Dhouib",
    "Mokni", "Bahloul", "Ben Rejeb", "Jebali", "Khalfallah", "Ben Romdhane", "Gdiri", "Chatti",
    "Kchaou", "Bouraoui", "Amri", "Ben Farhat", "Bouzgarrou", "Kouki", "Letaief", "Bejaoui",
    "Ben Othman", "Boussetta", "Sahli", "Hannachi", "Zribi", "Ben Nejma", "Debbabi", "Ben Mustapha",
    "Benzarti", "Barhoumi", "Harbaoui", "Lahmar", "Akrout", "Kooli", "Ben Chaabane", "Selmi",
    "Hajri", "Ben Ismail", "Chouchen", "Ghomrasni", "Mokhtar", "Beji", "Kefi", "Bchir",
]


def _normalized_email(prenom, nom, matricule):
    left = f"{str(prenom).strip().lower()}.{str(nom).strip().lower()}"
    replacements = {
        " ": ".",
        "'": "",
        "é": "e",
        "è": "e",
        "ê": "e",
        "à": "a",
        "â": "a",
        "ù": "u",
        "û": "u",
        "ï": "i",
        "î": "i",
        "ô": "o",
    }
    for src, dest in replacements.items():
        left = left.replace(src, dest)
    while ".." in left:
        left = left.replace("..", ".")
    return f"{left}.{matricule}@leoni.tn"


def deduplicate_collaborateur_names(apps, schema_editor):
    Collaborateur = apps.get_model("accounts", "Collaborateur")

    collaborateurs = list(
        Collaborateur.objects.select_related("site").all().order_by("site__nom", "matricule", "id")
    )

    used_names = set()
    generator_index = 0

    def next_unique_name():
        nonlocal generator_index
        total_first = len(FIRST_NAMES)
        total_last = len(LAST_NAMES)

        while True:
            first = FIRST_NAMES[generator_index % total_first]
            last = LAST_NAMES[((generator_index * 7) + (generator_index // total_first)) % total_last]
            generator_index += 1
            full_name = (first, last)
            if full_name not in used_names:
                return full_name

    for collaborateur in collaborateurs:
        current_name = ((collaborateur.prenom or "").strip(), (collaborateur.nom or "").strip())
        if current_name[0] and current_name[1] and current_name not in used_names:
            used_names.add(current_name)
            continue

        new_first, new_last = next_unique_name()
        collaborateur.prenom = new_first
        collaborateur.nom = new_last
        if getattr(collaborateur, "email", None):
            collaborateur.email = _normalized_email(new_first, new_last, collaborateur.matricule)
            collaborateur.save(update_fields=["prenom", "nom", "email"])
        else:
            collaborateur.save(update_fields=["prenom", "nom"])
        used_names.add((new_first, new_last))


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0010_convert_collaborateur_matricules_numeric"),
    ]

    operations = [
        migrations.RunPython(deduplicate_collaborateur_names, noop),
    ]
