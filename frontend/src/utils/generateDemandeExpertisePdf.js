import { jsPDF } from "jspdf";

const COMPANY_NAME = "SOCIETE LEONI WIRING SYSTEMS TUNISIA SARL";
const HONORAIRES_TEXT =
  "Afin de permettre le règlement de vos honoraires dans les meilleures conditions, nous vous prions de bien vouloir accompagner votre rapport par un mémoire de règlement d'honoraires établi en deux exemplaires selon le modèle ci-joint.";
const FOOTER_NOTE =
  "NB : Prière de ne donner à la personne examinée aucune indication sur les chances de succès de sa demande.";

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

function withPeriod(value) {
  const cleaned = normalize(value);
  if (!cleaned) return "";
  return /[.;:]$/.test(cleaned) ? cleaned : `${cleaned}.`;
}

function drawDottedLine(doc, x1, y, x2) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);

  for (let x = x1; x < x2; x += 2.2) {
    doc.line(x, y, Math.min(x + 0.55, x2), y);
  }
}

function drawTextOnDottedLine(doc, value, x1, y, x2) {
  const text = normalize(value);
  if (!text) {
    drawDottedLine(doc, x1, y, x2);
    return;
  }

  doc.text(text, x1, y - 1.1);
}

function drawLabeledDottedField(doc, label, value, x, y, lineStart, lineEnd) {
  doc.text(label, x, y);
  drawTextOnDottedLine(doc, value, lineStart, y + 0.4, lineEnd);
}

function drawWrappedText(doc, text, x, y, width, lineHeight = 5) {
  const lines = doc.splitTextToSize(text, width);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function drawSquareBullet(doc, text, x, y, width) {
  doc.rect(x, y - 2.6, 1.7, 1.7, "F");
  return drawWrappedText(doc, text, x + 5, y, width - 5, 5) + 1.2;
}

function openPdfPreview(doc, filename) {
  doc.setProperties({ title: filename });

  const pdfBlob = doc.output("blob");
  const pdfFile = new File([pdfBlob], filename, { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(pdfFile);
  const previewWindow = window.open(blobUrl, "_blank");

  if (!previewWindow) {
    URL.revokeObjectURL(blobUrl);
    throw new Error("PDF preview popup blocked");
  }

  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
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

  const date = formatDate(formData.date);
  const companyName = normalize(formData.societe, COMPANY_NAME);
  const controllerDoctorName = normalize(formData.medecinControleur);
  const expertDoctorName = normalize(formData.destinataire || formData.destination);
  const attachmentNames = Array.isArray(formData.attachmentNames)
    ? formData.attachmentNames.map((name) => String(name).trim()).filter(Boolean)
    : [];
  const piecesJointes = [attachmentNames.join(", "), formData.piecesJointes]
    .filter(Boolean)
    .join("\n")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  const firstAttachmentLine = piecesJointes[0] || "";
  const secondAttachmentLine = piecesJointes.slice(1).join(", ");
  const aptitudePoste = normalize(formData.aptitudePoste);
  const autresMissions = normalize(formData.autresMissions);

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.text(companyName, pageWidth / 2, 22, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("…………Le :", rightEdge - 47, 38);
  drawTextOnDottedLine(doc, date, rightEdge - 19, 38.4, rightEdge);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13.5);
  doc.text("DEMANDE D'EXPERTISE MEDICALE", pageWidth / 2, 56, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11.2);
  const doctorBlockX = 140;
  drawLabeledDottedField(doc, "DR :", expertDoctorName, doctorBlockX, 75, doctorBlockX + 10, rightEdge);

  let cursorY = 101;
  doc.text("Cher Confrère", margin, cursorY);
  cursorY += 11;
  doc.text("J'ai l'honneur de vous adresser pour expertise médicale :", margin, cursorY);

  cursorY += 13;
  drawLabeledDottedField(doc, "Nom :", normalize(formData.nom), margin, cursorY, 57, rightEdge);
  cursorY += 9;
  drawLabeledDottedField(doc, "Prénom :", normalize(formData.prenom), margin, cursorY, 57, rightEdge);
  cursorY += 9;
  drawLabeledDottedField(
    doc,
    "Matricule Leoni :",
    normalize(formData.matriculeLeoni),
    margin,
    cursorY,
    57,
    rightEdge
  );

  cursorY += 15;
  doc.setFont("helvetica", "bold");
  doc.text("Pièce jointes :", margin, cursorY);
  doc.line(margin, cursorY + 1, margin + 31, cursorY + 1);

  doc.setFont("helvetica", "normal");
  cursorY += 9;
  drawTextOnDottedLine(doc, firstAttachmentLine, margin, cursorY, rightEdge);
  cursorY += 8;
  drawTextOnDottedLine(doc, secondAttachmentLine, margin, cursorY, rightEdge);

  cursorY += 15;
  doc.setFont("helvetica", "bold");
  doc.text("Mission objet de l'expertise :", margin, cursorY);
  doc.line(margin, cursorY + 1, margin + 53, cursorY + 1);

  doc.setFont("helvetica", "normal");
  cursorY += 11;
  cursorY = drawSquareBullet(doc, "Examiner L'intéressé (e) ;", margin + 2, cursorY, contentWidth - 4);
  cursorY = drawSquareBullet(
    doc,
    "Préciser si le repos prescrit par son médecin traitant est justifié par son état de santé actuel et la date éventuelle de la reprise du travail.",
    margin + 2,
    cursorY,
    contentWidth - 4
  );
  cursorY = drawSquareBullet(
    doc,
    `Préciser son aptitude médicale actuelle au poste de ${aptitudePoste || "………………………"}`,
    margin + 2,
    cursorY,
    contentWidth - 4
  );
  cursorY = drawSquareBullet(
    doc,
    `Autres missions : ${withPeriod(autresMissions) || "………………………"}`,
    margin + 2,
    cursorY,
    contentWidth - 4
  );

  cursorY += 5;
  doc.setFontSize(10.8);
  cursorY = drawWrappedText(doc, HONORAIRES_TEXT, margin, cursorY, contentWidth, 4.8);

  doc.setFontSize(11);
  doc.text("Bien confraternellement", rightEdge, 262, { align: "right" });
  doc.text("Le médecin contrôleur de la société Leoni", rightEdge, 271, { align: "right" });
  if (controllerDoctorName) {
    doc.text(controllerDoctorName, rightEdge, 280, { align: "right" });
  }

  doc.setFontSize(9.2);
  drawWrappedText(doc, FOOTER_NOTE, margin, 289, contentWidth, 4.2);

  const filename = `demande_expertise_${sanitizeFilenamePart(
    formData.nom,
    "Nom"
  )}_${sanitizeFilenamePart(formData.prenom, "Prenom")}.pdf`;

  openPdfPreview(doc, filename);
  return filename;
}
