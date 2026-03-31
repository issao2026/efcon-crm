import { useState, useRef, useCallback } from "react";
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

export default function Clientes() {
  const [search, setSearch] = useState("");
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState<ClientType | null>(null);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [uploadDocType, setUploadDocType] = useState<string>("rg");
  const [uploadDocFile, setUploadDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New client modal: inline doc upload state
  const [newClientDocUploading, setNewClientDocUploading] = useState<string | null>(null); // docType being uploaded
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
  const { data: clientDocs = [], refetch: refetchDocs } = trpc.clients.getDocuments.useQuery(
    { clientId: showDocsModal?.id ?? 0 },
    { enabled: !!showDocsModal }
  );

  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      toast.success("Cliente criado com sucesso!");
      setShowNewClientModal(false);
      setNewClient({ name: "", cpfCnpj: "", rg: "", email: "", phone: "", whatsapp: "", address: "", birthDate: "", maritalStatus: "", nationality: "", profession: "", motherName: "", fatherName: "", clientRole: "comprador" });
      refetch();
    },
    onError: (e) => toast.error("Erro ao criar cliente: " + e.message),
  });

  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => { toast.success("Cliente removido"); refetch(); },
    onError: (e) => toast.error("Erro ao remover: " + e.message),
  });

  const ocrInlineMutation = trpc.documents.ocrInline.useMutation();

  const uploadDocMutation = trpc.clients.uploadDocument.useMutation({
    onSuccess: () => {
      toast.success("Documento enviado com sucesso!");
      setShowUploadDocModal(false);
      setUploadDocFile(null);
      refetchDocs();
    },
    onError: (e) => toast.error("Erro no upload: " + e.message),
  });

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

  async function handleUploadDoc() {
    if (!uploadDocFile || !showDocsModal) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        await uploadDocMutation.mutateAsync({
          clientId: showDocsModal.id,
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
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {getInitials(client.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{client.name}</p>
                      {client.cpfCnpj && (
                        <p className="text-slate-500 text-xs">{client.cpfCnpj}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                          className="text-red-400 hover:text-red-300 cursor-pointer"
                          onClick={() => deleteMutation.mutate({ id: client.id })}
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
                    onClick={() => setShowDocsModal(client)}
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

      {/* Documents Modal */}
      <Dialog open={!!showDocsModal} onOpenChange={(o) => !o && setShowDocsModal(null)}>
        <DialogContent className="bg-[#0d1526] border-[#1e2d47] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Documentos — {showDocsModal?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2">
            <div className="flex justify-between items-center mb-4">
              <p className="text-slate-400 text-sm">{(clientDocs as any[]).length} documento(s) enviado(s)</p>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
                onClick={() => setShowUploadDocModal(true)}
              >
                <Upload className="w-4 h-4" />
                Enviar documento
              </Button>
            </div>

            {(clientDocs as any[]).length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <FileText className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-slate-400">Nenhum documento enviado</p>
                <p className="text-slate-500 text-sm">Envie RG, CPF, CNH, matrícula e outros documentos</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(clientDocs as any[]).map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-[#1e2d47] hover:border-blue-500/30 transition-colors"
                    style={{ background: "#060d1a" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{doc.name}</p>
                        <p className="text-slate-500 text-xs">{DOC_TYPE_LABELS[doc.docType] ?? doc.docType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        doc.ocrStatus === "done"
                          ? "bg-green-500/20 text-green-300 border-green-500/30"
                          : doc.ocrStatus === "processing"
                          ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                          : "bg-slate-500/20 text-slate-300 border-slate-500/30"
                      }>
                        {doc.ocrStatus === "done" ? "OCR Concluído" : doc.ocrStatus === "processing" ? "Processando" : "Pendente"}
                      </Badge>
                      {doc.fileUrl && (
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                      {doc.fileUrl && (
                        <a href={doc.fileUrl} download>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white">
                            <Download className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Document Modal */}
      <Dialog open={showUploadDocModal} onOpenChange={setShowUploadDocModal}>
        <DialogContent className="bg-[#0d1526] border-[#1e2d47] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-400" />
              Enviar Documento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Tipo de documento</label>
              <Select value={uploadDocType} onValueChange={setUploadDocType}>
                <SelectTrigger className="bg-[#060d1a] border-[#1e2d47] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1526] border-[#1e2d47] text-white">
                  {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Arquivo</label>
              <div
                className="border-2 border-dashed border-[#1e2d47] rounded-lg p-6 text-center cursor-pointer hover:border-blue-500/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadDocFile ? (
                  <div className="flex items-center justify-center gap-2 text-green-400">
                    <FileText className="w-5 h-5" />
                    <span className="text-sm">{uploadDocFile.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); setUploadDocFile(null); }}>
                      <X className="w-4 h-4 text-slate-400 hover:text-white" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">Clique para selecionar arquivo</p>
                    <p className="text-slate-500 text-xs mt-1">JPG, PNG, PDF — máx. 10 MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setUploadDocFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-[#1e2d47] text-slate-300"
                onClick={() => setShowUploadDocModal(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
                onClick={handleUploadDoc}
                disabled={!uploadDocFile || uploading}
              >
                {uploading ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
