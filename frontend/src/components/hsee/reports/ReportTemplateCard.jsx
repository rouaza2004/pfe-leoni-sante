import { Plus } from "lucide-react";

export default function ReportTemplateCard({ template, onGenerate }) {
  const Icon = template.icon;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <span className="absolute inset-y-5 left-0 w-[3px] rounded-full bg-slate-950" />

      <div className="flex items-start gap-4 pl-2">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${template.iconWrap}`}>
          <Icon className={`h-6 w-6 ${template.iconColor}`} />
        </div>

        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-6 text-slate-900">{template.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{template.description}</p>
        </div>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5" />

      <div className="mt-auto flex items-center justify-between gap-3 pl-2">
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${template.badgeClass}`}>
          {template.category}
        </span>

        <button
          type="button"
          onClick={() => onGenerate(template)}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
        >
          <Plus className="h-4 w-4" />
          <span>Générer</span>
        </button>
      </div>
    </article>
  );
}
