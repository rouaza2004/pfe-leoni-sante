import { jsPDF } from "jspdf";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

// Positions en millimetres.
// Ajustez ces coordonnees apres un premier test d'impression pour coller
// parfaitement a votre formulaire scanne.
const PDF_POSITIONS = {
  nomPrenom: { x: 58, y: 54, maxWidth: 90 },
  age: { x: 165, y: 54, maxWidth: 18, align: "center" },
  entreprise: { x: 38, y: 67, maxWidth: 70 },
  posteTravail: { x: 125, y: 67, maxWidth: 58 },
  date: { x: 157, y: 42, maxWidth: 28, align: "center" },
  renseignementsCliniques: { x: 24, y: 92, maxWidth: 162, lineHeight: 5 },
  visiotest: { x: 28, y: 154, size: 4 },
  audiogramme: { x: 28, y: 166, size: 4 },
  ecg: { x: 108, y: 154, size: 4 },
  efr: { x: 108, y: 166, size: 4 },
};

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function ensureImageDataUrl(source) {
  if (!source) return "";

  if (typeof File !== "undefined" && source instanceof File) {
    return fileToDataUrl(source);
  }

  if (typeof source === "string" && source.startsWith("data:image/")) {
    return source;
  }

  if (typeof source === "string") {
    const response = await fetch(source);
    const blob = await response.blob();
    return fileToDataUrl(blob);
  }

  return "";
}

function detectImageFormat(dataUrl) {
  if (typeof dataUrl !== "string") return "JPEG";
  if (dataUrl.startsWith("data:image/png")) return "PNG";
  return "JPEG";
}

function drawWrappedText(doc, text, position) {
  const value = String(text || "").trim();
  if (!value) return;

  const lines = doc.splitTextToSize(value, position.maxWidth || 100);
  doc.text(lines, position.x, position.y, {
    align: position.align || "left",
    baseline: "top",
    maxWidth: position.maxWidth,
    lineHeightFactor: (position.lineHeight || 5) / 3.5,
  });
}

function drawCheckbox(doc, checked, position) {
  if (!checked) return;

  const { x, y, size = 4 } = position;

  // Une croix simple fonctionne bien au-dessus d'une case imprimee/scannee.
  doc.setLineWidth(0.5);
  doc.line(x, y, x + size, y + size);
  doc.line(x + size, y, x, y + size);
}

function formatDisplayDate(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }
  return String(value);
}

export async function generateExamenComplementairePdf(data) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const normalized = {
    nomPrenom: data?.nomPrenom || "",
    age: data?.age || "",
    entreprise: data?.entreprise || "",
    posteTravail: data?.posteTravail || "",
    renseignementsCliniques: data?.renseignementsCliniques || "",
    date: formatDisplayDate(data?.date),
    visiotest: Boolean(data?.visiotest),
    audiogramme: Boolean(data?.audiogramme),
    ecg: Boolean(data?.ecg),
    efr: Boolean(data?.efr),
  };

  const backgroundImage = await ensureImageDataUrl(data?.backgroundImage);
  if (backgroundImage) {
    doc.addImage(
      backgroundImage,
      detectImageFormat(backgroundImage),
      0,
      0,
      A4_WIDTH_MM,
      A4_HEIGHT_MM,
    );
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(20, 23, 26);

  drawWrappedText(doc, normalized.nomPrenom, PDF_POSITIONS.nomPrenom);
  drawWrappedText(doc, normalized.age, PDF_POSITIONS.age);
  drawWrappedText(doc, normalized.entreprise, PDF_POSITIONS.entreprise);
  drawWrappedText(doc, normalized.posteTravail, PDF_POSITIONS.posteTravail);
  drawWrappedText(doc, normalized.date, PDF_POSITIONS.date);
  drawWrappedText(
    doc,
    normalized.renseignementsCliniques,
    PDF_POSITIONS.renseignementsCliniques,
  );

  drawCheckbox(doc, normalized.visiotest, PDF_POSITIONS.visiotest);
  drawCheckbox(doc, normalized.audiogramme, PDF_POSITIONS.audiogramme);
  drawCheckbox(doc, normalized.ecg, PDF_POSITIONS.ecg);
  drawCheckbox(doc, normalized.efr, PDF_POSITIONS.efr);

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);

  return {
    doc,
    blob,
    url,
    open() {
      window.open(url, "_blank", "noopener,noreferrer");
    },
    download(filename = "examen-complementaire.pdf") {
      doc.save(filename);
    },
    print() {
      const printWindow = window.open(url, "_blank", "noopener,noreferrer");
      if (!printWindow) return;
      const launchPrint = () => printWindow.print();
      printWindow.addEventListener("load", launchPrint, { once: true });
      window.setTimeout(launchPrint, 800);
    },
    revoke() {
      URL.revokeObjectURL(url);
    },
  };
}
