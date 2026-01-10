import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Image, X, Loader2, File } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuiz } from "@/lib/quiz-context";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploadProps {
  onTextExtracted: (text: string) => void;
}

export function FileUpload({ onTextExtracted }: FileUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isLoading, setIsLoading, setLoadingMessage, loadingMessage, processingProgress, setProcessingProgress, setSourceMaterial } = useQuiz();

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setIsLoading(true);
    setLoadingMessage("Uploading file...");
    setProcessingProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      const isOfficeDoc = file.type.includes("wordprocessingml") || 
                          file.type.includes("presentationml") || 
                          file.type.includes("spreadsheetml") ||
                          file.type === "application/msword" ||
                          file.type === "application/vnd.ms-powerpoint" ||
                          file.type === "application/vnd.ms-excel";
      
      let imageDataUrl: string | null = null;
      if (isImage) {
        imageDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      setLoadingMessage("Extracting text from document...");
      setProcessingProgress(30);

      const response = await fetch("/api/extract-text", {
        method: "POST",
        body: formData,
      });

      setProcessingProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to extract text");
      }

      const data = await response.json();
      setProcessingProgress(100);
      
      if (!data.text || data.text.trim().length < 50) {
        throw new Error("Not enough text could be extracted from this document. Please try a different file with more readable text.");
      }

      setSourceMaterial({
        type: isImage ? "image" : isPdf ? "pdf" : isOfficeDoc ? "document" : null,
        text: data.text,
        imageDataUrl: imageDataUrl,
      });

      onTextExtracted(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while processing the file");
      setUploadedFile(null);
      setSourceMaterial({ type: null, text: null, imageDataUrl: null });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
      setProcessingProgress(0);
    }
  }, [onTextExtracted, setIsLoading, setLoadingMessage, setProcessingProgress, setSourceMaterial]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      processFile(file);
    }
  }, [processFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/msword": [".doc"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    disabled: isLoading,
  });

  const removeFile = () => {
    setUploadedFile(null);
    setError(null);
    setSourceMaterial({ type: null, text: null, imageDataUrl: null });
    onTextExtracted("");
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full border-4 border-muted animate-pulse" />
              <div 
                className="absolute inset-0 w-20 h-20 rounded-full border-4 border-primary border-t-transparent animate-spin"
                style={{ animationDuration: "1s" }}
              />
              <Upload className="absolute inset-0 m-auto h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-medium text-foreground mb-2">{loadingMessage}</p>
            <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-quiz-purple rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${processingProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{processingProgress}% complete</p>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card
              {...getRootProps()}
              className={`
                relative p-6 sm:p-12 border-2 border-dashed cursor-pointer transition-all duration-200
                ${isDragActive 
                  ? "border-primary bg-primary/5 scale-[1.02]" 
                  : "border-muted hover:border-primary/50 hover:bg-muted/30"
                }
                ${error ? "border-destructive/50" : ""}
              `}
              data-testid="dropzone-upload"
            >
              <input {...getInputProps()} data-testid="input-file" />
              
              <div className="flex flex-col items-center text-center gap-3 sm:gap-4">
                <div className={`
                  w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-colors
                  ${isDragActive ? "bg-primary text-primary-foreground" : "bg-muted"}
                `}>
                  <Upload className="h-8 w-8 sm:h-10 sm:w-10" />
                </div>
                
                <div>
                  <p className="text-lg sm:text-xl font-semibold text-foreground mb-1">
                    {isDragActive ? "Drop your file here" : "Upload your study material"}
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Drag and drop or click to browse
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mt-1 sm:mt-2">
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <FileText className="h-3 w-3" />
                    PDF
                  </Badge>
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <File className="h-3 w-3" />
                    DOCX
                  </Badge>
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <File className="h-3 w-3" />
                    PPTX
                  </Badge>
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Image className="h-3 w-3" />
                    Images
                  </Badge>
                </div>
              </div>
            </Card>

            {uploadedFile && !error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <Card className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                      {uploadedFile.type.includes("pdf") ? (
                        <FileText className="h-5 w-5 text-primary" />
                      ) : (
                        <Image className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground truncate max-w-[200px]">
                        {uploadedFile.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile();
                    }}
                    data-testid="button-remove-file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </Card>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <Card className="p-4 bg-destructive/10 border-destructive/30">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                      <X className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium text-destructive">Upload failed</p>
                      <p className="text-sm text-muted-foreground mt-1">{error}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
