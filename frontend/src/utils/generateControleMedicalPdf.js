import { jsPDF } from "jspdf";

const FOOTER_LEFT = "Leoni Menzel Hayet";
const FOOTER_RIGHT = "Service Médical";

function normalize(value, fallback = "") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR");
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

function drawField(doc, label, value, x, y, offset = 28) {
  doc.setFont("times", "bold");
  doc.text(label, x, y);
  doc.setFont("times", "normal");
  if (value) {
    doc.text(value, x + offset, y);
  }
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

export function downloadControleMedicalPdf(formData) {
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

  const date = formatDate(formData.date);
  const matricule = normalize(formData.matricule);
  const segment = normalize(formData.segment);
  const nom = normalize(formData.nom);
  const prenom = normalize(formData.prenom);
  const reposPrescrit = normalize(formData.reposPrescrit);
  const avis = normalize(formData.avisMedecinControleur, " ");
  const medecinControleur = normalize(formData.medecinControleur);

  doc.setTextColor(0, 0, 0);
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text("Contrôle médical", pageWidth / 2, 24, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(12);
  drawField(doc, "Le :", date, margin, 42);
  drawField(doc, "Matricule :", matricule, margin, 54, 28);

  doc.setFont("times", "bold");
  doc.text("Segment :", margin + 82, 54);
  doc.setFont("times", "normal");
  if (segment) {
    doc.text(segment, margin + 106, 54);
  }

  drawField(doc, "Nom :", nom, margin, 66);
  drawField(doc, "Prénom :", prenom, margin, 78);
  drawField(doc, "Repos prescrit :", reposPrescrit, margin, 90, 38);

  doc.setFont("times", "bold");
  doc.text("Avis du médecin contrôleur :", margin, 112);

  doc.setFont("times", "normal");
  doc.setFontSize(11);
  const avisLines = doc.splitTextToSize(avis, contentWidth);
  doc.text(avisLines, margin, 122);

  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.text("Cachet et signature", rightEdge, 232, { align: "right" });

  doc.setFont("times", "normal");
  doc.setFontSize(11);
  if (medecinControleur) {
    doc.text(medecinControleur, rightEdge, 242, { align: "right" });
  }

  doc.setFont("times", "bold");
  doc.setFontSize(10.5);
  doc.line(margin, pageHeight - 22, rightEdge, pageHeight - 22);
  doc.text(FOOTER_LEFT, margin, pageHeight - 14);
  doc.text(FOOTER_RIGHT, rightEdge, pageHeight - 14, { align: "right" });

  const filename = `controle_medical_${sanitizeFilenamePart(
    formData.nom,
    "Nom"
  )}_${sanitizeFilenamePart(formData.prenom, "Prenom")}.pdf`;

  openPdfPreview(doc, filename);
  return filename;
}
