import { useState, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { DocPreviewModal } from "@/components/DocPreviewModal";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  FileText, Plus, Search, Filter, Eye, MoreVertical,
  Clock, CheckCircle2, MessageCircle, Zap, Home,
  BarChart3, Settings, Bell, LogOut,
  Users, Briefcase, Download, Trash2, ChevronRight,
  Building2, Mail, Send, Upload, Loader2, X, UserCheck, ScanLine,
} from "lucide-react";

interface Contract {
  id?: number;
  code?: string;
  contractStatus?: string;
  nomeVendedor?: string | null;
  nomeComprador?: string | null;
  nomeCorretor?: string | null;
  descricaoImovel?: string | null;
  valorTotalContrato?: string | null;
  pdfUrl?: string | null;
  createdAt?: Date | string | null;
  progressPct?: number | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  rascunho: { label: "Coletando Dados", color: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30", dot: "bg-yellow-400" },
  gerado: { label: "Gerado", color: "bg-blue-500/20 text-blue-400 border border-blue-500/30", dot: "bg-blue-400" },
  enviado: { label: "Em Assinatura", color: "bg-purple-500/20 text-purple-400 border border-purple-500/30", dot: "bg-purple-400" },
  assinado: { label: "Concluído", color: "bg-green-500/20 text-green-400 border border-green-500/30", dot: "bg-green-400" },
};

function DistribuicaoModal({ contract, onClose }: { contract: Contract; onClose: () => void }) {
  const [sent, setSent] = useState<Record<string, { wa?: boolean; email?: boolean }>>({});

  const parties = [
    { role: "Vendedor", name: contract.nomeVendedor },
    { role: "Comprador", name: contract.nomeComprador },
    { role: "Corretor", name: contract.nomeCorretor },
  ].filter((p) => p.name);

  const pdfLink = contract.pdfUrl || "";
  const hasPdf = !!pdfLink;

  const waMsg = (name: string, role: string) =>
    encodeURIComponent(
      `Olá ${name}! Segue o contrato imobiliário para sua análise e assinatura.\n\n` +
      `🏠 Imóvel: ${contract.descricaoImovel || "—"}\n` +
      `📄 Código: ${contract.code || "—"}\n` +
      `👤 Sua função: ${role}\n\n` +
      (hasPdf ? `🔗 PDF do contrato: ${pdfLink}\n\n` : "") +
      `Por favor, verifique os dados e confirme o recebimento.`
    );

  const emailSubject = encodeURIComponent(`Contrato Imobiliário — ${contract.code || "—"} — ${contract.descricaoImovel || "—"}`);
  const emailBody = (name: string, role: string) =>
    encodeURIComponent(
      `Olá ${name},\n\n` +
      `Segue o contrato imobiliário para sua análise e assinatura.\n\n` +
      `Imóvel: ${contract.descricaoImovel || "—"}\n` +
      `Código: ${contract.code || "—"}\n` +
      `Sua função: ${role}\n\n` +
      (hasPdf ? `PDF do contrato: ${pdfLink}\n\n` : "") +
      `Atenciosamente,\nMarcello & Oliveira Imóveis`
    );

  const markSent = (name: string, channel: "wa" | "email") =>
    setSent((prev) => ({ ...prev, [name]: { ...prev[name], [channel]: true } }));

  const sendAllWa = () => {
    parties.forEach((p) => {
      window.open(`https://wa.me/?text=${waMsg(p.name!, p.role)}`, "_blank");
      markSent(p.name!, "wa");
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2d3a]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Send className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Distribuir Contrato</div>
              <div className="text-gray-400 text-xs">{contract.code} — {contract.descricaoImovel || "—"}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-lg">✕</button>
        </div>

        {/* PDF status */}
        <div className={`mx-5 mt-4 px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
          hasPdf ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
        }`}>
          {hasPdf ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
          {hasPdf ? (
            <>✅ PDF gerado e pronto para envio. <a href={pdfLink} target="_blank" rel="noopener noreferrer" className="underline ml-1">Visualizar</a></>
          ) : (
            "PDF ainda não gerado. Gere o contrato antes de distribuir."
          )}
        </div>

        {/* Note about WhatsApp */}
        <div className="mx-5 mt-2 px-3 py-2 rounded-xl bg-[#25D366]/5 border border-[#25D366]/10 text-xs text-gray-400">
          <strong className="text-gray-300">Como funciona:</strong> O WhatsApp abre no seu dispositivo com a mensagem pré-preenchida — sem API paga. O e-mail abre seu cliente de e-mail padrão.
        </div>

        {/* Parties */}
        <div className="p-5 space-y-3">
          {parties.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Nenhum participante cadastrado neste contrato.</p>
          ) : (
            parties.map((p) => (
              <div key={p.role} className="flex items-center gap-3 p-3 bg-[#0f1117] border border-[#2a2d3a] rounded-xl">
                <div className="w-9 h-9 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400 text-sm font-bold flex-shrink-0">
                  {p.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-semibold truncate">{p.name}</div>
                  <div className="text-gray-500 text-xs">{p.role}</div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={hasPdf ? `https://wa.me/?text=${waMsg(p.name!, p.role)}` : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => hasPdf && markSent(p.name!, "wa")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      !hasPdf ? "opacity-40 cursor-not-allowed bg-[#25D366]/10 text-[#25D366]" :
                      sent[p.name!]?.wa ? "bg-green-600/20 text-green-400 border border-green-500/20" :
                      "bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 text-[#25D366]"
                    }`}
                  >
                    <MessageCircle className="w-3 h-3" />
                    {sent[p.name!]?.wa ? "✓ WA" : "WA"}
                  </a>
                  <a
                    href={hasPdf ? `mailto:?subject=${emailSubject}&body=${emailBody(p.name!, p.role)}` : undefined}
                    onClick={() => hasPdf && markSent(p.name!, "email")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      !hasPdf ? "opacity-40 cursor-not-allowed bg-blue-500/10 text-blue-400" :
                      sent[p.name!]?.email ? "bg-green-600/20 text-green-400 border border-green-500/20" :
                      "bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    <Mail className="w-3 h-3" />
                    {sent[p.name!]?.email ? "✓ Email" : "Email"}
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center gap-3">
          {hasPdf && parties.length > 1 && (
            <button
              onClick={sendAllWa}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 text-[#25D366] text-sm font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> Enviar Todos via WA
            </button>
          )}
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#2a2d3a] text-gray-400 hover:text-white hover:border-gray-500 text-sm transition-colors">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Participant data ─────────────────────────────────────────────────────────
interface ParticipantData {
  clientId?: number | null;
  nome: string;
  cpf: string;
  rg: string;
  email: string;
  whatsapp: string;
  estadoCivil: string;
  profissao: string;
  endereco: string;
}
const emptyParticipant = (): ParticipantData => ({
  clientId: null, nome: "", cpf: "", rg: "",
  email: "", whatsapp: "", estadoCivil: "", profissao: "", endereco: "",
});

// ─── Wizard step indicator ────────────────────────────────────────────────────
function WizardSteps({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Partes" },
    { n: 2, label: "Imóvel" },
    { n: 3, label: "Revisão" },
  ];
  return (
    <div className="flex items-center gap-0 mb-1">
      {steps.map((s, idx) => (
        <div key={s.n} className="flex items-center">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            step === s.n ? "bg-blue-600 text-white" :
            step > s.n ? "bg-green-600/20 text-green-400" :
            "bg-[#2a2d3a] text-gray-500"
          }`}>
            {step > s.n ? <CheckCircle2 className="w-3 h-3" /> : <span>{s.n}</span>}
            {s.label}
          </div>
          {idx < steps.length - 1 && <div className="w-4 h-px bg-[#2a2d3a] mx-1" />}
        </div>
      ))}
    </div>
  );
}

// ─── Reusable participant card ────────────────────────────────────────────────
function ParticipantCard({
  row, index, sectionKey, allClients, ocrLoading, fileInputRefs,
  onUpdate, onRemove, onOcrFile, showRemove,
}: {
  row: ParticipantData;
  index: number;
  sectionKey: string;
  allClients: any[];
  ocrLoading: Record<string, boolean>;
  fileInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  onUpdate: (updates: Partial<ParticipantData>) => void;
  onRemove: () => void;
  onOcrFile: (file: File, key: string) => void;
  showRemove: boolean;
}) {
  const key = `${sectionKey}-${index}`;
  const [search, setSearch] = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const isFromClient = !!row.clientId;

  const filtered = search.length > 0
    ? allClients.filter((c: any) => c.name?.toLowerCase().includes(search.toLowerCase()) || c.cpfCnpj?.includes(search)).slice(0, 8)
    : allClients.slice(0, 8);

  return (
    <div className="bg-[#0f1117] border border-[#2a2d3a] rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        {/* Client search */}
        <div className="flex-1 relative">
          <div className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-1.5 ${
            isFromClient ? "border-green-500/40 bg-green-500/5" : "border-[#2a2d3a] bg-[#1a1d27]"
          }`}>
            <UserCheck className={`w-3.5 h-3.5 flex-shrink-0 ${isFromClient ? "text-green-400" : "text-gray-500"}`} />
            <input
              type="text"
              placeholder="Buscar cliente cadastrado..."
              value={isFromClient ? row.nome : search}
              onChange={(e) => {
                if (isFromClient) { onUpdate(emptyParticipant()); }
                setSearch(e.target.value);
                setShowDrop(true);
              }}
              onFocus={() => setShowDrop(true)}
              onBlur={() => setTimeout(() => setShowDrop(false), 200)}
              className="flex-1 bg-transparent text-xs text-white placeholder-gray-600 focus:outline-none min-w-0"
            />
            {isFromClient && (
              <button type="button" onClick={() => { onUpdate(emptyParticipant()); setSearch(""); }} className="text-gray-500 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          {showDrop && !isFromClient && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl shadow-xl max-h-44 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-xs text-gray-500 px-3 py-2">Nenhum cliente encontrado</p>
              ) : filtered.map((c: any) => (
                <button key={c.id} type="button"
                  onMouseDown={() => {
                    onUpdate({
                      clientId: c.id,
                      nome: c.name || "",
                      cpf: c.cpfCnpj || "",
                      rg: c.rg || "",
                      email: c.email || "",
                      whatsapp: c.whatsapp || c.phone || "",
                      estadoCivil: c.maritalStatus || "",
                      profissao: c.profession || "",
                      endereco: c.address || "",
                    });
                    setSearch(c.name);
                    setShowDrop(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#2a2d3a] transition-colors">
                  <div className="text-white text-xs font-medium">{c.name}</div>
                  {c.cpfCnpj && <div className="text-gray-500 text-xs">CPF: {c.cpfCnpj}</div>}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* OCR upload */}
        <input type="file" accept="image/*,.pdf" className="hidden"
          ref={(el) => { fileInputRefs.current[key] = el; }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onOcrFile(f, key); e.target.value = ""; }}
        />
        <button type="button" title="Enviar RG/CPF/CNH para OCR"
          onClick={() => fileInputRefs.current[key]?.click()}
          disabled={ocrLoading[key]}
          className="flex-shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg border border-[#2a2d3a] bg-[#1a1d27] text-xs text-gray-400 hover:text-blue-400 hover:border-blue-500 transition-colors disabled:opacity-50">
          {ocrLoading[key] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScanLine className="w-3.5 h-3.5" />}
          <span>{ocrLoading[key] ? "OCR..." : "OCR"}</span>
        </button>
        {showRemove && (
          <button type="button" onClick={onRemove} className="flex-shrink-0 text-gray-600 hover:text-red-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input type="text" placeholder="Nome completo" value={row.nome}
          onChange={(e) => onUpdate({ nome: e.target.value })}
          className="col-span-2 bg-[#1a1d27] border border-[#2a2d3a] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
        <input type="text" placeholder="CPF" value={row.cpf}
          onChange={(e) => onUpdate({ cpf: e.target.value })}
          className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
        <input type="text" placeholder="RG" value={row.rg}
          onChange={(e) => onUpdate({ rg: e.target.value })}
          className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
        <input type="email" placeholder="E-mail" value={row.email}
          onChange={(e) => onUpdate({ email: e.target.value })}
          className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
        <input type="tel" placeholder="WhatsApp" value={row.whatsapp}
          onChange={(e) => onUpdate({ whatsapp: e.target.value })}
          className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
        <input type="text" placeholder="Estado civil" value={row.estadoCivil}
          onChange={(e) => onUpdate({ estadoCivil: e.target.value })}
          className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
        <input type="text" placeholder="Profissão" value={row.profissao}
          onChange={(e) => onUpdate({ profissao: e.target.value })}
          className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
        <input type="text" placeholder="Endereço" value={row.endereco}
          onChange={(e) => onUpdate({ endereco: e.target.value })}
          className="col-span-2 bg-[#1a1d27] border border-[#2a2d3a] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
      </div>
      {isFromClient && (
        <div className="flex items-center gap-1 text-xs text-green-400">
          <CheckCircle2 className="w-3 h-3" /> Preenchido do cadastro
        </div>
      )}
    </div>
  );
}

const DRAFT_KEY = "efcon_wizard_draft";

// ─── Main wizard modal ────────────────────────────────────────────────────────
function NewContractModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [stepError, setStepError] = useState("");
  const [hasDraft, setHasDraft] = useState(() => !!localStorage.getItem(DRAFT_KEY));

  // Step 1 — Parties
  const [vendedores, setVendedores] = useState<ParticipantData[]>([emptyParticipant()]);
  const [compradores, setCompradores] = useState<ParticipantData[]>([emptyParticipant()]);
  const [corretores, setCorretores] = useState<ParticipantData[]>([emptyParticipant()]);

  // Step 2 — Property
  const [propertyMode, setPropertyMode] = useState<"select" | "manual">("select");
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [imovelDesc, setImovelDesc] = useState("");
  const [imovelEndereco, setImovelEndereco] = useState("");
  const [imovelBairro, setImovelBairro] = useState("");
  const [imovelCidade, setImovelCidade] = useState("");
  const [imovelEstado, setImovelEstado] = useState("");
  const [imovelCep, setImovelCep] = useState("");
  const [imovelTipo, setImovelTipo] = useState("");
  const [imovelSituacao, setImovelSituacao] = useState("");
  const [imovelAreaTotal, setImovelAreaTotal] = useState("");
  const [imovelAreaPrivativa, setImovelAreaPrivativa] = useState("");
  const [imovelAreaComum, setImovelAreaComum] = useState("");
  const [imovelValorVenal, setImovelValorVenal] = useState("");
  const [imovelProprietario, setImovelProprietario] = useState("");
  const [imovelCnpjCpf, setImovelCnpjCpf] = useState("");
  const [imovelDataRegistro, setImovelDataRegistro] = useState("");
  const [imovelNumeroRegistro, setImovelNumeroRegistro] = useState("");
  const [matriculaText, setMatriculaText] = useState("");
  const [cartorioText, setCartorioText] = useState("");
  const [matriculaFile, setMatriculaFile] = useState<{ name: string; url?: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<{ url: string; name: string } | null>(null);
  const [matriculaLoading, setMatriculaLoading] = useState(false);
  const matriculaInputRef = useRef<HTMLInputElement | null>(null);

  // OCR state
  const [ocrLoading, setOcrLoading] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ── Draft helpers ──
  const saveDraft = useCallback(() => {
    const draft = {
      step, vendedores, compradores, corretores,
      propertyMode, selectedPropertyId,
      imovelDesc, imovelEndereco, imovelBairro, imovelCidade,
      imovelEstado, imovelCep, imovelTipo, imovelSituacao,
      imovelAreaTotal, imovelAreaPrivativa, imovelAreaComum,
      imovelValorVenal, imovelProprietario, imovelCnpjCpf,
      imovelDataRegistro, imovelNumeroRegistro,
      matriculaText, cartorioText,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setHasDraft(true);
  }, [step, vendedores, compradores, corretores, propertyMode, selectedPropertyId,
    imovelDesc, imovelEndereco, imovelBairro, imovelCidade, imovelEstado, imovelCep,
    imovelTipo, imovelSituacao, imovelAreaTotal, imovelAreaPrivativa, imovelAreaComum,
    imovelValorVenal, imovelProprietario, imovelCnpjCpf, imovelDataRegistro, imovelNumeroRegistro,
    matriculaText, cartorioText]);

  const loadDraft = useCallback(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      if (d.vendedores) setVendedores(d.vendedores);
      if (d.compradores) setCompradores(d.compradores);
      if (d.corretores) setCorretores(d.corretores);
      if (d.propertyMode) setPropertyMode(d.propertyMode);
      if (d.selectedPropertyId) setSelectedPropertyId(d.selectedPropertyId);
      if (d.imovelDesc) setImovelDesc(d.imovelDesc);
      if (d.imovelEndereco) setImovelEndereco(d.imovelEndereco);
      if (d.imovelBairro) setImovelBairro(d.imovelBairro);
      if (d.imovelCidade) setImovelCidade(d.imovelCidade);
      if (d.imovelEstado) setImovelEstado(d.imovelEstado);
      if (d.imovelCep) setImovelCep(d.imovelCep);
      if (d.imovelTipo) setImovelTipo(d.imovelTipo);
      if (d.imovelSituacao) setImovelSituacao(d.imovelSituacao);
      if (d.imovelAreaTotal) setImovelAreaTotal(d.imovelAreaTotal);
      if (d.imovelAreaPrivativa) setImovelAreaPrivativa(d.imovelAreaPrivativa);
      if (d.imovelAreaComum) setImovelAreaComum(d.imovelAreaComum);
      if (d.imovelValorVenal) setImovelValorVenal(d.imovelValorVenal);
      if (d.imovelProprietario) setImovelProprietario(d.imovelProprietario);
      if (d.imovelCnpjCpf) setImovelCnpjCpf(d.imovelCnpjCpf);
      if (d.imovelDataRegistro) setImovelDataRegistro(d.imovelDataRegistro);
      if (d.imovelNumeroRegistro) setImovelNumeroRegistro(d.imovelNumeroRegistro);
      if (d.matriculaText) setMatriculaText(d.matriculaText);
      if (d.cartorioText) setCartorioText(d.cartorioText);
      if (d.step) setStep(d.step);
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);
    } catch { /* ignore */ }
  }, []);

  const discardDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  }, []);

  // ── Step validation ──
  const validateStep = useCallback((s: 1 | 2 | 3): string => {
    if (s === 1) {
      const hasVendedor = vendedores.some((v) => v.nome.trim());
      const hasComprador = compradores.some((v) => v.nome.trim());
      if (!hasVendedor) return "Informe ao menos um vendedor com nome.";
      if (!hasComprador) return "Informe ao menos um comprador com nome.";
    }
    if (s === 2) {
      const hasImovel = imovelDesc.trim() || selectedPropertyId;
      if (!hasImovel) return "Identifique o imóvel (selecione ou descreva).";
    }
    return "";
  }, [vendedores, compradores, imovelDesc, selectedPropertyId]);

  const goNext = useCallback(() => {
    const err = validateStep(step);
    if (err) { setStepError(err); return; }
    setStepError("");
    setStep((s) => (s + 1) as 1 | 2 | 3);
  }, [step, validateStep]);

  const { data: properties = [] } = trpc.properties.list.useQuery();
  const { data: allClients = [] } = trpc.clients.list.useQuery();
  const ocrInlineMutation = trpc.documents.ocrInline.useMutation();
  const utils = trpc.useUtils();
  const createMutation = trpc.contracts.create.useMutation({
    onSuccess: () => { utils.contracts.list.invalidate(); onCreated(); },
  });

  const updateParticipant = (
    setter: React.Dispatch<React.SetStateAction<ParticipantData[]>>,
    index: number,
    updates: Partial<ParticipantData>
  ) => setter((prev) => prev.map((r, i) => (i === index ? { ...r, ...updates } : r)));

  const handleParticipantOcr = useCallback(async (file: File, key: string) => {
    // Determine which setter to use from key prefix
    const setter = key.startsWith("vend") ? setVendedores : key.startsWith("comp") ? setCompradores : setCorretores;
    const index = parseInt(key.split("-")[1]) || 0;
    setOcrLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await ocrInlineMutation.mutateAsync({ fileBase64, mimeType: file.type, fileName: file.name, docType: "rg" });
      const f = res?.fields as Record<string, string> | undefined;
      if (f) {
        const updates: Partial<ParticipantData> = {};
        if (f.nome) updates.nome = f.nome;
        if (f.cpf) updates.cpf = f.cpf;
        if (f.rg) updates.rg = f.rg;
        if (f.estado_civil) updates.estadoCivil = f.estado_civil;
        if (f.profissao) updates.profissao = f.profissao;
        if (f.endereco) updates.endereco = f.endereco;
        updateParticipant(setter, index, updates);
      }
    } catch { /* ignore */ } finally { setOcrLoading((prev) => ({ ...prev, [key]: false })); }
  }, [ocrInlineMutation]);

  const handleMatriculaUpload = useCallback(async (file: File) => {
    setMatriculaLoading(true);
    try {
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await ocrInlineMutation.mutateAsync({ fileBase64, mimeType: file.type, fileName: file.name, docType: "matricula" });
      const fields = res?.fields as Record<string, string> | undefined;
      if (fields) {
        if (fields.matricula) setMatriculaText(fields.matricula);
        if (fields.cartorio) setCartorioText(fields.cartorio);
        if (fields.descricao_imovel) setImovelDesc(fields.descricao_imovel);
        if (fields.endereco_imovel) setImovelEndereco(fields.endereco_imovel);
        if (fields.bairro) setImovelBairro(fields.bairro);
        if (fields.cidade_imovel) setImovelCidade(fields.cidade_imovel);
        if (fields.estado_imovel) setImovelEstado(fields.estado_imovel);
        if (fields.cep_imovel) setImovelCep(fields.cep_imovel);
        if (fields.tipo_imovel) setImovelTipo(fields.tipo_imovel);
        if (fields.situacao_imovel) setImovelSituacao(fields.situacao_imovel);
        if (fields.area_total) setImovelAreaTotal(fields.area_total);
        if (fields.area_privativa) setImovelAreaPrivativa(fields.area_privativa);
        if (fields.area_comum) setImovelAreaComum(fields.area_comum);
        if (fields.valor) setImovelValorVenal(fields.valor);
        if (fields.proprietario_atual) setImovelProprietario(fields.proprietario_atual);
        if (fields.cnpj_cpf_proprietario) setImovelCnpjCpf(fields.cnpj_cpf_proprietario);
        if (fields.data_ultimo_registro) setImovelDataRegistro(fields.data_ultimo_registro);
        if (fields.numero_registro) setImovelNumeroRegistro(fields.numero_registro);
      }
      const fileUrl = (res as any)?.fileUrl as string | undefined;
      setMatriculaFile({ name: file.name, ...(fileUrl ? { url: fileUrl } : {}) } as any);
    } catch { /* ignore */ } finally { setMatriculaLoading(false); }
  }, [ocrInlineMutation, imovelDesc]);

  // When a registered property is selected, fill address fields
  const handleSelectProperty = (propId: number | null) => {
    setSelectedPropertyId(propId);
    if (!propId) return;
    const p = (properties as any[]).find((x: any) => x.id === propId);
    if (!p) return;
    setImovelDesc(p.description || p.street || `Imóvel #${p.id}`);
    const addr = [p.street, p.number, p.complement, p.neighborhood, p.city, p.state, p.zipCode].filter(Boolean).join(", ");
    setImovelEndereco(addr);
    if (p.registration) setMatriculaText(p.registration);
    if (p.registryOffice) setCartorioText(p.registryOffice);
  };

  // Step 3: save to DB and navigate to contract generator with prefill
  const handleFinish = () => {
    const descricao = imovelDesc.trim() || (selectedPropertyId ? `Imóvel #${selectedPropertyId}` : "");
    if (!descricao) return;

    // Build prefill payload for Contract.tsx (includes all extended fields)
    const prefill = {
      vendedores: vendedores.filter((v) => v.nome || v.email),
      compradores: compradores.filter((v) => v.nome || v.email),
      corretores: corretores.filter((v) => v.nome || v.email),
      imovelDescricao: descricao,
      imovelEndereco,
      imovelBairro,
      imovelCidade,
      imovelEstado,
      imovelCep,
      imovelTipo,
      imovelSituacao,
      imovelMatricula: matriculaText,
      imovelCartorio: cartorioText,
      imovelAreaTotal,
      imovelAreaPrivativa,
      imovelAreaComum,
      imovelValorVenal,
      imovelProprietarioAtual: imovelProprietario,
      imovelCnpjCpfProprietario: imovelCnpjCpf,
      imovelDataUltimoRegistro: imovelDataRegistro,
      imovelNumeroRegistro,
    };
    localStorage.setItem("efcon_contract_prefill", JSON.stringify(prefill));
    // Clear draft on finish
    localStorage.removeItem(DRAFT_KEY);

    createMutation.mutate({
      descricaoImovel: descricao,
      nomeVendedor: vendedores[0]?.nome || vendedores[0]?.email || undefined,
      nomeComprador: compradores[0]?.nome || compradores[0]?.email || undefined,
      nomeCorretor: corretores[0]?.nome || corretores[0]?.email || undefined,
    }, {
      onSuccess: () => {
        utils.contracts.list.invalidate();
        onCreated();
        onClose();
        navigate("/dashboard/contrato");
      },
    });
  };

  const stepTitles = ["Partes Envolvidas", "Identificação do Imóvel", "Revisão e Geração"];
  const stepSubs = [
    "Vendedores, compradores e corretores",
    "Imóvel e matrícula",
    "Confirme os dados e gere o contrato",
  ];

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2a2d3a]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-white font-bold text-base">{stepTitles[step - 1]}</h2>
              <p className="text-gray-400 text-xs mt-0.5">{stepSubs[step - 1]}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-lg">✕</button>
          </div>
          <WizardSteps step={step} />
          {/* Draft restore banner */}
          {hasDraft && (
            <div className="mt-3 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
              <span className="text-amber-300 text-xs flex-1">⚠️ Rascunho salvo encontrado.</span>
              <button type="button" onClick={loadDraft} className="text-xs text-amber-300 hover:text-amber-200 font-semibold underline">Retomar</button>
              <button type="button" onClick={discardDraft} className="text-xs text-gray-500 hover:text-gray-300 ml-1">Descartar</button>
            </div>
          )}
          {/* Step error */}
          {stepError && (
            <div className="mt-2 flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <span className="text-red-400 text-xs">{stepError}</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ── STEP 1: Parties ── */}
          {step === 1 && (
            <>
              {/* Vendedores */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-white font-semibold text-sm">Vendedor(es)</span>
                  </div>
                  <button type="button" onClick={() => setVendedores((p) => [...p, emptyParticipant()])}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                    <Plus className="w-3 h-3" /> Adicionar
                  </button>
                </div>
                <div className="space-y-3">
                  {vendedores.map((row, i) => (
                    <ParticipantCard key={i} row={row} index={i} sectionKey="vend"
                      allClients={allClients as any[]} ocrLoading={ocrLoading} fileInputRefs={fileInputRefs}
                      onUpdate={(u) => updateParticipant(setVendedores, i, u)}
                      onRemove={() => setVendedores((p) => p.filter((_, idx) => idx !== i))}
                      onOcrFile={handleParticipantOcr}
                      showRemove={vendedores.length > 1} />
                  ))}
                </div>
              </div>
              {/* Compradores */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-white font-semibold text-sm">Comprador(es)</span>
                  </div>
                  <button type="button" onClick={() => setCompradores((p) => [...p, emptyParticipant()])}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                    <Plus className="w-3 h-3" /> Adicionar
                  </button>
                </div>
                <div className="space-y-3">
                  {compradores.map((row, i) => (
                    <ParticipantCard key={i} row={row} index={i} sectionKey="comp"
                      allClients={allClients as any[]} ocrLoading={ocrLoading} fileInputRefs={fileInputRefs}
                      onUpdate={(u) => updateParticipant(setCompradores, i, u)}
                      onRemove={() => setCompradores((p) => p.filter((_, idx) => idx !== i))}
                      onOcrFile={handleParticipantOcr}
                      showRemove={compradores.length > 1} />
                  ))}
                </div>
              </div>
              {/* Corretores */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span className="text-white font-semibold text-sm">Corretor(es)</span>
                  </div>
                  <button type="button" onClick={() => setCorretores((p) => [...p, emptyParticipant()])}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                    <Plus className="w-3 h-3" /> Adicionar
                  </button>
                </div>
                <div className="space-y-3">
                  {corretores.map((row, i) => (
                    <ParticipantCard key={i} row={row} index={i} sectionKey="corr"
                      allClients={allClients as any[]} ocrLoading={ocrLoading} fileInputRefs={fileInputRefs}
                      onUpdate={(u) => updateParticipant(setCorretores, i, u)}
                      onRemove={() => setCorretores((p) => p.filter((_, idx) => idx !== i))}
                      onOcrFile={handleParticipantOcr}
                      showRemove={corretores.length > 1} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── STEP 2: Property ── */}
          {step === 2 && (
            <>
              {/* Property selector */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-white font-semibold text-sm">Identificação do Imóvel</span>
                </div>
                <div className="flex rounded-xl overflow-hidden border border-[#2a2d3a] mb-3">
                  <button onClick={() => setPropertyMode("select")}
                    className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                      propertyMode === "select" ? "bg-blue-600 text-white" : "bg-[#0f1117] text-gray-400 hover:text-gray-200"
                    }`}>Imóvel Cadastrado</button>
                  <button onClick={() => setPropertyMode("manual")}
                    className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                      propertyMode === "manual" ? "bg-blue-600 text-white" : "bg-[#0f1117] text-gray-400 hover:text-gray-200"
                    }`}>Digitar Manualmente</button>
                </div>
                {propertyMode === "select" ? (
                  (properties as any[]).length === 0 ? (
                    <div className="bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-3 py-3 text-center">
                      <p className="text-gray-500 text-xs">Nenhum imóvel cadastrado.</p>
                      <button onClick={() => setPropertyMode("manual")} className="text-blue-400 text-xs hover:underline mt-1">Digitar manualmente</button>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {(properties as any[]).map((p: any) => {
                        const label = p.description || p.street || `Imóvel #${p.id}`;
                        const sub = [p.city, p.state].filter(Boolean).join(", ");
                        const isSel = selectedPropertyId === p.id;
                        return (
                          <button key={p.id} onClick={() => handleSelectProperty(isSel ? null : p.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${
                              isSel ? "border-blue-500 bg-blue-500/10 text-white" : "border-[#2a2d3a] bg-[#0f1117] text-gray-300 hover:border-blue-400"
                            }`}>
                            <div className="flex items-center gap-2">
                              <Home className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-sm font-medium truncate">{label}</span>
                              {p.propertyType && <span className="ml-auto text-xs text-gray-500 flex-shrink-0">{p.propertyType}</span>}
                            </div>
                            {sub && <p className="text-xs text-gray-500 mt-0.5 ml-5">{sub}</p>}
                          </button>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <input type="text" placeholder="Ex: Apartamento 302 - Ed. Solar das Flores" value={imovelDesc}
                    onChange={(e) => setImovelDesc(e.target.value)}
                    className="w-full bg-[#0f1117] border border-blue-500 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-400" />
                )}
              </div>

              {/* Matrícula */}
              <div className="pt-3 border-t border-[#2a2d3a] space-y-2">
                {/* Row: label + upload button */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 font-semibold">Matrícula do Imóvel</span>
                  <input type="file" accept="image/*,.pdf" className="hidden" ref={matriculaInputRef}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleMatriculaUpload(f); e.target.value = ""; }}
                  />
                  <button type="button" onClick={() => matriculaInputRef.current?.click()} disabled={matriculaLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2d3a] bg-[#0f1117] text-xs text-gray-300 hover:text-blue-400 hover:border-blue-500 transition-colors disabled:opacity-50">
                    {matriculaLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScanLine className="w-3.5 h-3.5" />}
                    {matriculaLoading ? "Processando OCR..." : "Enviar Matrícula (OCR)"}
                  </button>
                </div>

                {/* File preview row */}
                {matriculaFile && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-xs text-blue-300 truncate flex-1">{matriculaFile.name}</span>
                    {matriculaFile.url && (
                      <button type="button" onClick={() => setPreviewUrl({ url: matriculaFile.url!, name: matriculaFile.name })}
                        className="text-xs text-blue-400 hover:text-blue-300 underline flex-shrink-0 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Ver
                      </button>
                    )}
                    <button type="button" onClick={() => { setMatriculaFile(null); setMatriculaText(""); setCartorioText(""); }}
                      className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Fields */}
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Número da matrícula" value={matriculaText}
                    onChange={(e) => setMatriculaText(e.target.value)}
                    className="bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                  <input type="text" placeholder="Cartório de Registro" value={cartorioText}
                    onChange={(e) => setCartorioText(e.target.value)}
                    className="bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                </div>
                <p className="text-xs text-gray-600">Envie PDF ou foto da matrícula para OCR, ou preencha manualmente.</p>
              </div>
            </>
          )}

          {/* ── STEP 3: Review ── */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">Revise os dados antes de gerar o contrato. Você poderá editar todos os campos na próxima tela.</p>

              {/* Parties summary */}
              {[{ label: "Vendedores", rows: vendedores }, { label: "Compradores", rows: compradores }, { label: "Corretores", rows: corretores }].map(({ label, rows }) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                  {rows.filter((r) => r.nome || r.email).length === 0 ? (
                    <p className="text-xs text-gray-600 italic">Nenhum informado</p>
                  ) : rows.filter((r) => r.nome || r.email).map((r, i) => (
                    <div key={i} className="flex items-center gap-2 bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 mb-1">
                      <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400 text-xs font-bold flex-shrink-0">
                        {(r.nome || r.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-xs font-medium truncate">{r.nome || r.email}</div>
                        {r.cpf && <div className="text-gray-500 text-xs">CPF: {r.cpf}</div>}
                      </div>
                      {r.clientId && <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              ))}

              {/* Property summary */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Imóvel</p>
                <div className="bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-white text-xs">{imovelDesc || <span className="text-gray-600 italic">Não informado</span>}</span>
                  </div>
                  {imovelTipo && <div className="text-gray-400 text-xs">Tipo: <span className="text-white">{imovelTipo}</span></div>}
                  {imovelEndereco && <div className="text-gray-400 text-xs">Endereço: <span className="text-white">{imovelEndereco}</span></div>}
                  {imovelBairro && <div className="text-gray-400 text-xs">Bairro: <span className="text-white">{imovelBairro}</span></div>}
                  {(imovelCidade || imovelEstado) && <div className="text-gray-400 text-xs">Cidade: <span className="text-white">{[imovelCidade, imovelEstado].filter(Boolean).join(" — ")}</span></div>}
                  {matriculaText && <div className="text-gray-400 text-xs">Matrícula: <span className="text-white">{matriculaText}</span></div>}
                  {cartorioText && <div className="text-gray-400 text-xs">Cartório: <span className="text-white">{cartorioText}</span></div>}
                  {imovelAreaTotal && <div className="text-gray-400 text-xs">Área total: <span className="text-white">{imovelAreaTotal}</span></div>}
                  {imovelValorVenal && <div className="text-gray-400 text-xs">Valor venal: <span className="text-white">R$ {imovelValorVenal}</span></div>}
                  {imovelProprietario && <div className="text-gray-400 text-xs">Proprietário atual: <span className="text-white">{imovelProprietario}</span></div>}
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2.5 text-xs text-blue-300">
                <strong>Próximo passo:</strong> Você será redirecionado para a página de geração do contrato com todos os campos pré-preenchidos. Lá você poderá revisar, completar e gerar o PDF.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-[#2a2d3a]">
          <div className="flex items-center gap-2 flex-1">
            <button onClick={step === 1 ? onClose : () => { setStepError(""); setStep((s) => (s - 1) as 1 | 2 | 3); }}
              className="flex-1 py-2.5 rounded-xl border border-[#2a2d3a] text-gray-400 hover:text-white text-sm font-semibold transition-colors">
              {step === 1 ? "Cancelar" : "← Voltar"}
            </button>
            <button type="button" onClick={saveDraft} title="Salvar rascunho"
              className="px-3 py-2.5 rounded-xl border border-[#2a2d3a] text-gray-500 hover:text-amber-400 hover:border-amber-500/40 transition-colors text-xs">
              💾 Rascunho
            </button>
          </div>
          {step < 3 ? (
            <button
              onClick={goNext}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
              Próximo →
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={(!imovelDesc.trim() && !selectedPropertyId) || createMutation.isPending}
              className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
              {createMutation.isPending
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Criando...</>
                : <><ChevronRight className="w-4 h-4" /> Gerar Contrato</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
    {previewUrl && (
      <DocPreviewModal url={previewUrl.url} fileName={previewUrl.name} onClose={() => setPreviewUrl(null)} />
    )}
    </>
  );
}
export default function Contratos() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [distribuicaoContract, setDistribuicaoContract] = useState<Contract | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const { data: contractsData, refetch } = trpc.contracts.list.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const utils = trpc.useUtils();
  const deleteMutation = trpc.contracts.delete.useMutation({ onSuccess: () => utils.contracts.list.invalidate() });
  const logout = trpc.auth.logout.useMutation({ onSuccess: () => navigate("/") });

  const contracts: Contract[] = (contractsData as any[]) || [];
  const filtered = contracts.filter((c) => {
    const matchesSearch = !search || (() => {
      const q = search.toLowerCase();
      return c.code?.toLowerCase().includes(q) || c.descricaoImovel?.toLowerCase().includes(q) ||
        c.nomeVendedor?.toLowerCase().includes(q) || c.nomeComprador?.toLowerCase().includes(q);
    })();
    const matchesStatus = !statusFilter || c.contractStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalContracts = contracts.length;
  const coletando = contracts.filter((c) => c.contractStatus === "rascunho").length;
  const gerado = contracts.filter((c) => c.contractStatus === "gerado").length;
  const emAssinatura = contracts.filter((c) => c.contractStatus === "enviado").length;
  const concluidos = contracts.filter((c) => c.contractStatus === "assinado").length;

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col">
      <header className="bg-[#1a1d27] border-b border-[#2a2d3a] px-4 md:px-6 h-14 flex items-center justify-between flex-shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/">
            <button className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
              <Home className="w-4 h-4" />
            </button>
          </Link>
          <Link href="/dashboard">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-bold text-sm leading-tight text-white">Efcon</div>
                <div className="text-xs leading-tight text-gray-400">Painel Administrativo</div>
              </div>
            </div>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/dashboard/relatorios">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
              <BarChart3 className="w-4 h-4" /> Analytics
            </button>
          </Link>
          <Link href="/dashboard/configuracoes">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
              <Settings className="w-4 h-4" /> Configurações
            </button>
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Novo Contrato</span>
          </button>
          <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"><Bell className="w-4 h-4" /></button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <span className="hidden sm:block text-sm font-medium text-white">{user?.name?.split(" ")[0]}</span>
            <button onClick={() => logout.mutate()} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors" title="Sair">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 md:px-8 py-6 max-w-[1400px] mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: FileText, label: "Total de Contratos", desc: "Todos os contratos cadastrados", value: totalContracts, color: "text-blue-400", iconBg: "bg-blue-600/20", filterKey: null },
            { icon: Clock, label: "Coletando Dados", desc: "Contratos em rascunho aguardando informações", value: coletando, color: "text-yellow-400", iconBg: "bg-yellow-600/20", filterKey: "rascunho" },
            { icon: Eye, label: "Em Assinatura", desc: "Contratos enviados aguardando assinatura", value: emAssinatura, color: "text-teal-400", iconBg: "bg-teal-600/20", filterKey: "enviado" },
            { icon: CheckCircle2, label: "Concluídos", desc: "Contratos assinados e finalizados", value: concluidos, color: "text-green-400", iconBg: "bg-green-600/20", filterKey: "assinado" },
          ].map((stat) => {
            const isActive = statusFilter === stat.filterKey;
            return (
              <button
                key={stat.label}
                onClick={() => setStatusFilter(isActive ? null : stat.filterKey)}
                title={stat.desc}
                className={`text-left bg-[#1a1d27] border rounded-xl p-4 flex items-center gap-3 transition-all hover:border-blue-500/50 cursor-pointer ${
                  isActive ? "border-blue-500 ring-1 ring-blue-500/40 bg-blue-500/5" : "border-[#2a2d3a]"
                }`}
              >
                <div className={`w-9 h-9 ${stat.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-gray-400 truncate">{stat.label}</div>
                  <div className="text-xs text-gray-600 truncate hidden md:block">{stat.desc}</div>
                </div>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Buscar por código ou imóvel..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1a1d27] border border-[#2a2d3a] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
          </div>
          <button className="flex items-center gap-2 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl px-3 py-2.5 text-sm text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
            <Filter className="w-4 h-4" /> Filtros
          </button>
        </div>

        <div className="mb-4">
          <h2 className="text-white font-bold text-base">Contratos ({filtered.length})</h2>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-12 text-center">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhum contrato encontrado.</p>
            <button onClick={() => setShowNewModal(true)} className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Criar primeiro contrato
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((contract, i) => {
              const statusKey = contract.contractStatus || "rascunho";
              const status = STATUS_CONFIG[statusKey] || STATUS_CONFIG.rascunho;
              const code = contract.code || `CTR-${new Date().getFullYear()}-${String(i + 1).padStart(4, "0")}`;
              const progress = contract.progressPct ?? (statusKey === "assinado" ? 100 : statusKey === "enviado" ? 66 : statusKey === "gerado" ? 33 : 0);
              const contractId = contract.id ?? i;
              return (
                <div key={contractId} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl px-4 py-4 hover:border-[#3a3d4a] transition-colors">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${status.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                        <span className="text-blue-400 text-xs font-bold">{code}</span>
                      </div>
                      <div className="text-white font-bold text-sm truncate">{contract.descricaoImovel || contract.nomeVendedor || "—"}</div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        Criado em {contract.createdAt ? new Date(contract.createdAt as string).toLocaleDateString("pt-BR") : "—"}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        {[
                          { has: !!contract.nomeVendedor, label: "Vendedor" },
                          { has: !!contract.nomeComprador, label: "Comprador" },
                          { has: !!contract.nomeCorretor, label: "Corretor" },
                        ].map((p) => (
                          <div key={p.label} className="flex flex-col items-center gap-1">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${p.has ? "bg-green-600/20" : "bg-[#2a2d3a]"}`}>
                              <Clock className={`w-3.5 h-3.5 ${p.has ? "text-green-400" : "text-gray-500"}`} />
                            </div>
                            <span className="text-[10px] text-gray-500">{p.label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="hidden md:flex flex-col gap-1 min-w-[100px]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Progresso</span>
                          <span className="text-xs font-bold text-white">{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-[#2a2d3a] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${progress === 100 ? "bg-green-500" : progress > 50 ? "bg-blue-500" : "bg-yellow-500"}`} style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setDistribuicaoContract(contract)} className="flex items-center gap-1.5 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                        <Send className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Distribuir</span>
                      </button>
                      <Link href={`/dashboard/contrato?contractId=${contract.id}`}>
                        <button className="flex items-center gap-1.5 bg-[#1a1d27] border border-[#2a2d3a] hover:border-blue-500/50 text-gray-300 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                          <Eye className="w-3.5 h-3.5" /> Ver
                        </button>
                      </Link>
                      <div className="relative">
                        <button onClick={() => setMenuOpen(menuOpen === contractId ? null : contractId)} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuOpen === contractId && (
                          <div className="absolute right-0 top-full mt-1 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl shadow-xl z-20 min-w-[140px]">
                            {contract.pdfUrl && (
                              <a href={contract.pdfUrl} download>
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors rounded-t-xl">
                                  <Download className="w-3.5 h-3.5" /> Baixar PDF
                                </button>
                              </a>
                            )}
                            <button onClick={() => { if (contract.id) { setConfirmDeleteId(contract.id); setMenuOpen(null); } }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors rounded-b-xl">
                              <Trash2 className="w-3.5 h-3.5" /> Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showNewModal && <NewContractModal onClose={() => setShowNewModal(false)} onCreated={() => refetch()} />}
      {distribuicaoContract && <DistribuicaoModal contract={distribuicaoContract} onClose={() => setDistribuicaoContract(null)} />}
      {menuOpen !== null && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}

      {/* Confirm Delete Dialog */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#0d1526] border border-[#1e2d47] rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-2">Excluir contrato?</h3>
            <p className="text-sm text-gray-400 mb-5">
              Esta ação não pode ser desfeita. O contrato será removido permanentemente.
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
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
