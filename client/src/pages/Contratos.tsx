import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  FileText, Plus, Search, Filter, Eye, MoreVertical,
  Clock, CheckCircle2, MessageCircle, Zap, Home,
  BarChart3, Settings, Bell, LogOut,
  Users, Briefcase, Download, Trash2, ChevronRight,
  Building2, Mail, Send, Upload, Loader2,
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

function NewContractModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [imovel, setImovel] = useState("");
  const [propertyMode, setPropertyMode] = useState<"select" | "manual">("select");
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [vendedores, setVendedores] = useState([{ email: "", whatsapp: "" }]);
  const [compradores, setCompradores] = useState([{ email: "", whatsapp: "" }]);
  const [corretores, setCorretores] = useState([{ email: "", whatsapp: "" }]);
  const [matriculaFile, setMatriculaFile] = useState<{ name: string; url: string } | null>(null);
  const [matriculaOcrFields, setMatriculaOcrFields] = useState<{ matricula?: string; cartorio?: string } | null>(null);
  const [matriculaLoading, setMatriculaLoading] = useState(false);
  const matriculaInputRef = useRef<HTMLInputElement | null>(null);

  const utils = trpc.useUtils();
  const { data: properties = [] } = trpc.properties.list.useQuery();
  const createMutation = trpc.contracts.create.useMutation({
    onSuccess: () => { utils.contracts.list.invalidate(); onCreated(); onClose(); },
  });

  const addRow = (setter: React.Dispatch<React.SetStateAction<{ email: string; whatsapp: string }[]>>) =>
    setter((prev) => [...prev, { email: "", whatsapp: "" }]);
  const updateRow = (setter: React.Dispatch<React.SetStateAction<{ email: string; whatsapp: string }[]>>, index: number, field: "email" | "whatsapp", value: string) =>
    setter((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  const removeRow = (setter: React.Dispatch<React.SetStateAction<{ email: string; whatsapp: string }[]>>, index: number) =>
    setter((prev) => prev.filter((_, i) => i !== index));

  const [ocrLoading, setOcrLoading] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const uploadOcrMutation = trpc.documents.upload.useMutation();
  const processOcrMutation = trpc.documents.processOcr.useMutation();

  const handleMatriculaUpload = async (file: File) => {
    setMatriculaLoading(true);
    try {
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const doc = await uploadOcrMutation.mutateAsync({
        name: file.name,
        docType: "outro",
        fileBase64,
        mimeType: file.type,
        fileSize: file.size,
      });
      setMatriculaFile({ name: file.name, url: (doc as any).fileUrl || "" });
      const ocr = await processOcrMutation.mutateAsync({
        documentId: (doc as any).documentId,
        fileUrl: (doc as any).fileUrl,
        docType: "matricula",
      });
      const fields = (ocr as any)?.fields || {};
      const matricula = fields.matricula || fields.numero_matricula || fields.registration_number || "";
      const cartorio = fields.cartorio || fields.cartorio_registro || fields.registry_office || "";
      if (matricula || cartorio) setMatriculaOcrFields({ matricula, cartorio });
    } catch (err) {
      console.error("Matrícula upload error:", err);
    } finally {
      setMatriculaLoading(false);
    }
  };

  const handleDocUpload = async (
    file: File,
    setter: React.Dispatch<React.SetStateAction<{ email: string; whatsapp: string }[]>>,
    index: number,
    key: string
  ) => {
    setOcrLoading((prev) => ({ ...prev, [key]: true }));
    try {
      // Read file as base64
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload to S3 via tRPC (base64)
      const doc = await uploadOcrMutation.mutateAsync({
        name: file.name,
        docType: "outro",
        fileBase64,
        mimeType: file.type,
        fileSize: file.size,
      });

      // Run OCR
      const ocr = await processOcrMutation.mutateAsync({
        documentId: (doc as any).documentId,
        fileUrl: (doc as any).fileUrl,
        docType: "documento",
      });
      const fields = (ocr as any)?.fields || {};

      // Extract email and whatsapp from OCR fields
      const email = fields.email || fields.e_mail || "";
      const whatsapp = fields.whatsapp || fields.celular || fields.telefone || fields.phone || "";

      if (email) updateRow(setter, index, "email", email);
      if (whatsapp) updateRow(setter, index, "whatsapp", whatsapp);
    } catch (err) {
      console.error("OCR upload error:", err);
    } finally {
      setOcrLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const PartySection = ({ title, icon: Icon, rows, setter, addLabel, sectionKey }: {
    title: string; icon: React.ElementType;
    rows: { email: string; whatsapp: string }[];
    setter: React.Dispatch<React.SetStateAction<{ email: string; whatsapp: string }[]>>;
    addLabel: string;
    sectionKey: string;
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
      {rows.map((row, i) => {
        const key = `${sectionKey}-${i}`;
        return (
          <div key={i} className="space-y-2 mb-3">
            <div className="flex items-center gap-2">
              <input type="email" placeholder={`E-mail ${i + 1} *`} value={row.email}
                onChange={(e) => updateRow(setter, i, "email", e.target.value)}
                className="flex-1 bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              {/* Upload doc button */}
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                ref={(el) => { fileInputRefs.current[key] = el; }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleDocUpload(file, setter, i, key);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                title="Enviar documento para preencher automaticamente"
                onClick={() => fileInputRefs.current[key]?.click()}
                disabled={ocrLoading[key]}
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-[#2a2d3a] bg-[#0f1117] text-gray-400 hover:text-blue-400 hover:border-blue-500 transition-colors disabled:opacity-50"
              >
                {ocrLoading[key] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              </button>
            </div>
            <input type="tel" placeholder={`WhatsApp ${i + 1} (opcional)`} value={row.whatsapp}
              onChange={(e) => updateRow(setter, i, "whatsapp", e.target.value)}
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
            {rows.length > 1 && (
              <button onClick={() => removeRow(setter, i)} className="text-xs text-red-400 hover:text-red-300 transition-colors">Remover</button>
            )}
          </div>
        );
      })}
    </div>
  );

  const handleCreate = () => {
    const descricao = propertyMode === "select" && selectedPropertyId
      ? (properties as any[]).find((p: any) => p.id === selectedPropertyId)?.description ||
        (properties as any[]).find((p: any) => p.id === selectedPropertyId)?.street ||
        `Imóvel #${selectedPropertyId}`
      : imovel.trim();
    if (!descricao) return;
    createMutation.mutate({
      descricaoImovel: descricao,
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
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="text-white font-semibold text-sm">Identificação do Imóvel</span>
            </div>
            {/* Toggle: select vs manual */}
            <div className="flex rounded-xl overflow-hidden border border-[#2a2d3a] mb-3">
              <button
                onClick={() => setPropertyMode("select")}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                  propertyMode === "select"
                    ? "bg-blue-600 text-white"
                    : "bg-[#0f1117] text-gray-400 hover:text-gray-200"
                }`}
              >
                Imóvel Cadastrado
              </button>
              <button
                onClick={() => setPropertyMode("manual")}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                  propertyMode === "manual"
                    ? "bg-blue-600 text-white"
                    : "bg-[#0f1117] text-gray-400 hover:text-gray-200"
                }`}
              >
                Digitar Descrição
              </button>
            </div>
            {propertyMode === "select" ? (
              (properties as any[]).length === 0 ? (
                <div className="bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-3 py-3 text-center">
                  <p className="text-gray-500 text-xs">Nenhum imóvel cadastrado.</p>
                  <button
                    onClick={() => setPropertyMode("manual")}
                    className="text-blue-400 text-xs hover:underline mt-1"
                  >
                    Digitar descrição manualmente
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {(properties as any[]).map((p: any) => {
                    const label = p.description || p.street || `Imóvel #${p.id}`;
                    const sub = [p.city, p.state].filter(Boolean).join(", ");
                    const isSelected = selectedPropertyId === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPropertyId(isSelected ? null : p.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${
                          isSelected
                            ? "border-blue-500 bg-blue-500/10 text-white"
                            : "border-[#2a2d3a] bg-[#0f1117] text-gray-300 hover:border-blue-400"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Home className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">{label}</span>
                          {p.propertyType && (
                            <span className="ml-auto text-xs text-gray-500 flex-shrink-0">{p.propertyType}</span>
                          )}
                        </div>
                        {sub && <p className="text-xs text-gray-500 mt-0.5 ml-5">{sub}</p>}
                      </button>
                    );
                  })}
                </div>
              )
            ) : (
              <>
                <input type="text" placeholder="Ex: Apartamento 302 - Ed. Solar das Flores *" value={imovel}
                  onChange={(e) => setImovel(e.target.value)}
                  className="w-full bg-[#0f1117] border border-blue-500 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-400" />
                <p className="text-gray-600 text-xs mt-1">O endereço completo será preenchido na etapa de detalhes pelo corretor.</p>
              </>
            )}

            {/* Matrícula upload */}
            <div className="mt-3 pt-3 border-t border-[#2a2d3a]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-medium">Matrícula do Imóvel</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  ref={matriculaInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleMatriculaUpload(file);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => matriculaInputRef.current?.click()}
                  disabled={matriculaLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2d3a] bg-[#0f1117] text-xs text-gray-300 hover:text-blue-400 hover:border-blue-500 transition-colors disabled:opacity-50"
                >
                  {matriculaLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {matriculaLoading ? "Processando..." : "Enviar Matrícula"}
                </button>
              </div>
              {matriculaFile && (
                <div className="bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-3 py-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span className="text-xs text-gray-300 truncate">{matriculaFile.name}</span>
                    {matriculaFile.url && (
                      <a href={matriculaFile.url} target="_blank" rel="noreferrer" className="ml-auto text-xs text-blue-400 hover:underline flex-shrink-0">Ver</a>
                    )}
                  </div>
                  {matriculaOcrFields && (matriculaOcrFields.matricula || matriculaOcrFields.cartorio) && (
                    <div className="pt-1 border-t border-[#2a2d3a] space-y-1">
                      {matriculaOcrFields.matricula && (
                        <p className="text-xs text-gray-400">Matrícula: <span className="text-white font-medium">{matriculaOcrFields.matricula}</span></p>
                      )}
                      {matriculaOcrFields.cartorio && (
                        <p className="text-xs text-gray-400">Cartório: <span className="text-white font-medium">{matriculaOcrFields.cartorio}</span></p>
                      )}
                    </div>
                  )}
                </div>
              )}
              {!matriculaFile && (
                <p className="text-xs text-gray-600">Envie o PDF ou foto da matrícula para extrair os dados automaticamente via OCR.</p>
              )}
            </div>
          </div>
          <PartySection title="Vendedores" icon={Users} rows={vendedores} setter={setVendedores} addLabel="Adicionar Vendedor" sectionKey="vend" />
          <PartySection title="Compradores" icon={Users} rows={compradores} setter={setCompradores} addLabel="Adicionar Comprador" sectionKey="comp" />
          <PartySection title="Corretores" icon={Briefcase} rows={corretores} setter={setCorretores} addLabel="Adicionar Corretor" sectionKey="corr" />
        </div>
        <div className="flex items-center gap-3 px-5 py-4 border-t border-[#2a2d3a]">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#2a2d3a] text-gray-400 hover:text-white text-sm font-semibold transition-colors">Cancelar</button>
          <button onClick={handleCreate} disabled={(propertyMode === "manual" ? !imovel.trim() : !selectedPropertyId) || createMutation.isPending}
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
  const [distribuicaoContract, setDistribuicaoContract] = useState<Contract | null>(null);
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
      {distribuicaoContract && <DistribuicaoModal contract={distribuicaoContract} onClose={() => setDistribuicaoContract(null)} />}
      {menuOpen !== null && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}
    </div>
  );
}
