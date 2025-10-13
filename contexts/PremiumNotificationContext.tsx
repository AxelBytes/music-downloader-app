import React, { createContext, useContext, useState, ReactNode } from 'react';
import PremiumNotification from '@/components/PremiumNotification';

interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

interface PremiumNotificationContextType {
  showNotification: (notification: Omit<NotificationData, 'id'>) => void;
  hideNotification: (id: string) => void;
}

const PremiumNotificationContext = createContext<PremiumNotificationContextType | undefined>(undefined);

export function PremiumNotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const showNotification = (notification: Omit<NotificationData, 'id'>) => {
    const id = Date.now().toString();
    const newNotification: NotificationData = {
      id,
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);

    console.log('🔔 [PremiumNotification] Mostrando notificación:', notification.title);
  };

  const hideNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    console.log('🔔 [PremiumNotification] Ocultando notificación:', id);
  };

  return (
    <PremiumNotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      
      {/* Renderizar todas las notificaciones */}
      {notifications.map((notification, index) => (
        <PremiumNotification
          key={notification.id}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          duration={notification.duration}
          visible={true}
          onClose={() => hideNotification(notification.id)}
        />
      ))}
    </PremiumNotificationContext.Provider>
  );
}

export function usePremiumNotification() {
  const context = useContext(PremiumNotificationContext);
  if (!context) {
    throw new Error('usePremiumNotification must be used within a PremiumNotificationProvider');
  }
  return context;
}
