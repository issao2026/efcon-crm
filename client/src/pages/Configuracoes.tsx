import { useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Settings, User, Building2, Bell, Shield, Save } from "lucide-react";

export default function Configuracoes() {
  const [profile, setProfile] = useState({
    name: "Marcello & Oliveira",
    creci: "28.867 J",
    email: "contato@marcellooliveira.com.br",
    phone: "(62) 99999-0000",
    address: "Goiânia - GO",
  });

  const handleSave = () => {
    toast.success("Configurações salvas com sucesso!");
  };

  return (
    <DashboardShell searchPlaceholder="Buscar configurações...">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Gerencie as configurações da sua conta</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar nav */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            {[
              { icon: User, label: "Perfil", active: true },
              { icon: Building2, label: "Imobiliária" },
              { icon: Bell, label: "Notificações" },
              { icon: Shield, label: "Segurança" },
            ].map((item) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-b border-border last:border-0 ${
                  item.active ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-bold text-gray-900 mb-5">Perfil da imobiliária</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Nome / Razão social</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">CRECI</label>
                <input
                  type="text"
                  value={profile.creci}
                  onChange={(e) => setProfile({ ...profile, creci: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">E-mail</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Telefone</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Endereço</label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={handleSave}>
                <Save className="w-4 h-4" /> Salvar alterações
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
