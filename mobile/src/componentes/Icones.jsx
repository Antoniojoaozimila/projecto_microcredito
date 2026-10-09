import Svg, { Circle, Path, Rect } from "react-native-svg";

const Traço = ({ children, size = 22, color = "#8b928e" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {children(color)}
  </Svg>
);

export const IconePessoa = (props) => (
  <Traço {...props}>
    {(color) => (
      <>
        <Circle cx="12" cy="8" r="3.2" stroke={color} strokeWidth="1.7" />
        <Path
          d="M5.2 19.2c.8-3.2 3.2-4.8 6.8-4.8s6 1.6 6.8 4.8"
          stroke={color}
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </>
    )}
  </Traço>
);

export const IconeCadeado = (props) => (
  <Traço {...props}>
    {(color) => (
      <>
        <Rect x="6" y="10.5" width="12" height="9" rx="2" stroke={color} strokeWidth="1.7" />
        <Path
          d="M8.2 10.5V8.2a3.8 3.8 0 0 1 7.6 0v2.3"
          stroke={color}
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </>
    )}
  </Traço>
);

export const IconeOlho = ({ fechado, ...props }) => (
  <Traço {...props}>
    {(color) =>
      fechado ? (
        <>
          <Path
            d="M4 12s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z"
            stroke={color}
            strokeWidth="1.7"
          />
          <Circle cx="12" cy="12" r="2" stroke={color} strokeWidth="1.7" />
          <Path d="M5 19L19 5" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
        </>
      ) : (
        <>
          <Path
            d="M3.5 12S7 7 12 7s8.5 5 8.5 5-3.5 5-8.5 5S3.5 12 3.5 12z"
            stroke={color}
            strokeWidth="1.7"
          />
          <Circle cx="12" cy="12" r="2.1" stroke={color} strokeWidth="1.7" />
        </>
      )
    }
  </Traço>
);

export const IconeSeta = ({ size = 18, color = "#ffffff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 12h14M13 6l6 6-6 6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const IconeWhatsapp = ({ size = 16, color = "#14924a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.41a10 10 0 0 0 4.65 1.18h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2zm5.76 13.92c-.24.68-1.4 1.3-1.94 1.38-.5.08-1.12.11-1.81-.11-.42-.14-.95-.31-1.64-.61-2.88-1.25-4.76-4.15-4.9-4.34-.14-.2-1.16-1.54-1.16-2.94s.73-2.08 1-2.37c.24-.28.64-.41 1.02-.41.12 0 .23 0 .33.01.3.01.44-.1.69.53.24.64.84 2.2.91 2.36.08.16.13.35.03.56-.1.22-.16.35-.31.54-.16.18-.33.41-.47.55-.16.16-.32.33-.14.64.18.31.82 1.35 1.76 2.19 1.21 1.08 2.23 1.42 2.55 1.58.32.16.5.13.69-.08.18-.2.78-.91.99-1.22.2-.31.41-.26.69-.16.28.1 1.79.84 2.1.99.3.16.5.23.58.36.07.14.07.78-.17 1.46z" />
  </Svg>
);

export const IconeSms = ({ size = 16, color = "#14924a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v7.2a1.5 1.5 0 0 1-1.5 1.5H9l-3.8 2.6V16.7H5A1.5 1.5 0 0 1 3.5 15.2V8A1.5 1.5 0 0 1 5 6.5z"
      stroke={color}
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </Svg>
);

export const IconeVoltar = ({ size = 20, color = "#1c1c1c" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 5L8 12l7 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const IconeCorreio = ({ size = 20, color = "#8b928e" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3.5" y="5.5" width="17" height="13" rx="2.2" stroke={color} strokeWidth="1.7" />
    <Path d="M4.5 7.2L12 12.4l7.5-5.2" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const IconeEntrar = ({ size = 18, color = "#ffffff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <Path d="M10 16l4-4-4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M14 12H3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

export const IconeChave = ({ size = 18, color = "#14924a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="8" cy="14" r="3.2" stroke={color} strokeWidth="1.7" />
    <Path d="M10.6 12.2L20 4.5M16.2 6.2l2.2 2.2M14.2 8.2l2.1 2.1" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
  </Svg>
);

export const IconeEnviar = ({ size = 18, color = "#ffffff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 12l16-7-6 16-2.5-6.5L4 12z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
  </Svg>
);

export const IconeFechar = ({ size = 16, color = "#ffffff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const IconeTelemovel = ({ size = 16, color = "#14924a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="7" y="3" width="10" height="18" rx="2.2" stroke={color} strokeWidth="1.7" />
    <Path d="M11 18.2h2" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
  </Svg>
);

export const IconeMoeda = ({ size = 16, color = "#14924a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="7.2" stroke={color} strokeWidth="1.7" />
    <Path d="M12 8.2v7.6M9.6 10.1c.5-.8 1.3-1.2 2.4-1.2 1.4 0 2.3.7 2.3 1.7s-.9 1.6-2.3 1.8-2.3.6-2.3 1.7.9 1.7 2.3 1.7c1.1 0 1.9-.4 2.4-1.1" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </Svg>
);

export const IconeGrafico = ({ size = 16, color = "#14924a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 19h16" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    <Path d="M7 16l4-4 3 2 5-6" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M15 8h4v4" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const IconeEquipa = ({ size = 16, color = "#14924a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="9" cy="9" r="2.4" stroke={color} strokeWidth="1.6" />
    <Circle cx="16" cy="10" r="2" stroke={color} strokeWidth="1.6" />
    <Path d="M4.8 18c.6-2.4 2.3-3.6 4.2-3.6s3.6 1.2 4.2 3.6M13.2 14.6c1.5-.2 3 .5 3.8 2.4" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </Svg>
);

export const IconeTelefone = ({ size = 16, color = "#14924a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M8.2 3.8h2.1l1.1 2.8-1.4 1.1a12.2 12.2 0 0 0 5.3 5.3l1.1-1.4 2.8 1.1v2.1c0 .7-.5 1.3-1.2 1.4A14.2 14.2 0 0 1 6.8 5c.1-.7.7-1.2 1.4-1.2z"
      stroke={color}
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </Svg>
);

export const IconeCasa = ({ size = 18, color = "#14924a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 11.2L12 4l8 7.2V20a1 1 0 0 1-1 1h-5.2v-6.2H10.2V21H5a1 1 0 0 1-1-1v-8.8z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
  </Svg>
);

export const IconeSino = ({ size = 18, color = "#14924a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 16.2V11a6 6 0 0 1 12 0v5.2l1.4 2.1H4.6L6 16.2z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
    <Path d="M10 19.2a2 2 0 0 0 4 0" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
  </Svg>
);

export const IconePin = ({ size = 16, color = "#14924a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 21s6.5-5.6 6.5-10.2a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
    <Circle cx="12" cy="10.6" r="2" stroke={color} strokeWidth="1.7" />
  </Svg>
);

export const IconeLupa = ({ size = 18, color = "#14924a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="6.2" stroke={color} strokeWidth="1.8" />
    <Path d="M16 16.2L20 20" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

export const IconeEngrenagem = ({ size = 18, color = "#14924a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.7" />
    <Path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4L18 18M18 6l-1.6 1.6M7.6 16.4L6 18" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
  </Svg>
);

export const IconeSair = ({ size = 18, color = "#9b2c2c" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    <Path d="M10 12h9M16 8.5L19.5 12 16 15.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const IconeSol = ({ size = 18, color = "#14924a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3.4" stroke={color} strokeWidth="1.7" />
    <Path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.5 1.5M16.5 16.5L18 18M18 6l-1.5 1.5M7.5 16.5L6 18" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
  </Svg>
);

export const IconeLua = ({ size = 18, color = "#14924a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M16.5 14.8A6.4 6.4 0 0 1 9.2 6.2 6.6 6.6 0 1 0 16.5 14.8z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
  </Svg>
);

export const IconeNascer = ({ size = 18, color = "#14924a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 16h16M7 16a5 5 0 0 1 10 0" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    <Path d="M12 4v3M6.2 8.2l1.6 1.6M17.8 8.2l-1.6 1.6" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
  </Svg>
);

export const IconeCarteira = ({ size = 18, color = "#14924a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z" stroke={color} strokeWidth="1.7" />
    <Path d="M4 8l2.2-3.5h11.6L20 8" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
    <Path d="M15.5 13.2h3" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
  </Svg>
);

export const IconeAlerta = ({ size = 18, color = "#b45309" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 4.2l8 14.2H4L12 4.2z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
    <Path d="M12 10v4" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    <Circle cx="12" cy="16.4" r="0.8" fill={color} />
  </Svg>
);

export const IconeDocumento = ({ size = 18, color = "#14924a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M7 3.5h7.2L19 8.2V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
    <Path d="M14 3.5V8h5M8.5 13h7M8.5 16.5h4.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
  </Svg>
);

export const IconeEdificio = ({ size = 18, color = "#1d4ed8" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 20V7.5L12 4l7 3.5V20" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
    <Path d="M4 20h16M10 20v-4h4v4M9 9.5h.01M15 9.5h.01M9 13h.01M15 13h.01" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
  </Svg>
);

export const IconeEscudo = ({ size = 18, color = "#0f766e" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3.5l7 2.6v5.6c0 4-2.7 6.8-7 8.2-4.3-1.4-7-4.2-7-8.2V6.1l7-2.6z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
  </Svg>
);

export const IconePercentagem = ({ size = 18, color = "#14924a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M7 17L17 7" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    <Circle cx="8" cy="8" r="2" stroke={color} strokeWidth="1.7" />
    <Circle cx="16" cy="16" r="2" stroke={color} strokeWidth="1.7" />
  </Svg>
);

export const IconeBase = ({ size = 18, color = "#1e3a8a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 7c0 1.4 3.1 2.6 7 2.6S19 8.4 19 7 15.9 4.4 12 4.4 5 5.6 5 7z" stroke={color} strokeWidth="1.7" />
    <Path d="M5 7v10c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V7M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6" stroke={color} strokeWidth="1.7" />
  </Svg>
);

export const IconeFicha = ({ size = 18, color = "#7c3aed" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 6.5V10M15 6.5V10" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    <Path d="M7.5 10.5h9v2.6a4.5 4.5 0 0 1-9 0v-2.6zM12 17.6V20" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const IconeEstrela = ({ size = 18, color = "#b45309" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3.5l2.1 4.4 4.8.7-3.5 3.4.8 4.8L12 14.6 7.8 16.8l.8-4.8L5.1 8.6l4.8-.7L12 3.5z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
  </Svg>
);

export const IconeMapa = ({ size = 18, color = "#0f766e" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 6.5l5-2 6 2 5-2V18l-5 2-6-2-5 2V6.5z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
    <Path d="M9 4.5v14M15 6.5v14" stroke={color} strokeWidth="1.7" />
  </Svg>
);
