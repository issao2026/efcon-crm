import { useState, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Zap, Upload as UploadIcon, X, FileText, Image, CheckCircle2, AlertCircle,
  Loader2, ArrowLeft, ArrowRight, Eye, RefreshCw, ChevronDown,
  User, Home, FileSearch, Shield
} from "lucide-react";
import { getLoginUrl } from "@/const";

// ─── Types ───────────────────────────────────────────────────────────────────
type DocType = "rg" | "cpf" | "cnh" | "comprovante_residencia" | "matricula" | "iptu" | "certidao" | "contrato" | "outro";
type UploadStatus = "idle" | "uploading" | "processing_ocr" | "done" | "error";

interface UploadedFile {
  id: string;
  file: File;
  docType: DocType;
  status: UploadStatus;
  progress: number;
  fileUrl?: string;
  documentId?: number;
  ocrFields?: Record<string, string>;
  ocrConfidence?: number;
  error?: string;
}

const DOC_TYPE_OPTIONS: { value: DocType; label: string; icon: React.ElementType; desc: string }[] = [
  { value: "rg", label: "RG", icon: User, desc: "Registro Geral" },
  { value: "cpf", label: "CPF", icon: FileText, desc: "Cadastro de Pessoa Física" },
  { value: "cnh", label: "CNH", icon: Shield, desc: "Carteira Nacional de Habilitação" },
  { value: "comprovante_residencia", label: "Comprovante de Residência", icon: Home, desc: "Conta de luz, água, etc." },
  { value: "matricula", label: "Matrícula do Imóvel", icon: FileSearch, desc: "Registro de imóveis" },
  { value: "iptu", label: "IPTU", icon: FileText, desc: "Imposto Predial" },
  { value: "certidao", label: "Certidão", icon: Shield, desc: "Certidão negativa, etc." },
  { value: "contrato", label: "Contrato", icon: FileText, desc: "Contrato anterior" },
  { value: "outro", label: "Outro", icon: FileText, desc: "Outros documentos" },
];

const OCR_FIELD_LABELS: Record<string, string> = {
  nome: "Nome completo",
  cpf: "CPF",
  rg: "RG",
  data_nascimento: "Data de nascimento",
  nome_mae: "Nome da mãe",
  nome_pai: "Nome do pai",
  orgao_emissor: "Órgão emissor",
  categoria_cnh: "Categoria CNH",
  endereco: "Endereço",
  cidade: "Cidade",
  estado: "Estado",
  cep: "CEP",
  descricao_imovel: "Descrição do imóvel",
  matricula: "Matrícula",
  cartorio: "Cartório",
  tipo_documento: "Tipo de documento",
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getFileIcon(file: File) {
  if (file.type.startsWith("image/")) return Image;
  return FileText;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Upload() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState<"upload" | "review" | "done">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.documents.upload.useMutation();
  const ocrMutation = trpc.documents.processOcr.useMutation();

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    const valid = arr.filter((f) => {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name}: arquivo muito grande (máx. 10 MB)`);
        return false;
      }
      if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(f.type)) {
        toast.error(`${f.name}: formato não suportado`);
        return false;
      }
      return true;
    });

    setFiles((prev) => [
      ...prev,
      ...valid.map((f) => ({
        id: `${Date.now()}-${Math.random()}`,
        file: f,
        docType: "outro" as DocType,
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

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFile = (id: string, updates: Partial<UploadedFile>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const setDocType = (id: string, docType: DocType) => {
    updateFile(id, { docType });
  };

  const processFile = async (uploadedFile: UploadedFile) => {
    try {
      updateFile(uploadedFile.id, { status: "uploading", progress: 20 });

      const base64 = await fileToBase64(uploadedFile.file);
      updateFile(uploadedFile.id, { progress: 50 });

      const result = await uploadMutation.mutateAsync({
        name: uploadedFile.file.name,
        docType: uploadedFile.docType,
        fileBase64: base64,
        mimeType: uploadedFile.file.type,
        fileSize: uploadedFile.file.size,
      });

      updateFile(uploadedFile.id, { progress: 70, fileUrl: result.fileUrl, status: "processing_ocr" });

      // Process OCR
      const ocrResult = await ocrMutation.mutateAsync({
        documentId: 0, // will be updated
        fileUrl: result.fileUrl,
        docType: uploadedFile.docType,
      });

      updateFile(uploadedFile.id, {
        status: "done",
        progress: 100,
        ocrFields: ocrResult.fields as Record<string, string>,
        ocrConfidence: ocrResult.confidence,
      });
    } catch (error: any) {
      updateFile(uploadedFile.id, { status: "error", error: error.message || "Erro no processamento" });
    }
  };

  const handleProcessAll = async () => {
    const idleFiles = files.filter((f) => f.status === "idle");
    if (idleFiles.length === 0) {
      toast.info("Todos os arquivos já foram processados");
      return;
    }

    setStep("review");
    for (const f of idleFiles) {
      await processFile(f);
    }
  };

  const allDone = files.length > 0 && files.every((f) => f.status === "done" || f.status === "error");
  const anyProcessing = files.some((f) => f.status === "uploading" || f.status === "processing_ocr");

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Acesso restrito</h2>
          <Button onClick={() => (window.location.href = getLoginUrl())}>Entrar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold">Efcon</span>
        </div>
        <Link href="/dashboard">
          <button className="text-white/60 hover:text-white text-sm flex items-center gap-2 transition-colors">
            Pular <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {[
            { key: "upload", label: "Upload" },
            { key: "review", label: "OCR & Revisão" },
            { key: "done", label: "Contrato" },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s.key
                    ? "bg-blue-600 text-white"
                    : s.key === "done" && allDone
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-sm font-medium ${step === s.key ? "text-gray-900" : "text-gray-400"}`}>
                {s.label}
              </span>
              {i < 2 && <ChevronDown className="w-4 h-4 text-gray-300 rotate-[-90deg]" />}
            </div>
          ))}
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-xs mb-4">
            <UploadIcon className="w-3 h-3 mr-1" /> Upload rápido
          </Badge>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Envie seus documentos</h1>
          <p className="text-gray-500">
            Ao enviar, o OCR extrai os dados automaticamente e cria a ficha da pessoa.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all mb-6 ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UploadIcon className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Arraste documentos aqui</h3>
          <p className="text-gray-500 text-sm mb-1">ou clique para selecionar arquivos</p>
          <p className="text-gray-400 text-xs">JPG, PNG ou PDF — máx. 10 MB por arquivo</p>
        </div>

        {/* Document type quick-select */}
        {files.length === 0 && (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-6">
            {DOC_TYPE_OPTIONS.slice(0, 5).map((opt) => (
              <div
                key={opt.value}
                className="bg-white border border-gray-100 rounded-xl p-3 text-center hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <opt.icon className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <div className="text-xs font-semibold text-gray-700">{opt.label}</div>
                <div className="text-xs text-gray-400">{opt.desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-3 mb-6">
            {files.map((f) => {
              const FileIcon = getFileIcon(f.file);
              return (
                <div key={f.id} className="bg-white border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    {/* Preview / icon */}
                    <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      {f.file.type.startsWith("image/") ? (
                        <img
                          src={URL.createObjectURL(f.file)}
                          alt={f.file.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <FileIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold text-gray-900 text-sm truncate max-w-xs">{f.file.name}</div>
                          <div className="text-xs text-gray-400">{formatFileSize(f.file.size)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {f.status === "done" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                          {f.status === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
                          {(f.status === "uploading" || f.status === "processing_ocr") && (
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                          )}
                          {f.status === "idle" && (
                            <button onClick={() => removeFile(f.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Doc type selector */}
                      {f.status === "idle" && (
                        <select
                          value={f.docType}
                          onChange={(e) => setDocType(f.id, e.target.value as DocType)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full max-w-xs"
                        >
                          {DOC_TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      )}

                      {/* Progress */}
                      {(f.status === "uploading" || f.status === "processing_ocr") && (
                        <div className="mt-2">
                          <Progress value={f.progress} className="h-1.5" />
                          <div className="text-xs text-gray-400 mt-1">
                            {f.status === "uploading" ? "Enviando arquivo..." : "Processando OCR com IA..."}
                          </div>
                        </div>
                      )}

                      {/* Error */}
                      {f.status === "error" && (
                        <div className="mt-2 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                          {f.error || "Erro no processamento"}
                        </div>
                      )}

                      {/* OCR Results */}
                      {f.status === "done" && f.ocrFields && (
                        <div className="mt-3 bg-green-50 border border-green-100 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-green-700">
                              OCR concluído — {f.ocrConfidence?.toFixed(0)}% precisão
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            {Object.entries(f.ocrFields)
                              .filter(([k, v]) => k !== "confidence" && k !== "tipo_documento" && v)
                              .slice(0, 8)
                              .map(([key, value]) => (
                                <div key={key} className="text-xs">
                                  <span className="text-gray-500">{OCR_FIELD_LABELS[key] || key}: </span>
                                  <span className="font-semibold text-gray-900">{String(value)}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="text-gray-500 gap-2" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>

          <div className="flex items-center gap-3">
            {files.length > 0 && !anyProcessing && !allDone && (
              <Button
                onClick={handleProcessAll}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                disabled={anyProcessing}
              >
                {anyProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
                ) : (
                  <><RefreshCw className="w-4 h-4" /> Processar OCR</>
                )}
              </Button>
            )}

            {allDone && (
              <Button
                onClick={() => navigate("/dashboard/contrato")}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                Gerar contrato <ArrowRight className="w-4 h-4" />
              </Button>
            )}

            <Button variant="outline" className="gap-2" onClick={() => navigate("/dashboard/contrato")}>
              Continuar sem arquivos <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tip */}
        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
          <p className="text-blue-700 text-sm">
            <strong>Dica:</strong> Envie RG, CPF e comprovante de residência do comprador e vendedor para que o sistema preencha o contrato automaticamente com OCR.
          </p>
        </div>
      </div>
    </div>
  );
}
