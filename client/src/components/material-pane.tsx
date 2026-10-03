import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Image, X, ZoomIn, ChevronLeft, ChevronRight, Loader2, BookCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/language-context';
import { apiRequest } from '@/lib/queryClient';
import { MathText } from '@/components/formatted-text';

interface MaterialPaneProps {
  materialImages: string[];
  materialText: string;
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  panelWidth?: number;
  onPanelWidthChange?: (width: number) => void;
  quizId?: string;
}

type ViewMode = 'images' | 'text' | 'summary';
const MATERIAL_SUMMARY_CACHE_VERSION = 'v2-images';

interface MaterialState {
  viewMode: ViewMode;
  imageIndex: number;
  summary: string;
  isSummarizing: boolean;
  error: string | null;
}

const useMaterialState = (initialHasImages: boolean) => {
  const [state, setState] = useState<MaterialState>({
    viewMode: initialHasImages ? 'images' : 'text',
    imageIndex: 0,
    summary: '',
    isSummarizing: false,
    error: null,
  });

  const setViewMode = useCallback((mode: ViewMode) => {
    setState(prev => ({ ...prev, viewMode: mode, imageIndex: 0 }));
  }, []);

  const setImageIndex = useCallback((index: number) => {
    setState(prev => ({ ...prev, imageIndex: index }));
  }, []);

  const setSummary = useCallback((summary: string) => {
    setState(prev => ({ ...prev, summary, error: null }));
  }, []);

  const setIsSummarizing = useCallback((isSummarizing: boolean) => {
    setState(prev => ({ ...prev, isSummarizing }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const resetState = useCallback(() => {
    setState({
      viewMode: initialHasImages ? 'images' : 'text',
      imageIndex: 0,
      summary: '',
      isSummarizing: false,
      error: null,
    });
  }, [initialHasImages]);

  return { state, setViewMode, setImageIndex, setSummary, setIsSummarizing, setError, resetState };
};

const MaterialContent: React.FC<{
  viewMode: ViewMode;
  materialText: string;
  materialImages: string[];
  imageIndex: number;
  summary: string;
  error: string | null;
  onImageSelect: (index: number) => void;
  onImageExpand: (url: string) => void;
}> = ({ viewMode, materialText, materialImages, imageIndex, summary, error, onImageSelect, onImageExpand }) => {
  const { t } = useLanguage();
  const hasImages = materialImages.length > 0;
  const hasText = Boolean(materialText.trim());

  if (viewMode === 'text' && hasText) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-border/70 bg-card p-4 text-sm leading-7 text-muted-foreground shadow-sm mb-11">
          <MathText content={materialText} />
        </div>
        {error && (
          <div className="rounded-3xl border border-red-300 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-300 shadow-sm">
            {error}
          </div>
        )}
      </div>
    );
  }

  if (viewMode === 'summary' && summary) {
    return (
      <div className="space-y-4 pb-11">
        <div className="rounded-3xl border border-border/70 bg-background p-4 text-sm leading-7 text-foreground shadow-sm">
          <p className="mb-3 text-sm font-semibold text-foreground">{t("materialPane.summary")}</p>
          <MathText content={summary} />
        </div>
        {error && (
          <div className="rounded-3xl border border-red-300 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-300 shadow-sm">
            {error}
          </div>
        )}
      </div>
    );
  }

  if (viewMode === 'images' && hasImages) {
    return (
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-[26px] border border-border/70 bg-card shadow-sm">
          <img
            src={materialImages[imageIndex]}
            alt={`Study material ${imageIndex + 1}`}
            className="w-full min-h-[260px] max-h-[55vh] object-contain bg-zinc-950 cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => onImageExpand(materialImages[imageIndex])}
          />
          <div className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 border border-border text-[11px] font-semibold text-muted-foreground shadow-sm">
            {imageIndex + 1} / {materialImages.length}
          </div>
        </div>

        {materialImages.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {materialImages.map((imageUrl: string, idx: number) => (
              <button
                key={idx}
                type="button"
                onClick={() => onImageSelect(idx)}
                className={`overflow-hidden rounded-2xl border transition ${idx === imageIndex ? 'border-primary ring-2 ring-primary/30' : 'border-border/70 hover:border-primary'}`}
              >
                <img
                  src={imageUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  className="h-20 w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-6 text-sm leading-7 text-muted-foreground shadow-sm">
      {t('quizPlayer.material')}
    </div>
  );
};

const MobileView: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  materialImages: string[];
  materialText: string;
  state: MaterialState;
  onViewModeChange: (mode: ViewMode) => void;
  onImageSelect: (index: number) => void;
  onImageExpand: (url: string) => void;
  onSummarize: () => void;
}> = ({
  isOpen,
  onClose,
  materialImages,
  materialText,
  state,
  onViewModeChange,
  onImageSelect,
  onImageExpand,
  onSummarize,
}) => {
  const { t } = useLanguage();
  const hasImages = materialImages.length > 0;
  const hasText = Boolean(materialText.trim());

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 150 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 1 }}
            onDragEnd={(e, info) => {
              if (info.velocity.y > 20 || info.offset.y > 120) {
                onClose();
              }
            }}
            className="fixed bottom-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur-md rounded-t-3xl shadow-2xl flex flex-col border-t border-border/60"
            style={{ maxHeight: '85vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 shrink-0">
              <div className="flex items-center gap-2">
                {state.viewMode === 'images' ? (
                  <Image className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-semibold text-foreground">
                  {state.viewMode === 'images' && materialImages.length > 1
                    ? t('quizPlayer.imagesCount', { current: state.imageIndex + 1, total: materialImages.length })
                    : t('quizPlayer.studyMaterial')}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Tabs / Segmented controls for switching modes */}
            {hasImages && hasText && (
              <div className="px-5 py-2.5 bg-muted/20 border-b border-border/40 shrink-0">
                <div className="grid grid-cols-2 gap-2 bg-muted/40 p-1 rounded-full border border-border/50">
                  <button
                    type="button"
                    onClick={() => onViewModeChange('images')}
                    className={`rounded-full py-1.5 text-xs font-bold transition-all duration-200 ${
                      state.viewMode === 'images'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t('quizPlayer.viewImages')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewModeChange('text')}
                    className={`rounded-full py-1.5 text-xs font-bold transition-all duration-200 ${
                      state.viewMode === 'text' || state.viewMode === 'summary'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t('quizPlayer.viewText')}
                  </button>
                </div>
              </div>
            )}

            {/* Summarize CTA section */}
            {(hasText || hasImages) && (state.viewMode === 'text' || state.viewMode === 'summary' || !hasText) && (
              <div className="px-5 py-2.5 border-b border-border/40 shrink-0 flex items-center justify-between gap-3 bg-muted/10">
                <div className="flex items-center gap-1.5">
                  <BookCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {state.viewMode === 'summary' ? t("materialPane.showingSummary") : hasText ? t("materialPane.extractedText") : t("materialPane.sourceImages")}
                  </span>
                </div>

                {state.summary ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-full text-xs h-8 px-4 shrink-0"
                    onClick={() => onViewModeChange(state.viewMode === 'summary' ? 'text' : 'summary')}
                  >
                    {state.viewMode === 'summary' ? t("materialPane.original") : t("materialPane.viewSummary")}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-full text-xs h-8 px-4 shrink-0"
                    onClick={onSummarize}
                    disabled={state.isSummarizing}
                  >
                    {state.isSummarizing ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        <span>{t("materialPane.summarizing")}</span>
                      </>
                    ) : (
                      <span>{t("materialPane.summarize")}</span>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <MaterialContent
                viewMode={state.viewMode}
                materialText={materialText}
                materialImages={materialImages}
                imageIndex={state.imageIndex}
                summary={state.summary}
                error={state.error}
                onImageSelect={onImageSelect}
                onImageExpand={onImageExpand}
              />
            </div>

            {/* Safe area spacer */}
            <div className="h-safe-area-inset-bottom shrink-0 pb-4" />
            {state.summary ? (
              <div className="flex items-center justify-center gap-2 py-2 border-t border-border/40 bg-muted/10">
                <span className="text-center text-sm italic text-muted-foreground">
                  {t("materialPane.disclaimer")}
                </span>
              </div>
            ) : (
              <></>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const DesktopView: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  materialImages: string[];
  materialText: string;
  state: MaterialState;
  onViewModeChange: (mode: ViewMode) => void;
  onImageSelect: (index: number) => void;
  onImageExpand: (url: string) => void;
  onSummarize: () => void;
  panelWidth: number;
  onPanelWidthChange: (width: number) => void;
}> = ({
  isOpen,
  onClose,
  materialImages,
  materialText,
  state,
  onViewModeChange,
  onImageSelect,
  onImageExpand,
  onSummarize,
  panelWidth,
  onPanelWidthChange,
}) => {
  const { t } = useLanguage();
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(panelWidth);
  const isDraggingRef = useRef(false);
  const hasImages = materialImages.length > 0;
  const hasText = Boolean(materialText.trim());

  const handleDragStart = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = panelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const containerWidth = window.innerWidth;
      const deltaX = dragStartXRef.current - e.clientX;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = Math.min(70, Math.max(20, dragStartWidthRef.current - deltaPercent));
      onPanelWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <AnimatePresence>
      {isOpen && (hasImages || hasText) && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: `${panelWidth}%`, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="border-r border-border shrink-0 bg-background/95 backdrop-blur-md relative"
        >
          <div
            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 transition-colors z-[100]"
            onMouseDown={handleDragStart}
          />
          <div className="h-full flex flex-col overflow-hidden absolute inset-0">
            {/* Header */}
            <div className="border-b border-border/70 px-4 py-4 bg-background/95 shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {hasImages ? (
                    <Image className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('quizPlayer.studyMaterial')}</p>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {hasImages && hasText
                        ? t('quizPlayer.studyMaterial')
                        : hasImages
                          ? t('quizPlayer.imagesCount', { current: state.imageIndex + 1, total: materialImages.length })
                          : t('quizPlayer.material')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* View Mode Buttons */}
              {hasImages && hasText && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onViewModeChange('images')}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                      state.viewMode === 'images'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {t('quizPlayer.viewImages')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewModeChange('text')}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                      state.viewMode === 'text'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {t('quizPlayer.viewText')}
                  </button>
                </div>
              )}

              {/* Summary Buttons */}
              {(hasText || hasImages) && state.summary && (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-full"
                    onClick={() => onViewModeChange(state.viewMode === 'summary' ? 'text' : 'summary')}
                  >
                    {state.viewMode === 'summary' ? t("materialPane.original") : t("materialPane.viewSummary")}
                  </Button>
                </div>
              )}
              {(hasText || hasImages) && !state.summary && (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-full"
                    onClick={onSummarize}
                    disabled={state.isSummarizing}
                  >
                    {state.isSummarizing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <BookCheck className="mr-2 h-4 w-4" />
                    )}
                    {t("materialPane.summarizeMaterial")}
                  </Button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <MaterialContent
                viewMode={state.viewMode}
                materialText={materialText}
                materialImages={materialImages}
                imageIndex={state.imageIndex}
                summary={state.summary}
                error={state.error}
                onImageSelect={onImageSelect}
                onImageExpand={onImageExpand}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MaterialPane: React.FC<MaterialPaneProps> = ({
  materialImages,
  materialText,
  isOpen,
  onClose,
  isMobile,
  panelWidth = 45,
  onPanelWidthChange,
  quizId,
}) => {
  const { t } = useLanguage();
  const hasImages = materialImages.length > 0;
  const hasText = Boolean(materialText.trim());

  const materialState = useMaterialState(hasImages);
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
  const materialIdentity = `${materialText}\u0000${materialImages.join('\u0000')}`;

  // Load summary from sessionStorage on mount
  useEffect(() => {
    if (!quizId) return;
    const stored = sessionStorage.getItem(`material_summary_${MATERIAL_SUMMARY_CACHE_VERSION}_${quizId}`);
    if (stored) {
      materialState.setSummary(stored);
    }
  }, [quizId, materialState.setSummary]);

  // Save summary to sessionStorage when it changes
  useEffect(() => {
    if (!quizId) return;
    const key = `material_summary_${MATERIAL_SUMMARY_CACHE_VERSION}_${quizId}`;
    try {
      if (materialState.state.summary) {
        sessionStorage.setItem(key, materialState.state.summary);
      } else {
        sessionStorage.removeItem(key);
      }
    } catch {
      // ignore storage failures
    }
  }, [quizId, materialState.state.summary]);

  // Reset state when materials change
  useEffect(() => {
    materialState.resetState();
    materialState.setError(null);
  }, [materialIdentity, materialState.resetState, materialState.setError]);

  const handleSummarize = async () => {
    if (!materialText.trim() && materialImages.length === 0) {
      materialState.setError(t('materialPane.noMaterial'));
      return;
    }

    materialState.setError(null);
    materialState.setIsSummarizing(true);

    try {
      const response = await apiRequest('POST', '/api/summarize-text', {
        text: materialText,
        documentImages: materialImages,
      });
      const data = await response.json();
      materialState.setSummary(data.summary || '');
      materialState.setViewMode('summary');
    } catch (error: any) {
      materialState.setError(t('materialPane.summaryError'));
    } finally {
      materialState.setIsSummarizing(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {isMobile ? (
        <MobileView
          isOpen={isOpen}
          onClose={onClose}
          materialImages={materialImages}
          materialText={materialText}
          state={materialState.state}
          onViewModeChange={materialState.setViewMode}
          onImageSelect={materialState.setImageIndex}
          onImageExpand={setExpandedImageUrl}
          onSummarize={handleSummarize}
        />
      ) : (
        <DesktopView
          isOpen={isOpen}
          onClose={onClose}
          materialImages={materialImages}
          materialText={materialText}
          state={materialState.state}
          onViewModeChange={materialState.setViewMode}
          onImageSelect={materialState.setImageIndex}
          onImageExpand={setExpandedImageUrl}
          onSummarize={handleSummarize}
          panelWidth={panelWidth}
          onPanelWidthChange={onPanelWidthChange || (() => {})}
        />
      )}

      {/* Expanded Image Modal */}
      <AnimatePresence>
        {expandedImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[101] bg-black/80 flex items-center justify-center p-4 sm:p-8 cursor-zoom-out"
            onClick={() => setExpandedImageUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-full max-h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={expandedImageUrl}
                alt={t("common.expandedView")}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl ring-1 ring-white/10"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute -top-4 -right-4 rounded-full shadow-lg border-2 border-background h-10 w-10 z-10"
                onClick={() => setExpandedImageUrl(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
