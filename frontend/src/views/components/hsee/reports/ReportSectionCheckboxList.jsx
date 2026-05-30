export default function ReportSectionCheckboxList({ options, selectedValues, onToggle }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
      <div className="grid gap-3">
        {options.map((option) => {
          const checked = selectedValues.includes(option.value);

          return (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-transparent bg-white/80 px-4 py-3 transition hover:border-slate-200 hover:bg-white"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(option.value)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
              />
              <div>
                <p className="text-sm font-semibold text-slate-800">{option.label}</p>
                {option.description ? (
                  <p className="mt-1 text-xs leading-5 text-slate-500">{option.description}</p>
                ) : null}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

