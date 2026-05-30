import { Plus } from "lucide-react";

export default function ReportTemplateCard({ template, onGenerate }) {
  const Icon = template.icon;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <span className="absolute inset-y-4 left-0 w-[3px] rounded-full bg-slate-950" />

      <div className="flex items-start gap-3 pl-2">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${template.iconWrap}`}>
          <Icon className={`h-5 w-5 ${template.iconColor}`} />
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-5 text-slate-900">{template.title}</h3>
          <p className="mt-1 text-sm leading-5 text-slate-500">{template.description}</p>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4" />

      <div className="mt-auto flex items-center justify-between gap-3 pl-2">
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${template.badgeClass}`}>
          {template.category}
        </span>

        <button
          type="button"
          onClick={() => onGenerate(template)}
          className="inline-flex h-9 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
        >
          <Plus className="h-4 w-4" />
          <span>Générer</span>
        </button>
      </div>
    </article>
  );
}

