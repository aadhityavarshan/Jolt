export type ReasonCategory = 
  | "medical-necessity" 
  | "documentation" 
  | "clinical-evidence" 
  | "patient-factors" 
  | "other";

export interface CategorizedReason {
  text: string;
  category: ReasonCategory;
}

const categoryKeywords: Record<ReasonCategory, string[]> = {
  "medical-necessity": [
    "medically necessary",
    "necessary",
    "indicated",
    "condition requires",
    "medical need",
    "clinical judgment",
    "standard of care",
  ],
  documentation: [
    "documented",
    "documentation",
    "records show",
    "clinical notes",
    "physician note",
    "chart",
    "documented in",
    "per record",
  ],
  "clinical-evidence": [
    "evidence",
    "study",
    "research",
    "guidelines",
    "clinical evidence",
    "proven effective",
    "established",
    "literature",
    "diagnostic",
    "imaging",
    "test result",
  ],
  "patient-factors": [
    "patient",
    "age",
    "comorbid",
    "history of",
    "previous",
    "contraindication",
    "risk factor",
    "failed",
    "response",
  ],
  other: [],
};

export function categorizeReasons(reasons: (string | { reasoning: string })[]): CategorizedReason[] {
  return reasons.map((r) => {
    const text = typeof r === "string" ? r : r.reasoning;
    const lowerText = text.toLowerCase();
    const category = (
      Object.entries(categoryKeywords).find(([_, keywords]) =>
        keywords.some((kw) => lowerText.includes(kw))
      )?.[0] as ReasonCategory
    ) || "other";

    return { text, category };
  });
}

export function groupReasonsByCategory(
  reasons: CategorizedReason[]
): Record<ReasonCategory, CategorizedReason[]> {
  const groups: Record<ReasonCategory, CategorizedReason[]> = {
    "medical-necessity": [],
    documentation: [],
    "clinical-evidence": [],
    "patient-factors": [],
    other: [],
  };

  reasons.forEach((reason) => {
    groups[reason.category].push(reason);
  });

  return groups;
}

export const categoryConfig: Record<
  ReasonCategory,
  { label: string; icon: string; color: string; bgColor: string }
> = {
  "medical-necessity": {
    label: "Medical Necessity",
    icon: "",
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-l-4 border-blue-500",
  },
  documentation: {
    label: "Documentation",
    icon: "",
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-l-4 border-purple-500",
  },
  "clinical-evidence": {
    label: "Clinical Evidence",
    icon: "",
    color: "text-green-600",
    bgColor: "bg-green-50 border-l-4 border-green-500",
  },
  "patient-factors": {
    label: "Patient Factors",
    icon: "",
    color: "text-orange-600",
    bgColor: "bg-orange-50 border-l-4 border-orange-500",
  },
  other: {
    label: "Additional Factors",
    icon: "",
    color: "text-gray-600",
    bgColor: "bg-gray-50 border-l-4 border-gray-500",
  },
};
