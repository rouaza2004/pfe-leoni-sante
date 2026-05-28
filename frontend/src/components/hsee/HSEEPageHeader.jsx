export default function HSEEPageHeader({
  eyebrow = "HSEE",
  title,
  subtitle,
  actions = null,
  leading = null,
  className = "",
}) {
  return (
    <section
      className={`overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm ring-1 ring-slate-200 sm:p-4 ${className}`.trim()}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl min-w-0">
          <div className="flex items-start gap-3">
            {leading ? <div className="shrink-0 pt-0.5">{leading}</div> : null}
            <div>
              {eyebrow ? (
                <p className="text-xs font-medium text-slate-500">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="mt-0.5 text-[22px] font-bold tracking-tight text-slate-900">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-0.5 text-xs leading-5 text-slate-500 sm:text-sm">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {actions ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}
