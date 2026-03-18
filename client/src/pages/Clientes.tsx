import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Plus, Users, Search, User, Phone, Mail, FileText,
  Building2, CheckCircle2, Clock, MoreHorizontal,
} from "lucide-react";

export default function Clientes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "", cpfCnpj: "", email: "", phone: "", clientType: "comprador" as "comprador" | "vendedor" | "locatario" | "locador" | "fiador",
  });

  const { data: clients = [], isLoading, refetch } = trpc.clients.list.useQuery();
  const createClient = trpc.clients.create.useMutation({
    onSuccess: () => {
      toast.success("Cliente cadastrado com sucesso!");
      setShowNewClient(false);
      setNewClient({ name: "", cpfCnpj: "", email: "", phone: "", clientType: "comprador" });
      refetch();
    },
    onError: () => toast.error("Erro ao cadastrar cliente"),
  });

  const filtered = (clients as any[]).filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.cpfCnpj?.includes(q);
  });

  const CLIENT_TYPE_LABELS: Record<string, string> = {
    comprador: "Comprador", vendedor: "Vendedor", locatario: "Locatário",
    locador: "Locador", fiador: "Fiador",
  };
  const CLIENT_TYPE_COLORS: Record<string, string> = {
    comprador: "bg-blue-100 text-blue-700", vendedor: "bg-green-100 text-green-700",
    locatario: "bg-purple-100 text-purple-700", locador: "bg-orange-100 text-orange-700",
    fiador: "bg-gray-100 text-gray-700",
  };

  return (
    <DashboardShell
      searchPlaceholder="Buscar clientes..."
      headerRight={
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={() => setShowNewClient(true)}>
          <Plus className="w-4 h-4" /> Novo cliente
        </Button>
      }
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{(clients as any[]).length} clientes cadastrados</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-border p-4 mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF, e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Client Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border text-center py-16">
          <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm mb-4">Nenhum cliente encontrado</p>
          <Button size="sm" variant="outline" onClick={() => setShowNewClient(true)}>
            <Plus className="w-4 h-4 mr-1" /> Cadastrar primeiro cliente
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client: any) => (
            <div key={client.id} className="bg-white rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                    {client.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{client.name}</div>
                    {client.cpfCnpj && <div className="text-xs text-muted-foreground">{client.cpfCnpj}</div>}
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CLIENT_TYPE_COLORS[client.clientType] || "bg-gray-100 text-gray-700"}`}>
                  {CLIENT_TYPE_LABELS[client.clientType] || client.clientType}
                </span>
              </div>
              <div className="space-y-1.5">
                {client.email && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" /> {client.email}
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" /> {client.phone}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                <Button variant="outline" size="sm" className="flex-1 text-xs h-8">
                  <FileText className="w-3.5 h-3.5 mr-1" /> Documentos
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs h-8">
                  <Building2 className="w-3.5 h-3.5 mr-1" /> Negócios
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Client Modal */}
      {showNewClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Novo Cliente</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Tipo *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["comprador", "vendedor", "locatario", "locador", "fiador"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setNewClient({ ...newClient, clientType: t })}
                      className={`px-2 py-1.5 text-xs font-semibold rounded-lg border-2 transition-colors ${
                        newClient.clientType === t ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {CLIENT_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Nome completo *</label>
                <input
                  type="text"
                  placeholder="Nome do cliente"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">CPF / CNPJ</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={newClient.cpfCnpj}
                  onChange={(e) => setNewClient({ ...newClient, cpfCnpj: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Telefone</label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewClient(false)}>Cancelar</Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  if (!newClient.name) { toast.error("Informe o nome"); return; }
                  createClient.mutate(newClient);
                }}
                disabled={createClient.isPending}
              >
                {createClient.isPending ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
