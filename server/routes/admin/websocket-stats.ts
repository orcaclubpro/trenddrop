/**
 * WebSocket Statistics API Endpoint
 * 
 * Provides metrics and monitoring data for WebSocket connections.
 */

import { Router, Request, Response } from 'express';
import { WebSocketMonitor } from '../../services/common/WebSocketMonitor.js';
import { WebSocketService } from '../../services/common/WebSocketService.js';
import { log } from '../../vite.js';

// Extend Express Request type to include session
interface RequestWithSession extends Request {
  session: {
    user?: {
      isAdmin?: boolean;
    }
  }
}

const router = Router();

/**
 * Middleware to check if the user is authenticated as admin
 */
const isAdmin = (req: Request, res: Response, next: Function) => {
  const reqWithSession = req as RequestWithSession;
  
  // In a real app, you'd check if the user is authenticated and has admin role
  if (reqWithSession.session && reqWithSession.session.user && reqWithSession.session.user.isAdmin) {
    return next();
  }
  
  // For development purposes only, allow access with a query parameter
  // REMOVE THIS IN PRODUCTION!
  if (process.env.NODE_ENV !== 'production' && req.query.adminKey === process.env.ADMIN_KEY) {
    return next();
  }
  
  return res.status(401).json({ 
    error: 'Unauthorized', 
    message: 'Admin access required'
  });
};

/**
 * GET /api/admin/websocket-stats
 * 
 * Returns current WebSocket statistics
 */
router.get('/', isAdmin, (req: Request, res: Response) => {
  try {
    const wsMonitor = WebSocketMonitor.getInstance();
    const metrics = wsMonitor.getMetrics();
    
    const wsService = WebSocketService.getInstance();
    const clientInfo = wsService.getClientInfo();
    
    res.json({
      status: 'success',
      data: {
        metrics,
        clients: {
          count: clientInfo.length,
          details: clientInfo
        }
      }
    });
  } catch (error) {
    log(`Error getting WebSocket stats: ${error}`, 'websocket');
    res.status(500).json({ 
      error: 'Server Error', 
      message: 'Failed to retrieve WebSocket statistics'
    });
  }
});

/**
 * GET /api/admin/websocket-stats/connections-history
 * 
 * Returns historical connection data
 */
router.get('/connections-history', isAdmin, (req: Request, res: Response) => {
  try {
    const wsMonitor = WebSocketMonitor.getInstance();
    const metrics = wsMonitor.getMetrics();
    
    res.json({
      status: 'success',
      data: {
        history: metrics.connectionHistory
      }
    });
  } catch (error) {
    log(`Error getting WebSocket history: ${error}`, 'websocket');
    res.status(500).json({ 
      error: 'Server Error', 
      message: 'Failed to retrieve WebSocket history'
    });
  }
});

/**
 * GET /api/admin/websocket-stats/active
 * 
 * Returns active connection information
 */
router.get('/active', isAdmin, (req: Request, res: Response) => {
  try {
    const wsService = WebSocketService.getInstance();
    const clientInfo = wsService.getClientInfo();
    
    res.json({
      status: 'success',
      data: {
        count: clientInfo.length,
        connections: clientInfo
      }
    });
  } catch (error) {
    log(`Error getting active WebSocket connections: ${error}`, 'websocket');
    res.status(500).json({ 
      error: 'Server Error', 
      message: 'Failed to retrieve active connections'
    });
  }
});

export default router; 