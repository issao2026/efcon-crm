import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Zap, ArrowRight, Play, Users, FileText, Search, Shield,
  Monitor, FileSearch, CheckSquare, FileOutput, ChevronRight,
  Check, Building2, Home as HomeIcon, ArrowLeftRight, CreditCard,
  MapPin, Phone, Mail, Star, TrendingUp, Clock, Lock
} from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();

  const handleCTA = () => {
    if (isAuthenticated) {
      window.location.href = "/comecar";
    } else {
      // Store the intended destination so after OAuth we redirect there
      sessionStorage.setItem("efcon_post_login", "/comecar");
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Navbar ─────────────────────────────────────────────────── */}
      <nav className="efcon-hero-bg sticky top-0 z-50 border-b border-white/10">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg">Efcon</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#como-funciona" className="text-white/70 hover:text-white text-sm transition-colors">Como funciona</a>
            <a href="#funcionalidades" className="text-white/70 hover:text-white text-sm transition-colors">Funcionalidades</a>
            <a href="#operacoes" className="text-white/70 hover:text-white text-sm transition-colors">Operações</a>
            <a href="#planos" className="text-white/70 hover:text-white text-sm transition-colors">Planos</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 text-sm" onClick={handleCTA}>
              Entrar
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4" onClick={handleCTA}>
              Começar grátis <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────── */}
      <section className="efcon-hero-bg min-h-[88vh] flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-8 bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs tracking-widest uppercase px-4 py-1.5">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full inline-block mr-2" />
            Plataforma Imobiliária com IA
          </Badge>

          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
            Contratos imobiliários<br />
            <span className="efcon-gradient-text">gerados em minutos</span>
          </h1>

          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            Comprador, vendedor e corretor preenchem seus dados —<br className="hidden md:block" />
            o sistema monta o contrato, analisa documentos com OCR<br className="hidden md:block" />
            e organiza todo o processo em um único painel.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-base font-semibold rounded-xl"
              onClick={handleCTA}
            >
              Criar conta grátis <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 bg-transparent px-8 py-6 text-base rounded-xl"
              onClick={handleCTA}
            >
              <Play className="w-4 h-4 mr-2" /> Ver demonstração
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { value: "10k+", label: "Contratos gerados", highlight: "k+" },
              { value: "99.9%", label: "Precisão OCR", highlight: ".9%" },
              { value: "<5min", label: "Tempo médio", highlight: "min" },
              { value: "100%", label: "LGPD compliant", highlight: "%" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="text-2xl font-black text-white mb-1">
                  {stat.value.replace(stat.highlight, "")}
                  <span className="text-blue-400">{stat.highlight}</span>
                </div>
                <div className="text-white/50 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Como Funciona ───────────────────────────────────────────── */}
      <section id="como-funciona" className="py-24 bg-white">
        <div className="container">
          <div className="mb-16">
            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-xs tracking-widest uppercase mb-4">
              Como funciona
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-4">
              Do cadastro ao contrato<br />assinado em 4 etapas
            </h2>
            <p className="text-gray-500 text-lg max-w-lg">
              Fluxo completo para venda, locação e permuta, sem papelada, sem retrabalho.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: Users,
                title: "Cadastro das partes",
                desc: "Comprador, vendedor e corretor preenchem seus dados. Cada participante acessa via link exclusivo, seguro e rastreável.",
              },
              {
                step: "02",
                icon: FileText,
                title: "Upload de documentos",
                desc: "RG, CPF, comprovantes e matrícula do imóvel são enviados pelo painel. OCR extrai os dados automaticamente.",
              },
              {
                step: "03",
                icon: Search,
                title: "Análise e validação",
                desc: "O sistema verifica todos os documentos, preenche o checklist jurídico automaticamente e sinaliza pendências.",
              },
              {
                step: "04",
                icon: Shield,
                title: "Geração do contrato",
                desc: "O contrato é montado automaticamente com todos os dados validados, pronto para assinatura digital.",
              },
            ].map((item) => (
              <div key={item.step} className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-bold text-gray-400 tracking-widest">{item.step}</span>
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="h-px bg-gray-200 mb-6" />
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Funcionalidades ─────────────────────────────────────────── */}
      <section id="funcionalidades" className="py-24 bg-gray-50">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-xs tracking-widest uppercase mb-4">
                Funcionalidades
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-4">
                Tudo que uma imobiliária<br />precisa em um sistema
              </h2>
              <div className="space-y-4 mt-8">
                {[
                  {
                    icon: Monitor,
                    title: "CRM Imobiliário completo",
                    desc: "Pipeline visual com status por etapa: negociação, financiamento, cartório, registro e conclusão. Histórico completo de cada negócio.",
                  },
                  {
                    icon: FileSearch,
                    title: "OCR inteligente de documentos",
                    desc: "Leitura automática de RG, CPF, CNH, matrícula e comprovantes. Extrai dados e preenche formulários sem digitação manual.",
                  },
                  {
                    icon: CheckSquare,
                    title: "Checklist jurídico automático",
                    desc: "Verificação em tempo real de todos os documentos exigidos por tipo de operação. Status visual por participante e por imóvel.",
                  },
                  {
                    icon: FileOutput,
                    title: "Geração automática de contratos",
                    desc: "Templates prontos para compra, venda, locação e permuta. Placeholders substituídos com dados validados. Pronto para assinatura digital.",
                  },
                ].map((feat) => (
                  <div key={feat.title} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feat.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{feat.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dashboard preview */}
            <div className="bg-gray-900 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-500 text-xs ml-2">efcon.app / dashboard</span>
              </div>
              <div className="text-gray-400 text-xs mb-3 uppercase tracking-widest">Negócios Ativos</div>
              <div className="space-y-3">
                {[
                  { addr: "Rua das Palmeiras, 340", type: "Venda · Carlos Andrade", value: "R$ 485.000", progress: 100, status: "CONCLUÍDO", statusColor: "bg-green-500" },
                  { addr: "Av. Brasil, 1.200 – apto 82", type: "Locação · Fernanda Lima", value: "R$ 2.800", progress: 65, status: "PENDENTE", statusColor: "bg-yellow-500" },
                  { addr: "Qd. 12 Lt. 07 – Setor Sul", type: "Financiamento · Roberto Souza", value: "R$ 320.000", progress: 40, status: "EM ANDAMENTO", statusColor: "bg-blue-500" },
                ].map((deal) => (
                  <div key={deal.addr} className="bg-gray-800 rounded-xl p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-white text-sm font-semibold">{deal.addr}</div>
                        <div className="text-gray-400 text-xs">{deal.type}</div>
                      </div>
                      <span className={`${deal.statusColor} text-white text-xs px-2 py-0.5 rounded font-bold`}>
                        {deal.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span>Documentação</span>
                      <span>{deal.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                        style={{ width: `${deal.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-gray-500 text-xs">Valor total</span>
                      <span className="text-white text-sm font-bold">{deal.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Operações ───────────────────────────────────────────────── */}
      <section id="operacoes" className="py-24 bg-white">
        <div className="container">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-4">
              Suporte completo para<br />cada tipo de negócio
            </h2>
            <p className="text-gray-500 text-lg">
              Fluxos adaptados para venda, locação e permuta, com contratos e checklists específicos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                tag: "VENDA / FINANCIAMENTO",
                tagColor: "text-blue-600 border-blue-200",
                accentColor: "bg-blue-600",
                title: "Compra & Venda",
                desc: "À vista, com financiamento bancário ou com permuta. O sistema controla cada etapa do processo de transferência.",
                steps: ["Vistoria e proposta", "Simulação de financiamento", "Recolhimento do ITBI", "Registro em cartório", "Pagamento e liberação"],
              },
              {
                tag: "LOCAÇÃO",
                tagColor: "text-teal-600 border-teal-200",
                accentColor: "bg-teal-500",
                title: "Aluguel",
                desc: "Cadastro completo de locador, locatário e fiador. Análise automática do perfil e geração do contrato de locação.",
                steps: ["Cadastro e análise", "Aprovação (seguro/fiador)", "Assinatura do contrato", "Registro e pagamento", "Entrega das chaves"],
              },
              {
                tag: "PERMUTA",
                tagColor: "text-orange-600 border-orange-200",
                accentColor: "bg-orange-500",
                title: "Troca de Imóveis",
                desc: "Vinculação de dois imóveis em uma única negociação. Gestão paralela dos documentos e participantes de ambas as partes.",
                steps: ["Avaliação dos dois imóveis", "Análise de diferença", "Documentação dupla", "Contrato de permuta", "Registro simultâneo"],
              },
            ].map((op) => (
              <div key={op.title} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className={`h-1 w-full rounded-full ${op.accentColor} mb-6`} />
                <Badge variant="outline" className={`text-xs tracking-widest uppercase mb-4 ${op.tagColor}`}>
                  {op.tag}
                </Badge>
                <h3 className="text-xl font-black text-gray-900 mb-3">{op.title}</h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">{op.desc}</p>
                <ol className="space-y-2">
                  {op.steps.map((step, i) => (
                    <li key={step} className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Planos ──────────────────────────────────────────────────── */}
      <section id="planos" className="py-24 bg-gray-50">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-xs tracking-widest uppercase mb-4">
              Planos
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Preço direto, sem surpresa</h2>
            <p className="text-gray-500 text-lg">Para corretores independentes, imobiliárias de médio porte e equipes grandes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                tier: "STARTER",
                price: "99",
                desc: "Para corretores autônomos que querem profissionalizar o processo.",
                features: ["Até 10 contratos/mês", "OCR de documentos", "Templates de venda e locação", "1 usuário"],
                cta: "Começar grátis",
                highlight: false,
              },
              {
                tier: "PROFISSIONAL",
                price: "199",
                desc: "Para imobiliárias que processam múltiplas negociações simultaneamente.",
                features: ["Contratos ilimitados", "OCR + análise com IA", "Todos os templates (6 tipos)", "CRM completo com pipeline", "Até 5 usuários"],
                cta: "Assinar agora",
                highlight: true,
                badge: "MAIS POPULAR",
              },
              {
                tier: "ENTERPRISE",
                price: "399",
                desc: "Para redes de imobiliárias e operações de alto volume com necessidades personalizadas.",
                features: ["Tudo do Profissional", "API de integração", "Assinatura via Clicksign", "Usuários ilimitados", "Suporte prioritário"],
                cta: "Falar com vendas",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.tier}
                className={`relative rounded-2xl p-8 ${
                  plan.highlight
                    ? "bg-gray-900 text-white shadow-2xl scale-105"
                    : "bg-white border border-gray-200"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-yellow-400 text-gray-900 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                      {plan.badge}
                    </span>
                  </div>
                )}
                <div className={`text-xs font-bold tracking-widest uppercase mb-4 ${plan.highlight ? "text-blue-400" : "text-blue-600"}`}>
                  {plan.tier}
                </div>
                <div className="mb-4">
                  <span className={`text-sm ${plan.highlight ? "text-gray-400" : "text-gray-500"}`}>R$</span>
                  <span className={`text-5xl font-black mx-1 ${plan.highlight ? "text-white" : "text-gray-900"}`}>{plan.price}</span>
                  <span className={`text-sm ${plan.highlight ? "text-gray-400" : "text-gray-500"}`}>/mês</span>
                </div>
                <p className={`text-sm mb-6 leading-relaxed ${plan.highlight ? "text-gray-300" : "text-gray-500"}`}>{plan.desc}</p>
                <div className={`h-px mb-6 ${plan.highlight ? "bg-white/10" : "bg-gray-100"}`} />
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? "text-blue-400" : "text-blue-600"}`} />
                      <span className={plan.highlight ? "text-gray-200" : "text-gray-700"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${
                    plan.highlight
                      ? "bg-white text-gray-900 hover:bg-gray-100"
                      : "border border-gray-300 bg-transparent text-gray-900 hover:bg-gray-50"
                  }`}
                  onClick={handleCTA}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────── */}
      <section className="efcon-hero-bg py-24">
        <div className="container text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Pronto para automatizar<br />
            <span className="efcon-gradient-text">seus contratos imobiliários</span>?
          </h2>
          <p className="text-white/60 text-lg mb-10">
            Comece gratuitamente. Sem cartão de crédito. Resultados em minutos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-base font-semibold rounded-xl"
              onClick={handleCTA}
            >
              Criar conta grátis <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 bg-transparent px-8 py-6 text-base rounded-xl"
              onClick={handleCTA}
            >
              Agendar demonstração
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <footer className="efcon-hero-bg border-t border-white/10 py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-bold text-lg">Efcon</span>
              </div>
              <p className="text-white/40 text-sm leading-relaxed">
                Plataforma SaaS para automação de contratos imobiliários. CRM, OCR, checklist jurídico e geração automática de documentos.
              </p>
            </div>
            <div>
              <div className="text-white/40 text-xs font-bold tracking-widest uppercase mb-4">Produto</div>
              <ul className="space-y-2">
                {["Funcionalidades", "Como funciona", "Planos", "API"].map((item) => (
                  <li key={item}><a href="#" className="text-white/60 hover:text-white text-sm transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-white/40 text-xs font-bold tracking-widest uppercase mb-4">Operações</div>
              <ul className="space-y-2">
                {["Compra e Venda", "Locação", "Permuta", "Financiamento"].map((item) => (
                  <li key={item}><a href="#" className="text-white/60 hover:text-white text-sm transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-white/40 text-xs font-bold tracking-widest uppercase mb-4">Empresa</div>
              <ul className="space-y-2">
                {["Sobre o Efcon", "Contato", "Suporte", "Blog"].map((item) => (
                  <li key={item}><a href="#" className="text-white/60 hover:text-white text-sm transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-white/30 text-sm">© 2025 Efcon · Todos os direitos reservados</span>
            <div className="flex gap-6">
              {["Privacidade", "Termos de uso", "LGPD"].map((item) => (
                <a key={item} href="#" className="text-white/30 hover:text-white/60 text-sm transition-colors">{item}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
