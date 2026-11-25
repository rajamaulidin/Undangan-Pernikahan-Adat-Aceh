export interface BannedWordEntry {
  word: string;
  language: "id" | "aceh";
  matchType: "exact" | "contains";
  isActive?: boolean;
}

export interface ProfanityCheckResult {
  flagged: boolean;
  matchedWords: string[];
}

export const defaultBannedWords: BannedWordEntry[] = [
  { word: "anjing", language: "id", matchType: "exact", isActive: true },
  { word: "bangsat", language: "id", matchType: "exact", isActive: true },
  { word: "bodoh", language: "id", matchType: "exact", isActive: true },
  { word: "goblok", language: "id", matchType: "exact", isActive: true },
  { word: "tolol", language: "id", matchType: "exact", isActive: true },
  { word: "babi", language: "id", matchType: "exact", isActive: true },
  { word: "kampret", language: "id", matchType: "exact", isActive: true },
  { word: "kontol", language: "id", matchType: "exact", isActive: true },
  { word: "memek", language: "id", matchType: "exact", isActive: true },
  { word: "tai", language: "id", matchType: "exact", isActive: true },
  { word: "asee", language: "aceh", matchType: "exact", isActive: true },
  { word: "buya", language: "aceh", matchType: "exact", isActive: true },
  { word: "pungo", language: "aceh", matchType: "exact", isActive: true },
  { word: "paleh", language: "aceh", matchType: "exact", isActive: true },
  { word: "bangai", language: "aceh", matchType: "exact", isActive: true },
  { word: "buy", language: "aceh", matchType: "exact", isActive: true },
  { word: "capok", language: "aceh", matchType: "exact", isActive: true },
  { word: "puko", language: "aceh", matchType: "exact", isActive: true },
  { word: "pukoe", language: "aceh", matchType: "exact", isActive: true },
  { word: "pukoe lempap", language: "aceh", matchType: "exact", isActive: true },
  { word: "bajeng", language: "aceh", matchType: "exact", isActive: true },
  { word: "ek boh", language: "aceh", matchType: "exact", isActive: true },
];

const leetMap: Record<string, string> = {
  "4": "a",
  "@": "a",
  "3": "e",
  "1": "i",
  "!": "i",
  "0": "o",
  "5": "s",
  "$": "s",
  "7": "t",
};

export function normalizeForProfanityCheck(raw: string): string {
  const lower = raw.toLowerCase();
  const deLeeted = lower.replace(/[4@31!05$7]/g, (ch) => leetMap[ch] ?? ch);
  // Strip separator symbols placed between letters while keeping spaces between distinct words.
  const strippedSeparators = deLeeted.replace(
    /([a-z])[.\-*_/+~`'|\\]+(?=[a-z])/g,
    "$1"
  );
  // Acehnese "asee" legitimately uses double "e", while other double letters in ID/Aceh are elongation spam.
  const collapsedNonE = strippedSeparators.replace(/([a-df-z])\1+/g, "$1");
  return collapsedNonE.replace(/e{3,}/g, "ee");
}

function collapseAllRepeats(text: string): string {
  return text.replace(/([a-z])\1+/g, "$1");
}

export function evaluateProfanity(
  text: string,
  rules: BannedWordEntry[] = defaultBannedWords
): ProfanityCheckResult {
  const normalized = normalizeForProfanityCheck(text);
  const tokens = normalized.split(/[^a-z]+/).filter(Boolean);
  const dedupedTokens = tokens.map(collapseAllRepeats);
  const canonicalPhrase = ` ${tokens.join(" ")} `;
  const dedupedPhrase = ` ${dedupedTokens.join(" ")} `;
  const matched: string[] = [];

  for (const rule of rules) {
    if (rule.isActive === false) continue;
    const rawTarget = rule.word.toLowerCase().trim();
    if (!rawTarget) continue;

    const normTarget = normalizeForProfanityCheck(rawTarget);
    const targetTokens = normTarget.split(/[^a-z]+/).filter(Boolean);
    if (targetTokens.length === 0) continue;

    const dedupedTargetTokens = targetTokens.map(collapseAllRepeats);
    let isHit = false;

    if (rule.matchType === "exact") {
      if (targetTokens.length === 1) {
        const single = targetTokens[0];
        const singleDedup = dedupedTargetTokens[0];
        isHit =
          tokens.includes(single) ||
          (!rawTarget.includes("ee") && dedupedTokens.includes(singleDedup));
      } else {
        const multiSeq = ` ${targetTokens.join(" ")} `;
        const multiDedupSeq = ` ${dedupedTargetTokens.join(" ")} `;
        const joinedSingle = targetTokens.join("");
        const joinedDedupSingle = dedupedTargetTokens.join("");
        isHit =
          canonicalPhrase.includes(multiSeq) ||
          dedupedPhrase.includes(multiDedupSeq) ||
          tokens.includes(joinedSingle) ||
          dedupedTokens.includes(joinedDedupSingle);
      }
    } else {
      const compactTarget = targetTokens.join("");
      const compactInput = tokens.join("");
      isHit =
        normalized.includes(normTarget) || compactInput.includes(compactTarget);
    }

    if (isHit && !matched.includes(rawTarget)) {
      matched.push(rawTarget);
    }
  }

  return {
    flagged: matched.length > 0,
    matchedWords: matched,
  };
}
