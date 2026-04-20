export default function EmailAfterGenerationCard({ checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-start gap-4 rounded-[24px] border border-sky-100 bg-sky-50/80 px-4 py-4 transition hover:border-sky-200 hover:bg-sky-50 sm:px-5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-sky-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
      />
      <div>
        <p className="text-sm font-semibold text-slate-900">
          Envoyer par email après génération
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Le rapport sera envoyé automatiquement aux destinataires définis
        </p>
      </div>
    </label>
  );
}
