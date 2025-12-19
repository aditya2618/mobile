import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { useHomeStore } from "../store/homeStore";
import { useDeviceStore } from "../store/deviceStore";
import { useAuthStore } from "../store/authStore";
import { wsClient } from "../api/websocket";

export default function HomeBootstrap({ onReady }: any) {
    const loadHomes = useHomeStore((s) => s.loadHomes);
    const activeHome = useHomeStore((s) => s.activeHome);
    const loadDevices = useDeviceStore((s) => s.loadDevices);
    const updateEntityState = useDeviceStore((s) => s.updateEntityState);
    const token = useAuthStore((s) => s.token);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                console.log("Loading homes...");
                await loadHomes();
                console.log("Homes loaded");
            } catch (err: any) {
                console.error("Error loading homes:", err);
                setError("Failed to load homes: " + err.message);
            }
        })();
    }, []);

    useEffect(() => {
        if (activeHome && token) {
            console.log("Loading devices for home:", activeHome.id);
            loadDevices(activeHome.id)
                .then(() => {
                    console.log("Devices loaded, calling onReady");

                    // Connect to WebSocket for real-time updates
                    wsClient.connect(token, activeHome.id, (data) => {
                        console.log("WebSocket update received:", data);

                        // Handle different message types
                        if (data.type === "entity_state" && data.entity_id && data.state) {
                            updateEntityState(data.entity_id, data.state);
                        }
                    });

                    onReady();
                })
                .catch((err) => {
                    console.error("Error loading devices:", err);
                    setError("Failed to load devices: " + err.message);
                });
        }

        // Cleanup WebSocket on unmount
        return () => {
            wsClient.disconnect();
        };
    }, [activeHome, token]);

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.error}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" />
            <Text style={styles.text}>Loading your home...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    text: {
        marginTop: 16,
        opacity: 0.7,
    },
    error: {
        color: "#f44",
        textAlign: "center",
    },
});
