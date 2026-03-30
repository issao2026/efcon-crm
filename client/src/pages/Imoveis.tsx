import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Home, MapPin, FileText, Search,
  ChevronDown, ChevronUp, X, Loader2, Building2, DollarSign,
  Upload, Eye, CheckCircle2
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type PropertyStatus = 'disponivel' | 'vendido' | 'alugado' | 'em_negociacao';

const STATUS_CONFIG: Record<PropertyStatus, { label: string; color: string; bg: string }> = {
  disponivel:    { label: 'Disponível',      color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  vendido:       { label: 'Vendido',          color: 'text-gray-500',   bg: 'bg-gray-100 border-gray-200' },
  alugado:       { label: 'Alugado',          color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  em_negociacao: { label: 'Em negociação',    color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200' },
};

interface PropertyForm {
  description: string;
  propertyType: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  registration: string;
  registryOffice: string;
  area: string;
  totalValue: string;
  items: string;
  propertyStatus: PropertyStatus;
}

const EMPTY_FORM: PropertyForm = {
  description: "",
  propertyType: "Apartamento",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  zipCode: "",
  registration: "",
  registryOffice: "",
  area: "",
  totalValue: "",
  items: "",
  propertyStatus: "disponivel",
};

const PROPERTY_TYPES = [
  "Apartamento", "Casa", "Terreno", "Sala Comercial", "Galpão",
  "Chácara", "Sítio", "Fazenda", "Flat", "Loja", "Outro",
];

const BR_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

// ─── CEP Lookup ───────────────────────────────────────────────────────────────
async function fetchCep(cep: string): Promise<{
  logradouro?: string; bairro?: string; localidade?: string; uf?: string; erro?: boolean;
} | null> {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({
  label, name, value, onChange, placeholder, type = "text", options, className, required,
}: {
  label: string; name: keyof PropertyForm; value: string;
  onChange: (name: keyof PropertyForm, value: string) => void;
  placeholder?: string; type?: string;
  options?: string[]; className?: string; required?: boolean;
}) {
  if (options) {
    return (
      <div className={className}>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        >
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
      />
    </div>
  );
}

// ─── Property Modal ────────────────────────────────────────────────────────────
function PropertyModal({
  initial, onClose, onSave,
}: {
  initial?: PropertyForm & { id?: number };
  onClose: () => void;
  onSave: (form: PropertyForm, id?: number) => Promise<void>;
}) {
  const [form, setForm] = useState<PropertyForm>(initial ?? EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const setField = (name: keyof PropertyForm, value: string) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const handleCepBlur = async () => {
    const cep = form.zipCode.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const data = await fetchCep(cep);
      if (data && !data.erro) {
        setForm((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
        toast.success("Endereço preenchido automaticamente via CEP");
      } else {
        toast.error("CEP não encontrado");
      }
    } finally {
      setCepLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.street || !form.city) {
      toast.error("Preencha ao menos o logradouro e a cidade");
      return;
    }
    setSaving(true);
    try {
      await onSave(form, initial?.id);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar imóvel");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {initial?.id ? "Editar Imóvel" : "Novo Imóvel"}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Tipo e Descrição */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Tipo de imóvel" name="propertyType" value={form.propertyType}
              onChange={setField} options={PROPERTY_TYPES} required />
            <Field label="Descrição" name="description" value={form.description}
              onChange={setField} placeholder="Ex: Apartamento 3 quartos, suite..." />
          </div>

          {/* Endereço */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Endereço</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-600 mb-1">CEP</label>
                <input
                  type="text"
                  value={form.zipCode}
                  onChange={(e) => setField("zipCode", e.target.value)}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                  maxLength={9}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
                {cepLoading && (
                  <div className="absolute right-3 top-8">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  </div>
                )}
              </div>
              <Field label="Logradouro" name="street" value={form.street}
                onChange={setField} placeholder="Rua, Av., etc." required className="md:col-span-2" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <Field label="Número" name="number" value={form.number}
                onChange={setField} placeholder="Nº" />
              <Field label="Complemento" name="complement" value={form.complement}
                onChange={setField} placeholder="Apto, Bloco..." />
              <Field label="Bairro" name="neighborhood" value={form.neighborhood}
                onChange={setField} placeholder="Bairro" />
              <Field label="Cidade" name="city" value={form.city}
                onChange={setField} placeholder="Cidade" required />
            </div>
            <div className="mt-4">
              <Field label="Estado" name="state" value={form.state}
                onChange={setField} options={["", ...BR_STATES]} className="w-32" />
            </div>
          </div>

          {/* Registro */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Registro</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Matrícula" name="registration" value={form.registration}
                onChange={setField} placeholder="Nº de matrícula" />
              <Field label="Cartório de registro" name="registryOffice" value={form.registryOffice}
                onChange={setField} placeholder="Nome do cartório" />
            </div>
          </div>

          {/* Situação */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Situação</p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(STATUS_CONFIG) as [PropertyStatus, typeof STATUS_CONFIG[PropertyStatus]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, propertyStatus: key }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    form.propertyStatus === key
                      ? `${cfg.bg} ${cfg.color} ring-2 ring-offset-1 ring-current`
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Características */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Características</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Área total (m²)" name="area" value={form.area}
                onChange={setField} placeholder="Ex: 98,50" />
              <Field label="Valor (R$)" name="totalValue" value={form.totalValue}
                onChange={setField} placeholder="Ex: 485000" type="text" />
            </div>
            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Itens que permanecem no imóvel
              </label>
              <textarea
                value={form.items}
                onChange={(e) => setField("items", e.target.value)}
                placeholder="Ex: Armários embutidos, ar-condicionado, cortinas..."
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {initial?.id ? "Salvar alterações" : "Cadastrar imóvel"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Matricula Upload Modal ───────────────────────────────────────────────────
function MatriculaUploadModal({
  propertyId,
  propertyName,
  existingUrl,
  onClose,
  onSuccess,
}: {
  propertyId: number;
  propertyName: string;
  existingUrl?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.properties.uploadMatricula.useMutation({
    onSuccess: () => {
      toast.success("Matrícula enviada com sucesso!");
      onSuccess();
      onClose();
    },
    onError: (e) => {
      toast.error("Erro no upload: " + e.message);
      setUploading(false);
    },
  });

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      await uploadMutation.mutateAsync({
        propertyId,
        fileBase64: base64,
        mimeType: file.type,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Enviar Matrícula</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{propertyName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {existingUrl && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-sm text-green-700 flex-1">Matrícula já enviada</span>
            <a href={existingUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> Ver
            </a>
          </div>
        )}

        <p className="text-sm text-gray-500 mb-4">
          {existingUrl ? "Envie um novo arquivo para substituir a matrícula atual." : "Envie o documento de matrícula do imóvel (PDF, JPG ou PNG, máx. 10 MB)."}
        </p>

        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition-colors mb-4"
          onClick={() => fileRef.current?.click()}
        >
          {file ? (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <FileText className="w-5 h-5" />
              <span className="text-sm font-medium">{file.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-gray-400 hover:text-gray-600 ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Clique para selecionar arquivo</p>
              <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — máx. 10 MB</p>
            </>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            {uploading ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Imoveis() {
  const utils = trpc.useUtils();
  const { data: properties = [], isLoading } = trpc.properties.list.useQuery();
  const createMutation = trpc.properties.create.useMutation({
    onSuccess: () => { utils.properties.list.invalidate(); toast.success("Imóvel cadastrado!"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.properties.update.useMutation({
    onSuccess: () => { utils.properties.list.invalidate(); toast.success("Imóvel atualizado!"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.properties.delete.useMutation({
    onSuccess: () => { utils.properties.list.invalidate(); toast.success("Imóvel excluído!"); },
    onError: (e) => toast.error(e.message),
  });

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<(PropertyForm & { id: number }) | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [matriculaUploadProperty, setMatriculaUploadProperty] = useState<typeof properties[0] | null>(null);

  const filtered = properties.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.description || "").toLowerCase().includes(q) ||
      (p.street || "").toLowerCase().includes(q) ||
      (p.city || "").toLowerCase().includes(q) ||
      (p.registration || "").toLowerCase().includes(q) ||
      (p.propertyType || "").toLowerCase().includes(q)
    );
  });

  const handleSave = async (form: PropertyForm, id?: number) => {
    if (id) {
      await updateMutation.mutateAsync({ id, ...form });
    } else {
      await createMutation.mutateAsync(form);
    }
  };

  const handleEdit = (p: typeof properties[0]) => {
    setEditingProperty({
      id: p.id,
      description: p.description || "",
      propertyType: p.propertyType || "Apartamento",
      street: p.street || "",
      number: p.number || "",
      complement: p.complement || "",
      neighborhood: p.neighborhood || "",
      city: p.city || "",
      state: p.state || "",
      zipCode: p.zipCode || "",
      registration: p.registration || "",
      registryOffice: p.registryOffice || "",
      area: p.area || "",
      totalValue: p.totalValue ? String(p.totalValue) : "",
      items: p.items || "",
      propertyStatus: ((p as any).propertyStatus as PropertyStatus) || "disponivel",
    });
  };

  const handleStatusChange = async (id: number, status: PropertyStatus) => {
    try {
      await updateMutation.mutateAsync({ id, propertyStatus: status });
    } catch {
      // error handled by mutation
    }
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync({ id });
    setConfirmDeleteId(null);
  };

  const formatCurrency = (val: string | number | null | undefined) => {
    if (!val) return "—";
    const n = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(n)) return "—";
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <DashboardShell searchPlaceholder="Buscar imóveis...">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Imóveis</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {properties.length} imóvel{properties.length !== 1 ? "is" : ""} cadastrado{properties.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo imóvel
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por descrição, endereço, matrícula..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total", value: properties.length, icon: Home, color: "blue" },
            { label: "Apartamentos", value: properties.filter((p) => p.propertyType === "Apartamento").length, icon: Building2, color: "purple" },
            { label: "Casas", value: properties.filter((p) => p.propertyType === "Casa").length, icon: Home, color: "green" },
            { label: "Outros", value: properties.filter((p) => !["Apartamento", "Casa"].includes(p.propertyType || "")).length, icon: MapPin, color: "amber" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${stat.color}-50`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl">
            <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              {search ? "Nenhum imóvel encontrado" : "Nenhum imóvel cadastrado"}
            </p>
            {!search && (
              <Button onClick={() => setShowModal(true)} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar primeiro imóvel
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => {
              const isExpanded = expandedId === p.id;
              const address = [p.street, p.number, p.complement, p.neighborhood, p.city, p.state]
                .filter(Boolean).join(", ");
              const hasMatricula = !!(p as any).matriculaDocUrl;
              return (
                <div key={p.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  {/* Row */}
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Home className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 truncate">
                          {p.description || `${p.propertyType || "Imóvel"} – ${p.city || "sem cidade"}`}
                        </span>
                        {p.propertyType && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                            {p.propertyType}
                          </span>
                        )}
                        {/* Status badge with inline dropdown */}
                        {(() => {
                          const st = ((p as any).propertyStatus as PropertyStatus) || 'disponivel';
                          const cfg = STATUS_CONFIG[st];
                          return (
                            <div className="relative group">
                              <span className={`px-2 py-0.5 text-xs rounded-full font-medium border cursor-pointer ${cfg.bg} ${cfg.color}`}>
                                {cfg.label} ▾
                              </span>
                              <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 hidden group-hover:block min-w-[140px]">
                                {(Object.entries(STATUS_CONFIG) as [PropertyStatus, typeof STATUS_CONFIG[PropertyStatus]][]).map(([key, c]) => (
                                  <button
                                    key={key}
                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(p.id, key); }}
                                    className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-gray-50 ${c.color} ${st === key ? 'font-bold' : ''}`}
                                  >
                                    {c.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                        {hasMatricula && (
                          <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Matrícula
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-0.5">{address || "Sem endereço"}</p>
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
                      {p.area && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {p.area} m²
                        </span>
                      )}
                      {p.totalValue && (
                        <span className="flex items-center gap-1 font-semibold text-green-700">
                          <DollarSign className="w-3.5 h-3.5" />
                          {formatCurrency(p.totalValue)}
                        </span>
                      )}
                      {p.registration && (
                        <span className="flex items-center gap-1 text-gray-400">
                          <FileText className="w-3.5 h-3.5" />
                          Mat. {p.registration}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleEdit(p)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setMatriculaUploadProperty(p)}
                        className={`p-2 rounded-lg transition-colors ${hasMatricula ? "text-green-500 hover:text-green-700 hover:bg-green-50" : "text-gray-400 hover:text-purple-600 hover:bg-purple-50"}`}
                        title={hasMatricula ? "Substituir Matrícula" : "Enviar Matrícula"}
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      {hasMatricula && (
                        <a
                          href={(p as any).matriculaDocUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Ver Matrícula"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => setConfirmDeleteId(p.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : p.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        {[
                          { label: "Tipo", value: p.propertyType },
                          { label: "Área", value: p.area ? `${p.area} m²` : null },
                          { label: "Valor", value: formatCurrency(p.totalValue) },
                          { label: "Matrícula", value: p.registration },
                          { label: "Cartório", value: p.registryOffice },
                          { label: "CEP", value: p.zipCode },
                          { label: "Endereço completo", value: address || null },
                          { label: "Itens inclusos", value: p.items },
                        ].filter((r) => r.value).map((row) => (
                          <div key={row.label} className={row.label === "Endereço completo" || row.label === "Itens inclusos" ? "col-span-2 md:col-span-3" : ""}>
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{row.label}</span>
                            <p className="text-gray-800 mt-0.5">{row.value}</p>
                          </div>
                        ))}
                        {hasMatricula && (
                          <div>
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Documento Matrícula</span>
                            <a
                              href={(p as any).matriculaDocUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 mt-0.5 text-blue-600 hover:underline text-sm"
                            >
                              <Eye className="w-3.5 h-3.5" /> Ver documento
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showModal || editingProperty) && (
        <PropertyModal
          initial={editingProperty ?? undefined}
          onClose={() => { setShowModal(false); setEditingProperty(null); }}
          onSave={handleSave}
        />
      )}

      {/* Matricula Upload Modal */}
      {matriculaUploadProperty && (
        <MatriculaUploadModal
          propertyId={matriculaUploadProperty.id}
          propertyName={
            matriculaUploadProperty.description ||
            `${matriculaUploadProperty.propertyType || "Imóvel"} – ${matriculaUploadProperty.city || "sem cidade"}`
          }
          existingUrl={(matriculaUploadProperty as any).matriculaDocUrl}
          onClose={() => setMatriculaUploadProperty(null)}
          onSuccess={() => utils.properties.list.invalidate()}
        />
      )}

      {/* Delete Confirm */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir imóvel?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Esta ação não pode ser desfeita. O imóvel será removido permanentemente.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Excluir"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
