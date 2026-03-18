import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { Upload as UploadIcon, X, FileText, Image, CheckCircle2, Loader2, ArrowLeft, ArrowRight, Zap } from "lucide-react";

type DocType = "rg" | "cpf" | "cnh" | "comprovante_residencia" | "matricula" | "iptu" | "certidao" | "contrato" | "outro";
type UploadStatus = "idle" | "uploading" | "done" | "error";

interface UploadedFile {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  fileUrl?: string;
  documentId?: number;
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

function detectDocType(filename: string): DocType {
  const lower = filename.toLowerCase();
  if (lower.includes("rg") || lower.includes("identidade")) return "rg";
  if (lower.includes("cpf")) return "cpf";
  if (lower.includes("cnh") || lower.includes("habilitacao")) return "cnh";
  if (lower.includes("comprovante") || lower.includes("residencia")) return "comprovante_residencia";
  if (lower.includes("matricula")) return "matricula";
  if (lower.includes("iptu")) return "iptu";
  if (lower.includes("certidao")) return "certidao";
  if (lower.includes("contrato")) return "contrato";
  return "outro";
}

export default function OnboardingUpload() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.documents.upload.useMutation();
  // Wait for auth to finish loading before deciding to redirect.
  // Only redirect if we are certain the user is NOT authenticated.
  useEffect(() => {
    if (authLoading) return; // still checking session — do nothing
    if (!isAuthenticated) {
      sessionStorage.setItem("efcon_post_login", "/comecar");
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    const valid = arr.filter((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        toast.error(`Tipo não suportado: ${f.name}`);
        return false;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`Arquivo muito grande (máx. 10 MB): ${f.name}`);
        return false;
      }
      return true;
    });
    setFiles((prev) => [
      ...prev,
      ...valid.map((f) => ({
        id: `${f.name}-${Date.now()}-${Math.random()}`,
        file: f,
        status: "idle" as UploadStatus,
        progress: 0,
      })),
    ]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadAll = async () => {
    if (files.length === 0) {
      setLocation("/dashboard");
      return;
    }

    setIsUploading(true);
    let successCount = 0;

    for (const uploadedFile of files) {
      if (uploadedFile.status === "done") continue;

      setFiles((prev) =>
        prev.map((f) => (f.id === uploadedFile.id ? { ...f, status: "uploading", progress: 30 } : f))
      );

      try {
        // Convert file to base64 for upload
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(uploadedFile.file);
        });

        setFiles((prev) =>
          prev.map((f) => (f.id === uploadedFile.id ? { ...f, progress: 60 } : f))
        );

        const docType = detectDocType(uploadedFile.file.name);
        const result = await uploadMutation.mutateAsync({
          name: uploadedFile.file.name,
          mimeType: uploadedFile.file.type,
          fileBase64: base64,
          fileSize: uploadedFile.file.size,
          docType,
        });

        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? { ...f, status: "done", progress: 100, fileUrl: result.fileUrl }
              : f
          )
        );
        successCount++;
      } catch (err: any) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id ? { ...f, status: "error", error: err.message } : f
          )
        );
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      toast.success(`${successCount} documento(s) enviado(s) com sucesso!`);
    }

    // Redirect to dashboard after a short delay
    setTimeout(() => setLocation("/dashboard"), 800);
  };

  const handleSkip = () => {
    setLocation("/dashboard");
  };

  const handleBack = () => {
    setLocation("/");
  };

  const allDone = files.length > 0 && files.every((f) => f.status === "done");
  const hasUploading = files.some((f) => f.status === "uploading");

  // While auth is loading, show a neutral skeleton so the page doesn't flash
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-[#0f1b35] h-14 flex items-center px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Efcon</span>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#0f1b35] h-14 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Efcon</span>
        </div>
        <button
          onClick={handleSkip}
          className="text-white/70 hover:text-white text-sm flex items-center gap-1.5 transition-colors"
        >
          Pular <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          {/* Badge */}
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
              <UploadIcon className="w-3.5 h-3.5 text-blue-500" />
              Upload rápido
            </span>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Envie seus documentos</h1>
            <p className="text-gray-500 text-base">
              Ao enviar, o OCR extrai os dados automaticamente e cria a ficha da pessoa.
            </p>
          </div>

          {/* Upload area */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative flex flex-col items-center justify-center gap-3 p-10 cursor-pointer
                transition-all duration-200 border-2 border-dashed m-4 rounded-xl
                ${isDragging
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={(e) => e.target.files && addFiles(e.target.files)}
              />
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? "bg-blue-100" : "bg-gray-100"}`}>
                <UploadIcon className={`w-6 h-6 ${isDragging ? "text-blue-600" : "text-gray-500"}`} />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-800 text-base">Arraste documentos aqui</p>
                <p className="text-gray-500 text-sm mt-0.5">ou clique para selecionar arquivos</p>
                <p className="text-gray-400 text-xs mt-1">JPG, PNG ou PDF — máx. 10 MB por arquivo</p>
              </div>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="px-4 pb-4 space-y-2">
                {files.map((f) => (
                  <div
                    key={f.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                      f.status === "done"
                        ? "bg-green-50 border-green-200"
                        : f.status === "error"
                        ? "bg-red-50 border-red-200"
                        : f.status === "uploading"
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    {/* Icon */}
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      {f.file.type === "application/pdf" ? (
                        <FileText className="w-4 h-4 text-red-500" />
                      ) : (
                        <Image className="w-4 h-4 text-blue-500" />
                      )}
                    </div>

                    {/* Name + progress */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{f.file.name}</p>
                      {f.status === "uploading" && (
                        <div className="mt-1 h-1 bg-blue-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${f.progress}%` }}
                          />
                        </div>
                      )}
                      {f.status === "error" && (
                        <p className="text-xs text-red-500 mt-0.5">{f.error || "Erro ao enviar"}</p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex-shrink-0">
                      {f.status === "done" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                      {f.status === "uploading" && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                      {(f.status === "idle" || f.status === "error") && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                          className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>

            <div className="flex items-center gap-3">
              {files.length === 0 ? (
                <Button
                  onClick={handleSkip}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 gap-2"
                >
                  Continuar sem arquivos <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleSkip}
                    className="text-gray-600 border-gray-300"
                    disabled={isUploading}
                  >
                    Pular
                  </Button>
                  <Button
                    onClick={uploadAll}
                    disabled={isUploading || allDone}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
                      </>
                    ) : allDone ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Concluído!
                      </>
                    ) : (
                      <>
                        Enviar {files.length} arquivo{files.length !== 1 ? "s" : ""} <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
