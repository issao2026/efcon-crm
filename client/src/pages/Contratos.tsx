import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  FileText, Plus, Search, Filter, Eye, MoreVertical,
  Clock, CheckCircle2, MessageCircle, Zap, Home,
  BarChart3, Settings, Bell, LogOut,
  Users, Briefcase, Download, Trash2, ChevronRight,
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

function WhatsAppBatchModal({ contract, onClose }: { contract: Contract; onClose: () => void }) {
  const parties = [
    { role: "Vendedor", name: contract.nomeVendedor },
    { role: "Comprador", name: contract.nomeComprador },
    { role: "Corretor", name: contract.nomeCorretor },
  ].filter((p) => p.name);

  const msg = (name: string, role: string) =>
    encodeURIComponent(
      `Olá ${name}, você tem um contrato imobiliário aguardando sua verificação e assinatura.\n\nImóvel: ${contract.descricaoImovel || "—"}\nCódigo: ${contract.code || "—"}\nSua função: ${role}\n\nAcesse o link para verificar e assinar: ${contract.pdfUrl || "Em breve"}`
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2d3a]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#25D366] rounded-lg flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">WhatsApp em Lote</div>
              <div className="text-gray-400 text-xs">{contract.code}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-lg">✕</button>
        </div>
        <div className="p-5 space-y-3">
          {parties.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Nenhum participante com dados de contato.</p>
          ) : (
            parties.map((p) => (
              <a
                key={p.role}
                href={`https://wa.me/?text=${msg(p.name!, p.role)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-[#25D366]/10 border border-[#25D366]/20 rounded-xl hover:bg-[#25D366]/20 transition-colors"
              >
                <div className="w-8 h-8 bg-[#25D366] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {p.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-semibold truncate">{p.name}</div>
                  <div className="text-gray-400 text-xs">{p.role}</div>
                </div>
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
              </a>
            ))
          )}
        </div>
        <div className="px-5 pb-5">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-[#2a2d3a] text-gray-400 hover:text-white hover:border-gray-500 text-sm transition-colors">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function NewContractModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [imovel, setImovel] = useState("");
  const [vendedores, setVendedores] = useState([{ email: "", whatsapp: "" }]);
  const [compradores, setCompradores] = useState([{ email: "", whatsapp: "" }]);
  const [corretores, setCorretores] = useState([{ email: "", whatsapp: "" }]);

  const utils = trpc.useUtils();
  const createMutation = trpc.contracts.create.useMutation({
    onSuccess: () => { utils.contracts.list.invalidate(); onCreated(); onClose(); },
  });

  const addRow = (setter: React.Dispatch<React.SetStateAction<{ email: string; whatsapp: string }[]>>) =>
    setter((prev) => [...prev, { email: "", whatsapp: "" }]);
  const updateRow = (setter: React.Dispatch<React.SetStateAction<{ email: string; whatsapp: string }[]>>, index: number, field: "email" | "whatsapp", value: string) =>
    setter((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  const removeRow = (setter: React.Dispatch<React.SetStateAction<{ email: string; whatsapp: string }[]>>, index: number) =>
    setter((prev) => prev.filter((_, i) => i !== index));

  const PartySection = ({ title, icon: Icon, rows, setter, addLabel }: {
    title: string; icon: React.ElementType;
    rows: { email: string; whatsapp: string }[];
    setter: React.Dispatch<React.SetStateAction<{ email: string; whatsapp: string }[]>>;
    addLabel: string;
  }) => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-400" />
          <span className="text-white font-semibold text-sm">{title}</span>
        </div>
        <button onClick={() => addRow(setter)} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
          <Plus className="w-3 h-3" /> {addLabel}
        </button>
      </div>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="space-y-2">
            <input type="email" placeholder={`E-mail ${i + 1} *`} value={row.email}
              onChange={(e) => updateRow(setter, i, "email", e.target.value)}
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
            <input type="tel" placeholder={`WhatsApp ${i + 1} (opcional)`} value={row.whatsapp}
              onChange={(e) => updateRow(setter, i, "whatsapp", e.target.value)}
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
            {rows.length > 1 && (
              <button onClick={() => removeRow(setter, i)} className="text-xs text-red-400 hover:text-red-300 transition-colors">Remover</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const handleCreate = () => {
    if (!imovel.trim()) return;
    createMutation.mutate({
      descricaoImovel: imovel,
      nomeVendedor: vendedores[0]?.email || undefined,
      nomeComprador: compradores[0]?.email || undefined,
      nomeCorretor: corretores[0]?.email || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2d3a]">
          <div>
            <h2 className="text-white font-bold text-lg">Criar Novo Contrato</h2>
            <p className="text-gray-400 text-xs mt-0.5">Preencha as informações do imóvel e participantes.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-lg">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-white font-semibold text-sm">Identificação do Imóvel</span>
            </div>
            <input type="text" placeholder="Ex: Apartamento 302 - Ed. Solar das Flores *" value={imovel}
              onChange={(e) => setImovel(e.target.value)}
              className="w-full bg-[#0f1117] border border-blue-500 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-400" />
            <p className="text-gray-600 text-xs mt-1">O endereço completo será preenchido na etapa de detalhes pelo corretor.</p>
          </div>
          <PartySection title="Vendedores" icon={Users} rows={vendedores} setter={setVendedores} addLabel="Adicionar Vendedor" />
          <PartySection title="Compradores" icon={Users} rows={compradores} setter={setCompradores} addLabel="Adicionar Comprador" />
          <PartySection title="Corretores" icon={Briefcase} rows={corretores} setter={setCorretores} addLabel="Adicionar Corretor" />
        </div>
        <div className="flex items-center gap-3 px-5 py-4 border-t border-[#2a2d3a]">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#2a2d3a] text-gray-400 hover:text-white text-sm font-semibold transition-colors">Cancelar</button>
          <button onClick={handleCreate} disabled={!imovel.trim() || createMutation.isPending}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
            {createMutation.isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><ChevronRight className="w-4 h-4" /> Criar Contrato</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Contratos() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [whatsappContract, setWhatsappContract] = useState<Contract | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const { data: contractsData, refetch } = trpc.contracts.list.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const utils = trpc.useUtils();
  const deleteMutation = trpc.contracts.delete.useMutation({ onSuccess: () => utils.contracts.list.invalidate() });
  const logout = trpc.auth.logout.useMutation({ onSuccess: () => navigate("/") });

  const contracts: Contract[] = (contractsData as any[]) || [];
  const filtered = contracts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.code?.toLowerCase().includes(q) || c.descricaoImovel?.toLowerCase().includes(q) ||
      c.nomeVendedor?.toLowerCase().includes(q) || c.nomeComprador?.toLowerCase().includes(q);
  });

  const totalContracts = contracts.length;
  const coletando = contracts.filter((c) => c.contractStatus === "rascunho").length;
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
            { icon: FileText, label: "Total de Contratos", value: totalContracts, color: "text-blue-400", iconBg: "bg-blue-600/20" },
            { icon: Clock, label: "Coletando Dados", value: coletando, color: "text-yellow-400", iconBg: "bg-yellow-600/20" },
            { icon: Eye, label: "Em Assinatura", value: emAssinatura, color: "text-teal-400", iconBg: "bg-teal-600/20" },
            { icon: CheckCircle2, label: "Concluídos", value: concluidos, color: "text-green-400", iconBg: "bg-green-600/20" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4 flex items-center gap-3">
              <div className={`w-9 h-9 ${stat.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <div className="text-xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-gray-400">{stat.label}</div>
              </div>
            </div>
          ))}
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
                      <button onClick={() => setWhatsappContract(contract)} className="flex items-center gap-1.5 bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 text-[#25D366] text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                        <MessageCircle className="w-3.5 h-3.5" /> <span className="hidden sm:inline">WhatsApp em Lote</span>
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
                            <button onClick={() => { if (contract.id) deleteMutation.mutate({ id: contract.id }); setMenuOpen(null); }}
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
      {whatsappContract && <WhatsAppBatchModal contract={whatsappContract} onClose={() => setWhatsappContract(null)} />}
      {menuOpen !== null && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}
    </div>
  );
}
