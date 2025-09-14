import { useEffect, useRef, useState } from 'react';

interface LocationUpdate {
  deviceId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy: number;
  speed?: number;
  bearing?: number;
  altitude?: number;
}

interface SSEEvent {
  type: 'connected' | 'location_update' | 'ping';
  data?: LocationUpdate;
  message?: string;
  timestamp?: number;
}

export const useLocationEvents = (token: string | null) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<LocationUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    // Create EventSource connection
    const eventSource = new EventSource(`/api/location/events`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    eventSourceRef.current = eventSource;

    // Connection opened
    eventSource.onopen = () => {
      console.log('SSE connection opened');
      setIsConnected(true);
      setError(null);
    };

    // Message received
    eventSource.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);
        
        switch (data.type) {
          case 'connected':
            console.log('SSE connected:', data.message);
            break;
            
          case 'location_update':
            if (data.data) {
              console.log('Location update received via SSE:', data.data);
              setLastUpdate(data.data);
            }
            break;
            
          case 'ping':
            // Keep connection alive
            break;
            
          default:
            console.log('Unknown SSE event type:', data.type);
        }
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };

    // Connection error
    eventSource.onerror = (event) => {
      console.error('SSE connection error:', event);
      setIsConnected(false);
      setError('Connection lost. Attempting to reconnect...');
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          console.log('Attempting to reconnect SSE...');
          // The useEffect will recreate the connection
        }
      }, 3000);
    };

    // Cleanup on unmount
    return () => {
      console.log('Closing SSE connection');
      eventSource.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [token]);

  // Manual reconnection function
  const reconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setError(null);
    // The useEffect will recreate the connection
  };

  return {
    isConnected,
    lastUpdate,
    error,
    reconnect
  };
};
