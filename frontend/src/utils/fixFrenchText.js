const MOJIBAKE_MARKERS = ["?", "?", "?", "?", "?", "?"];

const looksCorrupted = (value) =>
  typeof value === "string" && MOJIBAKE_MARKERS.some((marker) => value.includes(marker));

const score = (value) =>
  MOJIBAKE_MARKERS.reduce(
    (total, marker) => total + (typeof value === "string" ? value.split(marker).length - 1 : 0),
    0
  );

const repairOnce = (value) => {
  const directMap = {
    "Op?rateur": "Op?rateur",
    "Op??rateur": "Op?rateur",
    "Qualit?": "Qualit?",
    "Qualit??": "Qualit?",
    "Agent qualit?": "Agent qualit?",
    "Agent qualit??": "Agent qualit?",
    "R?sidence": "R?sidence",
    "R??sidence": "R?sidence",
    "N?ant": "N?ant",
    "N??ant": "N?ant",
    "H?patite": "H?patite",
    "H??patite": "H?patite",
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
    "??": "?",
    "??": "?",
    "??": "?",
    "??": "?",
    "??": "?",
    "??": "?",
    "??": "?",
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

