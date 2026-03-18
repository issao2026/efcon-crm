import { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FileText, Trash2, Save, X, ZoomIn, ZoomOut, RotateCw,
  CheckCircle2, AlertTriangle, Clock, Loader2, Eye, Download,
  UserPlus, ExternalLink, User
} from "lucide-react";

// ─── OCR field labels ────────────────────────────────────────────────────────
const OCR_FIELD_LABELS: Record<string, string> = {
  nome: "Nome completo",
  cpf: "CPF",
  rg: "RG",
  data_nascimento: "Data de nascimento",
  nome_mae: "Nome da mãe",
  nome_pai: "Nome do pai",
  orgao_emissor: "Órgão emissor",
  categoria_cnh: "Categoria CNH",
  validade_cnh: "Validade CNH",
  endereco: "Endereço",
  cidade: "Cidade",
  estado: "Estado",
  cep: "CEP",
  descricao_imovel: "Descrição do imóvel",
  matricula: "Matrícula",
  cartorio: "Cartório",
  area_total: "Área total",
  tipo_documento: "Tipo de documento",
  confidence: "Confiança OCR (%)",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  rg: "RG",
  cpf: "CPF",
  cnh: "CNH",
  comprovante_residencia: "Comprovante de Residência",
  matricula: "Matrícula",
  iptu: "IPTU",
  certidao: "Certidão",
  contrato: "Contrato",
  outro: "Outro",
};

const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  extraido: "bg-blue-100 text-blue-800",
  validado: "bg-green-100 text-green-800",
  rejeitado: "bg-red-100 text-red-800",
};

interface DocumentDetailModalProps {
  documentId: number | null;
  open: boolean;
  onClose: () => void;
  onDeleted?: () => void;
  onUpdated?: () => void;
}

export function DocumentDetailModal({
  documentId,
  open,
  onClose,
  onDeleted,
  onUpdated,
}: DocumentDetailModalProps) {
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageZoom, setImageZoom] = useState(100);
  const [imageRotation, setImageRotation] = useState(0);
  // New client creation state
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientRole, setNewClientRole] = useState<'comprador' | 'vendedor' | 'corretor'>('comprador');

  const utils = trpc.useUtils();
  const [autoOcrTriggered, setAutoOcrTriggered] = useState(false);

  const { data: doc, isLoading } = trpc.documents.getById.useQuery(
    { id: documentId! },
    {
      enabled: !!documentId && open,
      // Poll every 2s while OCR is processing so UI updates automatically
      refetchInterval: (query) => {
        const status = (query.state.data as any)?.ocrStatus;
        return status === 'processing' ? 2000 : false;
      },
    }
  );

  const { data: clients } = trpc.clients.list.useQuery(undefined, { enabled: open });

  const updateMutation = trpc.documents.updateOcrFields.useMutation({
    onSuccess: () => {
      toast.success("Campos OCR atualizados com sucesso");
      setIsDirty(false);
      utils.documents.list.invalidate();
      utils.documents.getById.invalidate({ id: documentId! });
      onUpdated?.();
    },
    onError: (err) => toast.error(`Erro ao salvar: ${err.message}`),
  });

  const deleteMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      toast.success("Documento excluído com sucesso");
      utils.documents.list.invalidate();
      onDeleted?.();
      onClose();
    },
    onError: (err) => toast.error(`Erro ao excluir: ${err.message}`),
  });

  const ocrMutation = trpc.documents.processOcr.useMutation({
    onSuccess: (result) => {
      toast.success(`OCR concluído com ${result.confidence}% de confiança`);
      utils.documents.getById.invalidate({ id: documentId! });
      utils.documents.list.invalidate();
      onUpdated?.();
    },
    onError: (err) => toast.error(`Erro no OCR: ${err.message}`),
  });

  const createClientMutation = trpc.clients.create.useMutation({
    onSuccess: async (result) => {
      toast.success('Cliente criado com sucesso!');
      utils.clients.list.invalidate();
      // Link the document to the newly created client
      if (documentId && result.id) {
        await updateMutation.mutateAsync({
          id: documentId,
          ocrFields: editedFields,
          clientId: result.id,
        });
      }
      setShowNewClientForm(false);
    },
    onError: (err) => toast.error(`Erro ao criar cliente: ${err.message}`),
  });

  const handleCreateNewClient = () => {
    const name = editedFields.nome || '';
    if (!name) {
      toast.error('Nome é obrigatório. Preencha o campo "Nome completo" no OCR primeiro.');
      return;
    }
    createClientMutation.mutate({
      name,
      cpfCnpj: editedFields.cpf || undefined,
      rg: editedFields.rg || undefined,
      birthDate: editedFields.data_nascimento || undefined,
      motherName: editedFields.nome_mae || undefined,
      fatherName: editedFields.nome_pai || undefined,
      address: editedFields.endereco || undefined,
      clientRole: newClientRole,
    });
  };

  // Auto-trigger OCR when document opens with pending status
  useEffect(() => {
    if (doc && open && doc.ocrStatus === 'pending' && doc.fileUrl && !autoOcrTriggered && !ocrMutation.isPending) {
      setAutoOcrTriggered(true);
      ocrMutation.mutate({
        documentId: doc.id,
        fileUrl: doc.fileUrl,
        docType: doc.docType || 'outro',
      });
    }
  }, [doc, open, autoOcrTriggered, ocrMutation]);

  // Reset auto-trigger when modal closes
  useEffect(() => {
    if (!open) setAutoOcrTriggered(false);
  }, [open]);

  // Sync fields when doc loads
  useEffect(() => {
    if (doc?.ocrFields) {
      const fields = typeof doc.ocrFields === "string"
        ? JSON.parse(doc.ocrFields)
        : doc.ocrFields;
      setEditedFields(fields as Record<string, string>);
      setIsDirty(false);
    } else {
      setEditedFields({});
      setIsDirty(false);
    }
    setImageZoom(100);
    setImageRotation(0);
  }, [doc]);

  const handleFieldChange = (key: string, value: string) => {
    setEditedFields((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    if (!documentId) return;
    updateMutation.mutate({ id: documentId, ocrFields: editedFields });
  };

  const handleRunOcr = () => {
    if (!doc) return;
    ocrMutation.mutate({
      documentId: doc.id,
      fileUrl: doc.fileUrl || "",
      docType: doc.docType || "outro",
    });
  };

  const isImage = doc?.mimeType?.startsWith("image/");
  const isPdf = doc?.mimeType === "application/pdf";

  const ocrFields = editedFields;
  const fieldEntries = Object.entries(ocrFields).filter(
    ([k]) => k !== "tipo_documento" && k !== "confidence"
  );

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-border/50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                {isLoading ? "Carregando..." : doc?.name || "Documento"}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {doc && (
                  <Badge className={STATUS_COLORS[doc.docStatus || "pendente"] || "bg-gray-100 text-gray-700"}>
                    {doc.docStatus || "pendente"}
                  </Badge>
                )}
                {doc?.ocrConfidence != null && (
                  <Badge variant="outline" className="text-xs">
                    OCR: {doc.ocrConfidence}%
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : doc ? (
            <div className="flex-1 overflow-hidden flex">
              {/* Left: Document Preview */}
              <div className="w-1/2 border-r border-border/50 flex flex-col bg-gray-50">
                {/* Toolbar */}
                <div className="flex items-center gap-1 px-3 py-2 border-b border-border/50 bg-white">
                  <button
                    onClick={() => setImageZoom((z) => Math.max(50, z - 25))}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                    title="Diminuir zoom"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs text-gray-500 w-12 text-center">{imageZoom}%</span>
                  <button
                    onClick={() => setImageZoom((z) => Math.min(200, z + 25))}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                    title="Aumentar zoom"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setImageRotation((r) => (r + 90) % 360)}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                    title="Girar"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex-1" />
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                      title="Abrir em nova aba"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      download={doc.name}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                      title="Baixar"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                {/* Preview area */}
                <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                  {doc.fileUrl ? (
                    isImage ? (
                      <img
                        src={doc.fileUrl}
                        alt={doc.name}
                        style={{
                          transform: `scale(${imageZoom / 100}) rotate(${imageRotation}deg)`,
                          transformOrigin: "center",
                          transition: "transform 0.2s",
                          maxWidth: "100%",
                        }}
                        className="rounded shadow"
                      />
                    ) : isPdf ? (
                      <iframe
                        src={doc.fileUrl}
                        className="w-full h-full rounded shadow"
                        title={doc.name}
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">Pré-visualização não disponível</p>
                        <p className="text-xs mt-1">{doc.mimeType}</p>
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-block text-blue-600 text-sm hover:underline"
                          >
                            Abrir arquivo
                          </a>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">Nenhum arquivo disponível</p>
                    </div>
                  )}
                </div>
                {/* OCR status bar */}
                <div className="px-3 py-2 border-t border-border/50 bg-white flex items-center gap-2">
                  {doc.ocrStatus === "done" && (
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                  {doc.ocrStatus === "failed" && (
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                  {doc.ocrStatus === "processing" && (
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
                  )}
                  {doc.ocrStatus === "pending" && (
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                  <span className="text-xs text-muted-foreground flex-1">
                    OCR: {doc.ocrStatus === "done" ? "Concluído" : doc.ocrStatus === "failed" ? "Falhou" : doc.ocrStatus === "processing" ? "Processando..." : "Pendente"}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={handleRunOcr}
                    disabled={ocrMutation.isPending || !doc.fileUrl}
                  >
                    {ocrMutation.isPending ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : null}
                    {doc.ocrStatus === "done" ? "Reprocessar OCR" : "Processar OCR"}
                  </Button>
                </div>
              </div>

              {/* Right: OCR Fields Editor */}
              <div className="w-1/2 flex flex-col overflow-hidden">
                <div className="px-5 py-3 border-b border-border/50 bg-white flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">Dados extraídos (OCR)</h3>
                    <span className="text-xs text-muted-foreground">
                      {DOC_TYPE_LABELS[doc.docType || "outro"] || doc.docType}
                    </span>
                  </div>
                  {isDirty && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Alterações não salvas
                    </p>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {fieldEntries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                      <p className="text-sm">Nenhum dado OCR disponível</p>
                      <p className="text-xs mt-1">Clique em "Processar OCR" para extrair dados</p>
                    </div>
                  ) : (
                    fieldEntries.map(([key, value]) => (
                      <div key={key}>
                        <Label className="text-xs text-muted-foreground mb-1 block">
                          {OCR_FIELD_LABELS[key] || key}
                        </Label>
                        <Input
                          value={value || ""}
                          onChange={(e) => handleFieldChange(key, e.target.value)}
                          className="h-8 text-sm"
                          placeholder={`Digite ${OCR_FIELD_LABELS[key] || key}`}
                        />
                      </div>
                    ))
                  )}

                  {/* Assign to client */}
                  <div className="pt-2 border-t border-border/50 space-y-2">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Vincular a cliente
                    </Label>
                    <div className="flex items-center gap-2">
                      <Select
                        value={doc.clientId?.toString() || ""}
                        onValueChange={(v) => {
                          if (!documentId) return;
                          if (v === "__novo__") {
                            setShowNewClientForm(true);
                            return;
                          }
                          setShowNewClientForm(false);
                          updateMutation.mutate({
                            id: documentId,
                            ocrFields: editedFields,
                            clientId: v && v !== "0" ? parseInt(v) : undefined,
                          });
                        }}
                      >
                        <SelectTrigger className="h-8 text-sm flex-1">
                          <SelectValue placeholder="Selecionar cliente..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Nenhum</SelectItem>
                          {clients?.map((c: any) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              <span className="flex items-center gap-1.5">
                                <User className="w-3 h-3 text-muted-foreground" />
                                {c.name}
                                {c.clientRole && (
                                  <span className="text-xs text-muted-foreground ml-1 capitalize">({c.clientRole})</span>
                                )}
                              </span>
                            </SelectItem>
                          ))}
                          <SelectItem value="__novo__">
                            <span className="flex items-center gap-1.5 text-blue-600">
                              <UserPlus className="w-3 h-3" />
                              Criar novo cliente...
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {/* Link to existing client profile */}
                      {doc.clientId && doc.clientId > 0 && (() => {
                        const linkedClient = clients?.find((c: any) => c.id === doc.clientId);
                        return (
                          <Link
                            href={`/dashboard/clientes/${doc.clientId}`}
                            className="p-1.5 rounded hover:bg-gray-100 text-blue-600 flex-shrink-0"
                            title={linkedClient ? `Ver ${linkedClient.name} em Clientes` : 'Ver em Clientes'}
                            onClick={onClose}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        );
                      })()}
                    </div>

                    {/* New client creation inline form */}
                    {showNewClientForm && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 space-y-2">
                        <p className="text-xs font-medium text-blue-800 flex items-center gap-1">
                          <UserPlus className="w-3 h-3" />
                          Criar novo cliente com dados do OCR
                        </p>
                        <div>
                          <Label className="text-xs text-muted-foreground">Categoria</Label>
                          <div className="flex gap-2 mt-1">
                            {(['comprador', 'vendedor', 'corretor'] as const).map((role) => (
                              <button
                                key={role}
                                onClick={() => setNewClientRole(role)}
                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                  newClientRole === role
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                                }`}
                              >
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                        {editedFields.nome ? (
                          <p className="text-xs text-gray-600">
                            Nome: <span className="font-medium">{editedFields.nome}</span>
                          </p>
                        ) : (
                          <p className="text-xs text-amber-600">
                            Preencha o campo "Nome completo" no OCR antes de criar.
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={handleCreateNewClient}
                            disabled={createClientMutation.isPending || !editedFields.nome}
                          >
                            {createClientMutation.isPending ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <UserPlus className="w-3 h-3 mr-1" />
                            )}
                            Criar e vincular
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => setShowNewClientForm(false)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-16 text-muted-foreground">
              <p className="text-sm">Documento não encontrado</p>
            </div>
          )}

          <DialogFooter className="px-6 py-3 border-t border-border/50 flex-shrink-0 bg-white">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={!doc || deleteMutation.isPending}
              className="mr-auto"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Excluir documento
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4 mr-1" />
              Fechar
            </Button>
            {isDirty && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                Salvar alterações
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O documento "{doc?.name}" será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (documentId) deleteMutation.mutate({ id: documentId });
                setShowDeleteConfirm(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
