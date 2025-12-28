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
    private cloudMode = false;
    private pendingRequests: Map<string, { resolve: (value: any) => void, reject: (reason?: any) => void }> = new Map();
    private requestIdCounter = 0;

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

        // Build WebSocket URL
        // Server routing pattern: path("ws/home/<int:home_id>/", Consumer)
        // Requires trailing slash BEFORE query params!
        const wsUrl = `${this.url}/home/${homeId}/?token=${token}`;

        console.log("Connecting to WebSocket:", wsUrl);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log("WebSocket connected");
            this.reconnectAttempts = 0;
            this.isConnecting = false;
        };

        this.ws.onmessage = (event) => {
            console.log("📩 Raw WebSocket event received:", typeof event.data, event.data);
            try {
                const data = JSON.parse(event.data);
                console.log("📦 WebSocket message parsed:", data);

                // Handle cloud mode responses
                if (this.cloudMode && data.request_id) {
                    this.handleCloudResponse(data);
                } else if (this.onMessageCallback) {
                    this.onMessageCallback(data);
                }
            } catch (err) {
                console.error("Error parsing WebSocket message:", err, event.data);
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

    setCloudMode(enabled: boolean, cloudUrl?: string) {
        this.cloudMode = enabled;
        if (enabled && cloudUrl) {
            // Cloud URL format: ws://35.209.239.164/ws (the /home/{id}/ part is added in connect())
            this.url = cloudUrl.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws';
            console.log('☁️ Cloud mode enabled, WebSocket URL:', this.url);
        }
    }

    /**
     * Request devices from cloud (async request-response pattern)
     */
    async requestDevices(homeId: number): Promise<any[]> {
        if (!this.isConnected()) {
            throw new Error('WebSocket not connected');
        }

        const requestId = `req_${++this.requestIdCounter}`;

        return new Promise((resolve, reject) => {
            // Store pending request
            this.pendingRequests.set(requestId, { resolve, reject });

            // Send request
            this.send({
                type: 'get_devices',
                request_id: requestId,
                home_id: homeId,
            });

            // Timeout after 10 seconds
            setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error('Request timeout'));
                }
            }, 10000);
        });
    }

    /**
     * Control entity via cloud (async request-response pattern)
     */
    async controlEntity(homeId: number, entityId: number, command: string, value?: any): Promise<any> {
        if (!this.isConnected()) {
            throw new Error('WebSocket not connected');
        }

        const requestId = `req_${++this.requestIdCounter}`;

        return new Promise((resolve, reject) => {
            // Store pending request (optional: if you want to wait for ack)
            // For control, we might just fire and forget, but waiting for ack is safer
            this.pendingRequests.set(requestId, { resolve, reject });

            // Send request
            this.send({
                type: 'control_entity',
                request_id: requestId,
                home_id: homeId,
                entity_id: entityId,
                command: command,
                value: value
            });

            // Timeout after 5 seconds
            setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error('Control request timeout'));
                }
            }, 5000);
        });
    }

    /**
     * Handle responses from cloud
     */
    private handleCloudResponse(data: any) {
        const requestId = data.request_id;
        if (requestId && this.pendingRequests.has(requestId)) {
            const { resolve } = this.pendingRequests.get(requestId)!;
            this.pendingRequests.delete(requestId);
            resolve(data.data || data.devices || []);
        }
    }
}

// Create a singleton instance
export const wsClient = new WebSocketClient();
