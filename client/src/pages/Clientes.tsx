import { useState, useRef, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Plus,
  Search,
  FileText,
  Briefcase,
  Upload,
  Trash2,
  MoreVertical,
  X,
  Eye,
  Download,
  Phone,
  Mail,
  User,
  Loader2,
  CheckCircle2,
  IdCard,
  CreditCard,
  Car,
  Home as HomeIcon,
  Save,
  Edit3,
  ChevronRight,
  MapPin,
  Calendar,
  Heart,
  Briefcase as BriefcaseIcon,
  Globe,
  Users2,
  Scan,
} from "lucide-react";
import { Link } from "wouter";

const ROLE_LABELS: Record<string, string> = {
  comprador: "Comprador",
  vendedor: "Vendedor",
  locador: "Locador",
  locatario: "Locatário",
  fiador: "Fiador",
  corretor: "Corretor",
};

const ROLE_COLORS: Record<string, string> = {
  comprador: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  vendedor: "bg-green-500/20 text-green-300 border-green-500/30",
  locador: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  locatario: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  fiador: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  corretor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
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

const DOC_TYPE_ICONS: Record<string, React.ReactNode> = {
  rg: <IdCard className="w-4 h-4" />,
  cpf: <CreditCard className="w-4 h-4" />,
  cnh: <Car className="w-4 h-4" />,
  comprovante_residencia: <HomeIcon className="w-4 h-4" />,
  matricula: <FileText className="w-4 h-4" />,
  iptu: <FileText className="w-4 h-4" />,
  certidao: <FileText className="w-4 h-4" />,
  contrato: <FileText className="w-4 h-4" />,
  outro: <FileText className="w-4 h-4" />,
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

type ClientType = {
  id: number;
  name: string;
  cpfCnpj?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  clientRole?: string | null;
  address?: string | null;
  rg?: string | null;
  birthDate?: string | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  profession?: string | null;
  motherName?: string | null;
  fatherName?: string | null;
};

// ─── ClienteFichaModal ──────────────────────────────────────────────────────
function ClienteFichaModal({
  client,
  onClose,
  onUpdated,
}: {
  client: ClientType;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [form, setForm] = useState({
    name: client.name ?? "",
    cpfCnpj: client.cpfCnpj ?? "",
    rg: client.rg ?? "",
    email: client.email ?? "",
    phone: client.phone ?? "",
    whatsapp: client.whatsapp ?? "",
    address: client.address ?? "",
    birthDate: client.birthDate ?? "",
    maritalStatus: client.maritalStatus ?? "",
    nationality: client.nationality ?? "",
    profession: client.profession ?? "",
    motherName: client.motherName ?? "",
    fatherName: client.fatherName ?? "",
    clientRole: client.clientRole ?? "comprador",
  });
  const [dirty, setDirty] = useState(false);
  const [uploadDocType, setUploadDocType] = useState("rg");
  const [uploadDocFile, setUploadDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrInlineMutation = trpc.documents.ocrInline.useMutation();

  const { data: clientDocs = [], refetch: refetchDocs } = trpc.clients.getDocuments.useQuery(
    { clientId: client.id },
    { refetchOnWindowFocus: false }
  );

  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      toast.success("Ficha atualizada com sucesso!");
      setDirty(false);
      onUpdated();
    },
    onError: (e) => toast.error("Erro ao salvar: " + e.message),
  });

  const uploadDocMutation = trpc.clients.uploadDocument.useMutation({
    onSuccess: () => {
      toast.success("Documento enviado com sucesso!");
      setUploadDocFile(null);
      refetchDocs();
    },
    onError: (e) => toast.error("Erro no upload: " + e.message),
  });

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  async function handleUploadDoc() {
    if (!uploadDocFile) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        // Run OCR to extract fields
        try {
          const ocrRes = await ocrInlineMutation.mutateAsync({
            fileBase64: base64,
            mimeType: uploadDocFile.type,
            fileName: uploadDocFile.name,
            docType: uploadDocType,
          });
          const fields = ocrRes?.fields as Record<string, string> | undefined;
          if (fields) {
            setForm((prev) => ({
              ...prev,
              name: fields.nome || prev.name,
              cpfCnpj: fields.cpf || prev.cpfCnpj,
              rg: fields.rg || prev.rg,
              birthDate: fields.data_nascimento || prev.birthDate,
              address: [
                fields.endereco,
                fields.cidade ? `${fields.cidade}${fields.estado ? "/" + fields.estado : ""}` : "",
                fields.cep ? `CEP ${fields.cep}` : "",
              ].filter(Boolean).join(", ") || prev.address,
              motherName: fields.nome_mae || prev.motherName,
              fatherName: fields.nome_pai || prev.fatherName,
            }));
            setDirty(true);
            toast.success(`OCR do ${DOC_TYPE_LABELS[uploadDocType] ?? uploadDocType} concluído — campos atualizados!`);
          }
        } catch {
          // OCR failed, still upload
        }
        await uploadDocMutation.mutateAsync({
          clientId: client.id,
          name: uploadDocFile.name,
          docType: uploadDocType as any,
          fileBase64: base64,
          mimeType: uploadDocFile.type,
          fileSize: uploadDocFile.size,
        });
        setUploading(false);
      };
      reader.readAsDataURL(uploadDocFile);
    } catch {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div
        className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-[#1e2d47] shadow-2xl overflow-hidden"
        style={{ background: "#0a1220" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d47]" style={{ background: "#0d1526" }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
              {getInitials(form.name)}
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">{form.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {form.clientRole && (
                  <Badge className={`text-xs border ${ROLE_COLORS[form.clientRole] ?? "bg-slate-700 text-slate-300"}`}>
                    {ROLE_LABELS[form.clientRole] ?? form.clientRole}
                  </Badge>
                )}
                {form.cpfCnpj && <span className="text-slate-500 text-xs">{form.cpfCnpj}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {dirty && (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
                onClick={() => updateMutation.mutate({ id: client.id, data: form as any })}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar alterações
              </Button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-[#1e2d47] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body — two panels */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: Editable data */}
          <div className="w-[45%] border-r border-[#1e2d47] overflow-y-auto px-5 py-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Edit3 className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Dados do Cliente</span>
            </div>

            {/* Papel */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Papel</label>
              <Select value={form.clientRole} onValueChange={(v) => setField("clientRole", v)}>
                <SelectTrigger className="bg-[#060d1a] border-[#1e2d47] text-white h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1526] border-[#1e2d47] text-white">
                  {Object.entries(ROLE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nome */}
            <div>
              <label className="text-xs text-slate-500 mb-1 flex items-center gap-1 block">
                <User className="w-3 h-3" /> Nome completo *
              </label>
              <Input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className="bg-[#060d1a] border-[#1e2d47] text-white h-9 text-sm"
              />
            </div>

            {/* CPF + RG */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 flex items-center gap-1 block">
                  <CreditCard className="w-3 h-3" /> CPF/CNPJ
                </label>
                <Input
                  value={form.cpfCnpj}
                  onChange={(e) => setField("cpfCnpj", e.target.value)}
                  className="bg-[#060d1a] border-[#1e2d47] text-white h-9 text-sm"
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 flex items-center gap-1 block">
                  <IdCard className="w-3 h-3" /> RG
                </label>
                <Input
                  value={form.rg}
                  onChange={(e) => setField("rg", e.target.value)}
                  className="bg-[#060d1a] border-[#1e2d47] text-white h-9 text-sm"
                  placeholder="RG"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs text-slate-500 mb-1 flex items-center gap-1 block">
                <Mail className="w-3 h-3" /> E-mail
              </label>
              <Input
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className="bg-[#060d1a] border-[#1e2d47] text-white h-9 text-sm"
                placeholder="email@exemplo.com"
              />
            </div>

            {/* Phone + WhatsApp */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 flex items-center gap-1 block">
                  <Phone className="w-3 h-3" /> Telefone
                </label>
                <Input
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  className="bg-[#060d1a] border-[#1e2d47] text-white h-9 text-sm"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 flex items-center gap-1 block">
                  <Phone className="w-3 h-3" /> WhatsApp
                </label>
                <Input
                  value={form.whatsapp}
                  onChange={(e) => setField("whatsapp", e.target.value)}
                  className="bg-[#060d1a] border-[#1e2d47] text-white h-9 text-sm"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="text-xs text-slate-500 mb-1 flex items-center gap-1 block">
                <MapPin className="w-3 h-3" /> Endereço
              </label>
              <Input
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                className="bg-[#060d1a] border-[#1e2d47] text-white h-9 text-sm"
                placeholder="Rua, número, bairro, cidade"
              />
            </div>

            {/* Birth + Marital */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 flex items-center gap-1 block">
                  <Calendar className="w-3 h-3" /> Nascimento
                </label>
                <Input
                  value={form.birthDate}
                  onChange={(e) => setField("birthDate", e.target.value)}
                  className="bg-[#060d1a] border-[#1e2d47] text-white h-9 text-sm"
                  placeholder="DD/MM/AAAA"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 flex items-center gap-1 block">
                  <Heart className="w-3 h-3" /> Estado civil
                </label>
                <Input
                  value={form.maritalStatus}
                  onChange={(e) => setField("maritalStatus", e.target.value)}
                  className="bg-[#060d1a] border-[#1e2d47] text-white h-9 text-sm"
                  placeholder="Solteiro(a)"
                />
              </div>
            </div>

            {/* Profession + Nationality */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 flex items-center gap-1 block">
                  <BriefcaseIcon className="w-3 h-3" /> Profissão
                </label>
                <Input
                  value={form.profession}
                  onChange={(e) => setField("profession", e.target.value)}
                  className="bg-[#060d1a] border-[#1e2d47] text-white h-9 text-sm"
                  placeholder="Profissão"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 flex items-center gap-1 block">
                  <Globe className="w-3 h-3" /> Nacionalidade
                </label>
                <Input
                  value={form.nationality}
                  onChange={(e) => setField("nationality", e.target.value)}
                  className="bg-[#060d1a] border-[#1e2d47] text-white h-9 text-sm"
                  placeholder="Brasileiro(a)"
                />
              </div>
            </div>

            {/* Mother + Father */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 flex items-center gap-1 block">
                  <Users2 className="w-3 h-3" /> Nome da mãe
                </label>
                <Input
                  value={form.motherName}
                  onChange={(e) => setField("motherName", e.target.value)}
                  className="bg-[#060d1a] border-[#1e2d47] text-white h-9 text-sm"
                  placeholder="Nome da mãe"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 flex items-center gap-1 block">
                  <Users2 className="w-3 h-3" /> Nome do pai
                </label>
                <Input
                  value={form.fatherName}
                  onChange={(e) => setField("fatherName", e.target.value)}
                  className="bg-[#060d1a] border-[#1e2d47] text-white h-9 text-sm"
                  placeholder="Nome do pai"
                />
              </div>
            </div>

            {/* Save button at bottom */}
            {dirty && (
              <div className="pt-2">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white gap-2"
                  onClick={() => updateMutation.mutate({ id: client.id, data: form as any })}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar alterações
                </Button>
              </div>
            )}
          </div>

          {/* RIGHT: Documents */}
          <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Documentos Digitalizados</span>
                <Badge className="bg-slate-700/50 text-slate-400 border-slate-600/30 text-xs">
                  {(clientDocs as any[]).length}
                </Badge>
              </div>
            </div>

            {/* Upload area */}
            <div className="rounded-xl border border-[#1e2d47] p-4 space-y-3" style={{ background: "#060d1a" }}>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Scan className="w-3.5 h-3.5 text-blue-400" />
                Enviar novo documento (OCR preenche campos automaticamente)
              </p>
              <div className="flex gap-2">
                <Select value={uploadDocType} onValueChange={setUploadDocType}>
                  <SelectTrigger className="bg-[#0d1526] border-[#1e2d47] text-white h-9 text-sm flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1526] border-[#1e2d47] text-white">
                    {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#1e2d47] text-slate-300 hover:text-white hover:bg-[#1a2540] gap-1.5 h-9"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Selecionar
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => setUploadDocFile(e.target.files?.[0] ?? null)}
                />
              </div>
              {uploadDocFile && (
                <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                  <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-blue-300 text-xs flex-1 truncate">{uploadDocFile.name}</span>
                  <button onClick={() => setUploadDocFile(null)}>
                    <X className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
                  </button>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-500 text-white h-7 text-xs gap-1 ml-1"
                    onClick={handleUploadDoc}
                    disabled={uploading || uploadDocMutation.isPending}
                  >
                    {uploading || uploadDocMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                    {uploading || uploadDocMutation.isPending ? "Enviando..." : "Enviar"}
                  </Button>
                </div>
              )}
            </div>

            {/* Documents list */}
            {(clientDocs as any[]).length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="w-14 h-14 rounded-full bg-[#0d1526] flex items-center justify-center mb-3">
                  <FileText className="w-7 h-7 text-slate-600" />
                </div>
                <p className="text-slate-400 text-sm">Nenhum documento enviado</p>
                <p className="text-slate-500 text-xs mt-1">Envie RG, CPF, CNH, matrícula e outros documentos</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(clientDocs as any[]).map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-[#1e2d47] hover:border-blue-500/30 transition-colors"
                    style={{ background: "#0d1526" }}
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 text-blue-400">
                      {DOC_TYPE_ICONS[doc.docType] ?? <FileText className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-slate-500 text-xs">{DOC_TYPE_LABELS[doc.docType] ?? doc.docType}</span>
                        <Badge className={
                          doc.ocrStatus === "done"
                            ? "bg-green-500/15 text-green-400 border-green-500/25 text-xs py-0"
                            : doc.ocrStatus === "processing"
                            ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/25 text-xs py-0"
                            : "bg-slate-500/15 text-slate-400 border-slate-500/25 text-xs py-0"
                        }>
                          {doc.ocrStatus === "done" ? "OCR ✓" : doc.ocrStatus === "processing" ? "Processando" : "Pendente"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {doc.fileUrl && (
                        <button
                          onClick={() => setPreviewDoc({ url: doc.fileUrl, name: doc.name })}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-[#1e2d47] transition-colors"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {doc.fileUrl && (
                        <a href={doc.fileUrl} download target="_blank" rel="noopener noreferrer">
                          <button className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-[#1e2d47] transition-colors" title="Baixar">
                            <Download className="w-4 h-4" />
                          </button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Preview */}
      {previewDoc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-[#1e2d47] overflow-hidden" style={{ background: "#0d1526" }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2d47]">
              <span className="text-white text-sm font-medium">{previewDoc.name}</span>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-2">
              {previewDoc.url.match(/\.(pdf)$/i) ? (
                <iframe src={previewDoc.url} className="w-full h-[70vh] rounded" title="Preview" />
              ) : (
                <img src={previewDoc.url} alt={previewDoc.name} className="max-w-full mx-auto rounded" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Clientes Page ─────────────────────────────────────────────────────
export default function Clientes() {
  const [search, setSearch] = useState("");
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [fichaClient, setFichaClient] = useState<ClientType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New client modal state
  const [newClientDocUploading, setNewClientDocUploading] = useState<string | null>(null);
  const [newClientDocs, setNewClientDocs] = useState<Record<string, { name: string; url: string }>>({});
  const newClientFileRefs = {
    rg: useRef<HTMLInputElement>(null),
    cpf: useRef<HTMLInputElement>(null),
    cnh: useRef<HTMLInputElement>(null),
    comprovante_residencia: useRef<HTMLInputElement>(null),
  };

  const [newClient, setNewClient] = useState({
    name: "",
    cpfCnpj: "",
    rg: "",
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    birthDate: "",
    maritalStatus: "",
    nationality: "",
    profession: "",
    motherName: "",
    fatherName: "",
    clientRole: "comprador" as string,
  });

  const { data: clients = [], refetch } = trpc.clients.list.useQuery();

  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      toast.success("Cliente criado com sucesso!");
      setShowNewClientModal(false);
      setNewClient({ name: "", cpfCnpj: "", rg: "", email: "", phone: "", whatsapp: "", address: "", birthDate: "", maritalStatus: "", nationality: "", profession: "", motherName: "", fatherName: "", clientRole: "comprador" });
      setNewClientDocs({});
      refetch();
    },
    onError: (e) => toast.error("Erro ao criar cliente: " + e.message),
  });

  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => { toast.success("Cliente removido"); refetch(); },
    onError: (e) => toast.error("Erro ao remover: " + e.message),
  });

  const ocrInlineMutation = trpc.documents.ocrInline.useMutation();

  const filtered = (clients as ClientType[]).filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.cpfCnpj ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  const handleNewClientDocUpload = useCallback(async (docType: string, file: File) => {
    setNewClientDocUploading(docType);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        try {
          const ocrRes = await ocrInlineMutation.mutateAsync({
            fileBase64: base64,
            mimeType: file.type,
            fileName: file.name,
            docType: docType,
          });
          const fields = ocrRes?.fields as Record<string, string> | undefined;
          if (fields) {
            setNewClient((prev) => ({
              ...prev,
              name: fields.nome || prev.name,
              cpfCnpj: fields.cpf || prev.cpfCnpj,
              rg: fields.rg || prev.rg,
              birthDate: fields.data_nascimento || prev.birthDate,
              address: [
                fields.endereco,
                fields.cidade ? `${fields.cidade}${fields.estado ? "/" + fields.estado : ""}` : "",
                fields.cep ? `CEP ${fields.cep}` : "",
              ].filter(Boolean).join(", ") || prev.address,
              motherName: fields.nome_mae || prev.motherName,
              fatherName: fields.nome_pai || prev.fatherName,
            }));
            toast.success(`OCR do ${DOC_TYPE_LABELS[docType] ?? docType} concluído — campos preenchidos!`);
          } else {
            toast.success(`Documento ${DOC_TYPE_LABELS[docType] ?? docType} enviado.`);
          }
          setNewClientDocs((prev) => ({ ...prev, [docType]: { name: file.name, url: ocrRes?.fileUrl ?? "" } }));
        } catch {
          toast.error("Erro ao processar OCR do documento.");
        }
        setNewClientDocUploading(null);
      };
      reader.readAsDataURL(file);
    } catch {
      setNewClientDocUploading(null);
      toast.error("Erro ao ler o arquivo.");
    }
  }, [ocrInlineMutation]);

  return (
    <div className="min-h-screen" style={{ background: "#060d1a" }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Clientes</h1>
            <p className="text-slate-400 mt-1">
              {filtered.length} cliente{filtered.length !== 1 ? "s" : ""} cadastrado{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            onClick={() => setShowNewClientModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo cliente
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, CPF, e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-[#0d1526] border-[#1e2d47] text-white placeholder:text-slate-500"
          />
        </div>

        {/* Clients Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[#0d1526] flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-400 text-lg">Nenhum cliente encontrado</p>
            <p className="text-slate-500 text-sm mt-1">Cadastre o primeiro cliente para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((client) => (
              <div
                key={client.id}
                className="rounded-xl border border-[#1e2d47] p-5 hover:border-blue-500/40 transition-all"
                style={{ background: "#0d1526" }}
              >
                <div className="flex items-start justify-between mb-4">
                  {/* Clickable name area */}
                  <button
                    className="flex items-center gap-3 text-left flex-1 min-w-0 group"
                    onClick={() => setFichaClient(client)}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 group-hover:from-blue-500 group-hover:to-blue-700 transition-all">
                      {getInitials(client.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate group-hover:text-blue-300 transition-colors flex items-center gap-1">
                        {client.name}
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </p>
                      {client.cpfCnpj && (
                        <p className="text-slate-500 text-xs">{client.cpfCnpj}</p>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {client.clientRole && (
                      <Badge className={`text-xs border ${ROLE_COLORS[client.clientRole] ?? "bg-slate-700 text-slate-300"}`}>
                        {ROLE_LABELS[client.clientRole] ?? client.clientRole}
                      </Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#0d1526] border-[#1e2d47] text-white">
                        <DropdownMenuItem
                          className="cursor-pointer hover:bg-[#1e2d47]"
                          onClick={() => setFichaClient(client)}
                        >
                          <Edit3 className="w-4 h-4 mr-2 text-blue-400" />
                          Abrir ficha
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-400 hover:text-red-300 cursor-pointer"
                          onClick={() => setConfirmDeleteId(client.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  {client.email && (
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {(client.phone || client.whatsapp) && (
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      <span>{client.whatsapp || client.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-[#1e2d47] text-slate-300 hover:text-white hover:bg-[#1a2540] text-xs gap-1"
                    onClick={() => setFichaClient(client)}
                  >
                    <FileText className="w-3 h-3" />
                    Documentos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-[#1e2d47] text-slate-300 hover:text-white hover:bg-[#1a2540] text-xs gap-1"
                    asChild
                  >
                    <Link href="/dashboard/negocios">
                      <Briefcase className="w-3 h-3" />
                      Negócios
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ficha do Cliente Modal */}
      {fichaClient && (
        <ClienteFichaModal
          client={fichaClient}
          onClose={() => setFichaClient(null)}
          onUpdated={() => { refetch(); }}
        />
      )}

      {/* New Client Modal */}
      <Dialog open={showNewClientModal} onOpenChange={setShowNewClientModal}>
        <DialogContent className="bg-[#0d1526] border-[#1e2d47] text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              Novo Cliente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Nome completo *</label>
              <Input
                placeholder="Nome completo"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                className="bg-[#060d1a] border-[#1e2d47] text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">CPF/CNPJ</label>
                <Input
                  placeholder="000.000.000-00"
                  value={newClient.cpfCnpj}
                  onChange={(e) => setNewClient({ ...newClient, cpfCnpj: e.target.value })}
                  className="bg-[#060d1a] border-[#1e2d47] text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">RG</label>
                <Input
                  placeholder="RG"
                  value={newClient.rg}
                  onChange={(e) => setNewClient({ ...newClient, rg: e.target.value })}
                  className="bg-[#060d1a] border-[#1e2d47] text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">E-mail</label>
              <Input
                placeholder="email@exemplo.com"
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                className="bg-[#060d1a] border-[#1e2d47] text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Telefone</label>
                <Input
                  placeholder="(11) 99999-9999"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  className="bg-[#060d1a] border-[#1e2d47] text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">WhatsApp</label>
                <Input
                  placeholder="(11) 99999-9999"
                  value={newClient.whatsapp}
                  onChange={(e) => setNewClient({ ...newClient, whatsapp: e.target.value })}
                  className="bg-[#060d1a] border-[#1e2d47] text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Papel</label>
              <Select value={newClient.clientRole} onValueChange={(v) => setNewClient({ ...newClient, clientRole: v })}>
                <SelectTrigger className="bg-[#060d1a] border-[#1e2d47] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1526] border-[#1e2d47] text-white">
                  {Object.entries(ROLE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Endereço</label>
              <Input
                placeholder="Rua, número, bairro, cidade"
                value={newClient.address}
                onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                className="bg-[#060d1a] border-[#1e2d47] text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Data de nascimento</label>
                <Input
                  placeholder="DD/MM/AAAA"
                  value={newClient.birthDate}
                  onChange={(e) => setNewClient({ ...newClient, birthDate: e.target.value })}
                  className="bg-[#060d1a] border-[#1e2d47] text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Estado civil</label>
                <Input
                  placeholder="Solteiro(a)"
                  value={newClient.maritalStatus}
                  onChange={(e) => setNewClient({ ...newClient, maritalStatus: e.target.value })}
                  className="bg-[#060d1a] border-[#1e2d47] text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Profissão</label>
                <Input
                  placeholder="Profissão"
                  value={newClient.profession}
                  onChange={(e) => setNewClient({ ...newClient, profession: e.target.value })}
                  className="bg-[#060d1a] border-[#1e2d47] text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nacionalidade</label>
                <Input
                  placeholder="Brasileiro(a)"
                  value={newClient.nationality}
                  onChange={(e) => setNewClient({ ...newClient, nationality: e.target.value })}
                  className="bg-[#060d1a] border-[#1e2d47] text-white"
                />
              </div>
            </div>
            {/* Document Upload Section */}
            <div className="border border-[#1e2d47] rounded-lg p-4 mt-2" style={{ background: "#060d1a" }}>
              <p className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wide">Documentos — OCR preenche campos automaticamente</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { type: "rg", label: "RG", icon: <IdCard className="w-4 h-4" /> },
                  { type: "cpf", label: "CPF", icon: <CreditCard className="w-4 h-4" /> },
                  { type: "cnh", label: "CNH", icon: <Car className="w-4 h-4" /> },
                  { type: "comprovante_residencia", label: "Comprovante de Endereço", icon: <HomeIcon className="w-4 h-4" /> },
                ] as const).map(({ type, label, icon }) => (
                  <div key={type}>
                    <input
                      ref={newClientFileRefs[type]}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleNewClientDocUpload(type, f);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => newClientFileRefs[type].current?.click()}
                      disabled={newClientDocUploading === type}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all ${
                        newClientDocs[type]
                          ? "border-green-500/40 bg-green-500/10 text-green-300"
                          : "border-[#1e2d47] bg-[#0d1526] text-slate-400 hover:border-blue-500/40 hover:text-white"
                      } disabled:opacity-50`}
                    >
                      {newClientDocUploading === type ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : newClientDocs[type] ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        icon
                      )}
                      <span className="truncate">
                        {newClientDocUploading === type
                          ? "Processando..."
                          : newClientDocs[type]
                          ? newClientDocs[type].name
                          : `Enviar ${label}`}
                      </span>
                      {!newClientDocs[type] && newClientDocUploading !== type && (
                        <Upload className="w-3 h-3 ml-auto flex-shrink-0" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-slate-600 text-xs mt-2">JPG, PNG ou PDF — máx. 10 MB por arquivo</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-[#1e2d47] text-slate-300"
                onClick={() => setShowNewClientModal(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
                onClick={() => createMutation.mutate(newClient as any)}
                disabled={!newClient.name || createMutation.isPending}
              >
                {createMutation.isPending ? "Criando..." : "Criar Cliente"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#0d1526] border border-[#1e2d47] rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-2">Excluir cliente?</h3>
            <p className="text-sm text-gray-400 mb-5">
              Esta ação não pode ser desfeita. O cliente e seus documentos serão removidos permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#2a2d3a] text-gray-300 hover:text-white hover:border-gray-500 text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { deleteMutation.mutate({ id: confirmDeleteId }); setConfirmDeleteId(null); }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
