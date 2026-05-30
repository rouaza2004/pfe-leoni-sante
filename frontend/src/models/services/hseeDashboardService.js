import { api } from "@/controllers/api/api";

const EMPTY_DASHBOARD = {
  filters: {
    period: "6m",
    department: "",
    site: "",
    departments: [],
    sites: [],
  },
  kpis: {
    accidents_travail: 0,
    incidents: 0,
    taux_frequence_tf: 0,
    taux_gravite_tg: 0,
    jours_perdus: 0,
    transferts_urgence: 0,
    visites_medicales: 0,
    maladies_professionnelles: 0,
  },
  charts: {
    accidents_by_department: [],
    lesion_types: [],
    medical_visit_types: [],
    injury_types: [],
    lost_days_by_month: [],
  },
  recent_accidents: [],
};

function ensureNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeSeries(series) {
  return ensureArray(series).map((item) => ({
    ...item,
    name: item?.name || "Non renseigne",
    value: ensureNumber(item?.value),
    color: item?.color || undefined,
  }));
}

function normalizeAccidents(rows) {
  return ensureArray(rows).map((row) => ({
    id: row?.id || "-",
    date: row?.date || "-",
    employee: row?.employee || "-",
    department: row?.department || "-",
    nature: row?.nature || "-",
    days: ensureNumber(row?.days),
    status: row?.status || "En attente",
  }));
}

export async function getHseeDashboardStats(period, department, site) {
  const params = {
    period: period || "6m",
  };

  if (department) {
    params.department = department;
  }
  if (site) {
    params.site = site;
  }

  const response = await api.get("/medical/hsee/dashboard/", { params });
  const payload = response?.data || {};

  return {
    filters: {
      period: payload?.filters?.period || EMPTY_DASHBOARD.filters.period,
      department: payload?.filters?.department || "",
      site: payload?.filters?.site || "",
      departments: ensureArray(payload?.filters?.departments).filter(Boolean),
      sites: ensureArray(payload?.filters?.sites).filter(Boolean),
    },
    kpis: {
      accidents_travail: ensureNumber(payload?.kpis?.accidents_travail),
      incidents: ensureNumber(payload?.kpis?.incidents),
      taux_frequence_tf: ensureNumber(payload?.kpis?.taux_frequence_tf),
      taux_gravite_tg: ensureNumber(payload?.kpis?.taux_gravite_tg),
      jours_perdus: ensureNumber(payload?.kpis?.jours_perdus),
      transferts_urgence: ensureNumber(payload?.kpis?.transferts_urgence),
      visites_medicales: ensureNumber(payload?.kpis?.visites_medicales),
      maladies_professionnelles: ensureNumber(payload?.kpis?.maladies_professionnelles),
    },
    charts: {
      accidents_by_department: normalizeSeries(payload?.charts?.accidents_by_department),
      lesion_types: normalizeSeries(payload?.charts?.lesion_types),
      medical_visit_types: normalizeSeries(payload?.charts?.medical_visit_types),
      injury_types: normalizeSeries(payload?.charts?.injury_types),
      lost_days_by_month: normalizeSeries(payload?.charts?.lost_days_by_month),
    },
    recent_accidents: normalizeAccidents(payload?.recent_accidents),
  };
}

export { EMPTY_DASHBOARD };

