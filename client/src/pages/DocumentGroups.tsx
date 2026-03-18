import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Users, Plus, FileText, CreditCard, Car, Home, Building2,
  FileCheck, AlertCircle, CheckCircle2, Clock, Upload as UploadIcon,
  ChevronDown, ChevronUp, X, Loader2, Eye, Trash2, UserPlus,
} from "lucide-react";
import { Link, useParams } from "wouter";

const DOC_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  rg: { label: "RG", icon: <CreditCard className="w-4 h-4" />, color: "bg-blue-100 text-blue-700 border-blue-200" },
  cpf: { label: "CPF", icon: <FileText className="w-4 h-4" />, color: "bg-purple-100 text-purple-700 border-purple-200" },
  cnh: { label: "CNH", icon: <Car className="w-4 h-4" />, color: "bg-green-100 text-green-700 border-green-200" },
  comprovante_residencia: { label: "Comprovante de Residência", icon: <Home className="w-4 h-4" />, color: "bg-orange-100 text-orange-700 border-orange-200" },
  matricula: { label: "Matrícula do Imóvel", icon: <Building2 className="w-4 h-4" />, color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  iptu: { label: "IPTU", icon: <FileCheck className="w-4 h-4" />, color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  certidao: { label: "Certidão", icon: <FileCheck className="w-4 h-4" />, color: "bg-teal-100 text-teal-700 border-teal-200" },
  escritura: { label: "Escritura", icon: <FileText className="w-4 h-4" />, color: "bg-rose-100 text-rose-700 border-rose-200" },
  contrato: { label: "Contrato", icon: <FileText className="w-4 h-4" />, color: "bg-gray-100 text-gray-700 border-gray-200" },
  outro: { label: "Outro", icon: <FileText className="w-4 h-4" />, color: "bg-gray-100 text-gray-600 border-gray-200" },
};

const ROLE_LABELS: Record<string, string> = {
  comprador: "Comprador",
  vendedor: "Vendedor",
  locador: "Locador",
  locatario: "Locatário",
  fiador: "Fiador",
  corretor: "Corretor",
  imovel: "Imóvel",
  outro: "Outro",
};

const ROLE_COLORS: Record<string, string> = {
  comprador: "bg-blue-100 text-blue-700",
  vendedor: "bg-green-100 text-green-700",
  locador: "bg-purple-100 text-purple-700",
  locatario: "bg-orange-100 text-orange-700",
  fiador: "bg-yellow-100 text-yellow-700",
  corretor: "bg-teal-100 text-teal-700",
  imovel: "bg-indigo-100 text-indigo-700",
  outro: "bg-gray-100 text-gray-700",
};

const STATUS_CONFIG = {
  pendente: { label: "Pendente", icon: <Clock className="w-3 h-3" />, color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  enviado: { label: "Enviado", icon: <UploadIcon className="w-3 h-3" />, color: "text-blue-600 bg-blue-50 border-blue-200" },
  validado: { label: "Validado", icon: <CheckCircle2 className="w-3 h-3" />, color: "text-green-600 bg-green-50 border-green-200" },
  rejeitado: { label: "Rejeitado", icon: <AlertCircle className="w-3 h-3" />, color: "text-red-600 bg-red-50 border-red-200" },
};

const ALL_DOC_TYPES = ["rg", "cpf", "cnh", "comprovante_residencia", "matricula", "iptu", "certidao", "escritura", "contrato", "outro"] as const;
const ALL_ROLES = ["comprador", "vendedor", "locador", "locatario", "fiador", "corretor", "imovel", "outro"] as const;

type DocType = typeof ALL_DOC_TYPES[number];
type PersonRole = typeof ALL_ROLES[number];

interface NewGroupForm {
  personName: string;
  personRole: PersonRole;
  cpf: string;
  notes: string;
  selectedDocs: DocType[];
}

function GroupCard({ group, onRefresh }: { group: any; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(true);
  const updateStatus = trpc.documentGroups.updateItemStatus.useMutation({
    onSuccess: onRefresh,
  });

  const totalItems = group.items?.length || 0;
  const validatedItems = group.items?.filter((i: any) => i.status === "validado").length || 0;
  const progress = totalItems > 0 ? Math.round((validatedItems / totalItems) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Group Header */}
      <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{group.personName}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[group.personRole] || ROLE_COLORS.outro}`}>
                {ROLE_LABELS[group.personRole] || group.personRole}
              </span>
            </div>
            {group.cpf && <p className="text-xs text-gray-500 mt-0.5">CPF: {group.cpf}</p>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Progress */}
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-gray-700">{validatedItems}/{totalItems} docs</div>
            <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1">
              <div className="h-1.5 bg-green-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Items */}
      {expanded && (
        <div className="border-t border-border">
          {group.items && group.items.length > 0 ? (
            <div className="divide-y divide-border">
              {group.items.map((item: any) => {
                const docConfig = DOC_TYPE_CONFIG[item.docType] || DOC_TYPE_CONFIG.outro;
                const statusConfig = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pendente;
                const ocrFields = item.ocrFields as Record<string, string> | null;
                return (
                  <div key={item.id} className="p-4 flex items-start gap-3 hover:bg-gray-50/50">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center ${docConfig.color}`}>
                      {docConfig.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-gray-800">{docConfig.label}</span>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${statusConfig.color}`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                        {item.ocrConfidence && (
                          <span className="text-xs text-gray-500">{item.ocrConfidence}% conf.</span>
                        )}
                      </div>
                      {/* OCR Fields Preview */}
                      {ocrFields && Object.keys(ocrFields).length > 0 && (
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                          {Object.entries(ocrFields).filter(([k]) => k !== 'confidence' && k !== 'tipo_documento').slice(0, 6).map(([key, val]) => (
                            <div key={key} className="text-xs">
                              <span className="text-gray-400 uppercase tracking-wide">{key.replace(/_/g, ' ')}: </span>
                              <span className="text-gray-700 font-medium">{String(val) || '—'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {item.fileName && (
                        <p className="text-xs text-gray-400 mt-1">{item.fileName}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.fileUrl && (
                        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                          <button className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </a>
                      )}
                      {item.status !== 'validado' && (
                        <button
                          onClick={() => updateStatus.mutate({ itemId: item.id, status: 'validado' })}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Marcar como validado"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-400 text-sm">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Nenhum documento neste grupo ainda.
            </div>
          )}
          {/* Add document to group */}
          <div className="p-3 bg-gray-50 border-t border-border">
            <AddDocToGroupButton groupId={group.id} onRefresh={onRefresh} />
          </div>
        </div>
      )}
    </div>
  );
}

function AddDocToGroupButton({ groupId, onRefresh }: { groupId: number; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [docType, setDocType] = useState<DocType>("outro");
  const addItem = trpc.documentGroups.addItem.useMutation({
    onSuccess: () => { setOpen(false); onRefresh(); toast.success("Documento adicionado ao grupo"); },
    onError: (e) => toast.error(e.message),
  });

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
        <Plus className="w-3.5 h-3.5" /> Adicionar documento
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={docType}
        onChange={(e) => setDocType(e.target.value as DocType)}
        className="text-xs border border-border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {ALL_DOC_TYPES.map(t => (
          <option key={t} value={t}>{DOC_TYPE_CONFIG[t].label}</option>
        ))}
      </select>
      <Button size="sm" className="h-7 text-xs" onClick={() => addItem.mutate({ groupId, docType })} disabled={addItem.isPending}>
        {addItem.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Adicionar"}
      </Button>
      <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function NewGroupModal({ dealId, onClose, onCreated }: { dealId?: number; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<NewGroupForm>({
    personName: "",
    personRole: "comprador",
    cpf: "",
    notes: "",
    selectedDocs: ["rg", "cpf"],
  });

  const createGroup = trpc.documentGroups.create.useMutation({
    onSuccess: () => {
      toast.success("Grupo criado com sucesso!");
      onCreated();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleDoc = (docType: DocType) => {
    setForm(f => ({
      ...f,
      selectedDocs: f.selectedDocs.includes(docType)
        ? f.selectedDocs.filter(d => d !== docType)
        : [...f.selectedDocs, docType],
    }));
  };

  const handleSubmit = () => {
    if (!form.personName.trim()) { toast.error("Informe o nome da pessoa"); return; }
    createGroup.mutate({
      dealId,
      personName: form.personName,
      personRole: form.personRole,
      cpf: form.cpf || undefined,
      notes: form.notes || undefined,
      items: form.selectedDocs.map(dt => ({ docType: dt })),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Novo Grupo de Documentos</h2>
            <p className="text-sm text-gray-500 mt-0.5">Crie um grupo para organizar os documentos de uma pessoa ou imóvel</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome da pessoa / entidade *</label>
            <input
              type="text"
              placeholder="Ex: Carlos Andrade, Imóvel Rua das Palmeiras..."
              value={form.personName}
              onChange={e => setForm(f => ({ ...f, personName: e.target.value }))}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Papel no negócio</label>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map(role => (
                <button
                  key={role}
                  onClick={() => setForm(f => ({ ...f, personRole: role }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    form.personRole === role
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-600 border-border hover:border-primary/50"
                  }`}
                >
                  {ROLE_LABELS[role]}
                </button>
              ))}
            </div>
          </div>

          {/* CPF */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">CPF (opcional)</label>
            <input
              type="text"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Document Types */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Documentos necessários</label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_DOC_TYPES.map(docType => {
                const config = DOC_TYPE_CONFIG[docType];
                const selected = form.selectedDocs.includes(docType);
                return (
                  <button
                    key={docType}
                    onClick={() => toggleDoc(docType)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      selected
                        ? "bg-primary/5 border-primary text-primary"
                        : "bg-white border-border text-gray-600 hover:border-primary/30"
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${selected ? "bg-primary/10" : "bg-gray-100"}`}>
                      {config.icon}
                    </span>
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Observações (opcional)</label>
            <textarea
              placeholder="Informações adicionais sobre este grupo..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-border flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={createGroup.isPending}>
            {createGroup.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</> : <><UserPlus className="w-4 h-4 mr-2" />Criar Grupo</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DocumentGroups() {
  const params = useParams<{ dealId?: string }>();
  const dealId = params.dealId ? parseInt(params.dealId) : undefined;
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);

  const { data: groups, isLoading, refetch } = trpc.documentGroups.list.useQuery({ dealId });

  const totalDocs = groups?.reduce((sum, g) => sum + (g.items?.length || 0), 0) || 0;
  const validatedDocs = groups?.reduce((sum, g) => sum + (g.items?.filter((i: any) => i.status === 'validado').length || 0), 0) || 0;
  const pendingDocs = groups?.reduce((sum, g) => sum + (g.items?.filter((i: any) => i.status === 'pendente').length || 0), 0) || 0;

  return (
    <DashboardShell
      headerRight={
        <div className="flex items-center gap-3">
          {dealId && (
            <Link href={`/dashboard/negocios/${dealId}/documentos`}>
              <Button variant="outline" size="sm">Ver Documentos do Negócio</Button>
            </Link>
          )}
          <Button onClick={() => setShowNewGroupModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Grupo
          </Button>
        </div>
      }
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Grupos de Documentos</h1>
        <p className="text-gray-500 text-sm mt-1">Organize os documentos por pessoa ou imóvel. O OCR preenche os dados automaticamente.</p>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Grupos", value: groups?.length || 0, icon: <Users className="w-5 h-5" />, color: "text-blue-600 bg-blue-50" },
          { label: "Total de docs", value: totalDocs, icon: <FileText className="w-5 h-5" />, color: "text-purple-600 bg-purple-50" },
          { label: "Validados", value: validatedDocs, icon: <CheckCircle2 className="w-5 h-5" />, color: "text-green-600 bg-green-50" },
          { label: "Pendentes", value: pendingDocs, icon: <Clock className="w-5 h-5" />, color: "text-yellow-600 bg-yellow-50" },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Groups List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : groups && groups.length > 0 ? (
        <div className="space-y-4">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} onRefresh={refetch} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-border p-16 text-center">
          <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary/40" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum grupo criado</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
            Crie grupos para organizar os documentos de cada pessoa envolvida no negócio — comprador, vendedor, fiador, etc.
          </p>
          <Button onClick={() => setShowNewGroupModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Criar primeiro grupo
          </Button>
        </div>
      )}

      {/* New Group Modal */}
      {showNewGroupModal && (
        <NewGroupModal
          dealId={dealId}
          onClose={() => setShowNewGroupModal(false)}
          onCreated={() => refetch()}
        />
      )}
    </DashboardShell>
  );
}
