import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Zap, ArrowLeft, FileOutput, Download, Eye,
  Loader2, CheckCircle2, User, Home, DollarSign, Users,
  ChevronDown, ChevronUp, RefreshCw, FileText, Scale, Building2, Repeat2,
  Plus, Trash2, MessageCircle,
} from "lucide-react";
import { getLoginUrl } from "@/const";

// ─── Types ───────────────────────────────────────────────────────────────────
type ContractType = "compra_venda" | "locacao" | "permuta" | "financiamento";

interface PartyData {
  id: string;
  nome: string;
  cpf: string;
  rg: string;
  nacionalidade: string;
  estadoCivil: string;
  profissao: string;
  endereco: string;
  whatsapp: string;
  email: string;
}

interface BrokerData {
  id: string;
  nome: string;
  creci: string;
  whatsapp: string;
  email: string;
}

interface ContractFormData {
  contractType: ContractType;
  // Multi-party
  vendedores: PartyData[];
  compradores: PartyData[];
  corretores: BrokerData[];
  // Imóvel
  imovelDescricao: string;
  imovelEndereco: string;
  imovelMatricula: string;
  imovelCartorio: string;
  imovelAreaTotal: string;
  imovelItens: string;
  // Financeiro
  valorTotal: string;
  valorSinal: string;
  valorFinanciamento: string;
  formaPagamento: string;
  dataVencimento: string;
  // Testemunhas
  testemunha1Nome: string;
  testemunha1Cpf: string;
  testemunha2Nome: string;
  testemunha2Cpf: string;
  // Cláusulas contratuais
  prazoEntregaPosse: string;
  condicaoEntregaPosse: string;
  prazoEscritura: string;
  percentualMulta: string;
  prazoRestituicaoValores: string;
  prazoCertidaoObjetoPe: string;
  quantidadeExerciciosIptu: string;
  responsavelDespesas: string;
  condicoesDistrato: string;
  foro: string;
  plataformaAssinatura: string;
  // Permuta
  descricaoImovelPermuta: string;
  valorImovelPermuta: string;
  ajusteFinanceiroPermuta: string;
  // Locação
  prazoLocacao: string;
  diaVencimentoAluguel: string;
  tipoGarantia: string;
  valorGarantia: string;
  indiceReajuste: string;
  multaRescisaoAntecipada: string;
  destinacaoImovel: string;
  // Imobiliária
  imobiliariaNome: string;
  imobiliariaCnpj: string;
  imobiliariaEndereco: string;
  // Misc
  localAssinatura: string;
  dataAssinatura: string;
}

const makeParty = (): PartyData => ({
  id: Math.random().toString(36).slice(2),
  nome: "", cpf: "", rg: "", nacionalidade: "brasileiro(a)",
  estadoCivil: "solteiro(a)", profissao: "", endereco: "", whatsapp: "", email: "",
});

const makeBroker = (): BrokerData => ({
  id: Math.random().toString(36).slice(2),
  nome: "Marcello & Oliveira", creci: "28.867 J", whatsapp: "", email: "",
});

const INITIAL_FORM: ContractFormData = {
  contractType: "compra_venda",
  vendedores: [makeParty()],
  compradores: [makeParty()],
  corretores: [makeBroker()],
  imovelDescricao: "", imovelEndereco: "", imovelMatricula: "", imovelCartorio: "", imovelAreaTotal: "", imovelItens: "",
  valorTotal: "", valorSinal: "", valorFinanciamento: "", formaPagamento: "À vista",
  dataVencimento: "", testemunha1Nome: "", testemunha1Cpf: "", testemunha2Nome: "", testemunha2Cpf: "",
  prazoEntregaPosse: "30 dias após assinatura", condicaoEntregaPosse: "livre e desembaraçado de quaisquer ônus",
  prazoEscritura: "60 dias após quitação", percentualMulta: "10",
  prazoRestituicaoValores: "30 dias", prazoCertidaoObjetoPe: "30 dias",
  quantidadeExerciciosIptu: "1", responsavelDespesas: "comprador",
  condicoesDistrato: "conforme lei 13.786/2018", foro: "Brasília, Distrito Federal",
  plataformaAssinatura: "Clicksign",
  descricaoImovelPermuta: "", valorImovelPermuta: "", ajusteFinanceiroPermuta: "",
  prazoLocacao: "30 meses", diaVencimentoAluguel: "10", tipoGarantia: "caução",
  valorGarantia: "", indiceReajuste: "IGPM", multaRescisaoAntecipada: "3 alugueis",
  destinacaoImovel: "residencial",
  imobiliariaNome: "Marcello & Oliveira Imóveis", imobiliariaCnpj: "12.345.678/0001-99",
  imobiliariaEndereco: "CRECI 28.867 J – Brasília, DF",
  localAssinatura: "Brasília, DF", dataAssinatura: new Date().toLocaleDateString("pt-BR"),
};

const CONTRACT_TYPE_OPTIONS = [
  { value: "compra_venda", label: "Compra e Venda" },
  { value: "locacao", label: "Locação" },
  { value: "permuta", label: "Permuta" },
  { value: "financiamento", label: "Financiamento" },
];

const ESTADO_CIVIL_OPTIONS = [
  { value: "solteiro(a)", label: "Solteiro(a)" },
  { value: "casado(a)", label: "Casado(a)" },
  { value: "divorciado(a)", label: "Divorciado(a)" },
  { value: "viúvo(a)", label: "Viúvo(a)" },
  { value: "separado(a)", label: "Separado(a)" },
  { value: "união estável", label: "União estável" },
];

// ─── Simple Field ─────────────────────────────────────────────────────────────
function Field({
  label, value, onChange, type = "text", required, placeholder, options, className
}: {
  label: string; value: string;
  onChange: (value: string) => void;
  type?: string; required?: boolean; placeholder?: string;
  options?: { value: string; label: string }[];
  className?: string;
}) {
  if (options) {
    return (
      <div className={className}>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
      />
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────
function Section({
  title, icon: Icon, children, defaultOpen = true, badge
}: {
  title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean; badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-4">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Icon className="w-4 h-4 text-blue-600" />
          </div>
          <span className="font-bold text-gray-900">{title}</span>
          {badge && <Badge className="bg-blue-100 text-blue-700 text-xs">{badge}</Badge>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

// ─── Party Card (Vendedor / Comprador) ────────────────────────────────────────
function PartyCard({
  party, index, label, clients, onUpdate, onRemove, canRemove,
}: {
  party: PartyData;
  index: number;
  label: string;
  clients: any[];
  onUpdate: (updated: PartyData) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const set = (field: keyof PartyData, value: string) =>
    onUpdate({ ...party, [field]: value });

  const fillFromClient = (client: any) => {
    if (!client) return;
    onUpdate({
      ...party,
      nome: client.name || party.nome,
      cpf: client.cpfCnpj || party.cpf,
      rg: client.rg || party.rg,
      nacionalidade: client.nationality || party.nacionalidade,
      estadoCivil: client.maritalStatus || party.estadoCivil,
      profissao: client.profession || party.profissao,
      endereco: client.address || party.endereco,
      whatsapp: client.phone || party.whatsapp,
      email: client.email || party.email,
    });
  };

  return (
    <div className="border border-gray-100 rounded-xl p-4 mb-3 bg-gray-50/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
          {label} {index + 1}
        </span>
        {canRemove && (
          <button
            onClick={onRemove}
            className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-lg hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick select from clients */}
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-500 mb-1">Selecionar cliente cadastrado</label>
        <select
          defaultValue=""
          onChange={(e) => {
            const c = clients.find((x: any) => String(x.id) === e.target.value);
            if (c) fillFromClient(c);
          }}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        >
          <option value="">— Buscar cliente cadastrado —</option>
          {clients.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name} {c.clientRole ? `(${c.clientRole})` : ''}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Nome completo" value={party.nome} onChange={(v) => set("nome", v)} required placeholder="Nome completo" />
        <Field label="CPF" value={party.cpf} onChange={(v) => set("cpf", v)} required placeholder="000.000.000-00" />
        <Field label="RG" value={party.rg} onChange={(v) => set("rg", v)} placeholder="00.000.000-0" />
        <Field label="Nacionalidade" value={party.nacionalidade} onChange={(v) => set("nacionalidade", v)} />
        <Field label="Estado civil" value={party.estadoCivil} onChange={(v) => set("estadoCivil", v)} options={ESTADO_CIVIL_OPTIONS} />
        <Field label="Profissão" value={party.profissao} onChange={(v) => set("profissao", v)} />
        <Field
          label="Endereço completo"
          value={party.endereco}
          onChange={(v) => set("endereco", v)}
          placeholder="Rua, número, bairro, cidade, estado"
          className="md:col-span-2"
        />
        <Field
          label="WhatsApp (com DDD)"
          value={party.whatsapp}
          onChange={(v) => set("whatsapp", v)}
          placeholder="(61) 99999-9999"
          type="tel"
        />
        <Field
          label="E-mail"
          value={party.email}
          onChange={(v) => set("email", v)}
          placeholder="exemplo@email.com"
          type="email"
        />
      </div>
    </div>
  );
}

// ─── Broker Card ─────────────────────────────────────────────────────────────
function BrokerCard({
  broker, index, clients, onUpdate, onRemove, canRemove,
}: {
  broker: BrokerData;
  index: number;
  clients: any[];
  onUpdate: (updated: BrokerData) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const set = (field: keyof BrokerData, value: string) =>
    onUpdate({ ...broker, [field]: value });

  const fillFromClient = (client: any) => {
    if (!client) return;
    onUpdate({
      ...broker,
      nome: client.name || broker.nome,
      whatsapp: client.phone || broker.whatsapp,
      email: client.email || broker.email,
    });
  };

  return (
    <div className="border border-gray-100 rounded-xl p-4 mb-3 bg-gray-50/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
          Corretor {index + 1}
        </span>
        {canRemove && (
          <button
            onClick={onRemove}
            className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-lg hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-500 mb-1">Selecionar corretor cadastrado</label>
        <select
          defaultValue=""
          onChange={(e) => {
            const c = clients.find((x: any) => String(x.id) === e.target.value);
            if (c) fillFromClient(c);
          }}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        >
          <option value="">— Buscar corretor cadastrado —</option>
          {clients.filter((c: any) => c.clientRole === 'corretor').map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
          {clients.filter((c: any) => c.clientRole !== 'corretor').length > 0 && (
            <optgroup label="Outros clientes">
              {clients.filter((c: any) => c.clientRole !== 'corretor').map((c: any) => (
                <option key={c.id} value={c.id}>{c.name} ({c.clientRole || 'sem categoria'})</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Nome / Razão social" value={broker.nome} onChange={(v) => set("nome", v)} required />
        <Field label="CRECI" value={broker.creci} onChange={(v) => set("creci", v)} placeholder="00.000 J" />
        <Field
          label="WhatsApp (com DDD)"
          value={broker.whatsapp}
          onChange={(v) => set("whatsapp", v)}
          placeholder="(61) 99999-9999"
          type="tel"
        />
        <Field
          label="E-mail"
          value={broker.email}
          onChange={(v) => set("email", v)}
          placeholder="corretor@email.com"
          type="email"
        />
      </div>
    </div>
  );
}

// ─── Contract Preview ─────────────────────────────────────────────────────────
function ContractPreview({ form }: { form: ContractFormData }) {
  const typeLabel = CONTRACT_TYPE_OPTIONS.find((o) => o.value === form.contractType)?.label || "Compra e Venda";
  const isLocacao = form.contractType === "locacao";
  const vendedorLabel = isLocacao ? "LOCADOR(A)" : "VENDEDOR(A)";
  const compradorLabel = isLocacao ? "LOCATÁRIO(A)" : "COMPRADOR(A)";

  return (
    <div id="contract-preview-content" className="bg-white border border-gray-200 rounded-2xl p-8 font-serif text-sm leading-relaxed text-gray-800 max-h-[600px] overflow-y-auto">
      <div className="text-center mb-8">
        <div className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-2">Marcello & Oliveira Imóveis</div>
        <div className="text-xs text-gray-400 mb-4">CRECI {form.corretores[0]?.creci || "28.867 J"} · Brasília, DF</div>
        <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">
          Contrato de {typeLabel}
        </h2>
        <div className="h-0.5 bg-gray-200 mt-4" />
      </div>

      <p className="mb-4">
        Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente{" "}
        <strong>Contrato de {typeLabel}</strong>:
      </p>

      {form.vendedores.map((v, i) => (
        <div key={v.id}>
          <p className="mb-2"><strong>{vendedorLabel}{form.vendedores.length > 1 ? ` ${i + 1}` : ""}:</strong></p>
          <p className="mb-4 pl-4 text-gray-700">
            {v.nome || "[NOME]"}, {v.nacionalidade}, {v.estadoCivil},
            {v.profissao ? ` ${v.profissao},` : ""} CPF nº {v.cpf || "[CPF]"}, RG nº {v.rg || "[RG]"},
            residente em {v.endereco || "[ENDEREÇO]"}.
          </p>
        </div>
      ))}

      {form.compradores.map((c, i) => (
        <div key={c.id}>
          <p className="mb-2"><strong>{compradorLabel}{form.compradores.length > 1 ? ` ${i + 1}` : ""}:</strong></p>
          <p className="mb-4 pl-4 text-gray-700">
            {c.nome || "[NOME]"}, {c.nacionalidade}, {c.estadoCivil},
            {c.profissao ? ` ${c.profissao},` : ""} CPF nº {c.cpf || "[CPF]"}, RG nº {c.rg || "[RG]"},
            residente em {c.endereco || "[ENDEREÇO]"}.
          </p>
        </div>
      ))}

      <div className="h-px bg-gray-100 my-4" />

      <p className="mb-2"><strong>CLÁUSULA 1ª – DO OBJETO</strong></p>
      <p className="mb-4 text-gray-700">
        Imóvel: {form.imovelDescricao || "[DESCRIÇÃO]"}, localizado em {form.imovelEndereco || "[ENDEREÇO]"},
        área total de {form.imovelAreaTotal || "[ÁREA]"} m², matrícula nº {form.imovelMatricula || "[MATRÍCULA]"}.
      </p>

      <p className="mb-2"><strong>CLÁUSULA 2ª – DO PREÇO</strong></p>
      <p className="mb-4 text-gray-700">
        Valor {isLocacao ? "do aluguel mensal" : "total"}: <strong>R$ {form.valorTotal || "[VALOR]"}</strong>,
        mediante {form.formaPagamento || "[FORMA DE PAGAMENTO]"}.
      </p>

      <div className="h-px bg-gray-100 my-4" />
      <p className="mb-6 text-gray-700">
        {form.localAssinatura}, {form.dataAssinatura}.
      </p>

      <div className="grid grid-cols-2 gap-8 mt-8">
        {form.vendedores.map((v, i) => (
          <div key={v.id} className="text-center">
            <div className="border-t border-gray-400 pt-2">
              <div className="font-semibold">{v.nome || `[${vendedorLabel}${form.vendedores.length > 1 ? ` ${i+1}` : ""}]`}</div>
              <div className="text-xs text-gray-500">CPF: {v.cpf || "[CPF]"}</div>
            </div>
          </div>
        ))}
        {form.compradores.map((c, i) => (
          <div key={c.id} className="text-center">
            <div className="border-t border-gray-400 pt-2">
              <div className="font-semibold">{c.nome || `[${compradorLabel}${form.compradores.length > 1 ? ` ${i+1}` : ""}]`}</div>
              <div className="text-xs text-gray-500">CPF: {c.cpf || "[CPF]"}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
        Intermediado por: {form.corretores.map(c => `${c.nome} (CRECI ${c.creci})`).join(", ")}
      </div>
    </div>
  );
}

// ─── Distribuição Modal (WhatsApp + E-mail) ───────────────────────────────────────────
function DistribuicaoModal({
  form,
  contractUrl,
  onClose,
}: {
  form: ContractFormData;
  contractUrl: string;
  onClose: () => void;
}) {
  const [sentStatus, setSentStatus] = useState<Record<string, 'whatsapp' | 'email' | 'both' | null>>({});

  const isLocacao = form.contractType === "locacao";
  const typeLabel = CONTRACT_TYPE_OPTIONS.find((o) => o.value === form.contractType)?.label || "Compra e Venda";

  const parties = [
    ...form.vendedores.map((v, i) => ({
      id: v.id,
      name: v.nome,
      phone: v.whatsapp,
      email: v.email,
      role: isLocacao
        ? `Locador(a)${form.vendedores.length > 1 ? ` ${i + 1}` : ""}`
        : `Vendedor(a)${form.vendedores.length > 1 ? ` ${i + 1}` : ""}`,
    })),
    ...form.compradores.map((c, i) => ({
      id: c.id,
      name: c.nome,
      phone: c.whatsapp,
      email: c.email,
      role: isLocacao
        ? `Locatário(a)${form.compradores.length > 1 ? ` ${i + 1}` : ""}`
        : `Comprador(a)${form.compradores.length > 1 ? ` ${i + 1}` : ""}`,
    })),
    ...form.corretores.map((b, i) => ({
      id: b.id,
      name: b.nome,
      phone: b.whatsapp,
      email: b.email,
      role: `Corretor(a)${form.corretores.length > 1 ? ` ${i + 1}` : ""}`,
    })),
  ].filter((p) => p.name);

  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return digits.startsWith("55") ? digits : `55${digits}`;
  };

  const buildWaMessage = (party: { name: string; role: string }) =>
    encodeURIComponent(
      `Olá, ${party.name}! 👋\n\n` +
      `Segue o contrato de *${typeLabel}* para sua revisão e assinatura.\n\n` +
      `📋 *Sua participação:* ${party.role}\n` +
      `🏠 *Imóvel:* ${form.imovelDescricao || form.imovelEndereco || "conforme contrato"}\n` +
      `💰 *Valor:* R$ ${form.valorTotal || "conforme contrato"}\n\n` +
      `🔗 *Link do contrato (PDF):*\n${contractUrl}\n\n` +
      `Por favor, revise o documento e confirme sua concordância.\n\n` +
      `Atenciosamente,\n${form.corretores[0]?.nome || "Marcello & Oliveira Imóveis"}`
    );

  const buildEmailBody = (party: { name: string; role: string }) =>
    encodeURIComponent(
      `Olá, ${party.name},\n\n` +
      `Segue o contrato de ${typeLabel} para sua revisão e assinatura.\n\n` +
      `Sua participação: ${party.role}\n` +
      `Imóvel: ${form.imovelDescricao || form.imovelEndereco || "conforme contrato"}\n` +
      `Valor: R$ ${form.valorTotal || "conforme contrato"}\n\n` +
      `Link do contrato (PDF):\n${contractUrl}\n\n` +
      `Por favor, revise o documento e confirme sua concordância. Em caso de dúvidas, entre em contato.\n\n` +
      `Atenciosamente,\n${form.corretores[0]?.nome || "Marcello & Oliveira Imóveis"}`
    );

  const handleSendAll = () => {
    parties.forEach((party) => {
      const hasPhone = party.phone && party.phone.replace(/\D/g, "").length >= 10;
      if (hasPhone) {
        window.open(`https://wa.me/${formatPhone(party.phone)}?text=${buildWaMessage(party)}`, "_blank");
      }
    });
    const newStatus: Record<string, 'whatsapp'> = {};
    parties.forEach((p) => { newStatus[p.id] = 'whatsapp'; });
    setSentStatus(newStatus);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg leading-tight">Contrato Pronto!</h3>
              <p className="text-blue-100 text-sm">PDF gerado com sucesso. Distribua para as partes.</p>
            </div>
          </div>
          <a
            href={contractUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors w-fit"
          >
            <Download className="w-4 h-4" /> Baixar PDF
          </a>
        </div>

        {/* Parties */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-700 text-sm font-semibold">
              Enviar contrato para {parties.length} parte{parties.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={handleSendAll}
              className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Enviar Todos via WhatsApp
            </button>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {parties.map((party) => {
              const hasPhone = party.phone && party.phone.replace(/\D/g, "").length >= 10;
              const hasEmail = party.email && party.email.includes("@");
              const waLink = hasPhone
                ? `https://wa.me/${formatPhone(party.phone)}?text=${buildWaMessage(party)}`
                : null;
              const emailLink = hasEmail
                ? `mailto:${party.email}?subject=${encodeURIComponent(`Contrato de ${typeLabel} – ${form.imovelDescricao || form.imovelEndereco || "Imóvel"}`)}&body=${buildEmailBody(party)}`
                : null;
              const sent = sentStatus[party.id];

              return (
                <div key={party.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 font-bold text-sm">
                      {party.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">{party.name || "—"}</div>
                    <div className="text-xs text-gray-500">{party.role}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {party.phone || <span className="italic">sem WhatsApp</span>}
                      {party.email && <span className="ml-2">· {party.email}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {waLink ? (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setSentStatus((s) => ({ ...s, [party.id]: s[party.id] === 'email' ? 'both' : 'whatsapp' }))}
                        title="Enviar via WhatsApp"
                        className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                          sent === 'whatsapp' || sent === 'both'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20'
                        }`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {sent === 'whatsapp' || sent === 'both' ? '✓ WA' : 'WhatsApp'}
                      </a>
                    ) : (
                      <span className="text-xs text-gray-300 px-2">sem WA</span>
                    )}
                    {emailLink ? (
                      <a
                        href={emailLink}
                        onClick={() => setSentStatus((s) => ({ ...s, [party.id]: s[party.id] === 'whatsapp' ? 'both' : 'email' }))}
                        title="Enviar por e-mail"
                        className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                          sent === 'email' || sent === 'both'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {sent === 'email' || sent === 'both' ? '✓ Email' : 'E-mail'}
                      </a>
                    ) : (
                      <span className="text-xs text-gray-300 px-2">sem email</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {parties.length === 0 && (
            <div className="text-center py-6 text-gray-400 text-sm">
              Nenhuma parte encontrada. Preencha os dados do contrato.
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Contract Page ───────────────────────────────────────────────────────
export default function Contract() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [form, setForm] = useState<ContractFormData>(INITIAL_FORM);
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [prefillDealId, setPrefillDealId] = useState<number | null>(null);
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  // Read dealId from URL query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dealId = params.get('dealId');
    if (dealId && !isNaN(parseInt(dealId))) setPrefillDealId(parseInt(dealId));
  }, []);

  // Read wizard prefill from localStorage (set by NewContractModal wizard in Contratos.tsx)
  useEffect(() => {
    const raw = localStorage.getItem("efcon_contract_prefill");
    if (!raw) return;
    try {
      const p = JSON.parse(raw);
      localStorage.removeItem("efcon_contract_prefill");
      setForm((prev) => {
        const toParty = (arr: any[]): PartyData[] =>
          (arr || []).filter((x: any) => x.nome || x.email).map((x: any) => ({
            ...makeParty(),
            nome: x.nome || "",
            cpf: x.cpf || "",
            rg: x.rg || "",
            email: x.email || "",
            whatsapp: x.whatsapp || "",
          }));
        const vendedores = toParty(p.vendedores);
        const compradores = toParty(p.compradores);
        const corretoresParsed = (p.corretores || []).filter((x: any) => x.nome || x.email).map((x: any) => ({
          ...makeBroker(),
          nome: x.nome || "",
          email: x.email || "",
          whatsapp: x.whatsapp || "",
        }));
        return {
          ...prev,
          vendedores: vendedores.length > 0 ? vendedores : [makeParty()],
          compradores: compradores.length > 0 ? compradores : [makeParty()],
          corretores: corretoresParsed.length > 0 ? corretoresParsed : [makeBroker()],
          imovelDescricao: p.imovelDescricao || prev.imovelDescricao,
          imovelEndereco: p.imovelEndereco || prev.imovelEndereco,
          imovelMatricula: p.imovelMatricula || prev.imovelMatricula,
          imovelCartorio: p.imovelCartorio || prev.imovelCartorio,
        };
      });
      toast.success("Dados do wizard carregados com sucesso!");
    } catch { /* ignore malformed data */ }
  }, []);

  // Fetch deal + clients for pre-fill
  const { data: dealData } = trpc.deals.byId.useQuery(
    { id: prefillDealId! },
    { enabled: prefillDealId !== null }
  );
  const { data: clientsList = [] } = trpc.clients.list.useQuery();
  const { data: propertiesList = [] } = trpc.properties.list.useQuery();

  // Helper to fill property fields from a property record
  const fillFromProperty = (prop: any) => {
    if (!prop) return;
    const addr = [
      prop.street, prop.number,
      prop.complement, prop.neighborhood,
      prop.city, prop.state, prop.zipCode,
    ].filter(Boolean).join(', ');
    setForm((prev) => ({
      ...prev,
      imovelDescricao: prop.description || prev.imovelDescricao,
      imovelEndereco: addr || prev.imovelEndereco,
      imovelMatricula: prop.registration || prev.imovelMatricula,
      imovelCartorio: prop.registryOffice || prev.imovelCartorio,
      imovelAreaTotal: prop.area || prev.imovelAreaTotal,
      imovelItens: prop.items || prev.imovelItens,
      valorTotal: prop.totalValue ? String(prop.totalValue) : prev.valorTotal,
    }));
  };

  // Pre-fill form when deal data loads
  useEffect(() => {
    if (!dealData) return;
    const deal = dealData as any;
    const clients = clientsList as any[];
    const buyer = clients.find((c: any) => c.id === deal.buyerId);
    const seller = clients.find((c: any) => c.id === deal.sellerId);
    const broker = clients.find((c: any) => c.id === deal.brokerId);

    const newVendedor = makeParty();
    if (seller) {
      Object.assign(newVendedor, {
        nome: seller.name || "", cpf: seller.cpfCnpj || "", rg: seller.rg || "",
        nacionalidade: seller.nationality || "brasileiro(a)",
        estadoCivil: seller.maritalStatus || "solteiro(a)",
        profissao: seller.profession || "", endereco: seller.address || "",
        whatsapp: seller.phone || "",
      });
    }

    const newComprador = makeParty();
    if (buyer) {
      Object.assign(newComprador, {
        nome: buyer.name || "", cpf: buyer.cpfCnpj || "", rg: buyer.rg || "",
        nacionalidade: buyer.nationality || "brasileiro(a)",
        estadoCivil: buyer.maritalStatus || "solteiro(a)",
        profissao: buyer.profession || "", endereco: buyer.address || "",
        whatsapp: buyer.phone || "",
      });
    }

    const newBroker = makeBroker();
    if (broker) {
      Object.assign(newBroker, { nome: broker.name || newBroker.nome, whatsapp: broker.phone || "" });
    }

    setForm((prev) => ({
      ...prev,
      contractType: deal.type === 'locacao' ? 'locacao' : deal.type === 'permuta' ? 'permuta' : deal.type === 'financiamento' ? 'financiamento' : 'compra_venda',
      vendedores: [newVendedor],
      compradores: [newComprador],
      corretores: [newBroker],
      valorTotal: deal.totalValue || deal.monthlyValue || prev.valorTotal,
    }));
  }, [dealData, clientsList]);

  const generateMutation = trpc.contracts.generate.useMutation();
  const generateHtmlMutation = trpc.contracts.generateHtml.useMutation();

  const setField = <K extends keyof ContractFormData>(name: K, value: ContractFormData[K]) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Multi-party helpers
  const updateVendedor = (index: number, updated: PartyData) => {
    setForm((prev) => {
      const arr = [...prev.vendedores];
      arr[index] = updated;
      return { ...prev, vendedores: arr };
    });
  };
  const addVendedor = () => setForm((prev) => ({ ...prev, vendedores: [...prev.vendedores, makeParty()] }));
  const removeVendedor = (index: number) => setForm((prev) => ({
    ...prev, vendedores: prev.vendedores.filter((_, i) => i !== index),
  }));

  const updateComprador = (index: number, updated: PartyData) => {
    setForm((prev) => {
      const arr = [...prev.compradores];
      arr[index] = updated;
      return { ...prev, compradores: arr };
    });
  };
  const addComprador = () => setForm((prev) => ({ ...prev, compradores: [...prev.compradores, makeParty()] }));
  const removeComprador = (index: number) => setForm((prev) => ({
    ...prev, compradores: prev.compradores.filter((_, i) => i !== index),
  }));

  const updateCorretor = (index: number, updated: BrokerData) => {
    setForm((prev) => {
      const arr = [...prev.corretores];
      arr[index] = updated;
      return { ...prev, corretores: arr };
    });
  };
  const addCorretor = () => setForm((prev) => ({ ...prev, corretores: [...prev.corretores, makeBroker()] }));
  const removeCorretor = (index: number) => setForm((prev) => ({
    ...prev, corretores: prev.corretores.filter((_, i) => i !== index),
  }));

  const buildFields = (): Record<string, string> => {
    // Primary vendor/buyer (first in list) for legacy DOCX template compatibility
    const v0 = form.vendedores[0] || makeParty();
    const c0 = form.compradores[0] || makeParty();
    const b0 = form.corretores[0] || makeBroker();

    // Build multi-party strings for additional parties
    const extraVendedores = form.vendedores.slice(1).map((v, i) =>
      `${v.nome}, ${v.nacionalidade}, ${v.estadoCivil}${v.profissao ? `, ${v.profissao}` : ""}, CPF ${v.cpf}, RG ${v.rg}, residente em ${v.endereco}`
    ).join("; ");

    const extraCompradores = form.compradores.slice(1).map((c, i) =>
      `${c.nome}, ${c.nacionalidade}, ${c.estadoCivil}${c.profissao ? `, ${c.profissao}` : ""}, CPF ${c.cpf}, RG ${c.rg}, residente em ${c.endereco}`
    ).join("; ");

    return {
      nome_vendedor: v0.nome,
      nacionalidade_vendedor: v0.nacionalidade,
      estado_civil_vendedor: v0.estadoCivil,
      profissao_vendedor: v0.profissao,
      tipo_documento_vendedor: 'RG',
      numero_documento_vendedor: v0.rg,
      cpf_cnpj_vendedor: v0.cpf,
      endereco_vendedor: v0.endereco,
      vendedores_adicionais: extraVendedores || 'N/A',
      nome_comprador: c0.nome,
      nacionalidade_comprador: c0.nacionalidade,
      estado_civil_comprador: c0.estadoCivil,
      profissao_comprador: c0.profissao,
      tipo_documento_comprador: 'RG',
      numero_documento_comprador: c0.rg,
      cpf_cnpj_comprador: c0.cpf,
      endereco_comprador: c0.endereco,
      compradores_adicionais: extraCompradores || 'N/A',
      descricao_imovel: form.imovelDescricao,
      endereco_imovel: form.imovelEndereco,
      matricula_imovel: form.imovelMatricula,
      cartorio_registro_imoveis: form.imovelCartorio,
      itens_que_permanecerao_no_imovel: form.imovelItens || 'conforme vistoria',
      valor_total_contrato: `R$ ${form.valorTotal}`,
      modalidade_pagamento: form.formaPagamento,
      valor_pagamento_avista: form.valorSinal ? `R$ ${form.valorSinal}` : 'N/A',
      forma_pagamento_avista: form.formaPagamento,
      data_pagamento_avista: form.dataVencimento || 'na assinatura',
      valor_financiamento: form.valorFinanciamento ? `R$ ${form.valorFinanciamento}` : 'N/A',
      instituicao_financeira: 'a definir',
      descricao_imovel_permuta: form.descricaoImovelPermuta || 'N/A',
      valor_imovel_permuta: form.valorImovelPermuta ? `R$ ${form.valorImovelPermuta}` : 'N/A',
      ajuste_financeiro_permuta: form.ajusteFinanceiroPermuta || 'N/A',
      prazo_entrega_posse: form.prazoEntregaPosse,
      condicao_entrega_posse: form.condicaoEntregaPosse,
      prazo_escritura: form.prazoEscritura,
      responsavel_despesas: form.responsavelDespesas,
      quantidade_exercicios_iptu: form.quantidadeExerciciosIptu,
      prazo_certidao_objeto_pe: form.prazoCertidaoObjetoPe,
      prazo_restituicao_valores: form.prazoRestituicaoValores,
      percentual_comissao: '6%',
      valor_comissao: 'conforme contrato de intermediação',
      percentual_multa: `${form.percentualMulta}%`,
      condicoes_distrato: form.condicoesDistrato,
      plataforma_assinatura: form.plataformaAssinatura,
      razao_social_imobiliaria: form.imobiliariaNome,
      cnpj_imobiliaria: form.imobiliariaCnpj,
      creci_imobiliaria: b0.creci,
      endereco_imobiliaria: form.imobiliariaEndereco,
      foro_eleito: form.foro,
      cidade_assinatura: form.localAssinatura,
      data_assinatura: form.dataAssinatura,
      nome_testemunha_1: form.testemunha1Nome,
      cpf_testemunha_1: form.testemunha1Cpf,
      nome_testemunha_2: form.testemunha2Nome,
      cpf_testemunha_2: form.testemunha2Cpf,
      // Locação-specific
      prazo_locacao: form.prazoLocacao || 'N/A',
      dia_vencimento_aluguel: form.diaVencimentoAluguel || 'N/A',
      tipo_garantia: form.tipoGarantia || 'N/A',
      valor_garantia: form.valorGarantia ? `R$ ${form.valorGarantia}` : 'N/A',
      indice_reajuste: form.indiceReajuste || 'IGPM',
      multa_rescisao_antecipada: form.multaRescisaoAntecipada || 'N/A',
      destinacao_imovel: form.destinacaoImovel || 'residencial',
      tipo_contrato: form.contractType === 'locacao' ? 'LOCAÇÃO' : form.contractType === 'permuta' ? 'PERMUTA' : form.contractType === 'financiamento' ? 'FINANCIAMENTO' : 'COMPRA E VENDA',
      // Broker
      nome_corretor: b0.nome,
      corretores: form.corretores.map(b => `${b.nome} (CRECI ${b.creci})`).join(", "),
    };
  };

  const handleGenerate = async () => {
    const v0 = form.vendedores[0];
    const c0 = form.compradores[0];
    if (!v0?.nome || !c0?.nome || !form.imovelEndereco || !form.valorTotal) {
      toast.error("Preencha os campos obrigatórios: vendedor, comprador, imóvel e valor");
      return;
    }

    setIsGenerating(true);
    const fields = buildFields();
    try {
      const result = await generateMutation.mutateAsync({ fields });
      setGeneratedPdfUrl(result.contractUrl);
      toast.success("Contrato gerado com sucesso!");
      // Auto-open distribution modal after PDF is ready
      setShowWhatsApp(true);
    } catch (error: any) {
      const errMsg = (error?.message || "").toLowerCase();
      const isPdfEngineError = errMsg.includes("chromium") || errMsg.includes("weasyprint") ||
        errMsg.includes("browser") || errMsg.includes("failed to launch") ||
        errMsg.includes("libnss") || errMsg.includes("shared object") ||
        errMsg.includes("internal server error");
      if (isPdfEngineError) {
        toast.info("Gerando contrato para impressão...");
        try {
          const htmlResult = await generateHtmlMutation.mutateAsync({ fields });
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(htmlResult.html);
            printWindow.document.close();
          } else {
            toast.error("Popup bloqueado. Permita popups para este site e tente novamente.");
          }
        } catch (_htmlErr) {
          toast.warning("Abrindo contrato sem papel timbrado (fallback)...");
          const previewEl = document.getElementById('contract-preview-content');
          if (previewEl) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
              printWindow.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Contrato</title><style>body{font-family:Georgia,serif;font-size:11pt;line-height:1.6;margin:2.5cm;color:#111}h2{text-align:center;font-size:14pt;text-transform:uppercase;letter-spacing:1px}strong{font-weight:700}p{margin-bottom:0.8em;text-align:justify}.pl-4{padding-left:1em}@media print{body{margin:2cm}}</style></head><body>${previewEl.innerHTML}</body></html>`);
              printWindow.document.close();
              printWindow.focus();
              setTimeout(() => { printWindow.print(); }, 500);
            }
          } else {
            window.print();
          }
        }
      } else {
        toast.error(error.message || "Erro ao gerar contrato");
      }
    } finally {
      setIsGenerating(false);
    }
  };

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

  const isLocacao = form.contractType === "locacao";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold">Efcon</span>
          <span className="text-white/30 mx-2">/</span>
          <span className="text-white/60 text-sm">Gerar Contrato</span>
        </div>
        <Button
          variant="ghost"
          className="text-white/60 hover:text-white gap-2"
          onClick={() => navigate("/dashboard/contratos")}
        >
          <ArrowLeft className="w-4 h-4" /> Voltar a Contratos
        </Button>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Gerar Contrato</h1>
            <p className="text-gray-500 text-sm mt-1">Preencha os dados para gerar o contrato padrão</p>
            {prefillDealId && dealData && (
              <div className="mt-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                Dados pré-preenchidos a partir do negócio <strong>{(dealData as any).code}</strong>. Revise e complete os campos antes de gerar.
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-4 h-4" /> {showPreview ? "Ocultar" : "Pré-visualizar"}
            </Button>
          </div>
        </div>

        <div className={`grid gap-6 ${showPreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 max-w-3xl"}`}>
          {/* Form */}
          <div>
            {/* Contract type */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                Tipo de Contrato
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {CONTRACT_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setField("contractType", opt.value as ContractType)}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      form.contractType === opt.value
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vendedores / Locadores */}
            <Section
              title={isLocacao ? "Locadores" : "Vendedores"}
              icon={User}
              badge={`${form.vendedores.length} parte${form.vendedores.length > 1 ? "s" : ""}`}
            >
              {form.vendedores.map((v, i) => (
                <PartyCard
                  key={v.id}
                  party={v}
                  index={i}
                  label={isLocacao ? "Locador(a)" : "Vendedor(a)"}
                  clients={clientsList as any[]}
                  onUpdate={(updated) => updateVendedor(i, updated)}
                  onRemove={() => removeVendedor(i)}
                  canRemove={form.vendedores.length > 1}
                />
              ))}
              <button
                onClick={addVendedor}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors text-sm font-semibold mt-1"
              >
                <Plus className="w-4 h-4" />
                Adicionar {isLocacao ? "locador(a)" : "vendedor(a)"}
              </button>
            </Section>

            {/* Compradores / Locatários */}
            <Section
              title={isLocacao ? "Locatários" : "Compradores"}
              icon={User}
              badge={`${form.compradores.length} parte${form.compradores.length > 1 ? "s" : ""}`}
            >
              {form.compradores.map((c, i) => (
                <PartyCard
                  key={c.id}
                  party={c}
                  index={i}
                  label={isLocacao ? "Locatário(a)" : "Comprador(a)"}
                  clients={clientsList as any[]}
                  onUpdate={(updated) => updateComprador(i, updated)}
                  onRemove={() => removeComprador(i)}
                  canRemove={form.compradores.length > 1}
                />
              ))}
              <button
                onClick={addComprador}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors text-sm font-semibold mt-1"
              >
                <Plus className="w-4 h-4" />
                Adicionar {isLocacao ? "locatário(a)" : "comprador(a)"}
              </button>
            </Section>

            {/* Imóvel */}
            <Section title="Dados do Imóvel" icon={Home}>
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Selecionar imóvel cadastrado</label>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const p = (propertiesList as any[]).find((x: any) => String(x.id) === e.target.value);
                    if (p) fillFromProperty(p);
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                >
                  <option value="">— Buscar imóvel cadastrado —</option>
                  {(propertiesList as any[]).map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.propertyType ? `${p.propertyType} – ` : ''}{p.street}{p.number ? `, ${p.number}` : ''}{p.city ? ` – ${p.city}/${p.state}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Descrição do imóvel" value={form.imovelDescricao} onChange={(v) => setField("imovelDescricao", v)} required placeholder="Ex: Apartamento, 3 quartos, 2 banheiros" className="md:col-span-2" />
                <Field label="Endereço do imóvel" value={form.imovelEndereco} onChange={(v) => setField("imovelEndereco", v)} required placeholder="Endereço completo do imóvel" className="md:col-span-2" />
                <Field label="Matrícula" value={form.imovelMatricula} onChange={(v) => setField("imovelMatricula", v)} placeholder="Nº da matrícula" />
                <Field label="Cartório de Registro" value={form.imovelCartorio} onChange={(v) => setField("imovelCartorio", v)} placeholder="Nome do cartório" />
                <Field label="Área total (m²)" value={form.imovelAreaTotal} onChange={(v) => setField("imovelAreaTotal", v)} placeholder="Ex: 98,50" />
                <Field label="Itens que permanecem no imóvel" value={form.imovelItens} onChange={(v) => setField("imovelItens", v)} placeholder="Ex: Armários embutidos, ar-condicionado..." className="md:col-span-2" />
              </div>
            </Section>

            {/* Financeiro */}
            <Section title="Dados Financeiros" icon={DollarSign}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label={isLocacao ? "Valor do aluguel mensal (R$)" : "Valor total (R$)"} value={form.valorTotal} onChange={(v) => setField("valorTotal", v)} required placeholder={isLocacao ? "Ex: 2500" : "Ex: 485000"} />
                {!isLocacao && (
                  <Field label="Valor do sinal (R$)" value={form.valorSinal} onChange={(v) => setField("valorSinal", v)} placeholder="Ex: 50000" />
                )}
                {(form.contractType === "compra_venda" || form.contractType === "financiamento") && (
                  <Field label="Valor financiado (R$)" value={form.valorFinanciamento} onChange={(v) => setField("valorFinanciamento", v)} placeholder="Ex: 350000" />
                )}
                {!isLocacao && (
                  <Field label="Forma de pagamento" value={form.formaPagamento} onChange={(v) => setField("formaPagamento", v)}
                    options={[
                      { value: "À vista", label: "À vista" },
                      { value: "Financiamento bancário", label: "Financiamento bancário" },
                      { value: "Parcelado", label: "Parcelado" },
                      { value: "Permuta", label: "Permuta" },
                    ]}
                  />
                )}
                {!isLocacao && (
                  <Field label="Data de vencimento" value={form.dataVencimento} onChange={(v) => setField("dataVencimento", v)} type="date" />
                )}
              </div>
            </Section>

            {/* Locação-specific */}
            {isLocacao && (
              <Section title="Condições de Locação" icon={Scale} defaultOpen={true}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Prazo de locação" value={form.prazoLocacao} onChange={(v) => setField("prazoLocacao", v)} placeholder="Ex: 30 meses" required />
                  <Field label="Dia de vencimento do aluguel" value={form.diaVencimentoAluguel} onChange={(v) => setField("diaVencimentoAluguel", v)} placeholder="Ex: 10" />
                  <Field label="Destinação do imóvel" value={form.destinacaoImovel} onChange={(v) => setField("destinacaoImovel", v)}
                    options={[
                      { value: "residencial", label: "Residencial" },
                      { value: "comercial", label: "Comercial" },
                      { value: "misto", label: "Misto" },
                    ]}
                  />
                  <Field label="Índice de reajuste" value={form.indiceReajuste} onChange={(v) => setField("indiceReajuste", v)}
                    options={[
                      { value: "IGPM", label: "IGP-M" },
                      { value: "IPCA", label: "IPCA" },
                      { value: "INPC", label: "INPC" },
                      { value: "IPC", label: "IPC" },
                    ]}
                  />
                  <Field label="Tipo de garantia" value={form.tipoGarantia} onChange={(v) => setField("tipoGarantia", v)}
                    options={[
                      { value: "caução", label: "Caução (depósito)" },
                      { value: "fiador", label: "Fiador" },
                      { value: "seguro-fiança", label: "Seguro-fiança" },
                      { value: "título de capitalização", label: "Título de capitalização" },
                      { value: "sem garantia", label: "Sem garantia" },
                    ]}
                  />
                  {(form.tipoGarantia === "caução" || form.tipoGarantia === "título de capitalização") && (
                    <Field label="Valor da garantia (R$)" value={form.valorGarantia} onChange={(v) => setField("valorGarantia", v)} placeholder="Ex: 7500 (3x aluguel)" />
                  )}
                  <Field label="Multa por rescisão antecipada" value={form.multaRescisaoAntecipada} onChange={(v) => setField("multaRescisaoAntecipada", v)} placeholder="Ex: 3 alugueis proporcionais" />
                  <Field label="Percentual de multa (%)" value={form.percentualMulta} onChange={(v) => setField("percentualMulta", v)} placeholder="Ex: 10" />
                  <Field label="Foro eleito" value={form.foro} onChange={(v) => setField("foro", v)} placeholder="Ex: Brasília, Distrito Federal" className="md:col-span-2" />
                </div>
              </Section>
            )}

            {/* Testemunhas */}
            <Section title="Testemunhas" icon={Users} defaultOpen={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Testemunha 1 – Nome" value={form.testemunha1Nome} onChange={(v) => setField("testemunha1Nome", v)} placeholder="Nome completo" />
                <Field label="Testemunha 1 – CPF" value={form.testemunha1Cpf} onChange={(v) => setField("testemunha1Cpf", v)} placeholder="000.000.000-00" />
                <Field label="Testemunha 2 – Nome" value={form.testemunha2Nome} onChange={(v) => setField("testemunha2Nome", v)} placeholder="Nome completo" />
                <Field label="Testemunha 2 – CPF" value={form.testemunha2Cpf} onChange={(v) => setField("testemunha2Cpf", v)} placeholder="000.000.000-00" />
              </div>
            </Section>

            {/* Corretores */}
            <Section
              title="Corretores & Assinatura"
              icon={FileText}
              defaultOpen={false}
              badge={`${form.corretores.length} corretor${form.corretores.length > 1 ? "es" : ""}`}
            >
              {form.corretores.map((b, i) => (
                <BrokerCard
                  key={b.id}
                  broker={b}
                  index={i}
                  clients={clientsList as any[]}
                  onUpdate={(updated) => updateCorretor(i, updated)}
                  onRemove={() => removeCorretor(i)}
                  canRemove={form.corretores.length > 1}
                />
              ))}
              <button
                onClick={addCorretor}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors text-sm font-semibold mt-1 mb-3"
              >
                <Plus className="w-4 h-4" />
                Adicionar corretor
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Local de assinatura" value={form.localAssinatura} onChange={(v) => setField("localAssinatura", v)} />
                <Field label="Data de assinatura" value={form.dataAssinatura} onChange={(v) => setField("dataAssinatura", v)} />
                <Field label="Plataforma de assinatura" value={form.plataformaAssinatura} onChange={(v) => setField("plataformaAssinatura", v)}
                  options={[
                    { value: "Clicksign", label: "Clicksign" },
                    { value: "DocuSign", label: "DocuSign" },
                    { value: "Assinatura física", label: "Assinatura física" },
                  ]}
                />
              </div>
            </Section>

            {/* Imobiliária */}
            <Section title="Imobiliária" icon={Building2} defaultOpen={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Razão social" value={form.imobiliariaNome} onChange={(v) => setField("imobiliariaNome", v)} />
                <Field label="CNPJ" value={form.imobiliariaCnpj} onChange={(v) => setField("imobiliariaCnpj", v)} placeholder="00.000.000/0001-00" />
                <Field label="Endereço da imobiliária" value={form.imobiliariaEndereco} onChange={(v) => setField("imobiliariaEndereco", v)} className="md:col-span-2" />
              </div>
            </Section>

            {/* Cláusulas */}
            {!isLocacao && (
              <Section title="Cláusulas Contratuais" icon={Scale} defaultOpen={false}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Prazo de entrega da posse" value={form.prazoEntregaPosse} onChange={(v) => setField("prazoEntregaPosse", v)} placeholder="Ex: 30 dias após assinatura" />
                  <Field label="Condição de entrega" value={form.condicaoEntregaPosse} onChange={(v) => setField("condicaoEntregaPosse", v)} placeholder="Ex: livre e desembaraçado" />
                  <Field label="Prazo para escritura" value={form.prazoEscritura} onChange={(v) => setField("prazoEscritura", v)} placeholder="Ex: 60 dias após quitação" />
                  <Field label="Prazo de restituição (distrato)" value={form.prazoRestituicaoValores} onChange={(v) => setField("prazoRestituicaoValores", v)} placeholder="Ex: 30 dias" />
                  <Field label="Prazo certidão objeto e pé" value={form.prazoCertidaoObjetoPe} onChange={(v) => setField("prazoCertidaoObjetoPe", v)} placeholder="Ex: 30 dias" />
                  <Field label="Qtd. exercícios IPTU" value={form.quantidadeExerciciosIptu} onChange={(v) => setField("quantidadeExerciciosIptu", v)} placeholder="Ex: 1" />
                  <Field label="Responsável pelas despesas" value={form.responsavelDespesas} onChange={(v) => setField("responsavelDespesas", v)}
                    options={[
                      { value: "comprador", label: "Comprador" },
                      { value: "vendedor", label: "Vendedor" },
                      { value: "ambos", label: "Ambos" },
                    ]}
                  />
                  <Field label="Percentual de multa (%)" value={form.percentualMulta} onChange={(v) => setField("percentualMulta", v)} placeholder="Ex: 10" />
                  <Field label="Condições de distrato" value={form.condicoesDistrato} onChange={(v) => setField("condicoesDistrato", v)} className="md:col-span-2" />
                  <Field label="Foro eleito" value={form.foro} onChange={(v) => setField("foro", v)} placeholder="Ex: Brasília, Distrito Federal" className="md:col-span-2" />
                </div>
              </Section>
            )}

            {/* Permuta */}
            {form.contractType === "permuta" && (
              <Section title="Dados da Permuta" icon={Repeat2} defaultOpen={true}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Descrição do imóvel permutado" value={form.descricaoImovelPermuta} onChange={(v) => setField("descricaoImovelPermuta", v)} className="md:col-span-2" />
                  <Field label="Valor do imóvel permutado (R$)" value={form.valorImovelPermuta} onChange={(v) => setField("valorImovelPermuta", v)} placeholder="Ex: 300000" />
                  <Field label="Ajuste financeiro" value={form.ajusteFinanceiroPermuta} onChange={(v) => setField("ajusteFinanceiroPermuta", v)} placeholder="Ex: R$ 50.000 a pagar" />
                </div>
              </Section>
            )}

            {/* Generate button */}
            <div className="flex items-center gap-4 mt-6 flex-wrap">
            {generatedPdfUrl ? (
              <>
                <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                  <CheckCircle2 className="w-5 h-5" /> Contrato gerado com sucesso!
                </div>
                <a href={generatedPdfUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                    <Download className="w-4 h-4" /> Baixar PDF
                  </Button>
                </a>
                <Button
                  onClick={() => setShowWhatsApp(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> Distribuir para as Partes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setGeneratedPdfUrl(null); setShowWhatsApp(false); }}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Novo contrato
                </Button>
              </>
            ) : (
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-8"
                  size="lg"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Gerando PDF...</>
                  ) : (
                    <><FileOutput className="w-4 h-4" /> Gerar Contrato PDF</>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="sticky top-6 self-start">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-gray-900 text-sm">Pré-visualização</span>
                <Badge className="bg-blue-50 text-blue-600 text-xs ml-auto">Atualiza em tempo real</Badge>
              </div>
              <ContractPreview form={form} />
            </div>
          )}
        </div>
      </div>

      {/* Distribuição Modal (WhatsApp + E-mail) */}
      {showWhatsApp && generatedPdfUrl && (
        <DistribuicaoModal
          form={form}
          contractUrl={generatedPdfUrl}
          onClose={() => setShowWhatsApp(false)}
        />
      )}
    </div>
  );
}
