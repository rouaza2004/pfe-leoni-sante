import { jsPDF } from "jspdf";

import leoniLogoUrl from "@/views/assets/leoni-logo.png";

const COMPANY_NAME = "SOCIETE LEONI WIRING SYSTEMS TUNISIA SARL";
const HONORAIRES_TEXT =
  "Afin de permettre le règlement de vos honoraires dans les meilleures conditions, nous vous prions de bien vouloir accompagner votre rapport par un mémoire de règlement d'honoraires établi en deux exemplaires selon le modèle ci-joint.";

const DEFAULT_MISSION_ITEMS = [
  "Examiner l'intéressé(e)",
  "Préciser si le repos prescrit par son médecin traitant est justifié par son état de santé actuel et la date éventuelle de la reprise du travail",
];

function formatDate(value) {
  if (!value) return "____________";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR");
}

function normalize(value, fallback = "") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function sanitizeFilenamePart(value, fallback) {
  const normalized = String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || fallback;
}

function truncateLines(lines, maxLines) {
  if (lines.length <= maxLines) return lines;
  const nextLines = lines.slice(0, maxLines);
  nextLines[maxLines - 1] = `${nextLines[maxLines - 1].replace(/\s+$/g, "")}...`;
  return nextLines;
}

async function imageUrlToDataUrl(url) {
  if (!url || url.startsWith("data:image/")) return url || null;

  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function drawHeader(doc, margin, rightEdge, dateLabel, companyName) {
  const logoX = margin;
  const logoY = 11;
  const logoWidth = 30;
  const logoHeight = 7.1;

  try {
    const logoDataUrl = await imageUrlToDataUrl(leoniLogoUrl);
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", logoX, logoY, logoWidth, logoHeight);
    }
  } catch (error) {
    console.warn("Logo LEONI non charge dans le PDF", error);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("LEONI", logoX, logoY + 6);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.text(doc.splitTextToSize(companyName, 55), logoX, 22);

  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.text(dateLabel, rightEdge, 18, { align: "right" });
}

function drawInlineField(doc, label, value, x, y, width, labelWidth = 34) {
  const valueX = x + labelWidth;
  const valueWidth = width - labelWidth;
  const normalized = normalize(value);

  doc.setFont("times", "bold");
  doc.setFontSize(11.5);
  doc.text(label, x, y);

  doc.setFont("times", "normal");
  doc.setFontSize(11.5);
  if (normalized) {
    const lines = truncateLines(doc.splitTextToSize(normalized, valueWidth), 2);
    doc.text(lines, valueX, y);
    return y + Math.max(7, lines.length * 5.2);
  }

  doc.setDrawColor(90, 90, 90);
  doc.setLineWidth(0.2);
  doc.line(valueX, y + 1.4, x + width, y + 1.4);
  return y + 7;
}

function drawTextArea(doc, label, value, x, y, width, maxLines = 3) {
  doc.setFont("times", "bold");
  doc.setFontSize(11.5);
  doc.text(label, x, y);

  const textY = y + 7;
  const normalized = normalize(value);
  doc.setFont("times", "normal");
  doc.setFontSize(11);

  if (normalized) {
    const lines = truncateLines(doc.splitTextToSize(normalized, width), maxLines);
    doc.text(lines, x, textY);
    return textY + lines.length * 5.2 + 4;
  }

  doc.setDrawColor(90, 90, 90);
  doc.setLineWidth(0.2);
  doc.line(x, textY + 1, x + width, textY + 1);
  return textY + 8;
}

function buildMissionItems(missionText) {
  const items = String(missionText ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/^[-•]\s*/, "").replace(/[;.:]+$/g, "").trim());

  return items.length ? items.slice(0, 2) : DEFAULT_MISSION_ITEMS;
}

function drawMissionItem(doc, text, x, y, width) {
  const bulletX = x + 2;
  const textX = x + 8;
  const lines = truncateLines(doc.splitTextToSize(text, width - 8), 3);

  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.circle(bulletX, y - 1.1, 0.8, "F");
  doc.text(lines, textX, y);

  return y + Math.max(6, lines.length * 5.1) + 1;
}

export async function downloadDemandeExpertisePdf(formData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const rightEdge = pageWidth - margin;
  const contentWidth = pageWidth - margin * 2;

  const ville = normalize(formData.ville);
  const date = formatDate(formData.date);
  const dateLabel = `${ville ? `${ville}, ` : ""}Le ${date}`;
  const companyName = normalize(formData.societe, COMPANY_NAME);
  const doctorName = normalize(formData.medecinControleur, "Dr. ____________");
  const destination = normalize(formData.destinataire || formData.destination);
  const attachmentNames = Array.isArray(formData.attachmentNames)
    ? formData.attachmentNames.map((name) => String(name).trim()).filter(Boolean)
    : [];
  const piecesJointes = normalize(
    [attachmentNames.join(", "), formData.piecesJointes].filter(Boolean).join("\n")
  );
  const aptitudePoste = normalize(formData.aptitudePoste);
  const autresMissions = normalize(formData.autresMissions);
  const missionItems = buildMissionItems(formData.mission);

  doc.setTextColor(0, 0, 0);
  await drawHeader(doc, margin, rightEdge, dateLabel, companyName);

  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("DEMANDE D'EXPERTISE MÉDICALE", pageWidth / 2, 45, { align: "center" });
  doc.setLineWidth(0.25);
  doc.line(pageWidth / 2 - 43, 47, pageWidth / 2 + 43, 47);

  let cursorY = 60;
  cursorY = drawInlineField(doc, "DR :", doctorName, margin, cursorY, contentWidth, 22);
  if (destination) {
    cursorY = drawInlineField(doc, "À :", destination, margin, cursorY, contentWidth, 22);
  }

  cursorY += 4;
  doc.setFont("times", "normal");
  doc.setFontSize(11.5);
  doc.text("Cher Confrère,", margin, cursorY);
  cursorY += 9;
  doc.text("J'ai l'honneur de vous adresser pour expertise médicale :", margin, cursorY);

  cursorY += 13;
  cursorY = drawInlineField(doc, "Nom :", normalize(formData.nom), margin, cursorY, contentWidth, 35);
  cursorY = drawInlineField(doc, "Prénom :", normalize(formData.prenom), margin, cursorY, contentWidth, 35);
  cursorY = drawInlineField(
    doc,
    "Matricule Leoni :",
    normalize(formData.matriculeLeoni),
    margin,
    cursorY,
    contentWidth,
    35
  );

  cursorY += 5;
  cursorY = drawTextArea(doc, "Pièces jointes :", piecesJointes, margin, cursorY, contentWidth, 2);

  cursorY += 4;
  doc.setFont("times", "bold");
  doc.setFontSize(11.5);
  doc.text("Mission objet de l'expertise :", margin, cursorY);
  cursorY += 9;

  missionItems.forEach((item) => {
    cursorY = drawMissionItem(doc, item, margin, cursorY, contentWidth);
  });

  cursorY = drawMissionItem(
    doc,
    `Préciser son aptitude médicale actuelle au poste de ${aptitudePoste || "____________________"}`,
    margin,
    cursorY,
    contentWidth
  );
  cursorY = drawMissionItem(
    doc,
    `Autres missions : ${autresMissions || "____________________________"}`,
    margin,
    cursorY,
    contentWidth
  );

  cursorY += 5;
  doc.setFont("times", "normal");
  doc.setFontSize(10.5);
  doc.text(truncateLines(doc.splitTextToSize(HONORAIRES_TEXT, contentWidth), 4), margin, cursorY);

  doc.setFontSize(11);
  doc.text("Bien confraternellement", rightEdge, 252, { align: "right" });
  doc.setFont("times", "bold");
  doc.text("Le médecin contrôleur de la société Leoni", rightEdge, 261, { align: "right" });
  doc.setFont("times", "normal");
  doc.text(doctorName, rightEdge, 270, { align: "right" });

  const filename = `demande_expertise_${sanitizeFilenamePart(
    formData.nom,
    "Nom"
  )}_${sanitizeFilenamePart(formData.prenom, "Prenom")}.pdf`;

  doc.save(filename);
}


