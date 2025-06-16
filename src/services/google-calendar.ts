import { aiService } from './ai-service';

// Google Calendar API Configuration
interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;
  attendees?: Array<{ email: string }>;
}

interface TokenInfo {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  expires_at: number;
}

export class GoogleCalendarService {
  private config: GoogleCalendarConfig;
  private tokenInfo: TokenInfo | null = null;
  private isInitialized = false;

  constructor() {
    this.config = {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
      redirectUri: `${window.location.origin}/auth/google/callback`,
      scopes: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events'
      ]
    };
    
    this.loadStoredTokens();
  }

  private loadStoredTokens(): void {
    try {
      const stored = localStorage.getItem('google_calendar_tokens');
      if (stored) {
        this.tokenInfo = JSON.parse(stored);
        
        // Check if token is expired
        if (this.tokenInfo && this.tokenInfo.expires_at < Date.now()) {
          this.refreshAccessToken();
        }
      }
    } catch (error) {
      console.error('Error loading stored tokens:', error);
      this.clearTokens();
    }
  }

  private storeTokens(tokenInfo: TokenInfo): void {
    try {
      localStorage.setItem('google_calendar_tokens', JSON.stringify(tokenInfo));
      this.tokenInfo = tokenInfo;
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  }

  private clearTokens(): void {
    localStorage.removeItem('google_calendar_tokens');
    this.tokenInfo = null;
  }

  public getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  public async handleAuthCallback(code: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!response.ok) {
        throw new Error(`OAuth error: ${response.statusText}`);
      }

      const tokenData = await response.json();
      const tokenInfo: TokenInfo = {
        ...tokenData,
        expires_at: Date.now() + (tokenData.expires_in * 1000)
      };

      this.storeTokens(tokenInfo);
      this.isInitialized = true;

      return { success: true };
    } catch (error: any) {
      console.error('Auth callback error:', error);
      return { success: false, error: error.message };
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.tokenInfo?.refresh_token) {
      return false;
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.tokenInfo.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const tokenData = await response.json();
      const updatedTokenInfo: TokenInfo = {
        ...this.tokenInfo,
        access_token: tokenData.access_token,
        expires_in: tokenData.expires_in,
        expires_at: Date.now() + (tokenData.expires_in * 1000)
      };

      this.storeTokens(updatedTokenInfo);
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearTokens();
      return false;
    }
  }

  private async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.tokenInfo) {
      throw new Error('Not authenticated');
    }

    // Check if token needs refresh
    if (this.tokenInfo.expires_at < Date.now() + 60000) { // Refresh 1 minute before expiry
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) {
        throw new Error('Failed to refresh authentication');
      }
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.tokenInfo.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      // Try to refresh token once
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${this.tokenInfo!.access_token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    }

    return response;
  }

  public async getCalendars(): Promise<any[]> {
    try {
      const response = await this.makeAuthenticatedRequest(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList'
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch calendars: ${response.statusText}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching calendars:', error);
      throw error;
    }
  }

  public async getEvents(calendarId: string = 'primary', timeMin?: string, timeMax?: string): Promise<CalendarEvent[]> {
    try {
      const params = new URLSearchParams({
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime'
      });

      const response = await this.makeAuthenticatedRequest(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.statusText}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  public async createEvent(calendarId: string = 'primary', event: CalendarEvent): Promise<CalendarEvent> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: 'POST',
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create event: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  public async updateEvent(calendarId: string = 'primary', eventId: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
        {
          method: 'PUT',
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update event: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  public async deleteEvent(calendarId: string = 'primary', eventId: string): Promise<void> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete event: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  public isConnected(): boolean {
    return !!(this.tokenInfo && this.tokenInfo.expires_at > Date.now());
  }

  public disconnect(): void {
    this.clearTokens();
    this.isInitialized = false;
  }

  public getConnectionStatus(): {
    connected: boolean;
    expiresAt?: number;
    scopes?: string[];
  } {
    return {
      connected: this.isConnected(),
      expiresAt: this.tokenInfo?.expires_at,
      scopes: this.tokenInfo?.scope.split(' ')
    };
  }
}

export const googleCalendarService = new GoogleCalendarService();