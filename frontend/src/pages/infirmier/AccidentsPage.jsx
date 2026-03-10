import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Eye,
  Send,
  TriangleAlert,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/api/api";

const emptyForm = {
  collaborateurId: "",
  date_accident: "",
  heure_accident: "",
  lieu_accident: "",
  circonstances: "",
  cause: "",
  nature_lesion: "",
  siege_lesion: "",
  transport_hopital: "",
  temoin1_nom: "",
  temoin1_telephone: "",
  temoin1_matricule: "",
  temoin2_nom: "",
  temoin2_telephone: "",
  temoin2_matricule: "",
  duree_arret: "",
  ipp: "",
};

export default function AccidentsPage() {
  const [accidents, setAccidents] = useState([]);
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedAccident, setSelectedAccident] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const selectedCollaborateur = useMemo(() => {
    return (
      collaborateurs.find((c) => String(c.id) === String(form.collaborateurId)) || null
    );
  }, [collaborateurs, form.collaborateurId]);

  const filteredAccidents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accidents;

    return accidents.filter((item) =>
      [
        item.date_accident,
        item.heure_accident,
        item.collaborateur,
        item.matricule,
        item.segment,
        item.poste,
        item.lieu_accident,
        item.nature_lesion,
        item.siege_lesion,
        item.cause,
        item.circonstances,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [accidents, search]);

  const loadData = async () => {
    try {
      setLoading(true);
      setErr("");

      const [collabRes, accidentsRes] = await Promise.all([
        api.get("/collaborateurs/"),
        api.get("/medical/accidents-travail/"),
      ]);

      const collabs = Array.isArray(collabRes.data) ? collabRes.data : [];
      const accidentsData = Array.isArray(accidentsRes.data) ? accidentsRes.data : [];

      setCollaborateurs(collabs);

      const dossiersResults = await Promise.all(
        collabs.map(async (collab) => {
          try {
            const dRes = await api.get(`/medical/dossier/${collab.id}/`);
            return {
              dossierId: dRes.data?.id,
              collab,
            };
          } catch (e) {
            console.error("Erreur dossier collaborateur", collab.id, e);
            return null;
          }
        })
      );

      const dossierMap = {};
      dossiersResults.forEach((entry) => {
        if (entry?.dossierId) {
          dossierMap[entry.dossierId] = entry.collab;
        }
      });

      const enriched = accidentsData.map((item) => {
        const collab = dossierMap[item.dossier] || {};

        return {
          ...item,
          collaborateur:
            `${collab.prenom || ""} ${collab.nom || ""}`.trim() || "—",
          matricule: collab.matricule || "—",
          segment:
            collab.segment_nom ||
            collab.segment?.nom ||
            collab.segment ||
            "—",
          poste:
            collab.poste_nom ||
            collab.poste?.nom ||
            collab.poste ||
            "—",
          telephone: collab.telephone || collab.tel || "—",
        };
      });

      setAccidents(enriched);
    } catch (e) {
      console.error(e);
      setErr("Erreur lors du chargement des accidents.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.collaborateurId) {
      alert("Veuillez sélectionner un collaborateur.");
      return;
    }

    try {
      setSaving(true);

      const dossierRes = await api.get(`/medical/dossier/${form.collaborateurId}/`);
      const dossierId = dossierRes.data?.id;

      if (!dossierId) {
        alert("Dossier médical introuvable.");
        return;
      }

      await api.post("/medical/accidents-travail/", {
        dossier: dossierId,
        date_accident: form.date_accident,
        heure_accident: form.heure_accident || null,
        lieu_accident: form.lieu_accident,
        circonstances: form.circonstances,
        cause: form.cause,
        nature_lesion: form.nature_lesion,
        siege_lesion: form.siege_lesion,
        transport_hopital: form.transport_hopital,
        temoin1_nom: form.temoin1_nom,
        temoin1_telephone: form.temoin1_telephone,
        temoin1_matricule: form.temoin1_matricule,
        temoin2_nom: form.temoin2_nom,
        temoin2_telephone: form.temoin2_telephone,
        temoin2_matricule: form.temoin2_matricule,
        duree_arret: form.duree_arret ? Number(form.duree_arret) : null,
        ipp: form.ipp || "",
      });

      resetForm();
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'enregistrement de l'accident.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendHSEE = async (accidentId) => {
    try {
      setSendingId(accidentId);
      await api.post(`/medical/accidents-travail/${accidentId}/send-hsee/`);
      await loadData();

      if (selectedAccident?.id === accidentId) {
        setSelectedAccident((prev) =>
          prev ? { ...prev, envoye_hsee: true } : prev
        );
      }
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'envoi au responsable HSEE.");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Module Infirmier</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Accidents de travail
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Déclaration, enquête initiale et envoi vers le responsable HSEE.
            </p>
          </div>

          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus size={16} />
            {showForm ? "Fermer le formulaire" : "Ajouter accident"}
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {showForm && (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Enquête initiale d&apos;accident
            </h2>
            <p className="text-sm text-slate-500">
              Renseignez les informations principales avant envoi à HSEE.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="xl:col-span-3">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Collaborateur
              </label>
              <select
                name="collaborateurId"
                value={form.collaborateurId}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              >
                <option value="">Sélectionner un collaborateur</option>
                {collaborateurs.map((collab) => (
                  <option key={collab.id} value={collab.id}>
                    {(collab.prenom || "") + " " + (collab.nom || "")} -{" "}
                    {collab.matricule || "Sans matricule"}
                  </option>
                ))}
              </select>
            </div>

            <ReadOnlyField label="Matricule" value={selectedCollaborateur?.matricule || ""} />
            <ReadOnlyField
              label="Segment"
              value={
                selectedCollaborateur?.segment_nom ||
                selectedCollaborateur?.segment?.nom ||
                selectedCollaborateur?.segment ||
                ""
              }
            />
            <ReadOnlyField
              label="Poste occupé"
              value={
                selectedCollaborateur?.poste_nom ||
                selectedCollaborateur?.poste?.nom ||
                selectedCollaborateur?.poste ||
                ""
              }
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
              <input
                type="date"
                name="date_accident"
                value={form.date_accident}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Heure</label>
              <input
                type="time"
                name="heure_accident"
                value={form.heure_accident}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Lieu de l&apos;accident
              </label>
              <input
                type="text"
                name="lieu_accident"
                value={form.lieu_accident}
                onChange={handleChange}
                placeholder="Atelier / ligne / magasin / ..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nature lésion
              </label>
              <input
                type="text"
                name="nature_lesion"
                value={form.nature_lesion}
                onChange={handleChange}
                required
                placeholder="Plaie / fracture / traumatisme ..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Siège lésion
              </label>
              <input
                type="text"
                name="siege_lesion"
                value={form.siege_lesion}
                onChange={handleChange}
                required
                placeholder="Main / Bras / Œil / ..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Cause
              </label>
              <input
                type="text"
                name="cause"
                value={form.cause}
                onChange={handleChange}
                required
                placeholder="Machine / faux mouvement / chute ..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div className="md:col-span-2 xl:col-span-3">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Circonstances de l&apos;accident
              </label>
              <textarea
                name="circonstances"
                value={form.circonstances}
                onChange={handleChange}
                rows={4}
                placeholder="Décrire brièvement ce qui s'est passé..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Transport hôpital
              </label>
              <input
                type="text"
                name="transport_hopital"
                value={form.transport_hopital}
                onChange={handleChange}
                placeholder="Oui / Non / Ambulance / Véhicule société..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Durée arrêt (jours)
              </label>
              <input
                type="number"
                min="0"
                name="duree_arret"
                value={form.duree_arret}
                onChange={handleChange}
                placeholder="0"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">IPP</label>
              <input
                type="text"
                name="ipp"
                value={form.ipp}
                onChange={handleChange}
                placeholder="Ex: 5%"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div className="xl:col-span-3 pt-2">
              <h3 className="text-sm font-semibold text-slate-900">Témoin 1</h3>
            </div>

            <InputField label="Nom témoin 1" name="temoin1_nom" value={form.temoin1_nom} onChange={handleChange} />
            <InputField label="Téléphone témoin 1" name="temoin1_telephone" value={form.temoin1_telephone} onChange={handleChange} />
            <InputField label="Matricule témoin 1" name="temoin1_matricule" value={form.temoin1_matricule} onChange={handleChange} />

            <div className="xl:col-span-3 pt-2">
              <h3 className="text-sm font-semibold text-slate-900">Témoin 2</h3>
            </div>

            <InputField label="Nom témoin 2" name="temoin2_nom" value={form.temoin2_nom} onChange={handleChange} />
            <InputField label="Téléphone témoin 2" name="temoin2_telephone" value={form.temoin2_telephone} onChange={handleChange} />
            <InputField label="Matricule témoin 2" name="temoin2_matricule" value={form.temoin2_matricule} onChange={handleChange} />

            <div className="md:col-span-2 xl:col-span-3 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Liste des accidents</h2>
            <p className="text-sm text-slate-500">
              Recherche, consultation et envoi au responsable HSEE.
            </p>
          </div>

          <div className="relative w-full lg:w-96">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Rechercher collaborateur, matricule, lésion..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-500">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Collaborateur</th>
                  <th className="px-3 py-3 font-medium">Matricule</th>
                  <th className="px-3 py-3 font-medium">Lieu</th>
                  <th className="px-3 py-3 font-medium">Lésion</th>
                  <th className="px-3 py-3 font-medium">Statut</th>
                  <th className="px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredAccidents.length > 0 ? (
                  filteredAccidents.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-3 text-slate-700">
                        <div>{item.date_accident || "-"}</div>
                        <div className="text-xs text-slate-400">{item.heure_accident || ""}</div>
                      </td>

                      <td className="px-3 py-3 font-medium text-slate-900">
                        {item.collaborateur}
                      </td>

                      <td className="px-3 py-3 text-slate-700">{item.matricule}</td>

                      <td className="px-3 py-3 text-slate-700">
                        {item.lieu_accident || "-"}
                      </td>

                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          <TriangleAlert size={12} />
                          {item.nature_lesion}
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        {item.envoye_hsee ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2 size={12} />
                            Envoyé HSEE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            En attente
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedAccident(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Eye size={14} />
                            Voir
                          </button>

                          {!item.envoye_hsee && (
                            <button
                              onClick={() => handleSendHSEE(item.id)}
                              disabled={sendingId === item.id}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {sendingId === item.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Send size={14} />
                              )}
                              Envoyer HSEE
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-3 py-10 text-center text-slate-500">
                      Aucun accident trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedAccident && (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Détail de l&apos;accident
              </h2>
              <p className="text-sm text-slate-500">
                Fiche de consultation rapide avant validation HSEE.
              </p>
            </div>

            <button
              onClick={() => setSelectedAccident(null)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Fermer
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Info label="Collaborateur" value={selectedAccident.collaborateur} />
            <Info label="Matricule" value={selectedAccident.matricule} />
            <Info label="Segment" value={selectedAccident.segment} />
            <Info label="Poste" value={selectedAccident.poste} />
            <Info label="Date accident" value={selectedAccident.date_accident} />
            <Info label="Heure accident" value={selectedAccident.heure_accident || "-"} />
            <Info label="Lieu accident" value={selectedAccident.lieu_accident || "-"} />
            <Info label="Nature lésion" value={selectedAccident.nature_lesion} />
            <Info label="Siège lésion" value={selectedAccident.siege_lesion} />
            <Info label="Cause" value={selectedAccident.cause} />
            <Info label="Transport hôpital" value={selectedAccident.transport_hopital || "-"} />
            <Info
              label="Durée arrêt"
              value={
                selectedAccident.duree_arret !== null &&
                selectedAccident.duree_arret !== undefined
                  ? selectedAccident.duree_arret
                  : "-"
              }
            />
            <Info label="IPP" value={selectedAccident.ipp || "-"} />
            <Info
              label="Statut HSEE"
              value={selectedAccident.envoye_hsee ? "Envoyé" : "En attente"}
            />

            <div className="md:col-span-2 xl:col-span-3">
              <p className="mb-1 text-sm font-medium text-slate-700">Circonstances</p>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                {selectedAccident.circonstances || "Aucune précision"}
              </div>
            </div>

            <div className="md:col-span-2 xl:col-span-3 grid gap-4 md:grid-cols-2">
              <WitnessCard
                title="Témoin 1"
                nom={selectedAccident.temoin1_nom}
                telephone={selectedAccident.temoin1_telephone}
                matricule={selectedAccident.temoin1_matricule}
              />
              <WitnessCard
                title="Témoin 2"
                nom={selectedAccident.temoin2_nom}
                telephone={selectedAccident.temoin2_telephone}
                matricule={selectedAccident.temoin2_matricule}
              />
            </div>
          </div>

          {!selectedAccident.envoye_hsee && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => handleSendHSEE(selectedAccident.id)}
                disabled={sendingId === selectedAccident.id}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {sendingId === selectedAccident.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                Envoyer au responsable HSEE
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InputField({ label, name, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
      />
    </div>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="text"
        value={value}
        readOnly
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600 outline-none"
      />
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value || "-"}</p>
    </div>
  );
}

function WitnessCard({ title, nom, telephone, matricule }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 space-y-2 text-sm text-slate-700">
        <p>
          <span className="font-medium text-slate-900">Nom:</span> {nom || "-"}
        </p>
        <p>
          <span className="font-medium text-slate-900">Téléphone:</span>{" "}
          {telephone || "-"}
        </p>
        <p>
          <span className="font-medium text-slate-900">Matricule:</span>{" "}
          {matricule || "-"}
        </p>
      </div>
    </div>
  );
}