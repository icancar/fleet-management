import express from 'express';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Store active connections
const connections = new Map<string, express.Response>();

// SSE endpoint for real-time location updates
router.get('/events', (req, res) => {
  const userId = '68c69dfc3f1c1de98e4a0703'; // Temporary hardcoded user ID for testing
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Store this connection
  connections.set(userId, res);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to location updates' })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    console.log(`SSE connection closed for user ${userId}`);
    connections.delete(userId);
  });

  // Keep connection alive with periodic ping
  const pingInterval = setInterval(() => {
    if (connections.has(userId)) {
      res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`);
    } else {
      clearInterval(pingInterval);
    }
  }, 30000); // Ping every 30 seconds
});

// Function to broadcast location update to specific user
export const broadcastLocationUpdate = (userId: string, locationData: any) => {
  const connection = connections.get(userId);
  if (connection) {
    try {
      connection.write(`data: ${JSON.stringify({ 
        type: 'location_update', 
        data: locationData,
        timestamp: Date.now()
      })}\n\n`);
      console.log(`Broadcasted location update to user ${userId}`);
    } catch (error) {
      console.error('Error broadcasting to user:', error);
      connections.delete(userId);
    }
  }
};

// Function to broadcast to all connected users
export const broadcastToAllUsers = (locationData: any) => {
  connections.forEach((connection, userId) => {
    try {
      connection.write(`data: ${JSON.stringify({ 
        type: 'location_update', 
        data: locationData,
        timestamp: Date.now()
      })}\n\n`);
    } catch (error) {
      console.error('Error broadcasting to user:', error);
      connections.delete(userId);
    }
  });
};

export default router;
