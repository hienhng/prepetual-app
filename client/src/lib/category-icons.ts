
import { 
  Binary, Book, FlaskConical, Globe, Languages, GraduationCap,
  Calculator, BookText, Beaker, Globe2, Sparkles, LayoutGrid
} from "lucide-react";

export const categoryConfig: Record<string, { label: string; icon: any; gradient: string }> = {
  "all": { label: "All", icon: LayoutGrid, gradient: "from-slate-500 to-slate-600" },
  "Math": { label: "Math", icon: Calculator, gradient: "from-blue-500 to-indigo-600" },
  "English": { label: "English", icon: BookText, gradient: "from-amber-500 to-orange-600" },
  "Science": { label: "Science", icon: Beaker, gradient: "from-emerald-500 to-teal-600" },
  "Social Studies": { label: "Social Studies", icon: Globe2, gradient: "from-purple-500 to-violet-600" },
  "Global Languages": { label: "Languages", icon: Languages, gradient: "from-pink-500 to-rose-600" },
  "Others/General": { label: "General", icon: GraduationCap, gradient: "from-cyan-500 to-blue-600" },
};

// Stored category values are translation-key suffixes, while older quizzes use
// their original display names. Normalize both forms for shared UI helpers.
const categoryAliases: Record<string, string> = {
  "categories.math": "Math",
  "categories.english": "English",
  "categories.science": "Science",
  "categories.socialStudies": "Social Studies",
  "categories.globalLanguages": "Global Languages",
  "categories.general": "Others/General",
};

const normalizeCategory = (category?: string | null) =>
  categoryAliases[category || ""] || category || "Others/General";

/**
 * Returns the current persisted category ID for either a legacy display label
 * or a current category value.
 */
export const getCategoryStorageKey = (category?: string | null) => {
  switch (normalizeCategory(category)) {
    case "Math": return "categories.math";
    case "English": return "categories.english";
    case "Science": return "categories.science";
    case "Social Studies": return "categories.socialStudies";
    case "Global Languages": return "categories.globalLanguages";
    default: return "categories.general";
  }
};

export const getCategoryIcon = (category?: string | null) => {
  return categoryConfig[normalizeCategory(category)]?.icon || GraduationCap;
};

export const getCategoryGradient = (category?: string | null) => {
  return categoryConfig[normalizeCategory(category)]?.gradient || "from-slate-500 to-slate-600";
};

export const getCategoryLabel = (category?: string | null) => {
  return categoryConfig[normalizeCategory(category)]?.label || "General";
};

export const getCategoryTranslationKey = (category?: string | null) => {
  switch (normalizeCategory(category)) {
    case "Math": return "common.categories.math";
    case "English": return "common.categories.english";
    case "Science": return "common.categories.science";
    case "Social Studies": return "common.categories.socialStudies";
    case "Global Languages": return "common.categories.globalLanguages";
    default: return "common.categories.general";
  }
};
