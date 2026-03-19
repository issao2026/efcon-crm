import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Zap, ArrowLeft, ArrowRight, FileOutput, Download, Eye,
  Loader2, CheckCircle2, User, Home, DollarSign, Users,
  ChevronDown, ChevronUp, RefreshCw, FileText, Scale, Building2, Repeat2
} from "lucide-react";
import { getLoginUrl } from "@/const";

// ─── Types ───────────────────────────────────────────────────────────────────
type ContractType = "compra_venda" | "locacao" | "permuta" | "financiamento";

interface ContractFormData {
  // Tipo
  contractType: ContractType;
  // Vendedor / Locador
  vendedorNome: string;
  vendedorCpf: string;
  vendedorRg: string;
  vendedorNacionalidade: string;
  vendedorEstadoCivil: string;
  vendedorProfissao: string;
  vendedorEndereco: string;
  // Comprador / Locatário
  compradorNome: string;
  compradorCpf: string;
  compradorRg: string;
  compradorNacionalidade: string;
  compradorEstadoCivil: string;
  compradorProfissao: string;
  compradorEndereco: string;
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
  corretorNome: string;
  corretorCreci: string;
}

const INITIAL_FORM: ContractFormData = {
  contractType: "compra_venda",
  vendedorNome: "", vendedorCpf: "", vendedorRg: "", vendedorNacionalidade: "brasileiro(a)",
  vendedorEstadoCivil: "solteiro(a)", vendedorProfissao: "", vendedorEndereco: "",
  compradorNome: "", compradorCpf: "", compradorRg: "", compradorNacionalidade: "brasileiro(a)",
  compradorEstadoCivil: "solteiro(a)", compradorProfissao: "", compradorEndereco: "",
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
  corretorNome: "Marcello & Oliveira", corretorCreci: "28.867 J",
};

const CONTRACT_TYPE_OPTIONS = [
  { value: "compra_venda", label: "Compra e Venda" },
  { value: "locacao", label: "Locação" },
  { value: "permuta", label: "Permuta" },
  { value: "financiamento", label: "Financiamento" },
];

// ─── Field component ─────────────────────────────────────────────────────────
function Field({
  label, name, value, onChange, type = "text", required, placeholder, options, className
}: {
  label: string; name: keyof ContractFormData; value: string;
  onChange: (name: keyof ContractFormData, value: string) => void;
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
          onChange={(e) => onChange(name, e.target.value)}
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
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
      />
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────
function Section({
  title, icon: Icon, children, defaultOpen = true
}: {
  title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean;
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
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>}
    </div>
  );
}

// ─── Contract Preview ─────────────────────────────────────────────────────────
function ContractPreview({ form }: { form: ContractFormData }) {
  const typeLabel = CONTRACT_TYPE_OPTIONS.find((o) => o.value === form.contractType)?.label || "Compra e Venda";
  const isLocacao = form.contractType === "locacao";

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8 font-serif text-sm leading-relaxed text-gray-800 max-h-[600px] overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-2">Marcello & Oliveira Imóveis</div>
        <div className="text-xs text-gray-400 mb-4">CRECI {form.corretorCreci} · Brasília, DF</div>
        <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">
          Contrato de {typeLabel}
        </h2>
        <div className="h-0.5 bg-gray-200 mt-4" />
      </div>

      {/* Parties */}
      <p className="mb-4">
        Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente{" "}
        <strong>Contrato de {typeLabel}</strong>, que se regerá pelas cláusulas e condições seguintes:
      </p>

      <p className="mb-2"><strong>{isLocacao ? "LOCADOR(A):" : "VENDEDOR(A):"}</strong></p>
      <p className="mb-4 pl-4 text-gray-700">
        {form.vendedorNome || "[NOME DO VENDEDOR]"}, {form.vendedorNacionalidade}, {form.vendedorEstadoCivil},
        {form.vendedorProfissao ? ` ${form.vendedorProfissao},` : ""} portador(a) do CPF nº{" "}
        {form.vendedorCpf || "[CPF]"}, RG nº {form.vendedorRg || "[RG]"}, residente e domiciliado(a) em{" "}
        {form.vendedorEndereco || "[ENDEREÇO]"}.
      </p>

      <p className="mb-2"><strong>{isLocacao ? "LOCATÁRIO(A):" : "COMPRADOR(A):"}</strong></p>
      <p className="mb-4 pl-4 text-gray-700">
        {form.compradorNome || "[NOME DO COMPRADOR]"}, {form.compradorNacionalidade}, {form.compradorEstadoCivil},
        {form.compradorProfissao ? ` ${form.compradorProfissao},` : ""} portador(a) do CPF nº{" "}
        {form.compradorCpf || "[CPF]"}, RG nº {form.compradorRg || "[RG]"}, residente e domiciliado(a) em{" "}
        {form.compradorEndereco || "[ENDEREÇO]"}.
      </p>

      <div className="h-px bg-gray-100 my-4" />

      <p className="mb-2"><strong>CLÁUSULA 1ª – DO OBJETO</strong></p>
      <p className="mb-4 text-gray-700">
        O presente contrato tem por objeto o imóvel{" "}
        {form.imovelDescricao || "[DESCRIÇÃO DO IMÓVEL]"}, localizado em{" "}
        {form.imovelEndereco || "[ENDEREÇO DO IMÓVEL]"}, com área total de{" "}
        {form.imovelAreaTotal || "[ÁREA]"} m², registrado sob a matrícula nº{" "}
        {form.imovelMatricula || "[MATRÍCULA]"} no {form.imovelCartorio || "[CARTÓRIO]"}.
      </p>

      <p className="mb-2"><strong>CLÁUSULA 2ª – DO PREÇO E FORMA DE PAGAMENTO</strong></p>
      <p className="mb-4 text-gray-700">
        O valor {isLocacao ? "do aluguel mensal" : "total da transação"} é de{" "}
        <strong>R$ {form.valorTotal || "[VALOR]"}</strong>, a ser pago mediante{" "}
        {form.formaPagamento || "[FORMA DE PAGAMENTO]"}.
        {form.valorSinal && ` Sinal de R$ ${form.valorSinal} a ser pago na assinatura.`}
        {form.valorFinanciamento && ` Valor financiado: R$ ${form.valorFinanciamento}.`}
      </p>

      <p className="mb-2"><strong>CLÁUSULA 3ª – DA ENTREGA</strong></p>
      <p className="mb-4 text-gray-700">
        A entrega do imóvel será realizada na data acordada entre as partes, livre e desembaraçado de quaisquer
        ônus, dívidas ou encargos que possam prejudicar o pleno exercício do direito do{" "}
        {isLocacao ? "locatário" : "comprador"}.
      </p>

      <p className="mb-2"><strong>CLÁUSULA 4ª – DAS OBRIGAÇÕES</strong></p>
      <p className="mb-4 text-gray-700">
        As partes se obrigam a cumprir fielmente todas as disposições do presente contrato, respondendo cada
        qual pelos danos causados em decorrência do descumprimento de suas obrigações.
      </p>

      <div className="h-px bg-gray-100 my-4" />

      <p className="mb-6 text-gray-700">
        E por estarem assim justos e contratados, firmam o presente instrumento em 02 (duas) vias de igual
        teor e forma, na presença das testemunhas abaixo.
      </p>

      <p className="mb-8 text-gray-700">
        {form.localAssinatura}, {form.dataAssinatura}.
      </p>

      <div className="grid grid-cols-2 gap-8 mt-8">
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2">
            <div className="font-semibold">{form.vendedorNome || "[VENDEDOR]"}</div>
            <div className="text-xs text-gray-500">CPF: {form.vendedorCpf || "[CPF]"}</div>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2">
            <div className="font-semibold">{form.compradorNome || "[COMPRADOR]"}</div>
            <div className="text-xs text-gray-500">CPF: {form.compradorCpf || "[CPF]"}</div>
          </div>
        </div>
      </div>

      {(form.testemunha1Nome || form.testemunha2Nome) && (
        <div className="mt-8">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Testemunhas:</p>
          <div className="grid grid-cols-2 gap-8">
            {form.testemunha1Nome && (
              <div className="text-center">
                <div className="border-t border-gray-400 pt-2">
                  <div className="font-semibold text-sm">{form.testemunha1Nome}</div>
                  <div className="text-xs text-gray-500">CPF: {form.testemunha1Cpf || "[CPF]"}</div>
                </div>
              </div>
            )}
            {form.testemunha2Nome && (
              <div className="text-center">
                <div className="border-t border-gray-400 pt-2">
                  <div className="font-semibold text-sm">{form.testemunha2Nome}</div>
                  <div className="text-xs text-gray-500">CPF: {form.testemunha2Cpf || "[CPF]"}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
        Intermediado por: {form.corretorNome} · CRECI {form.corretorCreci}
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
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [prefillDealId, setPrefillDealId] = useState<number | null>(null);

  // Read dealId from URL query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dealId = params.get('dealId');
    if (dealId && !isNaN(parseInt(dealId))) setPrefillDealId(parseInt(dealId));
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
    setForm((prev) => ({
      ...prev,
      contractType: deal.type === 'locacao' ? 'locacao' : deal.type === 'permuta' ? 'permuta' : deal.type === 'financiamento' ? 'financiamento' : 'compra_venda',
      compradorNome: buyer?.name || prev.compradorNome,
      compradorCpf: buyer?.cpfCnpj || prev.compradorCpf,
      compradorRg: buyer?.rg || prev.compradorRg,
      compradorNacionalidade: buyer?.nationality || prev.compradorNacionalidade,
      compradorEstadoCivil: buyer?.maritalStatus || prev.compradorEstadoCivil,
      compradorProfissao: buyer?.profession || prev.compradorProfissao,
      compradorEndereco: buyer?.address || prev.compradorEndereco,
      vendedorNome: seller?.name || prev.vendedorNome,
      vendedorCpf: seller?.cpfCnpj || prev.vendedorCpf,
      vendedorRg: seller?.rg || prev.vendedorRg,
      vendedorNacionalidade: seller?.nationality || prev.vendedorNacionalidade,
      vendedorEstadoCivil: seller?.maritalStatus || prev.vendedorEstadoCivil,
      vendedorProfissao: seller?.profession || prev.vendedorProfissao,
      vendedorEndereco: seller?.address || prev.vendedorEndereco,
      corretorNome: broker?.name || prev.corretorNome,
      valorTotal: deal.totalValue || deal.monthlyValue || prev.valorTotal,
    }));
  }, [dealData, clientsList]);

  const generateMutation = trpc.contracts.generate.useMutation();
  const aiSuggestMutation = trpc.contracts.suggestFields.useMutation();

  // Helper to fill a section from a client record
  const fillFromClient = (client: any, prefix: 'vendedor' | 'comprador' | 'corretor') => {
    if (!client) return;
    if (prefix === 'corretor') {
      setForm((prev) => ({ ...prev, corretorNome: client.name || prev.corretorNome }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      [`${prefix}Nome`]: client.name || prev[`${prefix}Nome` as keyof ContractFormData],
      [`${prefix}Cpf`]: client.cpfCnpj || prev[`${prefix}Cpf` as keyof ContractFormData],
      [`${prefix}Rg`]: client.rg || prev[`${prefix}Rg` as keyof ContractFormData],
      [`${prefix}Nacionalidade`]: client.nationality || prev[`${prefix}Nacionalidade` as keyof ContractFormData],
      [`${prefix}EstadoCivil`]: client.maritalStatus || prev[`${prefix}EstadoCivil` as keyof ContractFormData],
      [`${prefix}Profissao`]: client.profession || prev[`${prefix}Profissao` as keyof ContractFormData],
      [`${prefix}Endereco`]: client.address || prev[`${prefix}Endereco` as keyof ContractFormData],
    }));
  };

  const setField = (name: keyof ContractFormData, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAiSuggest = async () => {
    setIsAiLoading(true);
    try {
      const partialFields: Record<string, string> = {
        nome_vendedor: form.vendedorNome,
        cpf_cnpj_vendedor: form.vendedorCpf,
        nome_comprador: form.compradorNome,
        cpf_cnpj_comprador: form.compradorCpf,
        descricao_imovel: form.imovelDescricao,
        endereco_imovel: form.imovelEndereco,
        valor_total_contrato: form.valorTotal,
      };
      const result = await aiSuggestMutation.mutateAsync({
        partialFields,
        context: `Contrato de ${CONTRACT_TYPE_OPTIONS.find((o) => o.value === form.contractType)?.label}`,
      });
      if (result.suggestions) {
        toast.success("Sugestões da IA disponíveis! Revise os campos.");
      }
    } catch {
      toast.error("Erro ao buscar sugestões da IA");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!form.vendedorNome || !form.compradorNome || !form.imovelEndereco || !form.valorTotal) {
      toast.error("Preencha os campos obrigatórios: vendedor, comprador, imóvel e valor");
      return;
    }

    setIsGenerating(true);
    try {
      const fields: Record<string, string> = {
        nome_vendedor: form.vendedorNome,
        nacionalidade_vendedor: form.vendedorNacionalidade,
        estado_civil_vendedor: form.vendedorEstadoCivil,
        profissao_vendedor: form.vendedorProfissao,
        tipo_documento_vendedor: 'RG',
        numero_documento_vendedor: form.vendedorRg,
        cpf_cnpj_vendedor: form.vendedorCpf,
        endereco_vendedor: form.vendedorEndereco,
        nome_comprador: form.compradorNome,
        nacionalidade_comprador: form.compradorNacionalidade,
        estado_civil_comprador: form.compradorEstadoCivil,
        profissao_comprador: form.compradorProfissao,
        tipo_documento_comprador: 'RG',
        numero_documento_comprador: form.compradorRg,
        cpf_cnpj_comprador: form.compradorCpf,
        endereco_comprador: form.compradorEndereco,
        descricao_imovel: form.imovelDescricao,
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
        creci_imobiliaria: form.corretorCreci,
        endereco_imobiliaria: form.imobiliariaEndereco,
        foro_eleito: form.foro,
        cidade_assinatura: form.localAssinatura,
        data_assinatura: form.dataAssinatura,
        nome_testemunha_1: form.testemunha1Nome,
        cpf_testemunha_1: form.testemunha1Cpf,
        nome_testemunha_2: form.testemunha2Nome,
        cpf_testemunha_2: form.testemunha2Cpf,
        // Locação-specific fields
        prazo_locacao: form.prazoLocacao || 'N/A',
        dia_vencimento_aluguel: form.diaVencimentoAluguel || 'N/A',
        tipo_garantia: form.tipoGarantia || 'N/A',
        valor_garantia: form.valorGarantia ? `R$ ${form.valorGarantia}` : 'N/A',
        indice_reajuste: form.indiceReajuste || 'IGPM',
        multa_rescisao_antecipada: form.multaRescisaoAntecipada || 'N/A',
        destinacao_imovel: form.destinacaoImovel || 'residencial',
        tipo_contrato: form.contractType === 'locacao' ? 'LOCAÇÃO' : form.contractType === 'permuta' ? 'PERMUTA' : form.contractType === 'financiamento' ? 'FINANCIAMENTO' : 'COMPRA E VENDA',
      };
      const result = await generateMutation.mutateAsync({ fields });
      setGeneratedPdfUrl(result.contractUrl);
      toast.success("Contrato gerado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao gerar contrato");
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
              onClick={handleAiSuggest}
              disabled={isAiLoading}
            >
              {isAiLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> IA pensando...</>
              ) : (
                <><RefreshCw className="w-4 h-4" /> Sugerir com IA</>
              )}
            </Button>
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
                    onClick={() => setField("contractType", opt.value)}
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

            <Section title={form.contractType === "locacao" ? "Dados do Locador" : "Dados do Vendedor"} icon={User}>
              <div className="md:col-span-2 mb-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Selecionar cliente cadastrado</label>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const c = (clientsList as any[]).find((x: any) => String(x.id) === e.target.value);
                    if (c) fillFromClient(c, 'vendedor');
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                >
                  <option value="">— Buscar vendedor cadastrado —</option>
                  {(clientsList as any[]).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} {c.clientRole ? `(${c.clientRole})` : ''}</option>
                  ))}
                </select>
              </div>
              <Field label="Nome completo" name="vendedorNome" value={form.vendedorNome} onChange={setField} required placeholder="Nome completo" />
              <Field label="CPF" name="vendedorCpf" value={form.vendedorCpf} onChange={setField} required placeholder="000.000.000-00" />
              <Field label="RG" name="vendedorRg" value={form.vendedorRg} onChange={setField} placeholder="00.000.000-0" />
              <Field label="Nacionalidade" name="vendedorNacionalidade" value={form.vendedorNacionalidade} onChange={setField} />
              <Field label="Estado civil" name="vendedorEstadoCivil" value={form.vendedorEstadoCivil} onChange={setField}
                options={[
                  { value: "solteiro(a)", label: "Solteiro(a)" },
                  { value: "casado(a)", label: "Casado(a)" },
                  { value: "divorciado(a)", label: "Divorciado(a)" },
                  { value: "viúvo(a)", label: "Viúvo(a)" },
                  { value: "separado(a)", label: "Separado(a)" },
                ]}
              />
              <Field label="Profissão" name="vendedorProfissao" value={form.vendedorProfissao} onChange={setField} />
              <div className="md:col-span-2">
                <Field label="Endereço completo" name="vendedorEndereco" value={form.vendedorEndereco} onChange={setField} placeholder="Rua, número, bairro, cidade, estado" />
              </div>
            </Section>

            <Section title={form.contractType === "locacao" ? "Dados do Locatário" : "Dados do Comprador"} icon={User}>
              <div className="md:col-span-2 mb-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Selecionar cliente cadastrado</label>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const c = (clientsList as any[]).find((x: any) => String(x.id) === e.target.value);
                    if (c) fillFromClient(c, 'comprador');
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                >
                  <option value="">— Buscar comprador cadastrado —</option>
                  {(clientsList as any[]).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} {c.clientRole ? `(${c.clientRole})` : ''}</option>
                  ))}
                </select>
              </div>
              <Field label="Nome completo" name="compradorNome" value={form.compradorNome} onChange={setField} required placeholder="Nome completo" />
              <Field label="CPF" name="compradorCpf" value={form.compradorCpf} onChange={setField} required placeholder="000.000.000-00" />
              <Field label="RG" name="compradorRg" value={form.compradorRg} onChange={setField} placeholder="00.000.000-0" />
              <Field label="Nacionalidade" name="compradorNacionalidade" value={form.compradorNacionalidade} onChange={setField} />
              <Field label="Estado civil" name="compradorEstadoCivil" value={form.compradorEstadoCivil} onChange={setField}
                options={[
                  { value: "solteiro(a)", label: "Solteiro(a)" },
                  { value: "casado(a)", label: "Casado(a)" },
                  { value: "divorciado(a)", label: "Divorciado(a)" },
                  { value: "viúvo(a)", label: "Viúvo(a)" },
                  { value: "separado(a)", label: "Separado(a)" },
                ]}
              />
              <Field label="Profissão" name="compradorProfissao" value={form.compradorProfissao} onChange={setField} />
              <div className="md:col-span-2">
                <Field label="Endereço completo" name="compradorEndereco" value={form.compradorEndereco} onChange={setField} placeholder="Rua, número, bairro, cidade, estado" />
              </div>
            </Section>

            <Section title="Dados do Imóvel" icon={Home}>
              <div className="md:col-span-2 mb-1">
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
              <div className="md:col-span-2">
                <Field label="Descrição do imóvel" name="imovelDescricao" value={form.imovelDescricao} onChange={setField} required placeholder="Ex: Apartamento, 3 quartos, 2 banheiros" />
              </div>
              <div className="md:col-span-2">
                <Field label="Endereço do imóvel" name="imovelEndereco" value={form.imovelEndereco} onChange={setField} required placeholder="Endereço completo do imóvel" />
              </div>
              <Field label="Matrícula" name="imovelMatricula" value={form.imovelMatricula} onChange={setField} placeholder="Nº da matrícula" />
              <Field label="Cartório de Registro" name="imovelCartorio" value={form.imovelCartorio} onChange={setField} placeholder="Nome do cartório" />
              <Field label="Área total (m²)" name="imovelAreaTotal" value={form.imovelAreaTotal} onChange={setField} placeholder="Ex: 98,50" />
              <div className="md:col-span-2">
                <Field label="Itens que permanecem no imóvel" name="imovelItens" value={form.imovelItens} onChange={setField} placeholder="Ex: Armários embutidos, ar-condicionado..." />
              </div>
            </Section>

            <Section title="Dados Financeiros" icon={DollarSign}>
              <Field label={form.contractType === "locacao" ? "Valor do aluguel mensal (R$)" : "Valor total (R$)"} name="valorTotal" value={form.valorTotal} onChange={setField} required placeholder={form.contractType === "locacao" ? "Ex: 2500" : "Ex: 485000"} />
              {form.contractType !== "locacao" && (
                <Field label="Valor do sinal (R$)" name="valorSinal" value={form.valorSinal} onChange={setField} placeholder="Ex: 50000" />
              )}
              {(form.contractType === "compra_venda" || form.contractType === "financiamento") && (
                <Field label="Valor financiado (R$)" name="valorFinanciamento" value={form.valorFinanciamento} onChange={setField} placeholder="Ex: 350000" />
              )}
              {form.contractType !== "locacao" && (
                <Field label="Forma de pagamento" name="formaPagamento" value={form.formaPagamento} onChange={setField}
                  options={[
                    { value: "À vista", label: "À vista" },
                    { value: "Financiamento bancário", label: "Financiamento bancário" },
                    { value: "Parcelado", label: "Parcelado" },
                    { value: "Permuta", label: "Permuta" },
                  ]}
                />
              )}
              {form.contractType !== "locacao" && (
                <Field label="Data de vencimento" name="dataVencimento" value={form.dataVencimento} onChange={setField} type="date" />
              )}
            </Section>

            {/* Locação-specific section */}
            {form.contractType === "locacao" && (
              <Section title="Condições de Locação" icon={Scale} defaultOpen={true}>
                <Field label="Prazo de locação" name="prazoLocacao" value={form.prazoLocacao} onChange={setField} placeholder="Ex: 30 meses" required />
                <Field label="Dia de vencimento do aluguel" name="diaVencimentoAluguel" value={form.diaVencimentoAluguel} onChange={setField} placeholder="Ex: 10" />
                <Field label="Destinação do imóvel" name="destinacaoImovel" value={form.destinacaoImovel} onChange={setField}
                  options={[
                    { value: "residencial", label: "Residencial" },
                    { value: "comercial", label: "Comercial" },
                    { value: "misto", label: "Misto" },
                  ]}
                />
                <Field label="Índice de reajuste" name="indiceReajuste" value={form.indiceReajuste} onChange={setField}
                  options={[
                    { value: "IGPM", label: "IGP-M" },
                    { value: "IPCA", label: "IPCA" },
                    { value: "INPC", label: "INPC" },
                    { value: "IPC", label: "IPC" },
                  ]}
                />
                <Field label="Tipo de garantia" name="tipoGarantia" value={form.tipoGarantia} onChange={setField}
                  options={[
                    { value: "caução", label: "Caução (depósito)" },
                    { value: "fiador", label: "Fiador" },
                    { value: "seguro-fiança", label: "Seguro-fiança" },
                    { value: "título de capitalização", label: "Título de capitalização" },
                    { value: "sem garantia", label: "Sem garantia" },
                  ]}
                />
                {(form.tipoGarantia === "caução" || form.tipoGarantia === "título de capitalização") && (
                  <Field label="Valor da garantia (R$)" name="valorGarantia" value={form.valorGarantia} onChange={setField} placeholder="Ex: 7500 (3x aluguel)" />
                )}
                <Field label="Multa por rescisão antecipada" name="multaRescisaoAntecipada" value={form.multaRescisaoAntecipada} onChange={setField} placeholder="Ex: 3 alugueis proporcionais" />
                <Field label="Percentual de multa (%)" name="percentualMulta" value={form.percentualMulta} onChange={setField} placeholder="Ex: 10" />
                <Field label="Foro eleito" name="foro" value={form.foro} onChange={setField} placeholder="Ex: Brasília, Distrito Federal" className="md:col-span-2" />
              </Section>
            )}

            <Section title="Testemunhas" icon={Users} defaultOpen={false}>
              <Field label="Testemunha 1 – Nome" name="testemunha1Nome" value={form.testemunha1Nome} onChange={setField} placeholder="Nome completo" />
              <Field label="Testemunha 1 – CPF" name="testemunha1Cpf" value={form.testemunha1Cpf} onChange={setField} placeholder="000.000.000-00" />
              <Field label="Testemunha 2 – Nome" name="testemunha2Nome" value={form.testemunha2Nome} onChange={setField} placeholder="Nome completo" />
              <Field label="Testemunha 2 – CPF" name="testemunha2Cpf" value={form.testemunha2Cpf} onChange={setField} placeholder="000.000.000-00" />
            </Section>

            <Section title="Corretor & Assinatura" icon={FileText} defaultOpen={false}>
              <div className="md:col-span-2 mb-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Selecionar corretor cadastrado</label>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const c = (clientsList as any[]).find((x: any) => String(x.id) === e.target.value);
                    if (c) fillFromClient(c, 'corretor');
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                >
                  <option value="">— Buscar corretor cadastrado —</option>
                  {(clientsList as any[]).filter((c: any) => c.clientRole === 'corretor').map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  {(clientsList as any[]).filter((c: any) => c.clientRole !== 'corretor').length > 0 && (
                    <optgroup label="Outros clientes">
                      {(clientsList as any[]).filter((c: any) => c.clientRole !== 'corretor').map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.clientRole || 'sem categoria'})</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
              <Field label="Local de assinatura" name="localAssinatura" value={form.localAssinatura} onChange={setField} />
              <Field label="Data de assinatura" name="dataAssinatura" value={form.dataAssinatura} onChange={setField} />
              <Field label="Nome do corretor" name="corretorNome" value={form.corretorNome} onChange={setField} />
              <Field label="CRECI" name="corretorCreci" value={form.corretorCreci} onChange={setField} />
              <Field label="Plataforma de assinatura" name="plataformaAssinatura" value={form.plataformaAssinatura} onChange={setField}
                options={[
                  { value: "Clicksign", label: "Clicksign" },
                  { value: "DocuSign", label: "DocuSign" },
                  { value: "Assinatura física", label: "Assinatura física" },
                ]}
              />
            </Section>
            <Section title="Imobiliária" icon={Building2} defaultOpen={false}>
              <Field label="Razão social" name="imobiliariaNome" value={form.imobiliariaNome} onChange={setField} />
              <Field label="CNPJ" name="imobiliariaCnpj" value={form.imobiliariaCnpj} onChange={setField} placeholder="00.000.000/0001-00" />
              <Field label="Endereço da imobiliária" name="imobiliariaEndereco" value={form.imobiliariaEndereco} onChange={setField} className="md:col-span-2" />
            </Section>
{form.contractType !== "locacao" && (
            <Section title="Cláusulas Contratuais" icon={Scale} defaultOpen={false}>
              <Field label="Prazo de entrega da posse" name="prazoEntregaPosse" value={form.prazoEntregaPosse} onChange={setField} placeholder="Ex: 30 dias após assinatura" />
              <Field label="Condição de entrega" name="condicaoEntregaPosse" value={form.condicaoEntregaPosse} onChange={setField} placeholder="Ex: livre e desembaraçado" />
              <Field label="Prazo para escritura" name="prazoEscritura" value={form.prazoEscritura} onChange={setField} placeholder="Ex: 60 dias após quitação" />
              <Field label="Prazo de restituíção (distrato)" name="prazoRestituicaoValores" value={form.prazoRestituicaoValores} onChange={setField} placeholder="Ex: 30 dias" />
              <Field label="Prazo certidão objeto e pé" name="prazoCertidaoObjetoPe" value={form.prazoCertidaoObjetoPe} onChange={setField} placeholder="Ex: 30 dias" />
              <Field label="Qtd. exercícios IPTU" name="quantidadeExerciciosIptu" value={form.quantidadeExerciciosIptu} onChange={setField} placeholder="Ex: 1" />
              <Field label="Responsável pelas despesas" name="responsavelDespesas" value={form.responsavelDespesas} onChange={setField}
                options={[
                  { value: "comprador", label: "Comprador" },
                  { value: "vendedor", label: "Vendedor" },
                  { value: "ambos", label: "Ambos" },
                ]}
              />
              <Field label="Percentual de multa (%)" name="percentualMulta" value={form.percentualMulta} onChange={setField} placeholder="Ex: 10" />
              <Field label="Condições de distrato" name="condicoesDistrato" value={form.condicoesDistrato} onChange={setField} className="md:col-span-2" />
              <Field label="Foro eleito" name="foro" value={form.foro} onChange={setField} placeholder="Ex: Brasília, Distrito Federal" className="md:col-span-2" />
            </Section>
            )}
            {form.contractType === "permuta" && (
              <Section title="Dados da Permuta" icon={Repeat2} defaultOpen={true}>
                <Field label="Descrição do imóvel permutado" name="descricaoImovelPermuta" value={form.descricaoImovelPermuta} onChange={setField} className="md:col-span-2" />
                <Field label="Valor do imóvel permutado (R$)" name="valorImovelPermuta" value={form.valorImovelPermuta} onChange={setField} placeholder="Ex: 300000" />
                <Field label="Ajuste financeiro" name="ajusteFinanceiroPermuta" value={form.ajusteFinanceiroPermuta} onChange={setField} placeholder="Ex: R$ 50.000 a pagar" />
              </Section>
            )}

            {/* Generate button */}
            <div className="flex items-center gap-4 mt-6">
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
                    variant="outline"
                    onClick={() => { setGeneratedPdfUrl(null); }}
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
    </div>
  );
}
