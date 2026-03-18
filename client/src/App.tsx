import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Contract from "./pages/Contract";
import Negocios from "./pages/Negocios";
import Clientes from "./pages/Clientes";
import Documentos from "./pages/Documentos";
import NegocioDocumentos from "./pages/NegocioDocumentos";
import Contratos from "./pages/Contratos";
import Financeiro from "./pages/Financeiro";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import DocumentGroups from "./pages/DocumentGroups";
import NegocioDetalhe from "./pages/NegocioDetalhe";
import OnboardingUpload from "./pages/OnboardingUpload";

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path={"/"} component={Home} />
      <Route path={"/comecar"} component={OnboardingUpload} />

      {/* Dashboard main */}
      <Route path={"/dashboard"} component={Dashboard} />

      {/* Dashboard sub-pages */}
      <Route path={"/dashboard/negocios"} component={Negocios} />
      <Route path={"/dashboard/negocios/:id"} component={NegocioDetalhe} />
      <Route path={"/dashboard/clientes"} component={Clientes} />
      <Route path={"/dashboard/documentos"} component={Documentos} />
      <Route path={"/dashboard/documentos/:id"} component={NegocioDocumentos} />
      <Route path={"/dashboard/contratos"} component={Contratos} />
      <Route path={"/dashboard/financeiro"} component={Financeiro} />
      <Route path={"/dashboard/relatorios"} component={Relatorios} />
      <Route path={"/dashboard/configuracoes"} component={Configuracoes} />

      {/* Deal-level pages */}
      <Route path={"/dashboard/negocios/:id/documentos"} component={NegocioDocumentos} />
      <Route path={"/dashboard/grupos"} component={DocumentGroups} />
      <Route path={"/dashboard/grupos/:dealId"} component={DocumentGroups} />

      {/* Workflow pages */}
      <Route path={"/dashboard/upload"} component={Upload} />
      <Route path={"/dashboard/contrato"} component={Contract} />

      {/* Fallback */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
