import { useLanguage } from "@/lib/language-context";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type PausedGeneration = { id: string; generated: number; requested: number };

export function QuizGenerationResumeDialog({ draft, blocked, onDraft, onComplete }: {
  draft: PausedGeneration | null;
  blocked: boolean;
  onDraft: (draft: PausedGeneration) => void;
  onComplete: (quiz: any) => Promise<void>;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (draft) { setOpen(true); setError(""); } }, [draft]);

  async function resume() {
    if (!draft || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/quiz-generation-drafts/${draft.id}/resume`, { method: "POST", credentials: "include" });
      const result = await response.json();
      if (!response.ok) throw new Error(t('quizGeneration.resumeError'));
      if (result.type === "complete") {
        await onComplete(result.quiz);
        setOpen(false);
      } else if (result.type === "paused") {
        onDraft(result.draft);
      } else {
        throw new Error(t('quizGeneration.stoppedError'));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : t('quizGeneration.resumeError'));
    } finally {
      setBusy(false);
    }
  }

  if (!draft) return null;
  const remaining = Math.max(0, draft.requested - draft.generated);
  return <>
    {!open && <Button variant="outline" disabled={blocked} onClick={() => setOpen(true)}>{t('quizGeneration.resumeSaved', { generated: draft.generated, requested: draft.requested })}</Button>}
    <Dialog open={open && !blocked} onOpenChange={(value) => { if (!busy) setOpen(value); }}>
      <DialogContent onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{busy ? t("quizGeneration.continuing") : remaining ? t("quizGeneration.continueQuestion") : t("quizGeneration.finishQuestion")}</DialogTitle>
          <DialogDescription>
            {t('quizGeneration.savedCount', { generated: draft.generated, requested: draft.requested })}{' '}
            {remaining > 0 ? t('quizGeneration.remaining', { remaining }) : t("quizGeneration.readyToSave")}
          </DialogDescription>
        </DialogHeader>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {busy && <p role="status" className="text-sm text-muted-foreground">{t("quizGeneration.checkingRemaining")}</p>}
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>{t("quizGeneration.notNow")}</Button>
          <Button disabled={busy} onClick={() => void resume()}>{busy ? t("quizGeneration.generatingShort") : remaining ? t("quizGeneration.continueGeneration") : t("quizGeneration.finishSaving")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
