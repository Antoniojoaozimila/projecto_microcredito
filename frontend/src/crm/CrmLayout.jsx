import { Outlet } from "react-router-dom";
import { CrmThemeProvider } from "./contexts/ThemeContext";
import "./crm-pages.css";

export default function CrmLayout() {
  return (
    <CrmThemeProvider>
      <div className="crm-module">
        <Outlet />
      </div>
    </CrmThemeProvider>
  );
}
