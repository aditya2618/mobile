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

                // Check if user has any homes
                const homes = useHomeStore.getState().homes;

                if (homes.length === 0) {
                    // No homes - proceed to dashboard with empty state
                    console.log("No homes found for user. Proceeding to dashboard...");
                    setStatus("Ready! You can add your first home.");
                    setTimeout(() => onReady(), 500);
                    return;
                }

                // User has homes - continue normal flow
                setStatus("Home loaded!");
            } catch (err: any) {
                console.error("Error loading homes:", err);
                // Even if loading fails, proceed to dashboard
                // User can try again from there
                setError("Could not load homes. You can try again from the dashboard.");
                setTimeout(() => onReady(), 1500);
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
                    console.error("Error loading devices:", err);
                    // Proceed anyway - user can see empty dashboard
                    setError("Could not load devices. Please check your connection.");
                    setTimeout(() => onReady(), 1500);
                }
            })();
        } else if (useHomeStore.getState().homes.length > 0) {
            // User has homes but no active home selected
            // This shouldn't normally happen, but handle it gracefully
            console.log("No active home selected");
            setTimeout(() => onReady(), 500);
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
