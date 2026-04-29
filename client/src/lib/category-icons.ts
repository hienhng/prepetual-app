
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

export const getCategoryIcon = (category?: string | null) => {
  return categoryConfig[category || "Others/General"]?.icon || GraduationCap;
};

export const getCategoryGradient = (category?: string | null) => {
  return categoryConfig[category || "Others/General"]?.gradient || "from-slate-500 to-slate-600";
};

export const getCategoryLabel = (category?: string | null) => {
  return categoryConfig[category || "Others/General"]?.label || "General";
};
