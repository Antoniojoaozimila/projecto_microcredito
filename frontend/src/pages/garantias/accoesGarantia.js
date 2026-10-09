import { Ban, BellRing, Gavel, Lock, LockOpen, ShieldCheck } from "lucide-react";
import {
  MEIOS_NOTIFICACAO, REGRAS_GARANTIA, aprovarGarantia, cancelarGarantia, executarGarantia, libertarGarantia, notificarCliente, penhorarGarantia,
} from "../../services/garantiasMicrocredito";

export const configAccao = (tipo, garantia, utilizador) => {
  const codigo = garantia.codigo_garantia;
  const motivo = (placeholder) => ({ id: "motivo", label: "Motivo *", tipo: "textarea", placeholder, foco: true });
  return {
    aprovar: {
      titulo: `Aprovar ${codigo}`,
      subtitulo: "Aprovação do gestor",
      icone: ShieldCheck,
      descricao: "A garantia passa a «Ativa» e fica associada ao empréstimo.",
      botao: "Aprovar",
      sucesso: `Garantia ${codigo} aprovada.`,
      executar: () => aprovarGarantia(garantia.id, utilizador),
    },
    penhorar: {
      titulo: `Penhorar ${codigo}`,
      subtitulo: "Penhora de garantia",
      icone: Lock,
      tom: "vermelho",
      descricao: "O empréstimo está em atraso. A garantia fica penhorada até o cliente regularizar ou ser executada.",
      campos: [motivo("Ex: Parcelas em atraso sem resposta do cliente")],
      botao: "Penhorar",
      sucesso: `Garantia ${codigo} penhorada.`,
      executar: (v) => penhorarGarantia(garantia.id, v.motivo, utilizador),
    },
    notificar: {
      titulo: `Notificar cliente · ${codigo}`,
      subtitulo: "Notificação formal",
      icone: BellRing,
      descricao: `A notificação formal é obrigatória antes da execução (após ${REGRAS_GARANTIA.diasExecucao} dias de atraso).`,
      campos: [
        { id: "meio", label: "Meio de notificação *", opcoes: MEIOS_NOTIFICACAO, inicial: MEIOS_NOTIFICACAO[0] },
        { id: "observacao", label: "Observação", tipo: "textarea", placeholder: "Ex: Carta nº 123 entregue ao cliente" },
      ],
      botao: "Registar notificação",
      sucesso: `Notificação registada para ${codigo}.`,
      executar: (v) => notificarCliente(garantia.id, v, utilizador),
    },
    libertar: {
      titulo: `Libertar ${codigo}`,
      subtitulo: "Libertação de garantia",
      icone: LockOpen,
      descricao: garantia.status === "Penhorada" ? "O cliente regularizou os pagamentos. A garantia volta ao cliente." : "O empréstimo foi quitado. A garantia volta ao cliente.",
      campos: [motivo("Ex: Cliente regularizou as parcelas em atraso")],
      botao: "Libertar",
      sucesso: `Garantia ${codigo} libertada.`,
      executar: (v) => libertarGarantia(garantia.id, v.motivo, utilizador),
    },
    executar: {
      titulo: `Executar ${codigo}`,
      subtitulo: "Execução de garantia",
      icone: Gavel,
      tom: "vermelho",
      descricao: "A execução é definitiva e fica registada no histórico da garantia e do empréstimo.",
      campos: [
        motivo("Razão da execução (mínimo 10 caracteres)"),
        { id: "valor_recuperado", label: "Valor recuperado (MT)", tipo: "number", placeholder: "0.00" },
      ],
      botao: "Executar",
      sucesso: `Garantia ${codigo} executada.`,
      executar: (v) => executarGarantia(garantia.id, v, utilizador),
    },
    cancelar: {
      titulo: `Cancelar ${codigo}`,
      subtitulo: "Cancelamento",
      icone: Ban,
      tom: "vermelho",
      campos: [motivo("Ex: Garantia recusada na avaliação")],
      botao: "Cancelar garantia",
      sucesso: `Garantia ${codigo} cancelada.`,
      executar: (v) => cancelarGarantia(garantia.id, v.motivo, utilizador),
    },
  }[tipo];
};
