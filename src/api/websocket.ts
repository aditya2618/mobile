class WebSocketClient {
    private ws: WebSocket | null = null;
    private url: string;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 3000;
    private onMessageCallback?: (data: any) => void;

    constructor(url: string) {
        this.url = url;
    }

    connect(token: string, homeId: number, onMessage: (data: any) => void) {
        this.onMessageCallback = onMessage;

        // WebSocket URL format: ws://IP:8000/ws/home/{home_id}/
        const wsUrl = `${this.url}/home/${homeId}/?token=${token}`;

        console.log("Connecting to WebSocket:", wsUrl);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log("WebSocket connected");
            this.reconnectAttempts = 0;
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
        };

        this.ws.onclose = () => {
            console.log("WebSocket closed");
            this.attemptReconnect(token, homeId);
        };
    }

    private attemptReconnect(token: string, homeId: number) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);

            setTimeout(() => {
                if (this.onMessageCallback) {
                    this.connect(token, homeId, this.onMessageCallback);
                }
            }, this.reconnectDelay);
        } else {
            console.error("Max reconnection attempts reached");
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    send(data: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }
}

// Create a singleton instance
export const wsClient = new WebSocketClient("ws://10.113.86.170:8000/ws");
