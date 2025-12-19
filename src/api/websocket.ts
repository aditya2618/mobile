class WebSocketClient {
    private ws: WebSocket | null = null;
    private url: string;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 3000;
    private onMessageCallback?: (data: any) => void;
    private reconnectTimeout?: NodeJS.Timeout;
    private isConnecting = false;
    private shouldReconnect = true;

    constructor(url: string) {
        this.url = url;
    }

    connect(token: string, homeId: number, onMessage: (data: any) => void) {
        // Prevent duplicate connections
        if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
            console.log("WebSocket already connected or connecting");
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

        this.ws.onclose = () => {
            console.log("WebSocket closed");
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

    send(data: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }
}

// Create a singleton instance
export const wsClient = new WebSocketClient("ws://192.168.29.91:8000/ws");
