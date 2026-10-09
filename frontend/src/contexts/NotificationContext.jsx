import { createContext, useState, useCallback } from "react";

export const NotificationContext = createContext();

const initialNotifications = [
  { id: 1, message: "Parcela de Ana Júlia Mucavele vence hoje. 48.000 MT.", type: "cobranca", date: new Date().toISOString() },
  { id: 2, message: "Helena Macuácua está em atraso há 2 dias. 36.000 MT.", type: "cobranca", date: new Date().toISOString() },
  { id: 3, message: "12 parcelas vencem amanhã. Envie o lembrete aos clientes.", type: "cobranca", date: new Date().toISOString() },
  { id: 4, message: "Pagamento confirmado no menu Pagamentos.", type: "pagamento", date: new Date().toISOString() },
];

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(initialNotifications);

  const addNotification = useCallback((message, type = "info") => {
    setNotifications((prev) => [
      { id: Date.now(), message, type, date: new Date().toISOString() },
      ...prev.slice(0, 49),
    ]);
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};
