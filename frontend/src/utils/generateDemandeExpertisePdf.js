import { jsPDF } from "jspdf";

const COMPANY_NAME = "SOCIETE LEONI WIRING SYSTEMS TUNISIA SARL";
const FOOTER_NOTE =
  "NB : Prière de ne donner à la personne examinée aucune indication sur les chances de succès de sa demande.";
const HONORAIRES_TEXT =
  "Afin de permettre le règlement de vos honoraires dans les meilleures conditions, nous vous prions de bien vouloir accompagner votre rapport par un mémoire de règlement d'honoraires établi en deux exemplaires selon le modèle ci-joint.";

function formatDate(value) {
  if (!value) return "____________";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR");
}

function normalize(value, fallback = "____________") {
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

function drawBulletItem(doc, text, x, y, width, lineHeight = 5) {
  const bulletSize = 1.4;
  const textX = x + 4;
  const wrapped = doc.splitTextToSize(text, width - 4);

  doc.rect(x, y - 1.4, bulletSize, bulletSize, "F");
  doc.text(wrapped, textX, y);

  return y + wrapped.length * lineHeight + 1;
}

function drawUnderlinedLabel(doc, text, x, y) {
  doc.setFont("times", "bold");
  doc.text(text, x, y);
  const width = doc.getTextWidth(text);
  doc.line(x, y + 0.7, x + width, y + 0.7);
  doc.setFont("times", "normal");
}

export function downloadDemandeExpertisePdf(formData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const rightEdge = pageWidth - margin;
  const contentWidth = pageWidth - margin * 2;

  const ville = normalize(formData.ville, "____________");
  const date = formatDate(formData.date);
  const doctorName = normalize(formData.medecinControleur, "Dr. ____________");
  const attachmentNames = Array.isArray(formData.attachmentNames)
    ? formData.attachmentNames.map((name) => String(name).trim()).filter(Boolean)
    : [];
  const piecesJointes = String(formData.piecesJointes ?? "").trim();
  const aptitudePoste = normalize(formData.aptitudePoste, "____________");
  const autresMissions = normalize(formData.autresMissions, "____________");

  doc.setTextColor(0, 0, 0);
  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.text(COMPANY_NAME, pageWidth / 2, 22, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.text(`${ville}, Le ${date}`, rightEdge, 32, { align: "right" });

  doc.setFont("times", "bold");
  doc.setFontSize(13);
  doc.text("DEMANDE D'EXPERTISE MEDICALE", pageWidth / 2, 45, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(12);
  doc.text(`DR : ${doctorName}`, margin, 58);
  doc.text(" ", margin + 10, 65);

  doc.text("Cher Confère", margin, 79);
  doc.text("J'ai l'honneur de vous adresser pour expertise médicale :", margin, 90);

  doc.text(`Nom : ${normalize(formData.nom)}`, margin, 103);
  doc.text(`Prénom : ${normalize(formData.prenom)}`, margin, 110);
  doc.text(`Matricule Leoni : ${normalize(formData.matriculeLeoni)}`, margin, 117);

  drawUnderlinedLabel(doc, "Piece jointes :", margin, 130);
  doc.setFontSize(11);
  const attachmentText = attachmentNames.length > 0 ? attachmentNames.join(", ") : piecesJointes;
  const piecesLines = attachmentText
    ? doc.splitTextToSize(attachmentText, contentWidth)
    : ["............................................................................................."];
  doc.text(piecesLines, margin, 138);

  drawUnderlinedLabel(doc, "Mission objet de l'expertise :", margin, 157);
  doc.setFontSize(11);

  let cursorY = 166;
  cursorY = drawBulletItem(doc, "Examiner L'intéressé (e) ;", margin + 1, cursorY, contentWidth - 2);
  cursorY = drawBulletItem(
    doc,
    "Préciser si le repos prescrit par son médecin traitant est justifié par son état de santé actuel et la date éventuelle de la reprise du travail.",
    margin + 1,
    cursorY,
    contentWidth - 2
  );
  cursorY = drawBulletItem(
    doc,
    `Préciser son aptitude médicale actuelle au poste de ${aptitudePoste}`,
    margin + 1,
    cursorY,
    contentWidth - 2
  );
  cursorY = drawBulletItem(
    doc,
    `Autres missions : ${autresMissions}`,
    margin + 1,
    cursorY,
    contentWidth - 2
  );

  doc.text(doc.splitTextToSize(HONORAIRES_TEXT, contentWidth), margin, cursorY + 6);

  const closingY = 246;
  doc.text("Bien confraternellement", rightEdge, closingY, { align: "right" });
  doc.text("Le médecin contrôleur de la société Leoni", rightEdge, closingY + 8, {
    align: "right",
  });
  doc.text(doctorName, rightEdge, closingY + 16, { align: "right" });

  doc.setFont("times", "bold");
  doc.setFontSize(9.5);
  doc.text(doc.splitTextToSize(FOOTER_NOTE, contentWidth), margin, pageHeight - 12);

  const filename = `demande_expertise_${sanitizeFilenamePart(
    formData.nom,
    "Nom"
  )}_${sanitizeFilenamePart(formData.prenom, "Prenom")}.pdf`;

  doc.save(filename);
}
