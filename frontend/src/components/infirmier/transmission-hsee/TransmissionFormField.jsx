export function FieldLabel({ label, required = false }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
      {required ? <span className="text-rose-500"> *</span> : null}
    </label>
  );
}

export function TextField({
  label,
  required = false,
  error = "",
  className = "",
  ...props
}) {
  return (
    <div className={className}>
      <FieldLabel label={label} required={required} />
      <input
        {...props}
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-[13px] text-slate-800 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 ${
          error ? "border-rose-300" : "border-slate-200"
        }`}
      />
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

export function SelectField({
  label,
  required = false,
  error = "",
  options = [],
  className = "",
  ...props
}) {
  return (
    <div className={className}>
      <FieldLabel label={label} required={required} />
      <select
        {...props}
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-[13px] text-slate-800 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 ${
          error ? "border-rose-300" : "border-slate-200"
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

export function TextAreaField({
  label,
  required = false,
  error = "",
  rows = 4,
  className = "",
  ...props
}) {
  return (
    <div className={className}>
      <FieldLabel label={label} required={required} />
      <textarea
        {...props}
        rows={rows}
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-[13px] text-slate-800 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 ${
          error ? "border-rose-300" : "border-slate-200"
        }`}
      />
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
