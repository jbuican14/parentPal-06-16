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
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageQueue: AIAgentMessage[] = [];
  private tokenBalance: TokenBalance;
  private tokenUsageHistory: TokenUsage[] = [];
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.tokenBalance = {
      available: 10000,
      used: 0,
      limit: 10000,
      resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
    
    this.loadTokenData();
    this.connect();
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
    try {
      // Use secure WebSocket protocol
      const wsUrl = import.meta.env.VITE_AI_AGENT_WS_URL || 'wss://localhost:8080/ai-agent';
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('AI Agent WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
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
        console.error('AI Agent WebSocket error:', error);
        this.emit('error', { error, timestamp: new Date() });
      };

    } catch (error) {
      console.error('Error connecting to AI Agent:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('max_reconnect_attempts', { attempts: this.reconnectAttempts });
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
    } else {
      this.messageQueue.push(message);
    }
  }

  // Public API Methods
  public async processVoiceData(audioData: Blob, options: any = {}): Promise<any> {
    if (!this.canMakeRequest(50)) { // Estimate 50 tokens for voice processing
      throw new Error('Insufficient token balance for voice processing');
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
        reject(new Error('Voice processing timeout'));
      }, 30000);

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
    if (!this.canMakeRequest(100)) { // Estimate 100 tokens for document processing
      throw new Error('Insufficient token balance for document processing');
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
        reject(new Error('Document processing timeout'));
      }, 60000);

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
    const estimatedTokens = Math.ceil(text.length / 4); // Rough estimate
    
    if (!this.canMakeRequest(estimatedTokens)) {
      throw new Error('Insufficient token balance for text processing');
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
        reject(new Error('Text processing timeout'));
      }, 30000);

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

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  public reconnect(): void {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }
}

export const aiAgentClient = new AIAgentClient();