import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFile, faFilePdf, faFileWord, faFilePowerpoint, faFileExcel, faFileImage, faAlignLeft, faPlay, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";

function getFileAppearance(fileName: string, mimeType: string) {
  const extension = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() : "";
  if (extension === "pdf" || mimeType === "application/pdf") {
    return { icon: faFilePdf, label: "PDF file", color: "bg-red-500/10 text-red-600 dark:text-red-400" };
  }
  if (["doc", "docx"].includes(extension || "") || /word|msword/.test(mimeType)) {
    return { icon: faFileWord, label: "Word document", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" };
  }
  if (["ppt", "pptx"].includes(extension || "") || /presentation|powerpoint/.test(mimeType)) {
    return { icon: faFilePowerpoint, label: "PowerPoint presentation", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" };
  }
  if (["xls", "xlsx"].includes(extension || "") || /spreadsheet|excel/.test(mimeType)) {
    return { icon: faFileExcel, label: "Excel spreadsheet", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
  }
  if (["jpg", "jpeg", "png"].includes(extension || "") || mimeType.startsWith("image/")) {
    return { icon: faFileImage, label: "Image file", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" };
  }
  return { icon: faFile, label: "File", color: "bg-muted text-muted-foreground" };
}

interface FileTypeIconProps {
  fileName: string;
  mimeType: string;
  size?: "sm" | "md";
}

export function FileTypeIcon({ fileName, mimeType, size = "md" }: FileTypeIconProps) {
  const appearance = getFileAppearance(fileName, mimeType);
  return <MaterialIcon appearance={appearance} size={size} />;
}

const sourceAppearances = {
  text: { icon: faAlignLeft, label: "Pasted text", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  youtube: { icon: faPlay, label: "YouTube video link", color: "bg-red-500/10 text-red-600 dark:text-red-400" },
  prompt: { icon: faWandMagicSparkles, label: "Prompt", color: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400" },
};

export function SourceTypeIcon({ type, size = "md" }: { type: keyof typeof sourceAppearances; size?: "sm" | "md" }) {
  return <MaterialIcon appearance={sourceAppearances[type]} size={size} />;
}

function MaterialIcon({ appearance, size }: { appearance: ReturnType<typeof getFileAppearance>; size: "sm" | "md" }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center ${size === "sm" ? "h-9 w-9 rounded-lg" : "h-11 w-11 rounded-xl"} ${appearance.color}`}
      role="img"
      aria-label={appearance.label}
      title={appearance.label}
    >
      <FontAwesomeIcon icon={appearance.icon} className={size === "sm" ? "h-5 w-5" : "h-6 w-6"} aria-hidden="true" />
    </div>
  );
}
