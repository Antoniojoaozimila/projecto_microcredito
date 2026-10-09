import { useContext, useState } from "react";
import { BadgePercent, Save } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import MenuSuspenso from "../clientes/MenuSuspenso";
import { Campo, MensagemModal } from "../comum/ElementosModulo";
import { guardarConfig, lerConfig } from "../../services/configuracoesMicrocredito";
import "../clientes/ClienteModulo.css";
import "../comum/Modulo.css";
import "../relatorios/Relatorios.css";

const NUMEROS = [
  ["taxa_juros_padrao", "Taxa de juros padrão (%)", 0, 100],
  ["valor_minimo_emprestimo", "Valor mínimo (MT)", 1, null],
  ["valor_maximo_emprestimo", "Valor máximo (MT)", 1, null],
  ["prazo_minimo_parcelas", "Prazo mínimo", 1, 52],
  ["prazo_maximo_parcelas", "Prazo máximo", 1, 52],
  ["idade_minima_cliente", "Idade mínima", 18, 70],
  ["idade_maxima_cliente", "Idade máxima", 18, 70],
  ["score_minimo_aprovacao", "Score mínimo", 0, 1000],
  ["max_emprestimos_ativos", "Máx. empréstimos activos", 1, null],
  ["garantia_obrigatoria_acima", "Garantia obrigatória acima", 0, null],
  ["aprovacao_gestor_acima", "Aprovação do gestor acima", 0, null],
  ["dias_carencia", "Dias de carência", 0, null],
  ["taxa_multa_atraso", "Multa por dia (%)", 0, 100],
  ["dias_para_penhor", "Dias para penhor", 30, null],
  ["dias_para_execucao", "Dias para execução", 90, null],
  ["max_clientes_rota", "Máx. clientes por rota", 5, null],
  ["raio_max_cobranca_km", "Raio máximo (km)", 1, null],
  ["meta_mensal_cobrador", "Meta mensal do cobrador", 0, null],
  ["comissao_cobrador", "Comissão do cobrador (%)", 0, 100],
  ["dias_lembrete_antes", "Lembrete antes (dias)", 1, null],
  ["dias_lembrete_apos", "Lembrete após (dias)", 1, null],
];

const ConfigTaxas = () => {
  const { usuario } = useContext(AuthContext);
  const [form, setForm] = useState(lerConfig);
  const [aviso, setAviso] = useState(null);
  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const guardar = () => {
    try {
      if (Number(form.valor_maximo_emprestimo) < Number(form.valor_minimo_emprestimo)) throw new Error("O valor máximo tem de ser maior que o mínimo.");
      if (Number(form.prazo_maximo_parcelas) < Number(form.prazo_minimo_parcelas)) throw new Error("O prazo máximo tem de ser maior que o mínimo.");
      const parcial = {
        tipo_juros_padrao: form.tipo_juros_padrao,
        sistema_amortizacao_padrao: form.sistema_amortizacao_padrao,
      };
      NUMEROS.forEach(([chave, rotulo, min, max]) => {
        const n = Number(form[chave]);
        if (Number.isNaN(n) || n < min || (max !== null && n > max)) throw new Error(`${rotulo} está fora do intervalo permitido.`);
        parcial[chave] = n;
      });
      guardarConfig(parcial, usuario);
      setAviso({ texto: "Taxas, juros e regras de cobrança foram guardados." });
    } catch (e) {
      setAviso({ erro: true, texto: e.message });
    }
  };

  return (
    <div className="cli-page cfg-page">
      <header className="cli-top">
        <div className="cli-pills"><span className="cli-pill"><BadgePercent size={16} /> Taxas e juros</span></div>
        <button type="button" className="cli-btn-novo" onClick={guardar}><Save size={16} /> Guardar</button>
      </header>
      <section className="cli-section">
        <h2><BadgePercent size={16} /> Crédito</h2>
        <div className="cli-grid">
          <Campo icon={BadgePercent} label="Tipo de juros">
            <MenuSuspenso valor={form.tipo_juros_padrao} onChange={(v) => set("tipo_juros_padrao", v)} opcoes={["Simples", "Composto"].map((id) => ({ id, label: id }))} />
          </Campo>
          <Campo icon={BadgePercent} label="Sistema de amortização">
            <MenuSuspenso valor={form.sistema_amortizacao_padrao} onChange={(v) => set("sistema_amortizacao_padrao", v)} opcoes={["Tabela Price", "SAC", "Americano"].map((id) => ({ id, label: id }))} />
          </Campo>
          {NUMEROS.slice(0, 12).map(([chave, rotulo]) => (
            <Campo key={chave} icon={BadgePercent} label={rotulo}>
              <input type="number" value={form[chave]} onChange={(e) => set(chave, e.target.value)} />
            </Campo>
          ))}
        </div>
      </section>
      <section className="cli-section">
        <h2><BadgePercent size={16} /> Cobrança</h2>
        <div className="cli-grid">
          {NUMEROS.slice(12).map(([chave, rotulo]) => (
            <Campo key={chave} icon={BadgePercent} label={rotulo}>
              <input type="number" value={form[chave]} onChange={(e) => set(chave, e.target.value)} />
            </Campo>
          ))}
        </div>
      </section>
      <MensagemModal aviso={aviso} onFechar={() => setAviso(null)} />
    </div>
  );
};

export default ConfigTaxas;
