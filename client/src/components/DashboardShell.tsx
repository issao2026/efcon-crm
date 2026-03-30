import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import {
  Zap, LayoutDashboard, Briefcase, Users, FileText, FileOutput,
  DollarSign, BarChart3, Settings, Bell, Plus, LogOut, FolderOpen,
  Menu, X, Home, ChevronDown, Building2,
} from "lucide-react";
import { WhatsAppFAB } from "@/components/WhatsAppFAB";

interface DashboardShellProps {
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  searchPlaceholder?: string;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Briefcase, label: "Negócios", href: "/dashboard/negocios" },
  { icon: Users, label: "Clientes", href: "/dashboard/clientes" },
  { icon: Home, label: "Imóveis", href: "/dashboard/imoveis" },
  { icon: FileText, label: "Documentos", href: "/dashboard/documentos" },
  { icon: FileOutput, label: "Contratos", href: "/dashboard/contratos" },
];

const moreItems = [
  { icon: FolderOpen, label: "Grupos de Docs", href: "/dashboard/grupos" },
  { icon: DollarSign, label: "Financeiro", href: "/dashboard/financeiro" },
  { icon: BarChart3, label: "Relatórios", href: "/dashboard/relatorios" },
  { icon: Settings, label: "Configurações", href: "/dashboard/configuracoes" },
];

export function DashboardShell({ children, headerRight, searchPlaceholder }: DashboardShellProps) {
  const { isAuthenticated, loading: authLoading, user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-5 h-5 text-white animate-pulse" />
          </div>
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Acesso restrito</h2>
          <Button onClick={() => (window.location.href = getLoginUrl())}>Entrar</Button>
        </div>
      </div>
    );
  }

  const isActive = (href: string) =>
    href === "/dashboard"
      ? location === href
      : location === href || location.startsWith(href + "/");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ─── Top Navigation Bar ─────────────────────────────────────────────── */}
      <header className="bg-sidebar text-sidebar-foreground border-b border-sidebar-border sticky top-0 z-30 flex-shrink-0">
        <div className="flex items-center h-14 px-4 gap-4">
          {/* Logo */}
          <Link href="/dashboard">
            <div className="flex items-center gap-2 cursor-pointer flex-shrink-0 mr-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-base hidden sm:block">Efcon</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors whitespace-nowrap ${
                      active
                        ? "bg-sidebar-primary text-white"
                        : "text-sidebar-foreground/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {item.label}
                  </div>
                </Link>
              );
            })}

            {/* "Mais" dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors whitespace-nowrap ${
                  moreMenuOpen
                    ? "bg-white/10 text-white"
                    : "text-sidebar-foreground/70 hover:text-white hover:bg-white/10"
                }`}
              >
                Mais
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {moreMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMoreMenuOpen(false)} />
                  <div className="absolute top-full left-0 mt-1 w-48 bg-sidebar border border-sidebar-border rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                    {moreItems.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <Link key={item.href} href={item.href}>
                          <div
                            onClick={() => setMoreMenuOpen(false)}
                            className={`flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                              active
                                ? "bg-sidebar-primary text-white"
                                : "text-sidebar-foreground/70 hover:text-white hover:bg-white/10"
                            }`}
                          >
                            <item.icon className="w-4 h-4 flex-shrink-0" />
                            {item.label}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            {/* Notification bell */}
            <button className="relative p-2 text-sidebar-foreground/60 hover:text-white transition-colors rounded-lg hover:bg-white/10">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>

            {/* New deal button */}
            {headerRight || (
              <Link href="/dashboard/negocios/novo">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1 text-xs px-2.5 hidden sm:flex">
                  <Plus className="w-3.5 h-3.5" />
                  Novo negócio
                </Button>
              </Link>
            )}

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() || "M"}
                </div>
                <span className="text-white text-sm font-medium hidden lg:block max-w-[120px] truncate">
                  {user?.name?.split(" ")[0] || "Usuário"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-sidebar-foreground/60 hidden lg:block transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute top-full right-0 mt-1 w-52 bg-sidebar border border-sidebar-border rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                    <div className="px-4 py-3 border-b border-sidebar-border">
                      <div className="text-white text-sm font-semibold truncate">{user?.name || "Usuário"}</div>
                      <div className="text-sidebar-foreground/40 text-xs mt-0.5">admin · CRECI 28.867</div>
                    </div>
                    <Link href="/dashboard/configuracoes">
                      <div
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-sidebar-foreground/70 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Configurações
                      </div>
                    </Link>
                    <button
                      onClick={() => { setUserMenuOpen(false); logout().then(() => navigate("/")); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-sidebar-foreground/60 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Mobile Menu Overlay ─────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ─── Mobile Menu Drawer ──────────────────────────────────────────────── */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-sidebar text-sidebar-foreground flex flex-col transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-base">Efcon</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-sidebar-foreground/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="mb-4">
            <div className="text-sidebar-foreground/40 text-xs font-bold tracking-widest uppercase px-2 mb-2">PRINCIPAL</div>
            <ul className="space-y-0.5">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link href={item.href}>
                      <div
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                          active
                            ? "bg-sidebar-primary text-white"
                            : "text-sidebar-foreground/70 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{item.label}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <div className="text-sidebar-foreground/40 text-xs font-bold tracking-widest uppercase px-2 mb-2">MAIS</div>
            <ul className="space-y-0.5">
              {moreItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link href={item.href}>
                      <div
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                          active
                            ? "bg-sidebar-primary text-white"
                            : "text-sidebar-foreground/70 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{item.label}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Drawer footer */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || "M"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold truncate">{user?.name || "Usuário"}</div>
              <div className="text-sidebar-foreground/40 text-xs">admin · CRECI 28.867</div>
            </div>
            <button
              onClick={() => logout().then(() => navigate("/"))}
              className="text-sidebar-foreground/40 hover:text-white transition-colors flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Main Content ────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-3 md:p-6">
        {children}
      </main>

      {/* WhatsApp Floating Button */}
      <WhatsAppFAB />
    </div>
  );
}
