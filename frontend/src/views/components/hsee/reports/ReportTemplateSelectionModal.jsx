import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Check, Loader2, X } from "lucide-react";

function ModalTemplateCard({ template, selected, onSelect }) {
  const Icon = template.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(template.id)}
      className={`group relative flex h-full flex-col rounded-[28px] border bg-white p-5 text-left transition duration-200 ${
        selected
          ? "border-2 border-blue-500 bg-blue-50/60 shadow-sm shadow-blue-100 ring-2 ring-blue-100"
          : "border-slate-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-black/5 ${template.iconWrap}`}
        >
          <Icon className={`h-5 w-5 ${template.iconColor}`} />
        </div>

        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition ${
            selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-300"
          }`}
        >
          <Check className="h-4 w-4" />
        </span>
      </div>

      <h3 className="mt-4 text-base font-semibold leading-6 text-slate-900">{template.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{template.description}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {template.modalTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200"
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}

export default function ReportTemplateSelectionModal({
  open,
  onOpenChange,
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onContinue,
  loading = false,
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[calc(100vw-1.5rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[34px] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-2xl font-semibold tracking-tight text-slate-950">
                Générer un Nouveau Rapport
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-6 text-slate-500">
                Sélectionner un modèle de rapport
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
                <span>Chargement des modèles de rapports...</span>
              </div>
            </div>
          ) : templates.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
              Aucun modèle de rapport n’est disponible.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {templates.map((template) => (
                <ModalTemplateCard
                  key={template.id}
                  template={template}
                  selected={selectedTemplateId === template.id}
                  onSelect={onSelectTemplate}
                />
              ))}
            </div>
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
              onClick={onContinue}
              disabled={loading || !selectedTemplateId}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>Continuer</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

