// src/main.jsx ou index.jsx
import "./services/idLocal";
import "./services/ponteServidor";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SidebarProvider } from "./context/sidebarContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { TranslateProvider } from "./context/TranslateProvider";
import App from "./App";
import "./App.css";
import "./crm/crm.css";
import { migrarAnexos } from "./services/anexosLocais";
import { aplicarMarca } from "./services/marcaSistema";

migrarAnexos();
aplicarMarca();

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <TranslateProvider>
      <AuthProvider>
        <SidebarProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </SidebarProvider>
      </AuthProvider>
    </TranslateProvider>
  </BrowserRouter>
);
