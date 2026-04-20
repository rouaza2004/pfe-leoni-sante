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
      className={`overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-r from-gray-100 via-gray-100 to-blue-100 p-6 shadow-sm sm:p-8 ${className}`.trim()}
    >
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-5">
            {leading ? <div className="shrink-0 self-start pt-1">{leading}</div> : null}
            <div>
              {eyebrow ? (
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-700">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {actions ? <div className="flex flex-col gap-3 sm:flex-row">{actions}</div> : null}
      </div>
    </section>
  );
}
