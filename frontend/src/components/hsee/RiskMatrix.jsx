const GRAVITY_LABELS = [
  "1 - NÃ©gligeable",
  "2 - Mineure",
  "3 - ModÃ©rÃ©e",
  "4 - Grave",
  "5 - Catastrophique",
];

const PROBABILITY_LABELS = [
  "1 - Rare",
  "2 - Peu probable",
  "3 - Possible",
  "4 - Probable",
  "5 - TrÃ¨s probable",
];

function getCellTone(score) {
  if (score >= 20) return "bg-rose-500/90 text-white";
  if (score >= 15) return "bg-orange-500/90 text-white";
  if (score >= 10) return "bg-amber-400/95 text-slate-950";
  if (score >= 5) return "bg-yellow-200 text-slate-800";
  return "bg-emerald-200 text-emerald-950";
}

export default function RiskMatrix({ risks }) {
  const matrix = Array.from({ length: 5 }, (_, rowIndex) =>
    Array.from({ length: 5 }, (_, colIndex) => {
      const gravity = 5 - rowIndex;
      const probability = colIndex + 1;
      const cellRisks = risks.filter(
        (risk) => risk.gravity === gravity && risk.probability === probability,
      );

      return {
        gravity,
        probability,
        count: cellRisks.length,
        score: gravity * probability,
        risks: cellRisks,
      };
    }),
  );

  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 pb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          Matrice de CriticitÃ© des Risques
        </h2>
        <p className="text-sm leading-6 text-slate-500">
          Positionnement dynamique des risques selon leur gravitÃ© et leur probabilitÃ©.
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[920px]">
          <div className="grid grid-cols-[180px_repeat(5,minmax(120px,1fr))] gap-3">
            <div className="flex items-end rounded-3xl bg-slate-100 px-5 py-4 text-sm font-semibold text-slate-700">
              GravitÃ©
            </div>

            {PROBABILITY_LABELS.map((label) => (
              <div
                key={label}
                className="rounded-3xl bg-slate-100 px-4 py-4 text-center text-sm font-semibold text-slate-700"
              >
                {label}
              </div>
            ))}

            {matrix.map((row, rowIndex) => (
              <div key={GRAVITY_LABELS[rowIndex]} className="contents">
                <div className="flex items-center rounded-3xl bg-slate-100 px-5 py-5 text-sm font-semibold text-slate-700">
                  {GRAVITY_LABELS[rowIndex]}
                </div>

                {row.map((cell) => (
                  <div
                    key={`${cell.gravity}-${cell.probability}`}
                    className={`relative flex h-28 items-center justify-center rounded-[28px] shadow-inner ${getCellTone(
                      cell.score,
                    )}`}
                  >
                    <div className="text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-75">
                        Score {cell.score}
                      </p>
                      {cell.count > 0 ? (
                        <span className="mt-3 inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-white/90 px-3 text-base font-bold text-slate-900 shadow-sm">
                          {cell.count}
                        </span>
                      ) : (
                        <span className="mt-3 inline-block text-sm opacity-70">0</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              { label: "Faible", tone: "bg-emerald-200" },
              { label: "ModÃ©rÃ©", tone: "bg-yellow-200" },
              { label: "Moyen", tone: "bg-amber-400" },
              { label: "Ã‰levÃ©", tone: "bg-orange-500" },
              { label: "Critique", tone: "bg-rose-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <span className={`h-3 w-3 rounded-full ${item.tone}`} />
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
