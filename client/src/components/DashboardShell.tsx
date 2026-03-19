import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import {
  Zap, LayoutDashboard, Briefcase, Users, FileText, FileOutput,
  DollarSign, BarChart3, Settings, Bell, Search, Plus, LogOut, FolderOpen,
  Menu, X, Home,
} from "lucide-react";
import { WhatsAppFAB } from "@/components/WhatsAppFAB";

interface DashboardShellProps {
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  searchPlaceholder?: string;
}

export function DashboardShell({ children, headerRight, searchPlaceholder }: DashboardShellProps) {
  const { isAuthenticated, loading: authLoading, user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    {
      label: "PRINCIPAL",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
        { icon: Briefcase, label: "Negócios", href: "/dashboard/negocios" },
        { icon: Users, label: "Clientes", href: "/dashboard/clientes" },
        { icon: Home, label: "Imóveis", href: "/dashboard/imoveis" },
        { icon: FileText, label: "Documentos", href: "/dashboard/documentos" },
        { icon: FolderOpen, label: "Grupos de Docs", href: "/dashboard/grupos" },
        { icon: FileOutput, label: "Contratos", href: "/dashboard/contratos" },
      ],
    },
    {
      label: "FINANCEIRO",
      items: [
        { icon: DollarSign, label: "Financeiro", href: "/dashboard/financeiro" },
        { icon: BarChart3, label: "Relatórios", href: "/dashboard/relatorios" },
      ],
    },
    {
      label: "SISTEMA",
      items: [
        { icon: Settings, label: "Configurações", href: "/dashboard/configuracoes" },
      ],
    },
  ];

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

  const SidebarContent = () => (
    <>
      <Link href="/">
        <div
          className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border hover:bg-white/5 transition-colors cursor-pointer"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-base">Efcon</span>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navItems.map((section) => (
          <div key={section.label} className="mb-6">
            <div className="text-sidebar-foreground/40 text-xs font-bold tracking-widest uppercase px-2 mb-2">
              {section.label}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
                return (
                  <li key={item.label}>
                    <Link href={item.href}>
                      <div
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          isActive
                            ? "bg-sidebar-primary text-white"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        }`}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm flex-1">{item.label}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

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
    </>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar — hidden on mobile */}
      <aside className="hidden md:flex w-56 flex-shrink-0 bg-sidebar text-sidebar-foreground flex-col h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground flex flex-col transform transition-transform duration-300 ease-in-out md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-sidebar-foreground/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-border px-3 md:px-6 py-3 flex items-center gap-3 flex-shrink-0">
          {/* Hamburger — mobile only */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="flex-1 relative min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={searchPlaceholder || "Buscar..."}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 max-w-md"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            {headerRight || (
              <Link href="/dashboard/negocios/novo">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1 text-xs md:text-sm px-2 md:px-3">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Novo negócio</span>
                </Button>
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          {children}
        </main>
      </div>

      {/* WhatsApp Floating Button */}
      <WhatsAppFAB />
    </div>
  );
}
