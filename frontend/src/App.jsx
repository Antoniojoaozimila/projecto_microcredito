// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

import Login from "./components/Login/Login";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Clientes from "./pages/Clientes";
import ClientesLista from "./pages/clientes/ClientesLista";
import ClienteFormulario from "./pages/clientes/ClienteFormulario";
import ClienteDetalhe from "./pages/clientes/ClienteDetalhe";
import ClientesMapa from "./pages/clientes/ClientesMapa";
import ClientesImportar from "./pages/clientes/ClientesImportar";
import EmprestimoFormulario from "./pages/emprestimos/EmprestimoFormulario";
import EmprestimosLista from "./pages/emprestimos/EmprestimosLista";
import EmprestimoDetalhe from "./pages/emprestimos/EmprestimoDetalhe";
import EmprestimosCalendario from "./pages/emprestimos/EmprestimosCalendario";
import ClienteVisualizar from "./pages/ClienteVisualizar";
import ClienteEditar from "./pages/ClienteEditar";
import ViaturaEditar from "./pages/ViaturaEditar";
import Seguros from "./pages/Seguros";
import SeguroVisualizar from "./pages/SeguroVisualizar";
import SeguroEditar from "./pages/SeguroEditar";
import Agentes from "./pages/Agentes";
import AgenteVisualizar from "./pages/AgenteVisualizar";
import AgenteEditar from "./pages/AgenteEditar";
import AgenteCriar from "./pages/AgenteCriar";
import Supervisores from "./pages/Supervisores";
import Veiculos from "./pages/Veiculos";
import HistoricoPagamentos from "./pages/pagamentos/HistoricoPagamentos";
import RegistarPagamento from "./pages/pagamentos/RegistarPagamento";
import PagamentoDetalhe from "./pages/pagamentos/PagamentoDetalhe";
import PagamentoVisualizar from "./pages/PagamentoVisualizar";
import GarantiasLista from "./pages/garantias/GarantiasLista";
import EmprestimoCriado from "./pages/emprestimos/EmprestimoCriado";
import GarantiaCriada from "./pages/garantias/GarantiaCriada";
import GarantiaFormulario from "./pages/garantias/GarantiaFormulario";
import GarantiaDetalhe from "./pages/garantias/GarantiaDetalhe";
import GarantiasPenhoradas from "./pages/garantias/GarantiasPenhoradas";
import GarantiasExecucao from "./pages/garantias/GarantiasExecucao";
import GarantiasAlertas from "./pages/garantias/GarantiasAlertas";
import RelatorioVista from "./pages/relatorios/RelatorioVista";
import Exportacao from "./pages/relatorios/Exportacao";
import ModeloBM from "./pages/relatorios/ModeloBM";
import ConfigUtilizadores from "./pages/configuracoes/ConfigUtilizadores";
import ConfigIdentidade from "./pages/configuracoes/ConfigIdentidade";
import ConfigPerfis from "./pages/configuracoes/ConfigPerfis";
import ConfigTiposGarantia from "./pages/configuracoes/ConfigTiposGarantia";
import ConfigTaxas from "./pages/configuracoes/ConfigTaxas";
import ConfigNotificacoes from "./pages/configuracoes/ConfigNotificacoes";
import ConfigBackup from "./pages/configuracoes/ConfigBackup";
import ConfigIntegracoes from "./pages/configuracoes/ConfigIntegracoes";
import Settings from "./pages/Settings";
import Geolocalizacao from "./pages/Geolocalizacao";
import AtivacoesManuais from "./pages/AtivacoesManuais";
import Privacidade from "./pages/Privacidade";
import TermosUso from "./pages/TermosUso";
import Cookies from "./pages/Cookies";
import ModuloMicrocredito from "./pages/ModuloMicrocredito";
import CobrancasAgenda from "./pages/cobrancas/CobrancasAgenda";
import AgendaFormulario from "./pages/cobrancas/AgendaFormulario";
import AgendaDetalhe from "./pages/cobrancas/AgendaDetalhe";
import CobrancasHistorico from "./pages/cobrancas/CobrancasHistorico";
import CobrancasRota from "./pages/cobrancas/CobrancasRota";
import CobrancasZonas from "./pages/cobrancas/CobrancasZonas";
import CobrancasZonaFormulario from "./pages/cobrancas/CobrancasZonaFormulario";
import CobrancasCobradores from "./pages/cobrancas/CobrancasCobradores";
import CobrancasCobradorFormulario from "./pages/cobrancas/CobrancasCobradorFormulario";
import CarteirasGestao from "./pages/carteiras/CarteirasGestao";
import CarteiraFormulario from "./pages/carteiras/CarteiraFormulario";
import CarteiraDetalhe from "./pages/carteiras/CarteiraDetalhe";
import CarteirasMovimentos from "./pages/carteiras/CarteirasMovimentos";
import CarteirasDespesas from "./pages/carteiras/CarteirasDespesas";
import CrmLayout from "./crm/CrmLayout";
import {
  CriarCotacao,
  EditarCotacao,
  ListarCotacoes,
  GestaoCotacoes,
  Acompanhamento,
  AprovacaoTaxas,
} from "./crm";

function AppRoutes() {
  const { usuario, carregando } = useContext(AuthContext);

  if (carregando) return <p>Carregando...</p>;

  return (
    <Routes>
      {usuario ? (
        <>
          <Route path="/imperial/dashboard" element={<Dashboard />}>
            <Route path="home" element={<Home />} />
            <Route element={<CrmLayout />}>
              <Route path="cotacoes/criar" element={<CriarCotacao />} />
              <Route path="cotacoes/editar" element={<EditarCotacao />} />
              <Route path="cotacoes/listar" element={<ListarCotacoes />} />
              <Route path="crm/gestao-cotacoes" element={<GestaoCotacoes />} />
              <Route path="crm/acompanhamento" element={<Acompanhamento />} />
              <Route
                path="crm/aprovacao-taxas"
                element={
                  <ProtectedRoute allowedRoles={["admin", "subscricao"]}>
                    <AprovacaoTaxas />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="clientes" element={<ClientesLista />} />
            <Route path="clientes/novo" element={<ClienteFormulario />} />
            <Route path="clientes/editar/:id" element={<ClienteFormulario />} />
            <Route path="clientes/perfil/:id" element={<ClienteDetalhe />} />
            <Route path="clientes/mapa" element={<ClientesMapa />} />
            <Route path="clientes/importar" element={<ClientesImportar />} />
            <Route path="clientes-legado" element={<Clientes />} />
            <Route path="emprestimos" element={<EmprestimosLista />} />
            <Route path="emprestimos/novo" element={<EmprestimoFormulario />} />
            <Route path="emprestimos/calendario" element={<EmprestimosCalendario />} />
            <Route path="emprestimos/criado/:id" element={<EmprestimoCriado />} />
            <Route path="emprestimos/:id" element={<EmprestimoDetalhe />} />
            <Route path="clientes/visualizar/:id" element={<ClienteVisualizar />} />
            <Route
              path="clientes/editar/:id"
              element={
                <ProtectedRoute allowedRoles={["admin", "subscricao"]}>
                  <ClienteEditar />
                </ProtectedRoute>
              }
            />
            <Route
              path="viaturas/editar/:id"
              element={
                <ProtectedRoute allowedRoles={["admin", "subscricao"]}>
                  <ViaturaEditar />
                </ProtectedRoute>
              }
            />
            <Route path="seguros" element={<Seguros />} />
            <Route path="seguros/visualizar/:id" element={<SeguroVisualizar />} />
            <Route
              path="seguros/editar/:id"
              element={
                <ProtectedRoute allowedRoles={["admin", "subscricao"]}>
                  <SeguroEditar />
                </ProtectedRoute>
              }
            />
            <Route 
              path="agentes" 
              element={
                <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                  <Agentes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="agentes/visualizar/:id" 
              element={
                <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                  <AgenteVisualizar />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="agentes/editar/:id" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AgenteEditar />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="agentes/criar" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AgenteCriar />
                </ProtectedRoute>
              } 
            />
            <Route
              path="supervisores"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Supervisores />
                </ProtectedRoute>
              }
            />
            <Route path="veiculos" element={<Veiculos />} />
            <Route path="pagamentos" element={<HistoricoPagamentos />} />
            <Route path="pagamentos/registar" element={<RegistarPagamento />} />
            <Route path="pagamentos/detalhe/:id" element={<PagamentoDetalhe />} />
            <Route path="pagamentos/visualizar/:id" element={<PagamentoVisualizar />} />
            <Route path="garantias" element={<GarantiasLista />} />
            <Route path="garantias/nova" element={<GarantiaFormulario />} />
            <Route path="garantias/criada/:id" element={<GarantiaCriada />} />
            <Route path="garantias/penhoradas" element={<GarantiasPenhoradas />} />
            <Route path="garantias/execucao" element={<GarantiasExecucao />} />
            <Route path="garantias/alertas" element={<GarantiasAlertas />} />
            <Route path="garantias/:id" element={<GarantiaDetalhe />} />
            <Route path="relatorios" element={<RelatorioVista tipo="Financeiro" />} />
            <Route path="geolocalizacao" element={<Geolocalizacao />} />
            <Route
              path="ativacoes-manuais"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AtivacoesManuais />
                </ProtectedRoute>
              }
            />
            <Route path="settings" element={<Settings />} />
            <Route path="modulo/cobrancas/agenda" element={<CobrancasAgenda />} />
            <Route path="modulo/cobrancas/agenda/nova" element={<AgendaFormulario />} />
            <Route path="modulo/cobrancas/agenda/:id" element={<AgendaDetalhe />} />
            <Route path="modulo/cobrancas/historico" element={<CobrancasHistorico />} />
            <Route path="modulo/cobrancas/rota" element={<CobrancasRota />} />
            <Route path="modulo/cobrancas/zonas" element={<CobrancasZonas />} />
            <Route path="modulo/cobrancas/zonas/nova" element={<CobrancasZonaFormulario />} />
            <Route path="modulo/cobrancas/zonas/:id" element={<CobrancasZonaFormulario />} />
            <Route path="modulo/cobrancas/cobradores" element={<CobrancasCobradores />} />
            <Route path="modulo/cobrancas/cobradores/novo" element={<CobrancasCobradorFormulario />} />
            <Route path="modulo/cobrancas/cobradores/:id" element={<CobrancasCobradorFormulario />} />
            <Route path="modulo/carteiras/gestao" element={<CarteirasGestao />} />
            <Route path="modulo/carteiras/nova" element={<CarteiraFormulario />} />
            <Route path="modulo/carteiras/movimentos" element={<CarteirasMovimentos />} />
            <Route path="modulo/carteiras/despesas" element={<CarteirasDespesas />} />
            <Route path="modulo/carteiras/:id/editar" element={<CarteiraFormulario />} />
            <Route path="modulo/carteiras/:id" element={<CarteiraDetalhe />} />
            <Route path="modulo/relatorios/inadimplencia" element={<RelatorioVista tipo="Inadimplência" />} />
            <Route path="modulo/relatorios/performance" element={<RelatorioVista tipo="Performance" />} />
            <Route path="modulo/relatorios/clientes" element={<RelatorioVista tipo="Clientes" />} />
            <Route path="modulo/relatorios/carteiras" element={<RelatorioVista tipo="Carteiras" />} />
            <Route path="modulo/relatorios/exportacao" element={<Exportacao />} />
            <Route path="modulo/relatorios/modelo-bm" element={<ModeloBM />} />
            <Route path="modulo/configuracoes/utilizadores" element={<ConfigUtilizadores />} />
            <Route path="modulo/configuracoes/identidade" element={<ConfigIdentidade />} />
            <Route path="modulo/configuracoes/perfis" element={<ConfigPerfis />} />
            <Route path="modulo/configuracoes/zonas" element={<CobrancasZonas />} />
            <Route path="modulo/configuracoes/tipos-garantia" element={<ConfigTiposGarantia />} />
            <Route path="modulo/configuracoes/taxas" element={<ConfigTaxas />} />
            <Route path="modulo/configuracoes/notificacoes" element={<ConfigNotificacoes />} />
            <Route path="modulo/configuracoes/backup" element={<ConfigBackup />} />
            <Route path="modulo/configuracoes/integracoes" element={<ConfigIntegracoes />} />
            <Route path="modulo/*" element={<ModuloMicrocredito />} />
            <Route path="privacidade" element={<Privacidade />} />
            <Route path="termos-uso" element={<TermosUso />} />
            <Route path="cookies" element={<Cookies />} />
          </Route>
          <Route path="*" element={<Navigate to="/imperial/dashboard/home" replace />} />
        </>
      ) : (
        <>
          <Route path="/microcredito/login" element={<Login />} />
          <Route path="/imperial/login" element={<Navigate to="/microcredito/login" replace />} />
          <Route path="*" element={<Navigate to="/microcredito/login" replace />} />
        </>
      )}
    </Routes>
  );
}

export default AppRoutes;
