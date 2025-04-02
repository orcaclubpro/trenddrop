/**
 * LogController - Handles log-related API routes
 * 
 * This controller handles all log-related HTTP requests.
 */

import { Request, Response } from 'express';
import { logService } from '../services/index.js';
import { log } from '../vite.js';

export class LogController {
  /**
   * Get recent logs
   */
  async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const source = req.query.source as string | undefined;
      
      const logs = logService.getRecentLogs(limit, source);
      
      res.json({ logs });
    } catch (error) {
      log(`Error in getLogs: ${error}`, 'log-controller');
      res.status(500).json({ error: 'Failed to retrieve logs' });
    }
  }

  /**
   * Clear all logs
   */
  async clearLogs(req: Request, res: Response): Promise<void> {
    try {
      logService.clearLogs();
      res.json({ success: true, message: 'Logs cleared successfully' });
    } catch (error) {
      log(`Error in clearLogs: ${error}`, 'log-controller');
      res.status(500).json({ error: 'Failed to clear logs' });
    }
  }
} 