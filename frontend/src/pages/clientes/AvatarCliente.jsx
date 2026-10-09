import { Building2 } from "lucide-react";

const Homem = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="19.5" r="8" fill="currentColor" opacity=".55" />
    <path d="M15.8 18.5c-.4-5.6 3.3-9.5 8.2-9.5s8.6 3.9 8.2 9.5c-1.6-2.6-4.6-3.9-8.2-3.9s-6.6 1.3-8.2 3.9Z" fill="currentColor" opacity=".95" />
    <path d="M9 42c0-7.7 6.7-13 15-13s15 5.3 15 13" fill="currentColor" opacity=".55" />
    <path d="M20.5 29.4 24 34l3.5-4.6" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Mulher = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <path d="M13 27c1.8-2 2-5.4 2-9.5C15 12.3 19 8 24 8s9 4.3 9 9.5c0 4.1.2 7.5 2 9.5-2.6 1.4-6.4 2-11 2s-8.4-.6-11-2Z" fill="currentColor" opacity=".9" />
    <circle cx="24" cy="19.5" r="7.5" fill="#fff" opacity=".35" />
    <circle cx="24" cy="19.5" r="7.5" fill="currentColor" opacity=".45" />
    <path d="M9 42c0-7.4 6.7-12.5 15-12.5S39 34.6 39 42" fill="currentColor" opacity=".55" />
  </svg>
);

const Neutro = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="18" r="8.5" fill="currentColor" opacity=".7" />
    <path d="M9 42c0-7.7 6.7-13 15-13s15 5.3 15 13" fill="currentColor" opacity=".55" />
  </svg>
);

const AvatarCliente = ({ cliente, foto, tamanho = 42, className = "" }) => {
  const imagem = foto ?? (cliente?.foto_perfil?.conteudo || (typeof cliente?.foto_perfil === "string" ? cliente.foto_perfil : ""));
  const empresa = cliente?.tipo_cliente === "Pessoa Jurídica";
  const genero = empresa ? "empresa" : cliente?.genero === "Feminino" ? "feminino" : cliente?.genero === "Masculino" ? "masculino" : "neutro";
  return (
    <span
      className={`cli-avatar is-${imagem ? "foto" : genero} ${className}`.trim()}
      style={{ width: tamanho, height: tamanho }}
      title={cliente?.nome_completo || ""}
    >
      {imagem ? (
        <img src={imagem} alt="" />
      ) : empresa ? (
        <Building2 size={Math.round(tamanho * 0.48)} />
      ) : genero === "feminino" ? (
        <Mulher />
      ) : genero === "masculino" ? (
        <Homem />
      ) : (
        <Neutro />
      )}
    </span>
  );
};

export default AvatarCliente;
