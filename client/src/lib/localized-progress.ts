type Translate = (key: string, params?: Record<string, string | number>) => string;

// The server sends English progress text. Translate at render time so a language
// change also updates an upload or generation that is already running.
const messages: Record<string, string> = {
  'Starting quiz generation...': 'quizGeneration.starting',
  'Reading your study material...': 'quizGeneration.reading',
  'Reading your quiz prompt...': 'quizGeneration.readingPrompt',
  'Analyzing content structure...': 'quizGeneration.analyzing',
  'Planning your requested quiz...': 'quizGeneration.planning',
  'Preparing quiz generation...': 'quizGeneration.preparing',
  'AI is generating questions...': 'quizGeneration.generating',
  'Processing AI response...': 'quizGeneration.processing',
  'Validating generated questions...': 'quizGeneration.validating',
  'Finalizing your quiz...': 'quizGeneration.finalizing',
  'Saving your quiz...': 'quizGeneration.saving',
  'Quiz created successfully!': 'quizGeneration.complete',
  'Determining quiz language...': 'quizGeneration.language',
  'Creating study material for your quiz...': 'quizGeneration.creatingMaterial',
  'Study material created. Generating questions from it...': 'quizGeneration.materialReady',
  'Analyzing image content types...': 'quizGeneration.classifying',
  'Processing visual content...': 'quizGeneration.visuals',
  'Solving and independently auditing answers...': 'quizGeneration.verifying',
  'Reading text from images...': 'quizGeneration.extracting',
  'AI reading unavailable. Using basic OCR...': 'quizGeneration.ocrFallback',
  'AI is selecting multiple-choice questions and finding answers...': 'quizGeneration.importingQuestions',
  'Processing files...': 'fileUpload.processing',
  'Preparing files...': 'fileUpload.preparing',
  'Queued for processing...': 'fileUpload.queued',
  'Starting document analysis...': 'fileUpload.analyzing',
  'Extracting text from PDF...': 'fileUpload.extractingPdf',
  'Extracting text from document...': 'fileUpload.extractingDocument',
  'Preparing image for quiz generation...': 'fileUpload.preparingImage',
  'Scanning for images and graphics...': 'fileUpload.scanningImages',
  'Preparing embedded images for quiz generation...': 'fileUpload.embeddedImages',
  'Finalizing...': 'fileUpload.finalizing',
  'Document ready for visual analysis!': 'fileUpload.documentReady',
  'Image ready for visual analysis!': 'fileUpload.imageReady',
  'Extraction complete!': 'fileUpload.complete',
  'Extraction failed': 'fileUpload.extractionFailed',
};

export function localizeProgressMessage(message: string, t: Translate, fallbackKey: string): string {
  if (messages[message]) return t(messages[message]);
  const saved = message.match(/^(\d+) of (\d+) validated questions saved\.$/);
  if (saved) return t('quizGeneration.checkpoint', { generated: saved[1], requested: saved[2] });
  const remaining = message.match(/^Generating (\d+) remaining questions?\.\.\.$/);
  if (remaining) return t('quizGeneration.remainingProgress', { count: remaining[1] });
  const imported = message.match(/^Imported (\d+) questions!$/);
  if (imported) return t('quizGeneration.importedCount', { count: imported[1] });
  const pdfPage = message.match(/^Extracting text from PDF \(page (\d+) of (\d+)\)\.\.\.$/);
  if (pdfPage) return t('fileUpload.pdfPageProgress', { current: pdfPage[1], total: pdfPage[2] });
  return t(fallbackKey);
}
