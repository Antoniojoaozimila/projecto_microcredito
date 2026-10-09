import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, CameraOff, Check, RefreshCw, SwitchCamera, Trash2, Upload, X } from "lucide-react";
import AvatarCliente from "./AvatarCliente";

const MAX_MB = 50;

const FotoPerfil = ({ cliente, valor, onChange, onErro }) => {
  const [camaraAberta, setCamaraAberta] = useState(false);
  const [captura, setCaptura] = useState("");
  const [erroCamara, setErroCamara] = useState("");
  const [frontal, setFrontal] = useState(true);
  const video = useRef(null);
  const fluxo = useRef(null);
  const ficheiro = useRef(null);
  const ficheiroCamara = useRef(null);

  const pararCamara = () => {
    fluxo.current?.getTracks().forEach((faixa) => faixa.stop());
    fluxo.current = null;
  };

  useEffect(() => {
    if (!camaraAberta || captura) return undefined;
    let cancelado = false;
    const iniciar = async () => {
      setErroCamara("");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: frontal ? "user" : "environment", width: { ideal: 720 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelado) {
          stream.getTracks().forEach((faixa) => faixa.stop());
          return;
        }
        fluxo.current = stream;
        if (video.current) video.current.srcObject = stream;
      } catch (erro) {
        setErroCamara(
          erro?.name === "NotAllowedError"
            ? "O acesso à câmara foi recusado. Autorize a câmara no navegador e tente novamente."
            : erro?.name === "NotFoundError"
              ? "Não foi encontrada nenhuma câmara neste dispositivo."
              : "Não foi possível ligar a câmara."
        );
      }
    };
    iniciar();
    return () => {
      cancelado = true;
      pararCamara();
    };
  }, [camaraAberta, captura, frontal]);

  const abrirCamara = () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      ficheiroCamara.current?.click();
      return;
    }
    setCaptura("");
    setCamaraAberta(true);
  };

  const fecharCamara = () => {
    pararCamara();
    setCaptura("");
    setCamaraAberta(false);
  };

  const fotografar = () => {
    const v = video.current;
    if (!v?.videoWidth) return;
    const lado = Math.min(v.videoWidth, v.videoHeight);
    const tela = document.createElement("canvas");
    tela.width = 600;
    tela.height = 600;
    const ctx = tela.getContext("2d");
    if (frontal) {
      ctx.translate(600, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, (v.videoWidth - lado) / 2, (v.videoHeight - lado) / 2, lado, lado, 0, 0, 600, 600);
    setCaptura(tela.toDataURL("image/jpeg", 0.88));
    pararCamara();
  };

  const usarCaptura = () => {
    onChange({ nome: `foto-${Date.now()}.jpg`, tipo: "image/jpeg", conteudo: captura });
    fecharCamara();
  };

  const carregar = (lista) => {
    const escolhido = lista?.[0];
    if (!escolhido) return;
    if (!/^image\/(jpeg|png|webp)$/.test(escolhido.type)) {
      onErro?.("Escolha uma imagem JPG, PNG ou WEBP.");
      return;
    }
    if (escolhido.size > MAX_MB * 1024 * 1024) {
      onErro?.(`A foto excede ${MAX_MB}MB.`);
      return;
    }
    const endereco = URL.createObjectURL(escolhido);
    const img = new Image();
    img.onload = () => {
      const lado = Math.min(img.naturalWidth, img.naturalHeight);
      const tela = document.createElement("canvas");
      tela.width = 600;
      tela.height = 600;
      tela.getContext("2d").drawImage(img, (img.naturalWidth - lado) / 2, (img.naturalHeight - lado) / 2, lado, lado, 0, 0, 600, 600);
      URL.revokeObjectURL(endereco);
      onChange({ nome: escolhido.name.replace(/\.\w+$/, ".jpg"), tipo: "image/jpeg", conteudo: tela.toDataURL("image/jpeg", 0.88) });
    };
    img.onerror = () => {
      URL.revokeObjectURL(endereco);
      onErro?.("Não foi possível ler a foto.");
    };
    img.src = endereco;
  };

  const imagem = valor?.conteudo || "";

  return (
    <div className="cli-foto">
      <div className="cli-foto-previa">
        <AvatarCliente cliente={cliente} foto={imagem} tamanho={96} />
        {imagem ? <span className="cli-foto-ok"><Check size={13} /></span> : null}
      </div>
      <div className="cli-foto-texto">
        <strong>{imagem ? "Foto de perfil adicionada" : "Sem foto de perfil"}</strong>
        <small>Opcional · JPG, PNG ou WEBP até {MAX_MB}MB. Sem foto, é usado um ícone conforme o género.</small>
        <div className="cli-foto-accoes">
          <button type="button" className="cli-foto-btn is-principal" onClick={abrirCamara}><Camera size={15} /> Tirar foto</button>
          <button type="button" className="cli-foto-btn" onClick={() => ficheiro.current?.click()}><Upload size={15} /> Carregar foto</button>
          {imagem ? <button type="button" className="cli-foto-btn is-remover" onClick={() => onChange(null)}><Trash2 size={15} /> Remover</button> : null}
        </div>
      </div>
      <input ref={ficheiro} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { carregar(e.target.files); e.target.value = ""; }} />
      <input ref={ficheiroCamara} type="file" accept="image/*" capture="user" hidden onChange={(e) => { carregar(e.target.files); e.target.value = ""; }} />

      {camaraAberta ? createPortal(
        <div className="cli-modal-fundo cli-camara-fundo" role="presentation">
          <div className="cli-modal cli-camara" role="dialog" aria-modal="true" aria-label="Tirar foto">
            <button type="button" className="cli-camara-fechar" aria-label="Fechar" onClick={fecharCamara}><X size={18} /></button>
            <p>Foto de perfil</p>
            <div className="cli-camara-quadro">
              {captura ? (
                <img src={captura} alt="Pré-visualização" />
              ) : erroCamara ? (
                <span className="cli-camara-erro"><CameraOff size={34} /> {erroCamara}</span>
              ) : (
                <video ref={video} autoPlay playsInline muted className={frontal ? "is-espelho" : ""} />
              )}
              {!captura && !erroCamara ? <span className="cli-camara-guia" /> : null}
            </div>
            <div className="cli-modal-accoes">
              {captura ? (
                <>
                  <button type="button" className="cli-btn ghost" onClick={() => setCaptura("")}><RefreshCw size={16} /> Repetir</button>
                  <button type="button" className="cli-btn" onClick={usarCaptura}><Check size={16} /> Usar foto</button>
                </>
              ) : (
                <>
                  <button type="button" className="cli-btn ghost" onClick={() => setFrontal((f) => !f)} disabled={Boolean(erroCamara)}><SwitchCamera size={16} /> Trocar câmara</button>
                  <button type="button" className="cli-btn cli-camara-disparo" onClick={fotografar} disabled={Boolean(erroCamara)}><Camera size={16} /> Fotografar</button>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
};

export default FotoPerfil;
