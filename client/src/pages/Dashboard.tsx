import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  FileText, BarChart3, Settings, User,
  Bell, Plus, ChevronRight, Clock, AlertTriangle,
  CheckCircle2, Moon, Sun, Zap, LogOut, Home,
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

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [dark, setDark] = useState(true);
  const [notifTab, setNotifTab] = useState<"all" | "pending" | "expired" | "stopped">("all");

  const { data: stats } = trpc.dashboard.stats.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const { data: contractsData } = trpc.contracts.list.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const logout = trpc.auth.logout.useMutation({ onSuccess: () => navigate("/") });

  if (!isAuthenticated && !user) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
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

  const bg = dark ? "bg-[#0f1117]" : "bg-gray-100";
  const cardBg = dark ? "bg-[#1a1d27]" : "bg-white";
  const cardBorder = dark ? "border-[#2a2d3a]" : "border-gray-200";
  const textPrimary = dark ? "text-white" : "text-gray-900";
  const textSecondary = dark ? "text-gray-400" : "text-gray-500";
  const navBg = dark ? "bg-[#1a1d27] border-[#2a2d3a]" : "bg-white border-gray-200";

  return (
    <div className={`min-h-screen ${bg} flex flex-col transition-colors duration-200`}>
      {/* Top Nav */}
      <header className={`${navBg} border-b px-4 md:px-6 h-14 flex items-center justify-between flex-shrink-0 sticky top-0 z-30`}>
        <div className="flex items-center gap-3">
          <Link href="/">
            <button className={`p-1.5 rounded-lg ${dark ? "text-gray-400 hover:text-white hover:bg-white/10" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"} transition-colors`}>
              <Home className="w-4 h-4" />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className={`font-bold text-sm leading-tight ${textPrimary}`}>Efcon</div>
              <div className={`text-xs leading-tight ${textSecondary}`}>Sistema de Contratos Imobiliários</div>
            </div>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/dashboard/relatorios">
            <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${dark ? "text-gray-300 hover:text-white hover:bg-white/10" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}`}>
              <BarChart3 className="w-4 h-4" /> Analytics
            </button>
          </Link>
          <Link href="/dashboard/configuracoes">
            <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${dark ? "text-gray-300 hover:text-white hover:bg-white/10" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}`}>
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
            <button className={`p-2 rounded-lg transition-colors ${dark ? "text-gray-400 hover:text-white hover:bg-white/10" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}>
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {Math.min(notifications.length, 9)}+
                </span>
              )}
            </button>
          </div>
          <button onClick={() => setDark(!dark)} className={`p-2 rounded-lg transition-colors ${dark ? "text-gray-400 hover:text-white hover:bg-white/10" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}>
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <span className={`hidden sm:block text-sm font-medium ${textPrimary}`}>{user?.name?.split(" ")[0]}</span>
            <button onClick={() => logout.mutate()} className={`p-1.5 rounded-lg transition-colors ${dark ? "text-gray-500 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"}`} title="Sair">
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
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${dark ? "bg-blue-600/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
            <Settings className="w-3 h-3" /> Administrador
          </span>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: FileText, label: "Total de Contratos", value: totalContracts, color: "text-blue-400", iconBg: "bg-blue-600/20" },
            { icon: Clock, label: "Em Andamento", value: inProgress, color: "text-yellow-400", iconBg: "bg-yellow-600/20" },
            { icon: CheckCircle2, label: "Finalizados", value: finalized, color: "text-green-400", iconBg: "bg-green-600/20" },
          ].map((stat) => (
            <div key={stat.label} className={`${cardBg} border ${cardBorder} rounded-xl p-4 flex items-center gap-4`}>
              <div className={`w-10 h-10 ${stat.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <div className={`text-2xl font-bold ${textPrimary}`}>{stat.value}</div>
                <div className={`text-xs ${textSecondary}`}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Action Cards */}
          <div className="lg:col-span-2">
            <h2 className={`text-xs font-bold uppercase tracking-widest ${textSecondary} mb-3`}>Acesso Rápido</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/dashboard/contratos">
                <div className={`${cardBg} border ${cardBorder} rounded-xl p-5 cursor-pointer hover:border-blue-500/50 transition-all`}>
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-3">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className={`font-bold text-base ${textPrimary} mb-1`}>Contratos</div>
                  <div className={`text-xs ${textSecondary}`}>Gerenciar contratos imobiliários</div>
                </div>
              </Link>
              <Link href="/dashboard/relatorios">
                <div className={`${cardBg} border ${cardBorder} rounded-xl p-5 cursor-pointer hover:border-green-500/50 transition-all`}>
                  <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center mb-3">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div className={`font-bold text-base ${textPrimary} mb-1`}>Relatórios</div>
                  <div className={`text-xs ${textSecondary}`}>Análises e métricas do sistema</div>
                </div>
              </Link>
              <Link href="/dashboard/configuracoes">
                <div className={`${cardBg} border ${cardBorder} rounded-xl p-5 cursor-pointer hover:border-purple-500/50 transition-all`}>
                  <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center mb-3">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div className={`font-bold text-base ${textPrimary} mb-1`}>Configurações</div>
                  <div className={`text-xs ${textSecondary}`}>Usuários, segurança e sistema</div>
                </div>
              </Link>
              <Link href="/dashboard/configuracoes">
                <div className={`${cardBg} border ${cardBorder} rounded-xl p-5 cursor-pointer hover:border-orange-500/50 transition-all`}>
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center mb-3">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className={`font-bold text-base ${textPrimary} mb-1`}>Meu Perfil</div>
                  <div className={`text-xs ${textSecondary}`}>Ver e editar informações pessoais</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Notifications */}
          <div className="lg:col-span-1">
            <div className={`${cardBg} border ${cardBorder} rounded-xl overflow-hidden`}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2d3a]">
                <div className="flex items-center gap-2">
                  <Bell className={`w-4 h-4 ${textSecondary}`} />
                  <span className={`font-bold text-sm ${textPrimary}`}>Notificações</span>
                  {notifications.length > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{notifications.length}</span>
                  )}
                </div>
                <Link href="/dashboard/contratos">
                  <button className={`text-xs font-medium ${dark ? "text-blue-400 hover:text-blue-300" : "text-blue-600"} flex items-center gap-1`}>
                    Ver todos <ChevronRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
              <div className={`flex border-b ${dark ? "border-[#2a2d3a]" : "border-gray-200"} px-2 pt-1 gap-1`}>
                {([
                  { key: "all", label: "Todos", count: notifCounts.all },
                  { key: "pending", label: "Pendentes", count: notifCounts.pending },
                  { key: "expired", label: "Expirados", count: notifCounts.expired },
                  { key: "stopped", label: "Parados", count: notifCounts.stopped },
                ] as const).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setNotifTab(tab.key)}
                    className={`text-xs px-2 py-1.5 font-medium transition-colors flex items-center gap-1 ${notifTab === tab.key ? `${textPrimary} border-b-2 border-blue-500` : textSecondary}`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`text-[9px] px-1 rounded-full ${notifTab === tab.key ? "bg-blue-600 text-white" : dark ? "bg-[#2a2d3a] text-gray-400" : "bg-gray-200 text-gray-600"}`}>{tab.count}</span>
                    )}
                  </button>
                ))}
              </div>
              <div className={`divide-y ${dark ? "divide-[#2a2d3a]" : "divide-gray-100"} overflow-y-auto max-h-64`}>
                {filteredNotifs.length === 0 ? (
                  <div className={`px-4 py-8 text-center text-sm ${textSecondary}`}>Nenhuma notificação</div>
                ) : (
                  filteredNotifs.map((n) => (
                    <div key={n.id} className={`px-4 py-3 flex items-start gap-3 cursor-pointer ${dark ? "hover:bg-white/5" : "hover:bg-gray-50"} transition-colors`}>
                      <NotifIcon type={n.type} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-xs font-semibold ${n.type === "expired" ? "text-red-400" : n.type === "pending" ? "text-yellow-400" : n.type === "stopped" ? "text-orange-400" : "text-blue-400"}`}>{n.title}</span>
                          {n.code && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${dark ? "bg-[#2a2d3a] text-gray-300" : "bg-gray-100 text-gray-600"}`}>{n.code}</span>}
                        </div>
                        <div className={`text-xs truncate ${textSecondary}`}>{n.description}</div>
                        <div className={`text-[10px] mt-0.5 ${dark ? "text-gray-600" : "text-gray-400"}`}>{n.time}</div>
                      </div>
                      <ChevronRight className={`w-3 h-3 ${textSecondary} flex-shrink-0 mt-0.5`} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className={`${dark ? "bg-[#1a1d27] border-[#2a2d3a]" : "bg-[#0f1117] border-[#1a1d27]"} border rounded-xl p-5 flex items-center justify-between`}>
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
    </div>
  );
}
