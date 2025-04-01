/**
 * AgentController - Handles agent-related API routes
 * 
 * This controller handles all agent-related HTTP requests.
 */

import { Request, Response } from 'express';
import { startAgentService, stopAgentService, triggerScraping, getAgentStatus } from '../services/index.js';
import { log } from '../vite.js';

export class AgentController {
  /**
   * Get agent status
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = getAgentStatus();
      res.json(status);
    } catch (error) {
      log(`Error in getStatus: ${error}`, 'agent-controller');
      res.status(500).json({ error: 'Failed to retrieve agent status' });
    }
  }

  /**
   * Start the agent
   */
  async startAgent(req: Request, res: Response): Promise<void> {
    try {
      startAgentService();
      res.json({ success: true, message: 'Agent started successfully' });
    } catch (error) {
      log(`Error in startAgent: ${error}`, 'agent-controller');
      res.status(500).json({ error: 'Failed to start agent' });
    }
  }

  /**
   * Stop the agent
   */
  async stopAgent(req: Request, res: Response): Promise<void> {
    try {
      stopAgentService();
      res.json({ success: true, message: 'Agent stopped successfully' });
    } catch (error) {
      log(`Error in stopAgent: ${error}`, 'agent-controller');
      res.status(500).json({ error: 'Failed to stop agent' });
    }
  }

  /**
   * Trigger a scraping task
   */
  async triggerScraping(req: Request, res: Response): Promise<void> {
    try {
      await triggerScraping();
      res.json({ success: true, message: 'Scraping task triggered successfully' });
    } catch (error) {
      log(`Error in triggerScraping: ${error}`, 'agent-controller');
      res.status(500).json({ error: 'Failed to trigger scraping task' });
    }
  }
}

// Export controller instance
export const agentController = new AgentController();

// Export default for convenience
export default agentController;