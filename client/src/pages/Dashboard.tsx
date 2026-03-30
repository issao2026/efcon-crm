import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  FileText, BarChart3, Settings, User,
  Bell, Plus, ChevronRight, Clock, AlertTriangle,
  CheckCircle2, Moon, Sun, Zap, LogOut, Home, X,
} from "lucide-react";

function getGreeting(name: string) {
  const h = new Date().getHours();
  const greet = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  return `${greet}, ${name}!`;
}

type NotifType = "expired" | "pending" | "stopped" | "info";
interface Notification {
  id: number;
  type: NotifType;
  title: string;
  code?: string;
  description: string;
  time: string;
}

function NotifIcon({ type }: { type: NotifType }) {
  if (type === "expired") return <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />;
  if (type === "pending") return <Clock className="w-4 h-4 text-yellow-400 flex-shrink-0" />;
  if (type === "stopped") return <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />;
  return <Bell className="w-4 h-4 text-blue-400 flex-shrink-0" />;
}

interface ContractPreview {
  code?: string;
  descricaoImovel?: string | null;
  nomeVendedor?: string | null;
  nomeComprador?: string | null;
  nomeCorretor?: string | null;
  contractStatus?: string;
  valorTotalContrato?: string | null;
  pdfUrl?: string | null;
  createdAt?: Date | string | null;
}

function ContractHoverCard({ contract, onClose }: { contract: ContractPreview; onClose: () => void }) {
  const statusLabels: Record<string, { label: string; color: string }> = {
    rascunho: { label: "Coletando Dados", color: "text-yellow-400" },
    gerado: { label: "Gerado", color: "text-blue-400" },
    enviado: { label: "Em Assinatura", color: "text-purple-400" },
    assinado: { label: "Concluído", color: "text-green-400" },
  };
  const st = statusLabels[contract.contractStatus || "rascunho"] || statusLabels.rascunho;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-[#0d1526] border border-[#1e2d4a] rounded-2xl w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2d4a]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">{contract.code || "Contrato"}</div>
              <div className={`text-xs ${st.color}`}>{st.label}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {contract.descricaoImovel && (
            <div>
              <div className="text-gray-500 text-xs mb-0.5">Imóvel</div>
              <div className="text-white text-sm font-medium">{contract.descricaoImovel}</div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {contract.nomeVendedor && (
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Vendedor</div>
                <div className="text-gray-200 text-xs truncate">{contract.nomeVendedor}</div>
              </div>
            )}
            {contract.nomeComprador && (
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Comprador</div>
                <div className="text-gray-200 text-xs truncate">{contract.nomeComprador}</div>
              </div>
            )}
            {contract.nomeCorretor && (
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Corretor</div>
                <div className="text-gray-200 text-xs truncate">{contract.nomeCorretor}</div>
              </div>
            )}
            {contract.valorTotalContrato && (
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Valor</div>
                <div className="text-gray-200 text-xs">{contract.valorTotalContrato}</div>
              </div>
            )}
          </div>
          {contract.createdAt && (
            <div className="text-gray-600 text-xs">
              Criado em {new Date(contract.createdAt).toLocaleDateString("pt-BR")}
            </div>
          )}
        </div>
        <div className="px-5 pb-5 flex gap-2">
          {contract.pdfUrl && (
            <a href={contract.pdfUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold text-center transition-colors">
              Baixar PDF
            </a>
          )}
          <Link href="/dashboard/contratos">
            <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-[#1e2d4a] text-gray-400 hover:text-white text-xs font-semibold transition-colors">
              Ver todos
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [dark, setDark] = useState(true);
  const [notifTab, setNotifTab] = useState<"all" | "pending" | "expired" | "stopped">("all");
  const [previewContract, setPreviewContract] = useState<ContractPreview | null>(null);

  const { data: stats } = trpc.dashboard.stats.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const { data: contractsData } = trpc.contracts.list.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const logout = trpc.auth.logout.useMutation({ onSuccess: () => navigate("/") });

  if (!isAuthenticated && !user) {
    return (
      <div className="min-h-screen bg-[#060d1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Acesso restrito</h2>
          <p className="text-gray-400 mb-4">Faça login para acessar o painel</p>
          <a href={getLoginUrl()} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors">
            Entrar
          </a>
        </div>
      </div>
    );
  }

  const contracts = (contractsData as any[]) || [];
  const totalContracts = stats?.totalContracts ?? contracts.length;
  const inProgress = contracts.filter((c: any) => c.contractStatus === "rascunho" || c.contractStatus === "enviado").length;
  const finalized = contracts.filter((c: any) => c.contractStatus === "assinado").length;

  const notifications: Notification[] = contracts.slice(0, 8).map((c: any, i: number) => {
    const code = c.code || `CTR-${String(i + 1).padStart(4, "0")}`;
    const imovel = c.descricaoImovel || c.nomeVendedor || "Imóvel";
    const types: NotifType[] = ["expired", "pending", "stopped", "info"];
    const type = types[i % types.length];
    const titles: Record<string, string> = { expired: "Contrato expirado", pending: "Dados pendentes", stopped: "Contrato parado", info: "Novo contrato" };
    return { id: c.id ?? i, type, title: titles[type], code, description: imovel, time: c.createdAt ? new Date(c.createdAt).toLocaleDateString("pt-BR") : "—" };
  });

  const notifCounts = {
    all: notifications.length,
    pending: notifications.filter((n) => n.type === "pending").length,
    expired: notifications.filter((n) => n.type === "expired").length,
    stopped: notifications.filter((n) => n.type === "stopped").length,
  };
  const filteredNotifs = notifTab === "all" ? notifications : notifications.filter((n) => n.type === notifTab);

  // Navy palette matching home page
  const bg = dark ? "bg-[#060d1a]" : "bg-gray-100";
  const cardBg = dark ? "bg-[#0d1526]" : "bg-white";
  const cardBorder = dark ? "border-[#1e2d4a]" : "border-gray-200";
  const textPrimary = dark ? "text-white" : "text-gray-900";
  const textSecondary = dark ? "text-gray-400" : "text-gray-500";
  const navBg = dark ? "bg-[#0a1220] border-[#1e2d4a]" : "bg-white border-gray-200";

  const quickLinks = [
    { href: "/dashboard/contratos", label: "Contratos", desc: "Gerenciar contratos imobiliários", icon: FileText, iconBg: "bg-blue-600", hoverBorder: "hover:border-blue-500/60" },
    { href: "/dashboard/relatorios", label: "Relatórios", desc: "Análises e métricas do sistema", icon: BarChart3, iconBg: "bg-green-600", hoverBorder: "hover:border-green-500/60" },
    { href: "/dashboard/configuracoes", label: "Configurações", desc: "Usuários, segurança e sistema", icon: Settings, iconBg: "bg-purple-600", hoverBorder: "hover:border-purple-500/60" },
    { href: "/dashboard/clientes", label: "Meu Perfil", desc: "Ver e editar informações pessoais", icon: User, iconBg: "bg-orange-500", hoverBorder: "hover:border-orange-500/60" },
  ];

  return (
    <div className={`min-h-screen ${bg} flex flex-col transition-colors duration-200`}>
      {/* Top Nav */}
      <header className={`${navBg} border-b px-4 md:px-6 h-14 flex items-center justify-between flex-shrink-0 sticky top-0 z-30`}>
        <div className="flex items-center gap-3">
          <Link href="/">
            <button className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
              <Home className="w-4 h-4" />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight text-white">Efcon</div>
              <div className="text-xs leading-tight text-gray-500">Sistema de Contratos Imobiliários</div>
            </div>
          </div>
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
          <Link href="/dashboard/contratos">
            <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Novo Contrato</span>
            </button>
          </Link>
          <div className="relative">
            <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {Math.min(notifications.length, 9)}+
                </span>
              )}
            </button>
          </div>
          <button onClick={() => setDark(!dark)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
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

      {/* Main */}
      <div className="flex-1 px-4 md:px-8 py-6 max-w-[1400px] mx-auto w-full">
        {/* Greeting */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${textPrimary}`}>{getGreeting(user?.name?.split(" ")[0] || "Usuário")}</h1>
            <p className={`text-sm mt-0.5 ${textSecondary}`}>O que você gostaria de fazer hoje?</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/20">
            <Settings className="w-3 h-3" /> Administrador
          </span>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { href: "/dashboard/contratos", icon: FileText, label: "Total de Contratos", value: totalContracts, color: "text-blue-400", iconBg: "bg-blue-600/20", hoverBorder: "hover:border-blue-500/50" },
            { href: "/dashboard/contratos", icon: Clock, label: "Em Andamento", value: inProgress, color: "text-yellow-400", iconBg: "bg-yellow-600/20", hoverBorder: "hover:border-yellow-500/50" },
            { href: "/dashboard/contratos", icon: CheckCircle2, label: "Finalizados", value: finalized, color: "text-green-400", iconBg: "bg-green-600/20", hoverBorder: "hover:border-green-500/50" },
          ].map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <div className={`${cardBg} border ${cardBorder} ${stat.hoverBorder} rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all hover:scale-[1.01]`}>
                <div className={`w-10 h-10 ${stat.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${textPrimary}`}>{stat.value}</div>
                  <div className={`text-xs ${textSecondary}`}>{stat.label}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Action Cards */}
          <div className="lg:col-span-2">
            <h2 className={`text-xs font-bold uppercase tracking-widest ${textSecondary} mb-3`}>Acesso Rápido</h2>
            <div className="grid grid-cols-2 gap-4">
              {quickLinks.map((ql) => (
                <Link key={ql.href} href={ql.href}>
                  <div className={`${cardBg} border ${cardBorder} ${ql.hoverBorder} rounded-xl p-5 cursor-pointer transition-all hover:scale-[1.01] group`}>
                    <div className={`w-10 h-10 ${ql.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                      <ql.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className={`font-bold text-base ${textPrimary} mb-1 group-hover:text-blue-300 transition-colors`}>{ql.label}</div>
                    <div className={`text-xs ${textSecondary}`}>{ql.desc}</div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Recent Contracts mini-list */}
            {contracts.length > 0 && (
              <div className="mt-4">
                <h2 className={`text-xs font-bold uppercase tracking-widest ${textSecondary} mb-3`}>Contratos Recentes</h2>
                <div className={`${cardBg} border ${cardBorder} rounded-xl divide-y ${dark ? "divide-[#1e2d4a]" : "divide-gray-100"}`}>
                  {contracts.slice(0, 4).map((c: any) => {
                    const statusColors: Record<string, string> = {
                      rascunho: "text-yellow-400",
                      gerado: "text-blue-400",
                      enviado: "text-purple-400",
                      assinado: "text-green-400",
                    };
                    const statusLabels: Record<string, string> = {
                      rascunho: "Coletando Dados",
                      gerado: "Gerado",
                      enviado: "Em Assinatura",
                      assinado: "Concluído",
                    };
                    return (
                      <div
                        key={c.id}
                        className={`px-4 py-3 flex items-center gap-3 cursor-pointer ${dark ? "hover:bg-white/5" : "hover:bg-gray-50"} transition-colors`}
                        onClick={() => setPreviewContract(c)}
                      >
                        <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-semibold ${textPrimary} truncate`}>{c.descricaoImovel || c.code || "Contrato"}</div>
                          <div className={`text-xs ${textSecondary} truncate`}>{c.code}</div>
                        </div>
                        <span className={`text-xs font-medium ${statusColors[c.contractStatus || "rascunho"] || "text-gray-400"} flex-shrink-0`}>
                          {statusLabels[c.contractStatus || "rascunho"] || "—"}
                        </span>
                        <ChevronRight className={`w-3 h-3 ${textSecondary} flex-shrink-0`} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="lg:col-span-1">
            <div className={`${cardBg} border ${cardBorder} rounded-xl overflow-hidden`}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2d4a]">
                <div className="flex items-center gap-2">
                  <Bell className={`w-4 h-4 ${textSecondary}`} />
                  <span className={`font-bold text-sm ${textPrimary}`}>Notificações</span>
                  {notifications.length > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{notifications.length}</span>
                  )}
                </div>
                <Link href="/dashboard/contratos">
                  <button className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    Ver todos <ChevronRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
              <div className="flex border-b border-[#1e2d4a] px-2 pt-1 gap-1">
                {([
                  { key: "all", label: "Todos", count: notifCounts.all },
                  { key: "pending", label: "Pendentes", count: notifCounts.pending },
                  { key: "expired", label: "Expirados", count: notifCounts.expired },
                  { key: "stopped", label: "Parados", count: notifCounts.stopped },
                ] as const).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setNotifTab(tab.key)}
                    className={`text-xs px-2 py-1.5 font-medium transition-colors flex items-center gap-1 ${notifTab === tab.key ? `text-white border-b-2 border-blue-500` : "text-gray-500 hover:text-gray-300"}`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`text-[9px] px-1 rounded-full ${notifTab === tab.key ? "bg-blue-600 text-white" : "bg-[#1e2d4a] text-gray-400"}`}>{tab.count}</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="divide-y divide-[#1e2d4a] overflow-y-auto max-h-72">
                {filteredNotifs.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">Nenhuma notificação</div>
                ) : (
                  filteredNotifs.map((n) => {
                    const contract = contracts.find((c: any) => c.code === n.code);
                    return (
                      <div
                        key={n.id}
                        className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => contract && setPreviewContract(contract)}
                      >
                        <NotifIcon type={n.type} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-xs font-semibold ${n.type === "expired" ? "text-red-400" : n.type === "pending" ? "text-yellow-400" : n.type === "stopped" ? "text-orange-400" : "text-blue-400"}`}>{n.title}</span>
                            {n.code && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#1e2d4a] text-gray-300">{n.code}</span>}
                          </div>
                          <div className="text-xs truncate text-gray-400">{n.description}</div>
                          <div className="text-[10px] mt-0.5 text-gray-600">{n.time}</div>
                        </div>
                        <ChevronRight className="w-3 h-3 text-gray-500 flex-shrink-0 mt-0.5" />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-xl p-5 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-base">Criar Novo Contrato</h3>
            <p className="text-sm mt-0.5 text-gray-400">Inicie o processo de geração de contratos imobiliários</p>
          </div>
          <Link href="/dashboard/contratos">
            <button className="flex items-center gap-2 bg-[#00d4a0] hover:bg-[#00c090] text-black font-bold px-4 py-2.5 rounded-lg text-sm transition-colors">
              <Plus className="w-4 h-4" /> Novo Contrato
            </button>
          </Link>
        </div>
      </div>

      {/* Contract Preview Modal */}
      {previewContract && (
        <ContractHoverCard contract={previewContract} onClose={() => setPreviewContract(null)} />
      )}
    </div>
  );
}
