import { jsPDF } from "jspdf";

const COMPANY_NAME = "SOCIETE LEONI WIRING SYSTEMS TUNISIA SARL";
const HONORAIRES_TEXT =
  "Afin de permettre le règlement de vos honoraires dans les meilleures conditions, nous vous prions de bien vouloir accompagner votre rapport par un mémoire de règlement d'honoraires établi en deux exemplaires selon le modèle ci-joint.";
const FOOTER_NOTE =
  "NB : Prière de ne donner à la personne examinée aucune indication sur les chances de succès de sa demande.";

const REFERENCE_MISSION_ITEMS = [
  "Examiner L'intéressé (e) ;",
  "Préciser si le repos prescrit par son médecin traitant est justifié par son état de santé actuel et la date éventuelle de la reprise du travail.",
];

function formatDate(value) {
  if (!value) return "";
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

function truncateSingleLine(doc, text, maxWidth) {
  const normalized = normalize(text);
  if (!normalized || doc.getTextWidth(normalized) <= maxWidth) return normalized;

  let nextText = normalized;
  while (nextText.length > 0 && doc.getTextWidth(`${nextText}...`) > maxWidth) {
    nextText = nextText.slice(0, -1);
  }

  return `${nextText.trimEnd()}...`;
}

function formatSignatureDoctorName(value) {
  const normalized = normalize(value)
    .replace(/[._]+/g, " ")
    .replace(/\s+/g, " ");

  if (!normalized) return "";
  return /^dr\b\.?/i.test(normalized) ? normalized : `Dr ${normalized}`;
}

function splitAttachmentLines(formData) {
  const attachmentNames = Array.isArray(formData.attachmentNames)
    ? formData.attachmentNames.map((name) => String(name).trim()).filter(Boolean)
    : [];
  const textLines = String(formData.piecesJointes ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const lines = [...attachmentNames, ...textLines];
  return [lines[0] || "", lines.slice(1).join(", ")];
}

function drawDottedLine(doc, x1, y, x2) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.setLineDashPattern([0.7, 1.15], 0);
  doc.line(x1, y, x2, y);
  doc.setLineDashPattern([], 0);
}

function drawTextOnLine(doc, text, x, y, maxWidth, fontSize = 10.6) {
  const value = truncateSingleLine(doc, text, maxWidth);
  if (!value) return;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(fontSize);
  doc.text(value, x, y);
}

function drawInlineText(doc, label, value, x, y, maxWidth, labelWidth) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(label, x, y);
  drawTextOnLine(doc, value, x + labelWidth, y, maxWidth - labelWidth, 11);
}

function drawLabeledField(doc, label, value, x, y, lineEnd, labelWidth) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(label, x, y);

  const lineStart = x + labelWidth;
  const normalized = normalize(value);

  if (normalized) {
    drawTextOnLine(doc, normalized, lineStart + 1.5, y, lineEnd - lineStart - 3, 11);
    return;
  }

  drawDottedLine(doc, lineStart, y + 1.4, lineEnd);
}

function drawFullLine(doc, value, x, y, lineEnd) {
  const normalized = normalize(value);

  if (normalized) {
    drawTextOnLine(doc, normalized, x + 1.5, y - 2.2, lineEnd - x - 3);
    return;
  }

  drawDottedLine(doc, x, y, lineEnd);
}

function drawUnderlinedHeading(doc, text, x, y) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(text, x, y);
  doc.setLineWidth(0.2);
  doc.line(x, y + 1.2, x + doc.getTextWidth(text), y + 1.2);
}

function drawBulletText(doc, text, x, y, width) {
  const bulletSize = 1.8;
  const textX = x + 5.5;
  const lines = doc.splitTextToSize(text, width - 5.5);

  doc.rect(x, y - 2.2, bulletSize, bulletSize, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.4);
  doc.text(lines, textX, y);

  return y + Math.max(6.5, lines.length * 4.8) + 1.2;
}

function drawBulletInlineField(doc, label, value, x, y, lineEnd) {
  const bulletSize = 1.8;
  const textX = x + 5.5;

  doc.rect(x, y - 2.2, bulletSize, bulletSize, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.4);
  doc.text(label, textX, y);

  const lineStart = textX + doc.getTextWidth(label) + 2;
  const normalized = normalize(value);

  if (normalized) {
    drawTextOnLine(doc, normalized, lineStart + 1.5, y, lineEnd - lineStart - 3, 10.2);
  } else {
    drawDottedLine(doc, lineStart, y + 1.2, lineEnd);
  }

  return y + 8;
}

function openPdfInNewTab(doc, filename) {
  doc.setProperties({ title: filename });

  const pdfBlob = doc.output("blob");
  const pdfFile = new File([pdfBlob], filename, { type: "application/pdf" });
  const pdfUrl = URL.createObjectURL(pdfFile);
  const newWindow = window.open(pdfUrl, "_blank");

  if (!newWindow) {
    URL.revokeObjectURL(pdfUrl);
    throw new Error("PDF preview popup blocked");
  }

  window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
}

export async function downloadDemandeExpertisePdf(formData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const rightEdge = pageWidth - margin;
  const contentWidth = pageWidth - margin * 2;
  const companyName = normalize(formData.societe, COMPANY_NAME);
  const date = formatDate(formData.date);
  const destinationDoctorName = normalize(formData.destinataire || formData.destination);
  const signatureDoctorName = formatSignatureDoctorName(formData.medecinControleur);
  const nom = normalize(formData.nom);
  const prenom = normalize(formData.prenom);
  const matriculeLeoni = normalize(formData.matriculeLeoni);
  const aptitudePoste = normalize(formData.aptitudePoste);
  const autresMissions = normalize(formData.autresMissions);
  const [firstAttachment, secondAttachment] = splitAttachmentLines(formData);

  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(companyName, pageWidth / 2, 21, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const dateY = 37;
  drawDottedLine(doc, 126, dateY + 1.3, 143);
  doc.text("Le :", 146, dateY);
  drawDottedLine(doc, 156, dateY + 1.3, rightEdge);
  drawTextOnLine(doc, date, 158, dateY - 0.8, rightEdge - 160, 10.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13.2);
  doc.text("DEMANDE D'EXPERTISE MEDICALE", pageWidth / 2, 55, { align: "center" });

  const doctorX = 134;
  const doctorY = 72;
  drawInlineText(doc, "DR :", destinationDoctorName, doctorX, doctorY, rightEdge - doctorX, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Cher Confrère", margin, 93);
  doc.text("J'ai l'honneur de vous adresser pour expertise médicale :", margin, 105);

  drawLabeledField(doc, "Nom :", nom, margin, 123, 155, 35);
  drawLabeledField(doc, "Prénom :", prenom, margin, 133, 155, 35);
  drawLabeledField(doc, "Matricule Leoni :", matriculeLeoni, margin, 143, 155, 35);

  drawUnderlinedHeading(doc, "Pièce jointes :", margin, 159);
  drawFullLine(doc, firstAttachment, margin, 170, rightEdge);
  drawFullLine(doc, secondAttachment, margin, 180, rightEdge);

  drawUnderlinedHeading(doc, "Mission objet de l'expertise :", margin, 196);
  let cursorY = 208;
  cursorY = drawBulletText(doc, REFERENCE_MISSION_ITEMS[0], margin + 1, cursorY, contentWidth - 1);
  cursorY = drawBulletText(doc, REFERENCE_MISSION_ITEMS[1], margin + 1, cursorY, contentWidth - 1);
  cursorY = drawBulletInlineField(
    doc,
    "Préciser son aptitude médicale actuelle au poste de",
    aptitudePoste,
    margin + 1,
    cursorY,
    rightEdge
  );
  drawBulletInlineField(
    doc,
    "Autres missions :",
    autresMissions,
    margin + 1,
    cursorY,
    rightEdge
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.1);
  doc.text(doc.splitTextToSize(HONORAIRES_TEXT, contentWidth), margin, 248);

  doc.setFontSize(11);
  doc.text("Bien confraternellement", rightEdge, 277, { align: "right" });
  doc.text("Le médecin contrôleur de la société Leoni", rightEdge, 284, {
    align: "right",
  });
  if (signatureDoctorName) {
    doc.text(signatureDoctorName, rightEdge, 291, { align: "right" });
  }

  doc.setFontSize(7.2);
  doc.text(doc.splitTextToSize(FOOTER_NOTE, contentWidth), margin, 294);

  const filename = `demande_expertise_${sanitizeFilenamePart(
    formData.nom,
    "Nom"
  )}_${sanitizeFilenamePart(formData.prenom, "Prenom")}.pdf`;

  openPdfInNewTab(doc, filename);
  return filename;
}
