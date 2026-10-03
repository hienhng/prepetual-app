import { useId } from "react";
import { useLanguage } from "@/lib/language-context";
import { Label } from "@/components/ui/label";

const languages = [
  ["vi", "Tiếng Việt"], ["en", "English"], ["es", "Español"], ["fr", "Français"],
  ["de", "Deutsch"], ["pt", "Português"], ["it", "Italiano"], ["th", "ไทย"],
  ["zh", "中文"], ["ja", "日本語"], ["ko", "한국어"], ["ar", "العربية"],
  ["hi", "हिन्दी"], ["id", "Bahasa Indonesia"], ["ru", "Русский"],
];

export function QuizLanguageSelect({ value, onChange, disabled, detectedLanguage }: {
  value: string; onChange: (value: string) => void; disabled?: boolean; detectedLanguage?: string;
}) {
  const id = useId();
  const { language } = useLanguage();
  const vi = language === "vi";
  return <div className="space-y-2">
    <Label htmlFor={id}>{vi ? "Ngôn ngữ câu hỏi" : "Quiz language"}</Label>
    <select id={id} value={value} onChange={event => onChange(event.target.value)} disabled={disabled}
      aria-describedby={`${id}-hint`} data-testid="quiz-language"
      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
      <option value="auto">{vi ? "Tự động theo yêu cầu hoặc tài liệu" : "Auto — follow request or material"}</option>
      {languages.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
    </select>
    <p id={`${id}-hint`} className="text-xs text-muted-foreground">
      {detectedLanguage || (vi ? "Có thể yêu cầu ngôn ngữ khác trong lời nhắc. Lựa chọn ở đây được ưu tiên." : "You can request another language in your prompt. A selection here takes priority.")}
    </p>
  </div>;
}
