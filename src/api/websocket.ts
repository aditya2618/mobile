class WebSocketClient {
    private ws: WebSocket | null = null;
    private url: string = '';
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 3000;
    private onMessageCallback?: (data: any) => void;
    private reconnectTimeout?: NodeJS.Timeout;
    private isConnecting = false;
    private shouldReconnect = true;

    constructor() {
        // No URL in constructor - will be set via setUrl()
    }

    setUrl(url: string) {
        this.url = url;
        console.log("WebSocket URL set to:", url);
    }

    connect(token: string, homeId: number, onMessage: (data: any) => void) {
        // Prevent duplicate connections
        if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
            console.log("WebSocket already connected or connecting");
            return;
        }

        if (!this.url) {
            console.error("WebSocket URL not set. Call setUrl() first.");
            return;
        }

        this.onMessageCallback = onMessage;
        this.shouldReconnect = true;
        this.isConnecting = true;

        // WebSocket URL format: ws://IP:8000/ws/home/{home_id}/
        const wsUrl = `${this.url}/home/${homeId}/?token=${token}`;

        console.log("Connecting to WebSocket:", wsUrl);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log("WebSocket connected");
            this.reconnectAttempts = 0;
            this.isConnecting = false;
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("WebSocket message:", data);
                if (this.onMessageCallback) {
                    this.onMessageCallback(data);
                }
            } catch (err) {
                console.error("Error parsing WebSocket message:", err);
            }
        };

        this.ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            this.isConnecting = false;
        };

        this.ws.onclose = (event) => {
            console.log("WebSocket closed");
            console.log("Close code:", event.code);
            console.log("Close reason:", event.reason);
            console.log("Was clean:", event.wasClean);
            this.isConnecting = false;

            if (this.shouldReconnect) {
                this.attemptReconnect(token, homeId);
            }
        };
    }

    private attemptReconnect(token: string, homeId: number) {
        // Clear any existing reconnect timeout
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

            this.reconnectTimeout = setTimeout(() => {
                if (this.onMessageCallback && this.shouldReconnect) {
                    this.connect(token, homeId, this.onMessageCallback);
                }
            }, this.reconnectDelay);
        } else {
            console.error("Max reconnection attempts reached");
        }
    }

    disconnect() {
        this.shouldReconnect = false;

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.isConnecting = false;
    }

    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    send(data: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }
}

// Create a singleton instance
export const wsClient = new WebSocketClient();
