export interface SizeResult {
  recommended: string;
  confidence: number;
  chest: number;
  waist: number;
  allSizes: Array<{ size: string; fit: string; label: string }>;
  note: string | null;
}

const SIZE_BOUNDS: Array<[string, number, number]> = [
  ["XS", 76, 82], ["S", 82, 88], ["M", 88, 94],
  ["L", 94, 100], ["XL", 100, 107], ["XXL", 107, 117], ["XXXL", 117, 130],
];

const FIT_LABELS: Record<string, string> = {
  too_small: "Too tight",
  snug: "Snug fit",
  perfect: "Perfect fit",
  loose: "Relaxed fit",
  too_large: "Too loose",
};

export function recommendSizeLocally(
  height: number,
  weight: number,
  gender: "male" | "female" | "unisex" = "unisex",
  clothingType = "top",
  availableSizes: string[] = []
): SizeResult {
  const bmi = weight / Math.pow(height / 100, 2);
  const isFemale = gender === "female";

  const chest = isFemale
    ? 78 + (bmi - 20) * 1.8 + (height - 160) * 0.1
    : 88 + (bmi - 22) * 2.0 + (height - 170) * 0.15;
  const waist = isFemale ? 62 + (bmi - 20) * 2.2 : 74 + (bmi - 22) * 2.5;

  const type = clothingType.toLowerCase();
  const isBottom = type.includes("bottom") || type.includes("pant") || type.includes("jean") ||
                   type.includes("skirt") || type.includes("short") || type.includes("trouser");
  const measurement = isBottom ? waist : chest;

  let recommended = "M";
  let confidence = 0.7;

  for (const [size, min, max] of SIZE_BOUNDS) {
    if (measurement >= min && measurement < max) {
      recommended = size;
      const pos = (measurement - min) / (max - min);
      confidence = pos > 0.2 && pos < 0.8 ? 0.9 : 0.75;
      break;
    }
  }
  if (measurement < 76) { recommended = "XS"; confidence = 0.85; }
  if (measurement >= 130) { recommended = "XXXL"; confidence = 0.85; }

  const sizeOrder = SIZE_BOUNDS.map(([s]) => s);
  if (availableSizes.length > 0 && !availableSizes.includes(recommended)) {
    const recIdx = sizeOrder.indexOf(recommended);
    let best = recommended;
    let minDist = Infinity;
    for (const s of availableSizes) {
      const d = Math.abs(sizeOrder.indexOf(s) - recIdx);
      if (d < minDist) { minDist = d; best = s; }
    }
    recommended = best;
    confidence = Math.max(0.45, confidence - minDist * 0.1);
  }

  const allSizes = SIZE_BOUNDS.map(([size, min, max]) => {
    let fit: string;
    if (measurement < min - 6) fit = "too_large";
    else if (measurement < min) fit = "loose";
    else if (measurement >= max + 6) fit = "too_small";
    else if (measurement >= max) fit = "snug";
    else fit = "perfect";
    return { size, fit, label: FIT_LABELS[fit] ?? fit };
  });

  return {
    recommended,
    confidence: Math.round(confidence * 100),
    chest: Math.round(chest),
    waist: Math.round(waist),
    allSizes,
    note: confidence < 0.6 ? "Consider sizing up for a relaxed fit" : null,
  };
}
