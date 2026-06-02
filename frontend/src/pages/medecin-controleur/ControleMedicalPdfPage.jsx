import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { api } from "@/api/api";
import { fixFrenchTextDeep } from "@/utils/fixFrenchText";
import { getUsername } from "../../auth/auth";
import { downloadControleMedicalPdf } from "../../utils/generateControleMedicalPdf";
import { saveControleMedicalHistory } from "../../services/medecinControleurHistoryService";

function normalizeCollaborateurList(payload) {
  return fixFrenchTextDeep(Array.isArray(payload) ? payload : payload?.results || []);
}

function getCollaborateurKey(collaborateur) {
  return String(
    collaborateur?.id ??
      collaborateur?.matricule ??
      `${collaborateur?.nom || ""}-${collaborateur?.prenom || ""}`
  );
}

function mergeCollaborateurs(previous, incoming) {
  const merged = new Map(previous.map((item) => [getCollaborateurKey(item), item]));

  incoming.forEach((item) => {
    const key = getCollaborateurKey(item);
    merged.set(key, {
      ...(merged.get(key) || {}),
      ...item,
    });
  });

  return Array.from(merged.values());
}

function getSegmentLabel(collaborateur) {
  const segment = collaborateur?.segment;

  return (
    collaborateur?.segment_nom ||
    collaborateur?.departement ||
    (typeof segment === "string" ? segment : segment?.nom || segment?.libelle) ||
    ""
  );
}

function normalizeSearchValue(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function matchesCollaborateur(collaborateur, query) {
  const normalizedQuery = normalizeSearchValue(query.trim());
  if (!normalizedQuery) return false;

  const searchText = [
    collaborateur?.nom,
    collaborateur?.prenom,
    collaborateur?.matricule,
    `${collaborateur?.prenom || ""} ${collaborateur?.nom || ""}`,
    `${collaborateur?.nom || ""} ${collaborateur?.prenom || ""}`,
  ]
    .filter(Boolean)
    .join(" ");

  return normalizeSearchValue(searchText).includes(normalizedQuery);
}

function getCollaborateurDisplayName(collaborateur) {
  return `${collaborateur?.prenom || ""} ${collaborateur?.nom || ""}`.trim() || "--";
}

function Field({ label, children, hint }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function SectionCard({ title, subtitle, children, icon }) {
  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-sky-700">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function ControleMedicalPdfPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const doctorIdentifier = getUsername() || "Dr. ____________";
  const prefill = location.state?.prefill || {};

  const [form, setForm] = useState({
    date: prefill.date || today,
    matricule: prefill.matricule || "",
    segment: prefill.segment || "",
    nom: prefill.nom || "",
    prenom: prefill.prenom || "",
    reposPrescrit: prefill.reposPrescrit || "",
    avisMedecinControleur: prefill.avisMedecinControleur || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [loadingCollaborateurs, setLoadingCollaborateurs] = useState(false);
  const [collaborateursError, setCollaborateursError] = useState("");
  const [isNomFocused, setIsNomFocused] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchCollaborateurs = async () => {
      try {
        setLoadingCollaborateurs(true);
        setCollaborateursError("");
        const response = await api.get("/collaborateurs/");
        const data = normalizeCollaborateurList(response.data);

        if (!cancelled) {
          setCollaborateurs(data);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setCollaborateurs([]);
          setCollaborateursError("Impossible de charger les collaborateurs.");
        }
      } finally {
        if (!cancelled) {
          setLoadingCollaborateurs(false);
        }
      }
    };

    fetchCollaborateurs();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const query = form.nom.trim();
    if (query.length < 2) return undefined;

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        setLoadingCollaborateurs(true);
        setCollaborateursError("");
        const response = await api.get(`/collaborateurs/?search=${encodeURIComponent(query)}`);
        const data = normalizeCollaborateurList(response.data);

        if (!cancelled) {
          setCollaborateurs((prev) => mergeCollaborateurs(prev, data));
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setCollaborateursError("Impossible de charger les collaborateurs.");
        }
      } finally {
        if (!cancelled) {
          setLoadingCollaborateurs(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [form.nom]);

  const filteredCollaborateurs = useMemo(() => {
    const query = form.nom.trim();
    if (!query) return [];

    return collaborateurs.filter((item) => matchesCollaborateur(item, query)).slice(0, 8);
  }, [collaborateurs, form.nom]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectCollaborateur = (collaborateur) => {
    setForm((prev) => ({
      ...prev,
      matricule: collaborateur?.matricule || "",
      segment: getSegmentLabel(collaborateur),
      nom: collaborateur?.nom || "",
      prenom: collaborateur?.prenom || "",
    }));
    setIsNomFocused(false);
  };

  const handleGeneratePdf = async () => {
    try {
      setIsSaving(true);

      const pdfData = {
        ...form,
        medecinControleur: doctorIdentifier,
      };
      const pdfFilename = downloadControleMedicalPdf(pdfData);

      try {
        await saveControleMedicalHistory({
          date: pdfData.date,
          matricule: pdfData.matricule,
          segment: pdfData.segment,
          nom: pdfData.nom,
          prenom: pdfData.prenom,
          repos_prescrit: pdfData.reposPrescrit,
          avis_medecin_controleur: pdfData.avisMedecinControleur,
          medecin_identifiant: pdfData.medecinControleur,
          pdf_filename: pdfFilename,
          statut: "VALIDE",
        });
      } catch (saveError) {
        console.error("Erreur sauvegarde historique controle medical", saveError);
        window.alert("PDF genere, mais impossible d'enregistrer le controle dans l'historique.");
      }
    } catch (error) {
      console.error("Erreur generation controle medical PDF", error);
      window.alert("Impossible de generer le PDF du controle medical.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-sky-700 transition hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Retour
      </button>

      <section className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-sky-50/35 to-white p-6 shadow-sm shadow-slate-200/50">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Contrôle médical
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Renseignez le formulaire puis générez le document PDF au format administratif.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_340px]">
        <div className="space-y-6">
          <SectionCard
            title="Informations générales"
            subtitle="Données principales à reproduire dans le document"
            icon={<FileText size={18} />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Date">
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>

              <Field label="Matricule">
                <input
                  type="text"
                  name="matricule"
                  value={form.matricule}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>

              <Field label="Segment">
                <input
                  type="text"
                  name="segment"
                  value={form.segment}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>

              <Field
                label="Médecin contrôleur"
                hint="Renseigné automatiquement depuis la session active."
              >
                <input
                  type="text"
                  value={doctorIdentifier}
                  readOnly
                  className="w-full rounded-2xl border border-sky-200 bg-sky-50/50 px-4 py-3 text-sm text-slate-700 outline-none"
                />
              </Field>

              <Field label="Nom">
                <div className="relative">
                  <input
                    type="text"
                    name="nom"
                    value={form.nom}
                    onChange={handleChange}
                    onFocus={() => setIsNomFocused(true)}
                    onBlur={() => window.setTimeout(() => setIsNomFocused(false), 120)}
                    autoComplete="off"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />

                  {isNomFocused && form.nom.trim() ? (
                    <div className="absolute z-30 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-lg shadow-slate-200/60">
                      {loadingCollaborateurs ? (
                        <p className="px-3 py-2 text-sm text-slate-500">Chargement...</p>
                      ) : null}

                      {!loadingCollaborateurs && collaborateursError ? (
                        <p className="px-3 py-2 text-sm text-rose-600">{collaborateursError}</p>
                      ) : null}

                      {!loadingCollaborateurs &&
                        !collaborateursError &&
                        filteredCollaborateurs.map((collaborateur) => (
                          <button
                            key={getCollaborateurKey(collaborateur)}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleSelectCollaborateur(collaborateur)}
                            className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-sky-50"
                          >
                            <span className="block text-sm font-medium text-slate-900">
                              {getCollaborateurDisplayName(collaborateur)}
                            </span>
                            <span className="mt-0.5 block text-xs text-slate-500">
                              Matricule : {collaborateur?.matricule || "--"}
                            </span>
                          </button>
                        ))}

                      {!loadingCollaborateurs &&
                      !collaborateursError &&
                      filteredCollaborateurs.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-slate-500">
                          Aucun collaborateur trouvé.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </Field>

              <Field label="Prénom">
                <input
                  type="text"
                  name="prenom"
                  value={form.prenom}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>

              <Field label="Repos prescrit">
                <input
                  type="text"
                  name="reposPrescrit"
                  value={form.reposPrescrit}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="Avis du médecin contrôleur"
            subtitle="Zone de texte libre imprimée dans la grande section centrale du PDF"
            icon={<FileText size={18} />}
          >
            <Field label="Avis du médecin contrôleur">
              <textarea
                name="avisMedecinControleur"
                rows={10}
                value={form.avisMedecinControleur}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </Field>
          </SectionCard>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
            <h2 className="text-base font-semibold text-slate-900">PDF</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Le document reprend les valeurs du formulaire au format administratif sur une seule
              page A4.
            </p>
          </section>

          <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
            <button
              type="button"
              onClick={handleGeneratePdf}
              disabled={isSaving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm shadow-sky-900/25 transition hover:bg-slate-800"
            >
              <Download size={16} />
              {isSaving ? "Enregistrement..." : "Générer PDF"}
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
