const MOJIBAKE_MARKERS = ["Ã", "Â", "â", "├", "⌐", "�"];

const looksCorrupted = (value) =>
  typeof value === "string" && MOJIBAKE_MARKERS.some((marker) => value.includes(marker));

const score = (value) =>
  MOJIBAKE_MARKERS.reduce(
    (total, marker) => total + (typeof value === "string" ? value.split(marker).length - 1 : 0),
    0
  );

const repairOnce = (value) => {
  const directMap = {
    "Op├rateur": "Opérateur",
    "Op├⌐rateur": "Opérateur",
    "Qualit├": "Qualité",
    "Qualit├⌐": "Qualité",
    "Agent qualit├": "Agent qualité",
    "Agent qualit├⌐": "Agent qualité",
    "R├sidence": "Résidence",
    "R├⌐sidence": "Résidence",
    "N├ant": "Néant",
    "N├⌐ant": "Néant",
    "H├patite": "Hépatite",
    "H├⌐patite": "Hépatite",
  };

  if (directMap[value]) {
    return directMap[value];
  }

  try {
    const repaired = decodeURIComponent(escape(value));
    if (score(repaired) < score(value)) {
      return repaired;
    }
  } catch {
    // Ignore invalid sequences.
  }

  const cp437Map = {
    "├⌐": "é",
    "├¿": "à",
    "├ê": "è",
    "├®": "î",
    "├┤": "ô",
    "├╣": "ù",
    "├ç": "ç",
  };

  return Object.entries(cp437Map).reduce(
    (text, [pattern, replacement]) => text.split(pattern).join(replacement),
    value
  );
};

export const fixFrenchText = (value) => {
  if (!looksCorrupted(value)) return value;

  let repaired = value;
  for (let i = 0; i < 3; i += 1) {
    const next = repairOnce(repaired);
    if (next === repaired) break;
    repaired = next;
  }
  return repaired;
};

export const fixFrenchTextDeep = (value) => {
  if (typeof value === "string") return fixFrenchText(value);
  if (Array.isArray(value)) return value.map(fixFrenchTextDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, fixFrenchTextDeep(nestedValue)])
    );
  }
  return value;
};
