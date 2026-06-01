export const LEONI_SITES = ["Menzel Hayet", "Messadine", "Mateur 1", "Mateur 2"];

export const DEFAULT_SITE_FILTER_OPTIONS = [
  { value: "all", label: "Tous les sites" },
  ...LEONI_SITES.map((site) => ({ value: site, label: site })),
];

export const SITE_FILTER_OPTIONS = DEFAULT_SITE_FILTER_OPTIONS;

export const getSiteName = (value) => {
  if (!value) return "Non défini";
  if (typeof value === "string") return value || "Non défini";
  return value.nom || value.name || "Non défini";
};

export const matchesSiteFilter = (value, filterValue) => {
  if (!filterValue || filterValue === "all") return true;
  return getSiteName(value).toLowerCase() === String(filterValue).trim().toLowerCase();
};

