import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft, User, Mail, Phone, MapPin, FileText, Building2,
  Edit2, Save, X, Loader2, Calendar, Briefcase, Users,
  CreditCard, Hash, Heart, Globe, ChevronRight,
} from "lucide-react";
import { DocumentDetailModal } from "@/components/DocumentDetailModal";

const ROLE_LABELS: Record<string, string> = {
  comprador: "Comprador", vendedor: "Vendedor", locador: "Locador",
  locatario: "Locatário", fiador: "Fiador", corretor: "Corretor",
};
const ROLE_COLORS: Record<string, string> = {
  comprador: "bg-blue-100 text-blue-700", vendedor: "bg-green-100 text-green-700",
  locador: "bg-orange-100 text-orange-700", locatario: "bg-purple-100 text-purple-700",
  fiador: "bg-gray-100 text-gray-700", corretor: "bg-yellow-100 text-yellow-700",
};
const DEAL_STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho", em_andamento: "Em andamento", contrato_gerado: "Contrato gerado",
  assinatura: "Assinatura", concluido: "Concluído",
};
const DEAL_STATUS_COLORS: Record<string, string> = {
  rascunho: "bg-gray-100 text-gray-600", em_andamento: "bg-blue-100 text-blue-700",
  contrato_gerado: "bg-purple-100 text-purple-700", assinatura: "bg-yellow-100 text-yellow-700",
  concluido: "bg-green-100 text-green-700",
};
const DOC_TYPE_LABELS: Record<string, string> = {
  rg: "RG", cpf: "CPF", cnh: "CNH", comprovante_residencia: "Comprovante",
  matricula: "Matrícula", iptu: "IPTU", certidao: "Certidão", contrato: "Contrato", outro: "Outro",
};

type Tab = "perfil" | "documentos" | "negocios";

interface EditableFields {
  name: string;
  cpfCnpj: string;
  rg: string;
  email: string;
  phone: string;
  address: string;
  birthDate: string;
  maritalStatus: string;
  nationality: string;
  profession: string;
  motherName: string;
  fatherName: string;
  clientRole: string;
}

export default function ClienteDetalhe() {
  const [, params] = useRoute("/dashboard/clientes/:id");
  const [, navigate] = useLocation();
  const clientId = params?.id ? parseInt(params.id) : 0;

  const [activeTab, setActiveTab] = useState<Tab>("perfil");
  const [isEditing, setIsEditing] = useState(false);
  const [editFields, setEditFields] = useState<EditableFields | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);

  const { data: client, isLoading, refetch } = trpc.clients.getById.useQuery(
    { id: clientId },
    { enabled: clientId > 0 }
  );

  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      toast.success("Dados atualizados com sucesso!");
      setIsEditing(false);
      setEditFields(null);
      refetch();
    },
    onError: () => toast.error("Erro ao salvar dados"),
  });

  const startEditing = () => {
    if (!client) return;
    setEditFields({
      name: client.name || "",
      cpfCnpj: client.cpfCnpj || "",
      rg: client.rg || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      birthDate: client.birthDate || "",
      maritalStatus: client.maritalStatus || "",
      nationality: client.nationality || "",
      profession: client.profession || "",
      motherName: client.motherName || "",
      fatherName: client.fatherName || "",
      clientRole: client.clientRole || "comprador",
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditFields(null);
  };

  const saveEditing = () => {
    if (!editFields || !clientId) return;
    updateMutation.mutate({ id: clientId, data: editFields as any });
  };

  const setField = (key: keyof EditableFields, value: string) => {
    setEditFields((prev) => prev ? { ...prev, [key]: value } : prev);
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </DashboardShell>
    );
  }

  if (!client) {
    return (
      <DashboardShell>
        <div className="text-center py-24">
          <p className="text-muted-foreground">Cliente não encontrado.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard/clientes")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </div>
      </DashboardShell>
    );
  }

  const docs = (client as any).documents || [];
  const deals = (client as any).deals || [];
  const fields = isEditing && editFields ? editFields : null;

  const completionFields = [
    client.name, client.cpfCnpj, client.rg, client.email, client.phone,
    client.address, client.birthDate, client.maritalStatus, client.nationality,
    client.profession, client.motherName, client.fatherName,
  ];
  const filled = completionFields.filter(Boolean).length;
  const completion = Math.round((filled / completionFields.length) * 100);

  return (
    <DashboardShell>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/clientes")} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Clientes
        </Button>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-gray-900">{client.name}</span>
      </div>

      {/* Profile header card */}
      <div className="bg-white rounded-2xl border border-border p-6 mb-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-md">
              {client.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">{client.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-xs ${ROLE_COLORS[client.clientRole || ""] || "bg-gray-100 text-gray-700"}`}>
                  {ROLE_LABELS[client.clientRole || ""] || client.clientRole}
                </Badge>
                {client.cpfCnpj && (
                  <span className="text-xs text-muted-foreground">CPF: {client.cpfCnpj}</span>
                )}
              </div>
              {/* Completion bar */}
              <div className="flex items-center gap-2 mt-2">
                <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${completion >= 80 ? "bg-green-500" : completion >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                    style={{ width: `${completion}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{completion}% completo</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button size="sm" variant="outline" onClick={startEditing} className="gap-1.5">
                <Edit2 className="w-3.5 h-3.5" /> Editar
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={cancelEditing} className="gap-1.5">
                  <X className="w-3.5 h-3.5" /> Cancelar
                </Button>
                <Button size="sm" onClick={saveEditing} disabled={updateMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                  {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Salvar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
        {([
          { key: "perfil", label: "Perfil", icon: <User className="w-3.5 h-3.5" /> },
          { key: "documentos", label: `Documentos (${docs.length})`, icon: <FileText className="w-3.5 h-3.5" /> },
          { key: "negocios", label: `Negócios (${deals.length})`, icon: <Building2 className="w-3.5 h-3.5" /> },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Perfil */}
      {activeTab === "perfil" && (
        <div className="bg-white rounded-2xl border border-border p-6">
          {isEditing && editFields ? (
            <div className="space-y-5">
              {/* Role selector */}
              <div>
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">Categoria</Label>
                <div className="flex flex-wrap gap-2">
                  {(["comprador", "vendedor", "locador", "locatario", "fiador", "corretor"] as const).map((role) => (
                    <button
                      key={role}
                      onClick={() => setField("clientRole", role)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors ${
                        editFields.clientRole === role
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {ROLE_LABELS[role]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                  { key: "name", label: "Nome completo", icon: <User className="w-3.5 h-3.5" />, required: true },
                  { key: "cpfCnpj", label: "CPF / CNPJ", icon: <CreditCard className="w-3.5 h-3.5" /> },
                  { key: "rg", label: "RG", icon: <Hash className="w-3.5 h-3.5" /> },
                  { key: "birthDate", label: "Data de nascimento", icon: <Calendar className="w-3.5 h-3.5" /> },
                  { key: "email", label: "E-mail", icon: <Mail className="w-3.5 h-3.5" /> },
                  { key: "phone", label: "Telefone", icon: <Phone className="w-3.5 h-3.5" /> },
                  { key: "nationality", label: "Nacionalidade", icon: <Globe className="w-3.5 h-3.5" /> },
                  { key: "maritalStatus", label: "Estado civil", icon: <Heart className="w-3.5 h-3.5" /> },
                  { key: "profession", label: "Profissão", icon: <Briefcase className="w-3.5 h-3.5" /> },
                  { key: "motherName", label: "Nome da mãe", icon: <Users className="w-3.5 h-3.5" /> },
                  { key: "fatherName", label: "Nome do pai", icon: <Users className="w-3.5 h-3.5" /> },
                ] as { key: keyof EditableFields; label: string; icon: React.ReactNode; required?: boolean }[]).map(({ key, label, icon, required }) => (
                  <div key={key}>
                    <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      {icon} {label}{required && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      value={editFields[key] || ""}
                      onChange={(e) => setField(key, e.target.value)}
                      className="h-9 text-sm"
                      placeholder={label}
                    />
                  </div>
                ))}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Endereço completo
                </Label>
                <Input
                  value={editFields.address || ""}
                  onChange={(e) => setField("address", e.target.value)}
                  className="h-9 text-sm"
                  placeholder="Rua, número, bairro, cidade, estado"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {([
                { label: "Nome completo", value: client.name, icon: <User className="w-4 h-4" /> },
                { label: "CPF / CNPJ", value: client.cpfCnpj, icon: <CreditCard className="w-4 h-4" /> },
                { label: "RG", value: client.rg, icon: <Hash className="w-4 h-4" /> },
                { label: "Data de nascimento", value: client.birthDate, icon: <Calendar className="w-4 h-4" /> },
                { label: "E-mail", value: client.email, icon: <Mail className="w-4 h-4" /> },
                { label: "Telefone", value: client.phone, icon: <Phone className="w-4 h-4" /> },
                { label: "Nacionalidade", value: client.nationality, icon: <Globe className="w-4 h-4" /> },
                { label: "Estado civil", value: client.maritalStatus, icon: <Heart className="w-4 h-4" /> },
                { label: "Profissão", value: client.profession, icon: <Briefcase className="w-4 h-4" /> },
                { label: "Nome da mãe", value: client.motherName, icon: <Users className="w-4 h-4" /> },
                { label: "Nome do pai", value: client.fatherName, icon: <Users className="w-4 h-4" /> },
              ]).map(({ label, value, icon }) => (
                <div key={label} className={`flex items-start gap-3 py-2 border-b border-gray-50 ${!value ? "opacity-50" : ""}`}>
                  <div className="text-muted-foreground mt-0.5 flex-shrink-0">{icon}</div>
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {value || <span className="text-gray-300 italic text-xs">Não informado</span>}
                    </div>
                  </div>
                </div>
              ))}
              {/* Address full width */}
              <div className={`flex items-start gap-3 py-2 border-b border-gray-50 md:col-span-2 ${!client.address ? "opacity-50" : ""}`}>
                <div className="text-muted-foreground mt-0.5 flex-shrink-0"><MapPin className="w-4 h-4" /></div>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Endereço</div>
                  <div className="text-sm font-medium text-gray-900">
                    {client.address || <span className="text-gray-300 italic text-xs">Não informado</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
          {!isEditing && completion < 100 && (
            <div className="mt-5 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
              <div className="text-xs text-amber-700">
                <span className="font-semibold">{completionFields.length - filled} campos</span> ainda não preenchidos.
                Complete a ficha para gerar contratos sem lacunas.
              </div>
              <Button size="sm" variant="outline" onClick={startEditing} className="text-xs h-7 border-amber-300 text-amber-700 hover:bg-amber-100">
                Completar ficha
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Documentos */}
      {activeTab === "documentos" && (
        <div className="bg-white rounded-2xl border border-border p-6">
          {docs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum documento vinculado a este cliente.</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate("/dashboard/documentos")}>
                Ir para Documentos
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map((doc: any) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{doc.name}</div>
                    <div className="text-xs text-muted-foreground">{DOC_TYPE_LABELS[doc.docType] || doc.docType}</div>
                  </div>
                  <Badge className={`text-xs flex-shrink-0 ${
                    doc.docStatus === "validado" ? "bg-green-100 text-green-700" :
                    doc.docStatus === "extraido" ? "bg-blue-100 text-blue-700" :
                    doc.docStatus === "rejeitado" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {doc.docStatus}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Negócios */}
      {activeTab === "negocios" && (
        <div className="bg-white rounded-2xl border border-border p-6">
          {deals.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum negócio vinculado a este cliente.</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate("/dashboard/negocios")}>
                Ir para Negócios
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {deals.map((deal: any) => (
                <div
                  key={deal.id}
                  onClick={() => navigate(`/dashboard/negocios/${deal.id}`)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{deal.code}</div>
                    <div className="text-xs text-muted-foreground capitalize">{deal.type}</div>
                  </div>
                  <Badge className={`text-xs flex-shrink-0 ${DEAL_STATUS_COLORS[deal.status] || "bg-gray-100 text-gray-600"}`}>
                    {DEAL_STATUS_LABELS[deal.status] || deal.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Document Detail Modal */}
      <DocumentDetailModal
        open={selectedDocId !== null}
        documentId={selectedDocId || 0}
        onClose={() => { setSelectedDocId(null); refetch(); }}
      />
    </DashboardShell>
  );
}
