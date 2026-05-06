const ADMIN_ROLE = "ADMIN";

const READ_ONLY_PATH_PREFIXES = [
  "/medecin-traitant",
  "/medecin-travail",
  "/medecin-controleur",
  "/infirmier",
  "/rh",
];

const READ_ONLY_EXACT_PATHS = ["/bon-chauffeur", "/suivi-transferts", "/dashboard-pharmacie"];

const MUTATION_METHODS = new Set(["post", "put", "patch", "delete"]);

const MUTATION_KEYWORDS = [
  "ajouter",
  "add",
  "nouveau",
  "new",
  "créer",
  "creer",
  "create",
  "modifier",
  "edit",
  "mettre à jour",
  "mettre a jour",
  "update",
  "supprimer",
  "delete",
  "remove",
  "enregistrer",
  "save",
  "valider",
  "submit",
  "importer",
  "import",
];

export function isAdminReadOnlyPath(pathname, role) {
  if (role !== ADMIN_ROLE) {
    return false;
  }

  if (!pathname) {
    return false;
  }

  return (
    READ_ONLY_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    READ_ONLY_EXACT_PATHS.some((exactPath) => pathname === exactPath)
  );
}

export function isMutationMethod(method = "") {
  return MUTATION_METHODS.has(String(method).toLowerCase());
}

export function isMutationActionElement(element) {
  if (!element || typeof element.closest !== "function") {
    return false;
  }

  const target = element.closest("button, [role='button'], input[type='submit'], input[type='button']");

  if (!target) {
    return false;
  }

  const attributesText = [
    target.getAttribute("aria-label"),
    target.getAttribute("title"),
    target.getAttribute("name"),
    target.getAttribute("value"),
    target.textContent,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (target.getAttribute("type")?.toLowerCase() === "submit") {
    return true;
  }

  return MUTATION_KEYWORDS.some((keyword) => attributesText.includes(keyword));
}
