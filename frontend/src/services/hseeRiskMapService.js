import { api } from "@/api/api";

export const RISK_CATEGORY_OPTIONS = [
  "Risque physique",
  "Risque chimique",
  "Risque biologique",
  "Risque ergonomique",
  "Risque incendie",
  "Risque Ã©lectrique",
  "Autre",
];

export const RISK_DEPARTMENT_OPTIONS = [
  "Production",
  "Maintenance",
  "Logistique",
  "QualitÃ©",
  "Administration",
  "HSE",
];

const LEVELS = [
  { key: "faible", label: "Faible", min: 1, color: "emerald" },
  { key: "moyen", label: "Moyen", min: 6, color: "amber" },
  { key: "eleve", label: "Ã‰levÃ©", min: 12, color: "orange" },
  { key: "critique", label: "Critique", min: 20, color: "rose" },
];

function hashValue(input) {
  return String(input || "")
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function normalizeStatus(statut) {
  if (statut === "TERMINE") {
    return { key: "maitrise", label: "MaÃ®trisÃ©" };
  }

  if (statut === "EN_COURS") {
    return { key: "traitement", label: "En traitement" };
  }

  return { key: "planifie", label: "PlanifiÃ©" };
}

function extractMeasures(action) {
  const parts = String(action || "")
    .split(/[\n.;â€¢]/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length) return parts.slice(0, 4);
  return ["Mesures prÃ©ventives Ã  prÃ©ciser."];
}

function inferCategory(plan) {
  const source = `${plan?.risque || ""} ${plan?.zone || ""}`.toLowerCase();

  if (source.includes("chim")) return "Risque chimique";
  if (source.includes("incend")) return "Risque incendie";
  if (source.includes("elect")) return "Risque Ã©lectrique";
  if (source.includes("ergon") || source.includes("posture")) return "Risque ergonomique";
  if (source.includes("bio")) return "Risque biologique";
  if (source.includes("machine") || source.includes("atelier")) return "Risque physique";
  return "Autre";
}

function deriveProbability(plan) {
  const statusWeight =
    plan?.statut === "TERMINE" ? 1 : plan?.statut === "EN_COURS" ? 2 : 3;
  const seed = hashValue(`${plan?.id}-${plan?.zone}-${plan?.risque}`);
  return Math.min(5, Math.max(1, ((seed + statusWeight) % 5) + 1));
}

function deriveSeverity(plan) {
  const seed = hashValue(`${plan?.risque}-${plan?.responsable}-${plan?.action}`);
  return Math.min(5, Math.max(1, (seed % 5) + 1));
}

export function getRiskLevel(score) {
  if (score >= 20) return LEVELS[3];
  if (score >= 12) return LEVELS[2];
  if (score >= 6) return LEVELS[1];
  return LEVELS[0];
}

function ensureDateLabel(value) {
  return value || "Ã€ dÃ©finir";
}

function toIsoNow() {
  return new Date().toISOString();
}

export function computeRiskKpis(risks) {
  return {
    critiques: risks.filter((risk) => risk.level.key === "critique").length,
    eleves: risks.filter((risk) => risk.level.key === "eleve").length,
    enTraitement: risks.filter((risk) => risk.status.key === "traitement").length,
    maitrises: risks.filter((risk) => risk.status.key === "maitrise").length,
  };
}

export function getNextRiskCode(risks) {
  const maxCode = risks.reduce((max, risk) => {
    const match = String(risk?.code || "").match(/RISK-(\d+)/);
    const value = match ? Number(match[1]) : 0;
    return value > max ? value : max;
  }, 0);

  return `RISK-${String(maxCode + 1).padStart(3, "0")}`;
}

export function createRiskFromForm(values, existingRisks = []) {
  const probability = Number(values.probability);
  const gravity = Number(values.gravity);
  const criticality = probability * gravity;
  const level = getRiskLevel(criticality);
  const createdAt = toIsoNow();

  return {
    id: `local-${createdAt}`,
    code: getNextRiskCode(existingRisks),
    title: values.title.trim(),
    category: values.category,
    department: values.department,
    description: values.description.trim(),
    probability,
    gravity,
    criticality,
    level,
    status: { key: "traitement", label: "En traitement" },
    preventiveMeasures: values.preventiveMeasures.length
      ? values.preventiveMeasures
      : ["Mesures prÃ©ventives Ã  prÃ©ciser."],
    responsible: values.responsible?.trim() || "Non assignÃ©",
    dueDate: ensureDateLabel(values.dueDate),
    createdAt,
  };
}

function mapPlanToRisk(plan, index) {
  const probability = deriveProbability(plan);
  const gravity = deriveSeverity(plan);
  const criticality = probability * gravity;

  return {
    id: String(plan?.id ?? index + 1),
    code: `RISK-${String(index + 1).padStart(3, "0")}`,
    title: plan?.risque || `Risque identifiÃ© - ${plan?.zone || "Zone non renseignÃ©e"}`,
    category: inferCategory(plan),
    department: plan?.zone || "Zone non renseignÃ©e",
    description:
      plan?.risque && plan?.zone
        ? `Risque identifiÃ© dans la zone ${plan.zone}. Suivi structurÃ© requis pour rÃ©duire l'exposition et sÃ©curiser l'activitÃ©.`
        : "Risque professionnel Ã  suivre dans la cartographie HSEE.",
    probability,
    gravity,
    criticality,
    level: getRiskLevel(criticality),
    status: normalizeStatus(plan?.statut),
    preventiveMeasures: extractMeasures(plan?.action),
    responsible: plan?.responsable || "Non assignÃ©",
    dueDate: ensureDateLabel(plan?.delai),
    createdAt: plan?.created_at || toIsoNow(),
    sourcePlan: plan,
  };
}

export async function getRiskMapData() {
  const response = await api.get("/medical/hsee/plan-action/");
  const plans = Array.isArray(response?.data) ? response.data : [];
  const risks = plans.map(mapPlanToRisk);

  return {
    risks,
    kpis: computeRiskKpis(risks),
  };
}
