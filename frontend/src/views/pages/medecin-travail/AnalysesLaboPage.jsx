import { useEffect, useMemo, useState } from "react";
import { FileText, RotateCcw } from "lucide-react";
import { jsPDF } from "jspdf";
import { useLocation } from "react-router-dom";

const GMT_LOGO_URL = "/gmt_logo_transparent.png?v=2";
const CERT_LOGO_URL = "/cert_logo.png";
const amiriUrl = "/amiri/Amiri-Regular.ttf";

const INITIAL_FORM = {
  numero_labo: "",
  nom_prenom: "",
  age: "",
  civilite: "M.",
  matricule: "",
  cin: "",
  gsm: "",
  entreprise: "",
  poste_travail: "",
  renseignements_cliniques: "",
  date: "",
  examens: {
    glycemie: false,
    creatinine: false,
    nfs: false,
    vs: false,
    transaminases: false,
    acide_urique: false,
    triglycerides: false,
    cholesterol: false,
    examen_selles: false,
  },
};

const EXAMENS = [
  { key: "glycemie", label: "Glycémie" },
  { key: "creatinine", label: "Créatinine" },
  { key: "nfs", label: "NFS" },
  { key: "vs", label: "VS" },
  { key: "transaminases", label: "Transaminases" },
  { key: "acide_urique", label: "Acide urique" },
  { key: "triglycerides", label: "Triglycérides" },
  { key: "cholesterol", label: "Cholestérol" },
  { key: "examen_selles", label: "Examens copro-parasitologiques des selles" },
];

const ARABIC_HEADER = "مجمع طب الشغل";
const ARABIC_SUBHEADER = "بولاية المنستير";

const ARABIC_NOTE = "لإجراء التحاليل المخبرية يجب الحضور صائما و قبل الساعة 10 صباحا";


const mmToPx = (mm) => mm * 3.78;

const loadImageAsDataUrl = async (url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type || !blob.type.startsWith("image/")) return null;
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return null;
  }
};

const ensureAmiriFont = (() => {
  let loaded = false;
  return async () => {
    if (loaded) return;
    const font = new FontFace("Amiri", `url(${amiriUrl})`);
    await font.load();
    document.fonts.add(font);
    loaded = true;
  };
})();

const renderArabicBlock = async (text, fontSize, maxWidthMm, color = "#0f172a") => {
  await ensureAmiriFont();
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return { dataUrl: null, widthMm: 0, heightMm: 0 };

  const fontPx = fontSize;
  const maxWidthPx = Math.ceil(mmToPx(maxWidthMm));
  ctx.font = `${fontPx}px Amiri`;
  const words = text.split(" ");
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidthPx) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  });
  if (current) lines.push(current);

  const lineHeight = fontPx * 1.4;
  canvas.width = maxWidthPx;
  canvas.height = Math.ceil(lines.length * lineHeight + 4);
  const ctx2 = canvas.getContext("2d");
  if (!ctx2) return { dataUrl: null, widthMm: 0, heightMm: 0 };
  ctx2.clearRect(0, 0, canvas.width, canvas.height);
  ctx2.font = `${fontPx}px Amiri`;
  ctx2.fillStyle = color;
  ctx2.textAlign = "right";
  ctx2.textBaseline = "top";
  ctx2.direction = "rtl";
  lines.forEach((line, idx) => {
    ctx2.fillText(line, canvas.width - 2, 2 + idx * lineHeight);
  });

  return {
    dataUrl: canvas.toDataURL("image/png"),
    widthMm: maxWidthMm,
    heightMm: canvas.height / mmToPx(1),
  };
};

const drawCheckbox = (doc, x, y, size, checked) => {
  doc.rect(x, y, size, size);
  if (checked) {
    doc.setLineWidth(0.6);
    doc.line(x + 1, y + size / 2, x + size / 2.2, y + size - 1.2);
    doc.line(x + size / 2.2, y + size - 1.2, x + size - 1, y + 1);
  }
};

const drawLabelLine = (doc, label, x, y, lineWidth) => {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(label, x, y);
  const textWidth = doc.getTextWidth(label);
  const lineX = x + textWidth + 2;
  doc.setLineDash([1.5, 1.2], 0);
  doc.line(lineX, y + 1.2, lineX + lineWidth, y + 1.2);
  doc.setLineDash([], 0);
};

const buildPdf = async (form) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;

  doc.setFont("helvetica", "normal");
  doc.setTextColor("#0f172a");

  const logoDataUrl = await loadImageAsDataUrl(GMT_LOGO_URL);
  const certLogoDataUrl = await loadImageAsDataUrl(CERT_LOGO_URL);
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", pageWidth / 2 - 10, 10, 20, 16);
  } else {
    doc.rect(pageWidth / 2 - 10, 10, 20, 16);
  }

  doc.setFontSize(8.5);
  doc.text(`N° du Labo : ${form.numero_labo || "..............."}`, margin, 14);
  doc.setFontSize(8.5);
  doc.text("Groupement de Médecine du Travail", margin, 20);
  doc.text("Du Gouvernorat de Monastir", margin, 24);

  doc.setFontSize(7.5);
  doc.text("Certifié ISO 9001 : 2008", pageWidth / 2, 30, { align: "center" });

  doc.setFontSize(8.5);
  doc.rect(pageWidth - margin - 28, 10, 28, 10);
  doc.text("FR - VME - 06/02", pageWidth - margin - 26, 16.5);

  const arabicHeader = await renderArabicBlock(ARABIC_HEADER, 11, 45);
  if (arabicHeader.dataUrl) {
    doc.addImage(arabicHeader.dataUrl, "PNG", pageWidth - margin - 45, 22, arabicHeader.widthMm, arabicHeader.heightMm);
  }
  const arabicSub = await renderArabicBlock(ARABIC_SUBHEADER, 10, 45);
  if (arabicSub.dataUrl) {
    doc.addImage(arabicSub.dataUrl, "PNG", pageWidth - margin - 45, 28, arabicSub.widthMm, arabicSub.heightMm);
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DEMANDE D'EXAMENS DE LABORATOIRE", pageWidth / 2, 40, { align: "center" });
  doc.setFont("helvetica", "normal");

  if (form.numero_labo) {
    doc.setFontSize(10);
    doc.text(`N° ${form.numero_labo}`, pageWidth - margin - 20, 46);
  }

  let y = 52;
  drawLabelLine(doc, "NOM ET PRENOM :", margin, y, 70);
  doc.text(form.nom_prenom || "", margin + 35, y - 0.6);
  drawLabelLine(doc, "AGE :", pageWidth - margin - 60, y, 18);
  doc.text(form.age || "", pageWidth - margin - 40, y - 0.6);
  drawLabelLine(doc, "Mle :", pageWidth - margin - 30, y, 18);
  doc.text(form.matricule || "", pageWidth - margin - 10, y - 0.6, { align: "right" });

  y += 8;
  drawLabelLine(doc, "C.I.N :", margin, y, 45);
  doc.text(form.cin || "", margin + 20, y - 0.6);
  drawLabelLine(doc, "GSM :", pageWidth / 2 - 10, y, 40);
  doc.text(form.gsm || "", pageWidth / 2 + 12, y - 0.6);

  y += 8;
  drawLabelLine(doc, "ENTREPRISE :", margin, y, 70);
  doc.text(form.entreprise || "", margin + 30, y - 0.6);
  drawLabelLine(doc, "POSTE DE TRAVAIL :", pageWidth / 2 - 10, y, 70);
  doc.text(form.poste_travail || "", pageWidth / 2 + 30, y - 0.6);

  y += 8;
  drawLabelLine(doc, "RENSEIGNEMENTS CLINIQUES :", margin, y, pageWidth - margin * 2 - 60);
  doc.text(form.renseignements_cliniques || "", margin + 60, y - 0.6);

  y += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("EXAMENS DE LABORATOIRE :", margin, y);
  doc.setFont("helvetica", "normal");

  y += 7;
  const boxSize = 4.2;
  EXAMENS.forEach((item) => {
    drawCheckbox(doc, margin, y - 3.5, boxSize, form.examens[item.key]);
    doc.setFontSize(9.5);
    doc.text(item.label, margin + 7, y);
    y += 6.5;
  });

  y += 3;
  doc.setFontSize(8.5);
  doc.text(
    "NB: Pour effectuer les analyses de laboratoire, vous devez vous présenter à jeun et avant 10h du matin.",
    margin,
    y,
    { maxWidth: pageWidth - margin * 2 }
  );

  const arabicNote = await renderArabicBlock(ARABIC_NOTE, 11, pageWidth - margin * 2);
  if (arabicNote.dataUrl) {
    doc.addImage(arabicNote.dataUrl, "PNG", margin, y + 6, arabicNote.widthMm, arabicNote.heightMm);
  }

  const footerY = pageHeight - 20;
  doc.setFontSize(9.5);
  drawLabelLine(doc, "DATE :", margin, footerY, 35);
  doc.text(form.date || "", margin + 14, footerY - 0.6);
  doc.text("CACHET ET SIGNATURE DU MÉDECIN DU TRAVAIL", pageWidth - margin - 90, footerY);


  return doc;
};

export default function AnalysesLaboPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const location = useLocation();
  const [prefillError, setPrefillError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const collabId = params.get("collaborateurId");
    if (!collabId) return;

    let cancelled = false;

    const load = async () => {
      try {
        setPrefillError("");
        const [collabRes, dossierRes] = await Promise.all([
          api.get(`/collaborateurs/${collabId}/`),
          api.get(`/medical/dossier/${collabId}/`),
        ]);
        if (cancelled) return;
        const c = collabRes.data || {};
        const d = dossierRes.data || {};
        setForm((prev) => ({
          ...prev,
          nom_prenom: `${c.nom || ""} ${c.prenom || ""}`.trim(),
          age: c.age || "",
          cin: c.cin || "",
          gsm: c.telephone || c.gsm || "",
          entreprise: d.entreprise || "",
          poste_travail: c.poste || "",
          matricule: c.matricule || "",
        }));
      } catch (e) {
        if (!cancelled) setPrefillError("Impossible de pré-remplir les données.");
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [location.search]);

  const dateValue = useMemo(() => {
    if (form.date) return form.date;
    const today = new Date();
    return today.toISOString().slice(0, 10);
  }, [form.date]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleExamChange = (key) => {
    setForm((prev) => ({
      ...prev,
      examens: {
        ...prev.examens,
        [key]: !prev.examens[key],
      },
    }));
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
  };

  const handleGenerate = async () => {
    const doc = await buildPdf({ ...form, date: dateValue });
    doc.save("demande-examens-laboratoire.pdf");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">
          Demande d’examens de laboratoire
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Remplir le formulaire puis générer le document PDF.
        </p>
      </div>

      {prefillError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {prefillError}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Informations</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">N° du Labo</label>
                <input
                  name="numero_labo"
                  value={form.numero_labo}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Date</label>
                <input
                  type="date"
                  name="date"
                  value={dateValue}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Nom et prénom</label>
                <input
                  name="nom_prenom"
                  value={form.nom_prenom}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Civilité</label>
                <select
                  name="civilite"
                  value={form.civilite}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="M.">M.</option>
                  <option value="Mme">Mme</option>
                  <option value="Mlle">Mlle</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Âge</label>
                <input
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">C.I.N</label>
                <input
                  name="cin"
                  value={form.cin}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">GSM</label>
                <input
                  name="gsm"
                  value={form.gsm}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Entreprise</label>
                <input
                  name="entreprise"
                  value={form.entreprise}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Poste de travail</label>
                <input
                  name="poste_travail"
                  value={form.poste_travail}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Renseignements cliniques</label>
                <textarea
                  name="renseignements_cliniques"
                  value={form.renseignements_cliniques}
                  onChange={handleChange}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Examens de laboratoire</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {EXAMENS.map((exam) => (
                <label
                  key={exam.key}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={form.examens[exam.key]}
                    onChange={() => handleExamChange(exam.key)}
                  />
                  {exam.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-base font-semibold text-slate-900">Actions</h3>
            <p className="mt-2 text-sm text-slate-500">
              Générez la version PDF au format A4 à partir des informations saisies.
            </p>
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={handleGenerate}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                <FileText size={16} />
                Générer PDF
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw size={16} />
                Réinitialiser
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            Le PDF généré reprend la mise en page du formulaire papier (entête, zones de
            saisie, cases à cocher, notes). Les logos peuvent être remplacés en plaçant
            un fichier `gmt_logo.png` dans le dossier public si besoin.
          </div>
        </div>
      </div>
    </div>
  );
}

