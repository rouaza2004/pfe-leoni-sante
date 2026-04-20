import * as Dialog from "@radix-ui/react-dialog";
import { Download, Eye, Loader2, X } from "lucide-react";

import EmailAfterGenerationCard from "./EmailAfterGenerationCard";
import ReportSectionCheckboxList from "./ReportSectionCheckboxList";

function FormField({ label, children }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-semibold text-slate-700">{label}</div>
      {children}
    </label>
  );
}

function inputClass({ muted = false } = {}) {
  return `h-12 w-full rounded-2xl border px-4 text-sm outline-none transition ${
    muted
      ? "border-slate-200 bg-slate-100 text-slate-500"
      : "border-slate-200 bg-white text-slate-800 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
  }`;
}

function SelectField({ value, onChange, options = [], disabled = false }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className={`${inputClass()} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export default function ReportParametersModal({
  open,
  onOpenChange,
  values,
  sections,
  periodOptions,
  formatOptions,
  departmentOptions,
  detailLevelOptions,
  onFieldChange,
  onToggleSection,
  onPreview,
  onGenerate,
  selectedTemplateTitle,
  loading = false,
  submitting = false,
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[34px] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-2xl font-semibold tracking-tight text-slate-950">
                Paramètres du rapport
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-6 text-slate-500">
                Configurez les paramètres de génération pour {selectedTemplateTitle}.
              </Dialog.Description>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center text-slate-500">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Chargement des paramètres du modèle...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <FormField label="Période">
                  <SelectField
                    value={values.period}
                    onChange={(value) => onFieldChange("period", value)}
                    options={periodOptions}
                  />
                </FormField>

                <FormField label="Format de sortie">
                  <SelectField
                    value={values.format}
                    onChange={(value) => onFieldChange("format", value)}
                    options={formatOptions}
                  />
                </FormField>

                <FormField label="Département">
                  <SelectField
                    value={values.department}
                    onChange={(value) => onFieldChange("department", value)}
                    options={departmentOptions}
                  />
                </FormField>

                <FormField label="Niveau de détail">
                  <SelectField
                    value={values.detailLevel}
                    onChange={(value) => onFieldChange("detailLevel", value)}
                    options={detailLevelOptions}
                  />
                </FormField>

                <FormField label="Date de génération">
                  <input readOnly value={values.generatedDate} className={inputClass({ muted: true })} />
                </FormField>

                <FormField label="Généré par">
                  <input readOnly value={values.generatedBy} className={inputClass({ muted: true })} />
                </FormField>
              </div>

              <div className="mt-5 space-y-5">
                <div>
                  <div className="mb-2 text-sm font-semibold text-slate-700">
                    Sections à inclure
                  </div>
                  <ReportSectionCheckboxList
                    options={sections}
                    selectedValues={values.sections}
                    onToggle={onToggleSection}
                  />
                </div>

                <EmailAfterGenerationCard
                  checked={values.sendEmail}
                  onChange={(checked) => onFieldChange("sendEmail", checked)}
                />
              </div>
            </>
          )}

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Annuler
              </button>
            </Dialog.Close>

            <button
              type="button"
              onClick={onPreview}
              disabled={loading || submitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Eye className="h-4 w-4" />
              <span>Prévisualiser</span>
            </button>

            <button
              type="button"
              onClick={onGenerate}
              disabled={loading || submitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span>Générer le Rapport</span>
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
