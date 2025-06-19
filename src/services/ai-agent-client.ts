import { aiService } from './ai-service';

// Token Management Types
interface TokenUsage {
  operation: string;
  tokensUsed: number;
  timestamp: Date;
  cost?: number;
}

interface TokenBalance {
  available: number;
  used: number;
  limit: number;
  resetDate: Date;
}

interface AIAgentMessage {
  id: string;
  type: 'request' | 'response' | 'error' | 'token_update';
  operation: string;
  data: any;
  timestamp: Date;
  tokenUsage?: TokenUsage;
}

interface ProcessingRequest {
  id: string;
  type: 'voice' | 'document' | 'text';
  data: any;
  priority: 'low' | 'medium' | 'high';
  callback?: (result: any) => void;
}

// WebSocket AI Agent Client
export class AIAgentClient {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 2000;
  private messageQueue: AIAgentMessage[] = [];
  private tokenBalance: TokenBalance;
  private tokenUsageHistory: TokenUsage[] = [];
  private eventListeners: Map<string, Function[]> = new Map();
  private connectionEnabled = false;
  private fallbackMode = false;

  constructor() {
    this.tokenBalance = {
      available: 10000,
      used: 0,
      limit: 10000,
      resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
    
    this.loadTokenData();
    this.checkConnectionConfig();
  }

  private checkConnectionConfig(): void {
    const wsUrl = import.meta.env.VITE_AI_AGENT_WS_URL;
    
    // Only attempt connection if URL is properly configured and not a placeholder
    if (wsUrl && 
        wsUrl !== 'wss://your-ai-agent-server.com/ws' && 
        wsUrl !== 'wss://localhost:8080/ai-agent' &&
        !wsUrl.includes('placeholder')) {
      this.connectionEnabled = true;
      this.connect();
    } else {
      console.log('AI Agent WebSocket not configured or using placeholder URL. Running in fallback mode.');
      this.fallbackMode = true;
      this.emit('fallback_mode', { reason: 'No valid WebSocket URL configured' });
    }
  }

  private loadTokenData(): void {
    try {
      const stored = localStorage.getItem('ai_agent_tokens');
      if (stored) {
        const data = JSON.parse(stored);
        this.tokenBalance = data.balance || this.tokenBalance;
        this.tokenUsageHistory = data.history || [];
      }
    } catch (error) {
      console.error('Error loading token data:', error);
    }
  }

  private saveTokenData(): void {
    try {
      const data = {
        balance: this.tokenBalance,
        history: this.tokenUsageHistory.slice(-1000) // Keep last 1000 entries
      };
      localStorage.setItem('ai_agent_tokens', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving token data:', error);
    }
  }

  private connect(): void {
    if (!this.connectionEnabled) {
      return;
    }

    try {
      const wsUrl = import.meta.env.VITE_AI_AGENT_WS_URL;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('AI Agent WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.fallbackMode = false;
        this.processMessageQueue();
        this.emit('connected', { timestamp: new Date() });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: AIAgentMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('AI Agent WebSocket disconnected');
        this.isConnected = false;
        this.emit('disconnected', { timestamp: new Date() });
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.warn('AI Agent WebSocket connection failed. Switching to fallback mode.');
        this.fallbackMode = true;
        this.emit('connection_failed', { error, timestamp: new Date() });
      };

    } catch (error) {
      console.warn('Error connecting to AI Agent. Switching to fallback mode:', error);
      this.fallbackMode = true;
      this.emit('connection_failed', { error, timestamp: new Date() });
    }
  }

  private attemptReconnect(): void {
    if (!this.connectionEnabled) {
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect to AI Agent in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.log('Max AI Agent reconnection attempts reached. Switching to fallback mode.');
      this.fallbackMode = true;
      this.emit('fallback_mode', { 
        reason: 'Max reconnection attempts reached',
        attempts: this.reconnectAttempts 
      });
    }
  }

  private handleMessage(message: AIAgentMessage): void {
    switch (message.type) {
      case 'response':
        this.handleResponse(message);
        break;
      case 'token_update':
        this.handleTokenUpdate(message);
        break;
      case 'error':
        this.handleError(message);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private handleResponse(message: AIAgentMessage): void {
    if (message.tokenUsage) {
      this.recordTokenUsage(message.tokenUsage);
    }
    
    this.emit('response', {
      operation: message.operation,
      data: message.data,
      tokenUsage: message.tokenUsage
    });
  }

  private handleTokenUpdate(message: AIAgentMessage): void {
    if (message.data.balance) {
      this.tokenBalance = { ...this.tokenBalance, ...message.data.balance };
      this.saveTokenData();
      this.emit('token_balance_updated', this.tokenBalance);
    }
  }

  private handleError(message: AIAgentMessage): void {
    console.error('AI Agent error:', message.data);
    this.emit('agent_error', {
      operation: message.operation,
      error: message.data,
      timestamp: message.timestamp
    });
  }

  private recordTokenUsage(usage: TokenUsage): void {
    this.tokenUsageHistory.push(usage);
    this.tokenBalance.used += usage.tokensUsed;
    this.tokenBalance.available = Math.max(0, this.tokenBalance.limit - this.tokenBalance.used);
    
    this.saveTokenData();
    this.emit('token_usage', usage);
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      if (message && this.ws) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }

  private sendMessage(message: AIAgentMessage): void {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(message));
    } else if (!this.fallbackMode) {
      this.messageQueue.push(message);
    }
  }

  // Fallback processing using local AI service
  private async processFallback(operation: string, data: any): Promise<any> {
    console.log(`Processing ${operation} using fallback AI service`);
    
    switch (operation) {
      case 'process_voice':
        // Use browser's speech recognition or return mock data
        return {
          text: "Voice processing not available without AI agent connection",
          confidence: 0,
          events: []
        };
      
      case 'process_document':
        // Basic document processing
        return {
          summary: `Document "${data.fileName}" uploaded successfully. AI processing not available.`,
          events: [],
          status: 'processed_locally'
        };
      
      default:
        // Use local AI service for text processing
        if (data.text) {
          try {
            return await aiService.processText(data.text, operation);
          } catch (error) {
            console.error('Fallback processing error:', error);
            return {
              error: 'AI processing temporarily unavailable',
              fallback: true
            };
          }
        }
        
        return {
          error: 'Operation not supported in fallback mode',
          fallback: true
        };
    }
  }

  // Public API Methods
  public async processVoiceData(audioData: Blob, options: any = {}): Promise<any> {
    if (!this.canMakeRequest(50)) {
      throw new Error('Insufficient token balance for voice processing');
    }

    if (this.fallbackMode || !this.isConnected) {
      return this.processFallback('process_voice', { audioData, options });
    }

    const message: AIAgentMessage = {
      id: this.generateId(),
      type: 'request',
      operation: 'process_voice',
      data: {
        audioData: await this.blobToBase64(audioData),
        options
      },
      timestamp: new Date()
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        resolve(this.processFallback('process_voice', { audioData, options }));
      }, 10000); // Shorter timeout, fallback faster

      const handler = (response: any) => {
        if (response.operation === 'process_voice') {
          clearTimeout(timeout);
          this.off('response', handler);
          resolve(response.data);
        }
      };

      this.on('response', handler);
      this.sendMessage(message);
    });
  }

  public async processDocument(file: File, options: any = {}): Promise<any> {
    if (!this.canMakeRequest(100)) {
      throw new Error('Insufficient token balance for document processing');
    }

    if (this.fallbackMode || !this.isConnected) {
      return this.processFallback('process_document', { 
        fileName: file.name, 
        fileType: file.type, 
        options 
      });
    }

    const message: AIAgentMessage = {
      id: this.generateId(),
      type: 'request',
      operation: 'process_document',
      data: {
        fileName: file.name,
        fileType: file.type,
        fileData: await this.fileToBase64(file),
        options
      },
      timestamp: new Date()
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        resolve(this.processFallback('process_document', { 
          fileName: file.name, 
          fileType: file.type, 
          options 
        }));
      }, 30000);

      const handler = (response: any) => {
        if (response.operation === 'process_document') {
          clearTimeout(timeout);
          this.off('response', handler);
          resolve(response.data);
        }
      };

      this.on('response', handler);
      this.sendMessage(message);
    });
  }

  public async processText(text: string, operation: string, options: any = {}): Promise<any> {
    const estimatedTokens = Math.ceil(text.length / 4);
    
    if (!this.canMakeRequest(estimatedTokens)) {
      throw new Error('Insufficient token balance for text processing');
    }

    if (this.fallbackMode || !this.isConnected) {
      return this.processFallback(operation, { text, options });
    }

    const message: AIAgentMessage = {
      id: this.generateId(),
      type: 'request',
      operation,
      data: {
        text,
        options
      },
      timestamp: new Date()
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        resolve(this.processFallback(operation, { text, options }));
      }, 15000);

      const handler = (response: any) => {
        if (response.operation === operation) {
          clearTimeout(timeout);
          this.off('response', handler);
          resolve(response.data);
        }
      };

      this.on('response', handler);
      this.sendMessage(message);
    });
  }

  // Token Management
  public canMakeRequest(estimatedTokens: number): boolean {
    return this.tokenBalance.available >= estimatedTokens;
  }

  public getTokenBalance(): TokenBalance {
    return { ...this.tokenBalance };
  }

  public getTokenUsageHistory(limit: number = 100): TokenUsage[] {
    return this.tokenUsageHistory.slice(-limit);
  }

  public getTokenUsageStats(): {
    totalUsed: number;
    averagePerDay: number;
    topOperations: Array<{ operation: string; tokens: number; count: number }>;
  } {
    const totalUsed = this.tokenUsageHistory.reduce((sum, usage) => sum + usage.tokensUsed, 0);
    
    const daysSinceStart = Math.max(1, Math.ceil(
      (Date.now() - this.tokenUsageHistory[0]?.timestamp.getTime() || Date.now()) / (24 * 60 * 60 * 1000)
    ));
    
    const operationStats = this.tokenUsageHistory.reduce((acc, usage) => {
      if (!acc[usage.operation]) {
        acc[usage.operation] = { tokens: 0, count: 0 };
      }
      acc[usage.operation].tokens += usage.tokensUsed;
      acc[usage.operation].count += 1;
      return acc;
    }, {} as Record<string, { tokens: number; count: number }>);

    const topOperations = Object.entries(operationStats)
      .map(([operation, stats]) => ({ operation, ...stats }))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 5);

    return {
      totalUsed,
      averagePerDay: totalUsed / daysSinceStart,
      topOperations
    };
  }

  // Event System
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  // Utility Methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data URL prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async fileToBase64(file: File): Promise<string> {
    return this.blobToBase64(file);
  }

  // Connection Management
  public isConnectedToAgent(): boolean {
    return this.isConnected;
  }

  public isInFallbackMode(): boolean {
    return this.fallbackMode;
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  public reconnect(): void {
    if (!this.connectionEnabled) {
      console.log('WebSocket connection not enabled. Check VITE_AI_AGENT_WS_URL configuration.');
      return;
    }
    
    this.disconnect();
    this.reconnectAttempts = 0;
    this.fallbackMode = false;
    this.connect();
  }

  public enableConnection(wsUrl?: string): void {
    if (wsUrl) {
      // Temporarily override the URL for this session
      (import.meta.env as any).VITE_AI_AGENT_WS_URL = wsUrl;
    }
    this.connectionEnabled = true;
    this.fallbackMode = false;
    this.connect();
  }
}

export const aiAgentClient = new AIAgentClient();