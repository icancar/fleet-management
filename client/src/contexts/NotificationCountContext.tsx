import React, { createContext, useContext, useState, useEffect } from 'react';

interface NotificationCountContextType {
  unreadCount: number;
  loading: boolean;
  refreshCount: () => void;
  decrementCount: () => void;
  resetCount: () => void;
}

const NotificationCountContext = createContext<NotificationCountContextType | undefined>(undefined);

export const useNotificationCountContext = () => {
  const context = useContext(NotificationCountContext);
  if (!context) {
    throw new Error('useNotificationCountContext must be used within a NotificationCountProvider');
  }
  return context;
};

export const NotificationCountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const refreshCount = () => {
    fetchUnreadCount();
  };

  const decrementCount = () => {
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const resetCount = () => {
    setUnreadCount(0);
  };

  return (
    <NotificationCountContext.Provider value={{
      unreadCount,
      loading,
      refreshCount,
      decrementCount,
      resetCount
    }}>
      {children}
    </NotificationCountContext.Provider>
  );
};
