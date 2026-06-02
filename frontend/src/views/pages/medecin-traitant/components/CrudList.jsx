import { useState } from "react";
import { api } from "@/api/api";

function Input({ label, type = "text", value, onChange, disabled }) {
  return (
    <div>
      <label className="text-xs text-slate-500">{label}</label>
      <input
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
        type={type}
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function CrudList({
  title,
  dossierId,
  items = [],
  fields = [],
  createUrl,
  deleteUrlBase,
  onSaved,
  readOnly = false,
}) {
  const [form, setForm] = useState(() => {
    const init = {};
    fields.forEach((f) => (init[f.name] = ""));
    return init;
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (readOnly) return;

    try {
      setErr("");
      setLoading(true);

      await api.post(createUrl, {
        ...form,
        dossier: dossierId,
      });

      // reset
      const init = {};
      fields.forEach((f) => (init[f.name] = ""));
      setForm(init);

      onSaved?.();
    } catch (e) {
      console.error(e);
      setErr("Erreur ajout.");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    if (readOnly) return;

    try {
      setErr("");
      setLoading(true);
      await api.delete(`${deleteUrlBase}${id}/`);
      onSaved?.();
    } catch (e) {
      console.error(e);
      setErr("Erreur suppression.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        {readOnly && (
          <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
            Lecture ÙÙ‚Ø·
          </span>
        )}
      </div>

      {err && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-700 text-sm">
          {err}
        </div>
      )}

      {/* FORM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {fields.map((f) => (
          <Input
            key={f.name}
            label={f.label}
            type={f.type || "text"}
            value={form[f.name]}
            disabled={readOnly}
            onChange={(v) => setForm({ ...form, [f.name]: v })}
          />
        ))}
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-60"
        >
          Ajouter
        </button>
      )}

      {/* LIST */}
      <div className="space-y-2">
        {items?.length === 0 ? (
          <div className="text-sm text-slate-500">Aucun élément.</div>
        ) : (
          items.map((it) => (
            <div
              key={it.id}
              className="flex items-center justify-between border border-slate-100 rounded-xl p-3"
            >
              <div className="text-sm text-slate-800">
                {fields.map((f) => (
                  <span key={f.name} className="mr-3">
                    <span className="text-slate-500">{f.label}:</span>{" "}
                    {String(it[f.name] ?? "””")}
                  </span>
                ))}
              </div>

              {!readOnly && (
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  className="text-sm font-semibold text-rose-600 hover:underline"
                >
                  Supprimer
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

