import { FileSearch } from "lucide-react";

export default function TransmissionEmptyState({ text }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <FileSearch className="h-5 w-5 text-slate-400" />
      </div>
      <p className="mt-4 text-[13px] font-medium text-slate-700">{text}</p>
      <p className="mt-1 text-[11px] text-slate-500">
        Enregistrez ou transmettez une enquête pour alimenter l’historique.
      </p>
    </div>
  );
}

