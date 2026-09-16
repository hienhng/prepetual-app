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
      if (!response.ok) throw new Error(result.message || "Could not resume generation.");
      if (result.type === "complete") {
        await onComplete(result.quiz);
        setOpen(false);
      } else if (result.type === "paused") {
        onDraft(result.draft);
      } else {
        throw new Error("Generation stopped unexpectedly. Your saved questions are retained.");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not resume. Your questions are saved.");
    } finally {
      setBusy(false);
    }
  }

  if (!draft) return null;
  const remaining = Math.max(0, draft.requested - draft.generated);
  return <>
    {!open && <Button variant="outline" disabled={blocked} onClick={() => setOpen(true)}>Resume saved quiz · {draft.generated}/{draft.requested} questions</Button>}
    <Dialog open={open && !blocked} onOpenChange={(value) => { if (!busy) setOpen(value); }}>
      <DialogContent onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{busy ? "Continuing your quiz…" : remaining ? "Continue generating?" : "Finish saving your quiz?"}</DialogTitle>
          <DialogDescription>
            {draft.generated} of {draft.requested} questions are validated and saved.
            {remaining > 0 ? ` Generation stopped before reaching your requested count. Continue to generate the remaining ${remaining}? Your saved questions will stay unchanged.` : "Your questions are ready. Try finishing the save again."}
          </DialogDescription>
        </DialogHeader>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {busy && <p role="status" className="text-sm text-muted-foreground">Generating and checking the remaining questions…</p>}
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>Not now</Button>
          <Button disabled={busy} onClick={() => void resume()}>{busy ? "Generating…" : remaining ? "Continue generation" : "Finish saving"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
