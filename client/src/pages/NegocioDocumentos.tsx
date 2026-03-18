import { useState, useRef } from "react";
import { Link, useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Upload as UploadIcon, FileText, CheckCircle2, Clock, AlertTriangle,
  XCircle, RefreshCw, Eye, Download, ChevronRight, ArrowLeft,
  User, Building2, Shield, X, Zap, Loader2,
} from "lucide-react";

const DOC_TYPE_LABELS: Record<string, string> = {
  rg: "RG", cpf: "CPF", cnh: "CNH", comprovante_residencia: "Comprovante",
  matricula: "Matrícula", iptu: "IPTU", certidao: "Certidão",
  contrato: "Contrato", outro: "Outro",
};

const OCR_STATUS = {
  pending: { label: "Pendente", icon: Clock, color: "text-gray-500", bg: "bg-gray-100", badge: "bg-gray-100 text-gray-600" },
  processing: { label: "Lendo OCR", icon: RefreshCw, color: "text-blue-600", bg: "bg-blue-50", badge: "bg-blue-100 text-blue-700" },
  completed: { label: "Validado", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", badge: "bg-green-100 text-green-700" },
  failed: { label: "Revisar", icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50", badge: "bg-orange-100 text-orange-700" },
};

const CHECKLIST_ITEMS = [
  { key: "rg_locatario", label: "RG Locatário", participant: "Locatário" },
  { key: "cpf_locatario", label: "CPF Locatário", participant: "Locatário" },
  { key: "comprovante_renda", label: "Comprovante de renda", participant: "Locatário" },
  { key: "rg_locador", label: "RG Locador", participant: "Locador" },
  { key: "cpf_locador", label: "CPF Locador", participant: "Locador" },
  { key: "matricula", label: "Matrícula do imóvel", participant: "Imóvel" },
  { key: "iptu", label: "IPTU", participant: "Imóvel" },
];

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NegocioDocumentos() {
  const params = useParams<{ id: string }>();
  const dealId = parseInt(params.id || "0");
  const [, navigate] = useLocation();

  const [activeDoc, setActiveDoc] = useState<any>(null);
  const [participantFilter, setParticipantFilter] = useState<"todos" | string>("todos");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documents = [], isLoading, refetch } = trpc.documents.list.useQuery({ dealId });
  const uploadDoc = trpc.documents.upload.useMutation({
    onSuccess: (result) => {
      toast.success("Documento enviado! OCR em andamento...");
      refetch();
      if (result) setActiveDoc(result);
    },
    onError: () => toast.error("Erro ao enviar documento"),
  });

  const docs = documents as any[];
  const counts = {
    completed: docs.filter((d) => d.ocrStatus === "completed").length,
    processing: docs.filter((d) => d.ocrStatus === "processing").length,
    pending: docs.filter((d) => d.ocrStatus === "pending").length,
    failed: docs.filter((d) => d.ocrStatus === "failed").length,
  };

  const filteredDocs = participantFilter === "todos" ? docs : docs.filter((d) => d.participant === participantFilter);
  const participants = Array.from(new Set(docs.map((d) => d.participant).filter(Boolean)));

  const checklistDone = CHECKLIST_ITEMS.filter((item) =>
    docs.some((d) => d.docType === item.key && d.ocrStatus === "completed")
  ).length;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onload = async () => {
            const base64 = (reader.result as string).split(",")[1];
            await uploadDoc.mutateAsync({
              dealId: dealId || undefined,
              name: file.name,
              mimeType: file.type,
              fileBase64: base64,
              fileSize: file.size,
              docType: "outro",
            });
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <DashboardShell
      searchPlaceholder="Buscar documentos..."
      headerRight={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-sm">
            <Eye className="w-4 h-4" /> Consultar OCR
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon className="w-4 h-4" /> Novo upload
          </Button>
        </div>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.docx"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link href="/dashboard/negocios">
          <span className="hover:text-gray-900 cursor-pointer">Negócios</span>
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">Documentos do Negócio #{dealId}</span>
      </div>

      <div className="flex gap-6">
        {/* Left: Main content */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-black text-gray-900">Documentos do Negócio</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Faça upload, consulte o OCR e valide os dados extraídos antes de gerar o contrato
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { key: "completed", label: "Validados", count: counts.completed, icon: CheckCircle2, color: "text-green-600", border: "border-l-green-500" },
              { key: "processing", label: "OCR em andamento", count: counts.processing, icon: RefreshCw, color: "text-blue-600", border: "border-l-blue-500" },
              { key: "pending", label: "Pendentes", count: counts.pending, icon: Clock, color: "text-yellow-600", border: "border-l-yellow-500" },
              { key: "failed", label: "Com problema", count: counts.failed, icon: AlertTriangle, color: "text-red-600", border: "border-l-red-500" },
            ].map((stat) => (
              <div key={stat.key} className={`bg-white rounded-xl border border-border border-l-4 ${stat.border} p-4`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <div className={`text-2xl font-black ${stat.color}`}>{stat.count}</div>
              </div>
            ))}
          </div>

          {/* Upload Zone */}
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <UploadIcon className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-gray-900 text-sm">Upload de Documentos</h2>
              <span className="text-xs text-muted-foreground">Arraste arquivos ou clique para selecionar · PDF, JPG, PNG, DOCX</span>
            </div>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50/50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="text-sm text-blue-600 font-medium">Enviando e processando OCR...</p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <UploadIcon className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Arraste documentos aqui</p>
                  <p className="text-xs text-muted-foreground mt-1">ou clique para selecionar do seu dispositivo</p>
                  <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                    {["RG", "CPF", "CNH", "COMPROVANTE", "MATRÍCULA", "IPTU", "CERTIDÕES"].map((tag) => (
                      <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Documents List */}
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Documentos enviados</h2>
                <p className="text-xs text-muted-foreground">Clique em um documento para revisar o OCR</p>
              </div>
              <span className="text-xs text-muted-foreground">{docs.length} arquivos</span>
            </div>

            {/* Participant filter */}
            {participants.length > 0 && (
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-gray-50/50">
                {(["todos", ...participants] as string[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setParticipantFilter(p)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                      participantFilter === p ? "bg-blue-600 text-white" : "bg-white border border-border text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {p === "todos" ? "Todos" : p}
                  </button>
                ))}
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Nenhum documento enviado ainda</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => fileInputRef.current?.click()}>
                  <UploadIcon className="w-4 h-4 mr-1" /> Enviar primeiro documento
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredDocs.map((doc: any) => {
                  const status = OCR_STATUS[doc.ocrStatus as keyof typeof OCR_STATUS] || OCR_STATUS.pending;
                  const StatusIcon = status.icon;
                  const isActive = activeDoc?.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors ${isActive ? "bg-blue-50" : "hover:bg-gray-50/50"}`}
                      onClick={() => setActiveDoc(isActive ? null : doc)}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${status.bg}`}>
                        <FileText className={`w-5 h-5 ${status.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate">{doc.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {doc.participant && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{doc.participant}</span>
                          )}
                          {doc.fileSize && <span className="text-xs text-muted-foreground">{formatFileSize(doc.fileSize)}</span>}
                          {doc.createdAt && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.badge}`}>
                        <StatusIcon className={`w-3.5 h-3.5 ${doc.ocrStatus === "processing" ? "animate-spin" : ""}`} />
                        {status.label}
                      </div>
                      {doc.ocrConfidence && (
                        <span className="text-xs text-muted-foreground font-medium">
                          OCR {Math.round(doc.ocrConfidence * 100)}%
                        </span>
                      )}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {doc.fileUrl && (
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <button className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: OCR Panel + Checklist */}
        <div className="w-80 flex-shrink-0 space-y-4">
          {/* OCR Data Panel */}
          {activeDoc ? (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-bold text-gray-900">{activeDoc.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${OCR_STATUS[activeDoc.ocrStatus as keyof typeof OCR_STATUS]?.badge || "bg-gray-100 text-gray-600"}`}>
                    {OCR_STATUS[activeDoc.ocrStatus as keyof typeof OCR_STATUS]?.label || "Pendente"}
                  </span>
                  <button onClick={() => setActiveDoc(null)} className="text-muted-foreground hover:text-gray-900">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* OCR Preview thumbnail */}
              {activeDoc.fileUrl && (
                <div className="p-3 border-b border-border">
                  <div className="w-full h-28 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {activeDoc.mimeType?.startsWith("image/") ? (
                      <img src={activeDoc.fileUrl} alt={activeDoc.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                        <span className="text-xs text-muted-foreground">PDF</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Extracted data */}
              <div className="p-4">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  Dados extraídos pelo OCR
                </div>
                {activeDoc.ocrData ? (
                  <div className="space-y-3">
                    {Object.entries(activeDoc.ocrData as Record<string, any>).map(([key, value]) => {
                      if (!value || key === "rawText") return null;
                      const conf = activeDoc.ocrConfidence || 0;
                      const confPct = Math.round(conf * 100);
                      const confColor = confPct >= 90 ? "text-green-600" : confPct >= 70 ? "text-yellow-600" : "text-red-600";
                      const labels: Record<string, string> = {
                        fullName: "Nome completo", cpf: "CPF", rg: "RG / Órgão emissor",
                        birthDate: "Data de nascimento", address: "Endereço", phone: "Telefone",
                        email: "E-mail", nationality: "Nacionalidade", maritalStatus: "Estado civil",
                        profession: "Profissão",
                      };
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                              {labels[key] || key}
                            </span>
                            <span className={`text-xs font-bold ${confColor}`}>{confPct}% conf.</span>
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${confPct >= 90 ? "border-green-200 bg-green-50 text-green-800" : "border-yellow-200 bg-yellow-50 text-yellow-800"}`}>
                            <span className="flex-1">{String(value)}</span>
                            {confPct >= 90 && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    {activeDoc.ocrStatus === "processing" ? (
                      <>
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">OCR em andamento...</p>
                        <Progress value={67} className="mt-3 h-1.5" />
                      </>
                    ) : (
                      <>
                        <FileText className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Nenhum dado extraído ainda</p>
                      </>
                    )}
                  </div>
                )}
                {activeDoc.ocrData && (
                  <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm" size="sm">
                    Confirmar dados
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border p-6 text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-sm font-semibold text-gray-700">Painel OCR</p>
              <p className="text-xs text-muted-foreground mt-1">Clique em um documento para ver os dados extraídos</p>
            </div>
          )}

          {/* Legal Checklist */}
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-gray-900">Checklist Jurídico</span>
              </div>
              <span className="text-xs font-bold text-muted-foreground">{checklistDone}/{CHECKLIST_ITEMS.length} ok</span>
            </div>
            <div className="p-3 space-y-1">
              {CHECKLIST_ITEMS.map((item) => {
                const done = docs.some((d) => d.docType === item.key && d.ocrStatus === "completed");
                return (
                  <div key={item.key} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${done ? "bg-green-50" : "bg-gray-50"}`}>
                    {done
                      ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      : <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-semibold ${done ? "text-green-700" : "text-gray-700"}`}>{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.participant}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-4 pb-4">
              <Progress value={(checklistDone / CHECKLIST_ITEMS.length) * 100} className="h-2 mb-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{checklistDone} validados</span>
                <span>{CHECKLIST_ITEMS.length - checklistDone} pendentes</span>
              </div>
            </div>
            {checklistDone === CHECKLIST_ITEMS.length && (
              <div className="px-4 pb-4">
                <Link href={`/dashboard/contrato?dealId=${dealId}`}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm" size="sm">
                    Gerar contrato →
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
