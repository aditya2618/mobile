import { useEffect, useState } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { useHomeStore } from "../store/homeStore";
import { useDeviceStore } from "../store/deviceStore";
import { useSceneStore } from "../store/sceneStore";
import { useTheme } from "../context/ThemeContext";

export default function HomeBootstrap({ onReady }: { onReady: () => void }) {
    const loadHomes = useHomeStore((s) => s.loadHomes);
    const activeHome = useHomeStore((s) => s.activeHome);
    const loadDevices = useDeviceStore((s) => s.loadDevices);
    const loadScenes = useSceneStore((s) => s.loadScenes);
    const { theme, mode } = useTheme();
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState("Loading homes...");

    useEffect(() => {
        (async () => {
            try {
                setStatus("Loading homes...");
                await loadHomes();
            } catch (err: any) {
                console.error("Error loading homes:", err);
                setError("Failed to load homes: " + err.message);
            }
        })();
    }, []);

    useEffect(() => {
        if (activeHome) {
            (async () => {
                try {
                    setStatus("Loading devices and scenes...");
                    await Promise.all([
                        loadDevices(activeHome.id),
                        loadScenes(activeHome.id)
                    ]);
                    setStatus("Ready!");
                    setTimeout(() => onReady(), 500);
                } catch (err: any) {
                    console.error("Error loading data:", err);
                    setError("Failed to load data: " + err.message);
                }
            })();
        }
    }, [activeHome]);

    return (
        <>
            <StatusBar
                barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={theme.background}
            />
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {error ? (
                    <View style={styles.content}>
                        <Text variant="headlineSmall" style={[styles.errorTitle, { color: theme.error }]}>
                            Error
                        </Text>
                        <Text variant="bodyMedium" style={[styles.errorText, { color: theme.textSecondary }]}>
                            {error}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.content}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text variant="titleMedium" style={[styles.status, { color: theme.text }]}>
                            {status}
                        </Text>
                    </View>
                )}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    content: {
        alignItems: "center",
    },
    status: {
        marginTop: 16,
        textAlign: "center",
    },
    errorTitle: {
        fontWeight: "bold",
        marginBottom: 8,
    },
    errorText: {
        textAlign: "center",
    },
});
