import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const raiz = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
  // Em produção a versão web do telemóvel é servida em /m/ (ver deploy/Caddyfile).
  base: mode === "production" ? "/m/" : "/",
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "react-native/Libraries/Utilities/codegenNativeComponent",
        replacement: path.resolve(raiz, "src/shims/codegenNativeComponent.js"),
      },
      { find: /^react-native$/, replacement: "react-native-web" },
      {
        find: "@react-native/assets-registry/registry",
        replacement: path.resolve(raiz, "src/shims/assetsRegistry.js"),
      },
    ],
    extensions: [".web.jsx", ".web.js", ".jsx", ".js", ".json"],
  },
  optimizeDeps: {
    exclude: ["react-native-svg", "expo-linear-gradient", "expo-status-bar"],
    esbuildOptions: {
      resolveExtensions: [".web.jsx", ".web.js", ".jsx", ".js", ".json"],
      mainFields: ["browser", "module", "main"],
    },
  },
  define: {
    global: "window",
    __DEV__: JSON.stringify(mode !== "production"),
    "process.env.NODE_ENV": JSON.stringify(mode === "production" ? "production" : "development"),
    "process.env.EXPO_PUBLIC_API_URL": JSON.stringify(process.env.EXPO_PUBLIC_API_URL || ""),
  },
  server: {
    host: true,
    port: 5175,
    proxy: {
      "/api": { target: "http://localhost:3000", changeOrigin: true },
    },
  },
}));
