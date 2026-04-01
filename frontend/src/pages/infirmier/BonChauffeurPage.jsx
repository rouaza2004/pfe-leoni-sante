import { useEffect, useMemo, useState } from "react";
import { api } from "@/api/api";
import { FileText, FileDown, Eye, Trash2, Plus } from "lucide-react";
import { jsPDF } from "jspdf";

const ModalShell = ({ open, title, onClose, children, footer }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            X
          </button>
        </div>
        <div className="max-h-[70vh] overflow-auto px-6 py-4">{children}</div>
        {footer && <div className="border-t border-slate-200 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
};

const emptyForm = {
  nom_chauffeur: "",
  date: "",
  heure: "",
  medecin: "",
  infirmier: "",
  nom_malade: "",
  matricule: "",
  telephone: "",
  motif: "",
  service_plant: "",
  moyen_transport: "",
  hopital: "",
  accompagnant: "",
  montant_prime: "",
};

const formatOrderNumber = (value) => String(value || 0).padStart(6, "0");

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR");
};

const formatTime = (value) => value || "-";

const buildPdf = (order) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Ordre de Transport", 15, 16);
  doc.setFontSize(12);
  doc.text(`N° ${formatOrderNumber(order.numero_ordre)}`, 70, 16);
  doc.setFontSize(18);
  doc.setTextColor(200, 0, 0);
  doc.text("LEONI", pageWidth - 35, 16, { align: "center" });
  doc.setTextColor(0, 0, 0);

  doc.setLineWidth(0.3);
  doc.rect(15, 22, pageWidth - 30, 120);

  const rows = [
    ["Nom Chauffeur", order.nom_chauffeur || ""],
    ["Date", formatDate(order.date)],
    ["Heure", formatTime(order.heure)],
    ["Médecin", order.medecin || ""],
    ["Infirmier", order.infirmier || ""],
    ["Nom Malade", order.nom_malade || ""],
    ["Matricule", order.matricule || ""],
    ["N° Téléphone", order.telephone || ""],
    ["Motif", order.motif || ""],
    ["Service/Plant", order.service_plant || ""],
    ["Moyen de Transport", order.moyen_transport || ""],
    ["Hôpital", order.hopital || ""],
    ["Accompagnant", order.accompagnant || ""],
    ["Montant Prime", order.montant_prime ? `${order.montant_prime} DT` : ""],
  ];

  let y = 28;
  const labelX = 20;
  const valueX = 75;
  const rowHeight = 8;

  rows.forEach(([label, value], index) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(label, labelX, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value || ""), valueX, y);
    if (index < rows.length - 1) {
      doc.line(15, y + 3, pageWidth - 15, y + 3);
    }
    y += rowHeight;
  });

  const signatureY = 160;
  doc.setFont("helvetica", "bold");
  doc.text("Chauffeur", 25, signatureY);
  doc.text("Signature", pageWidth / 2 - 10, signatureY);
  doc.text("Responsable Médical", pageWidth - 55, signatureY);
  doc.line(20, signatureY + 20, 70, signatureY + 20);
  doc.line(pageWidth / 2 - 25, signatureY + 20, pageWidth / 2 + 25, signatureY + 20);
  doc.line(pageWidth - 80, signatureY + 20, pageWidth - 20, signatureY + 20);

  return doc;
};

export default function BonChauffeurPage() {
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const nextOrder = useMemo(() => {
    const maxValue = orders.reduce((acc, item) => Math.max(acc, item.numero_ordre || 0), 0);
    return maxValue + 1;
  }, [orders]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/medical/bon-chauffeurs/");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err?.response?.data?.detail || "Erreur lors du chargement des bons.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.nom_chauffeur || !form.date || !form.heure || !form.nom_malade) {
      setError("Veuillez remplir au minimum le nom du chauffeur, la date, l'heure et le nom du malade.");
      return;
    }

    try {
      setError("");
      await api.post("/medical/bon-chauffeurs/", {
        ...form,
        montant_prime: form.montant_prime ? Number(form.montant_prime) : null,
      });
      setForm(emptyForm);
      await loadOrders();
    } catch (err) {
      setError(err?.response?.data?.detail || "Erreur lors de l'enregistrement.");
    }
  };

  const handleDelete = async (order) => {
    const confirmed = window.confirm("Supprimer ce bon chauffeur ?");
    if (!confirmed) return;
    try {
      await api.delete(`/medical/bon-chauffeurs/${order.id}/`);
      await loadOrders();
    } catch (err) {
      setError(err?.response?.data?.detail || "Erreur lors de la suppression.");
    }
  };

  const handlePdf = (order) => {
    const doc = buildPdf(order);
    doc.save(`bon-chauffeur-${formatOrderNumber(order.numero_ordre)}.pdf`);
  };

  const handleGeneratePdf = () => {
    const payload = {
      numero_ordre: nextOrder,
      ...form,
    };
    handlePdf(payload);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Bon Chauffeur</h1>
            <p className="mt-2 text-sm text-slate-500">
              Ordre de transport — enregistrement et génération PDF
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="text-xs font-semibold text-slate-600">N° Ordre</label>
            <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
              {formatOrderNumber(nextOrder)}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Nom Chauffeur</label>
            <input
              value={form.nom_chauffeur}
              onChange={(e) => handleChange("nom_chauffeur", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              type="text"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Date</label>
            <input
              value={form.date}
              onChange={(e) => handleChange("date", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              type="date"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Heure</label>
            <input
              value={form.heure}
              onChange={(e) => handleChange("heure", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              type="time"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Médecin</label>
            <input
              value={form.medecin}
              onChange={(e) => handleChange("medecin", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              type="text"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Infirmier</label>
            <input
              value={form.infirmier}
              onChange={(e) => handleChange("infirmier", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              type="text"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Nom Malade</label>
            <input
              value={form.nom_malade}
              onChange={(e) => handleChange("nom_malade", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              type="text"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Matricule</label>
            <input
              value={form.matricule}
              onChange={(e) => handleChange("matricule", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              type="text"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">N° Téléphone</label>
            <input
              value={form.telephone}
              onChange={(e) => handleChange("telephone", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              type="text"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Service / Plant</label>
            <input
              value={form.service_plant}
              onChange={(e) => handleChange("service_plant", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              type="text"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Moyen de Transport</label>
            <input
              value={form.moyen_transport}
              onChange={(e) => handleChange("moyen_transport", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              type="text"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Hôpital</label>
            <input
              value={form.hopital}
              onChange={(e) => handleChange("hopital", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              type="text"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Accompagnant</label>
            <input
              value={form.accompagnant}
              onChange={(e) => handleChange("accompagnant", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              type="text"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Montant Prime (DT)</label>
            <input
              value={form.montant_prime}
              onChange={(e) => handleChange("montant_prime", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              type="number"
              min="0"
              step="0.01"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="text-xs font-semibold text-slate-600">Motif</label>
            <textarea
              value={form.motif}
              onChange={(e) => handleChange("motif", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              rows={3}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGeneratePdf}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <FileText size={16} />
            Générer PDF
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus size={16} />
            Enregistrer
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Bons enregistrés</h2>
            <p className="text-sm text-slate-500">Historique des ordres de transport</p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">Chargement...</div>
        ) : orders.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">Aucun bon enregistré.</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-400">
                <tr className="border-b">
                  <th className="py-2">N°</th>
                  <th className="py-2">Nom Chauffeur</th>
                  <th className="py-2">Nom Malade</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Heure</th>
                  <th className="py-2">Hôpital</th>
                  <th className="py-2">Moyen</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b last:border-none">
                    <td className="py-3 font-medium text-slate-800">
                      {formatOrderNumber(order.numero_ordre)}
                    </td>
                    <td className="py-3 text-slate-700">{order.nom_chauffeur}</td>
                    <td className="py-3 text-slate-700">{order.nom_malade}</td>
                    <td className="py-3 text-slate-600">{formatDate(order.date)}</td>
                    <td className="py-3 text-slate-600">{formatTime(order.heure)}</td>
                    <td className="py-3 text-slate-600">{order.hopital || "-"}</td>
                    <td className="py-3 text-slate-600">{order.moyen_transport || "-"}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelected(order)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                          title="Voir"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePdf(order)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                          title="Télécharger PDF"
                        >
                          <FileDown size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(order)}
                          className="rounded-lg border border-rose-200 p-2 text-rose-500 hover:bg-rose-50"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ModalShell
        open={!!selected}
        title="Détails du bon chauffeur"
        onClose={() => setSelected(null)}
        footer={
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
          >
            Fermer
          </button>
        }
      >
        {selected && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">N° Ordre</p>
              <p className="font-semibold text-slate-800">
                {formatOrderNumber(selected.numero_ordre)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Nom Chauffeur</p>
              <p className="font-semibold text-slate-800">{selected.nom_chauffeur}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Nom Malade</p>
              <p className="font-semibold text-slate-800">{selected.nom_malade}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Date / Heure</p>
              <p className="font-semibold text-slate-800">
                {formatDate(selected.date)} {formatTime(selected.heure)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Médecin</p>
              <p className="font-semibold text-slate-800">{selected.medecin || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Infirmier</p>
              <p className="font-semibold text-slate-800">{selected.infirmier || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Service / Plant</p>
              <p className="font-semibold text-slate-800">{selected.service_plant || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Moyen de Transport</p>
              <p className="font-semibold text-slate-800">{selected.moyen_transport || "-"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-slate-500">Motif</p>
              <p className="font-semibold text-slate-800">{selected.motif || "-"}</p>
            </div>
          </div>
        )}
      </ModalShell>
    </div>
  );
}
