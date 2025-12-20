import { useState, useEffect } from "react";
import { View, StyleSheet, StatusBar, ScrollView } from "react-native";
import { Button, TextInput, Text } from "react-native-paper";
import { useAuthStore } from "../store/authStore";
import { useServerConfigStore } from "../store/serverConfigStore";
import { useTheme } from "../context/ThemeContext";
import { wsClient } from "../api/websocket";

export default function RegisterScreen({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
    const register = useAuthStore((s) => s.register);
    const { setServerConfig, serverIp: savedIp, serverPort: savedPort, getWebSocketUrl } = useServerConfigStore();
    const { theme, mode } = useTheme();

    const [serverIp, setServerIp] = useState(savedIp || "192.168.29.91");
    const [serverPort, setServerPort] = useState(savedPort || "8000");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Load saved server IP on mount
    useEffect(() => {
        if (savedIp) setServerIp(savedIp);
        if (savedPort) setServerPort(savedPort);
    }, [savedIp, savedPort]);

    const handleRegister = async () => {
        setLoading(true);
        setError("");

        // Validate passwords match
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            // First, save server configuration
            console.log("=== REGISTER DEBUG START ===");
            console.log("Saving server config:", serverIp, serverPort);
            await setServerConfig(serverIp, serverPort);

            // Initialize WebSocket URL
            const wsUrl = getWebSocketUrl();
            wsClient.setUrl(wsUrl);
            console.log("WebSocket URL initialized:", wsUrl);

            // Then attempt registration
            console.log("Attempting registration with username:", username);
            await register(username, email, password);
            console.log("✅ Registration successful!");
        } catch (error: any) {
            console.error("❌ Registration failed:", error);
            setError(error.response?.data?.error || error.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <StatusBar
                barStyle="light-content"
                backgroundColor="#0f172a"
            />
            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text variant="displaySmall" style={styles.title}>
                            🏠 Create Account
                        </Text>
                        <Text variant="bodyLarge" style={styles.subtitle}>
                            Join your smart home
                        </Text>
                    </View>

                    <View style={styles.form}>
                        {/* Server Configuration */}
                        <Text variant="labelLarge" style={styles.sectionLabel}>
                            Server Configuration
                        </Text>

                        <View style={styles.ipRow}>
                            <TextInput
                                label="Server IP"
                                value={serverIp}
                                onChangeText={setServerIp}
                                style={[styles.input, styles.ipInput]}
                                mode="outlined"
                                placeholder="192.168.1.100"
                                keyboardType="numeric"
                                theme={{
                                    colors: {
                                        onSurfaceVariant: '#94a3b8',
                                        outline: '#334155',
                                        primary: '#3b82f6',
                                    }
                                }}
                                textColor="#e2e8f0"
                                left={<TextInput.Icon icon="server-network" color="#94a3b8" />}
                            />

                            <TextInput
                                label="Port"
                                value={serverPort}
                                onChangeText={setServerPort}
                                style={[styles.input, styles.portInput]}
                                mode="outlined"
                                placeholder="8000"
                                keyboardType="numeric"
                                theme={{
                                    colors: {
                                        onSurfaceVariant: '#94a3b8',
                                        outline: '#334155',
                                        primary: '#3b82f6',
                                    }
                                }}
                                textColor="#e2e8f0"
                            />
                        </View>

                        {/* Registration Form */}
                        <Text variant="labelLarge" style={styles.sectionLabel}>
                            Account Information
                        </Text>

                        <TextInput
                            label="Username"
                            value={username}
                            onChangeText={setUsername}
                            style={styles.input}
                            mode="outlined"
                            autoCapitalize="none"
                            theme={{
                                colors: {
                                    onSurfaceVariant: '#94a3b8',
                                    outline: '#334155',
                                    primary: '#3b82f6',
                                }
                            }}
                            textColor="#e2e8f0"
                            left={<TextInput.Icon icon="account" color="#94a3b8" />}
                        />

                        <TextInput
                            label="Email (optional)"
                            value={email}
                            onChangeText={setEmail}
                            style={styles.input}
                            mode="outlined"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            theme={{
                                colors: {
                                    onSurfaceVariant: '#94a3b8',
                                    outline: '#334155',
                                    primary: '#3b82f6',
                                }
                            }}
                            textColor="#e2e8f0"
                            left={<TextInput.Icon icon="email" color="#94a3b8" />}
                        />

                        <TextInput
                            label="Password"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            style={styles.input}
                            mode="outlined"
                            theme={{
                                colors: {
                                    onSurfaceVariant: '#94a3b8',
                                    outline: '#334155',
                                    primary: '#3b82f6',
                                }
                            }}
                            textColor="#e2e8f0"
                            left={<TextInput.Icon icon="lock" color="#94a3b8" />}
                        />

                        <TextInput
                            label="Confirm Password"
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            style={styles.input}
                            mode="outlined"
                            theme={{
                                colors: {
                                    onSurfaceVariant: '#94a3b8',
                                    outline: '#334155',
                                    primary: '#3b82f6',
                                }
                            }}
                            textColor="#e2e8f0"
                            left={<TextInput.Icon icon="lock-check" color="#94a3b8" />}
                        />

                        {error ? (
                            <Text variant="bodySmall" style={styles.errorText}>
                                {error}
                            </Text>
                        ) : null}

                        <Button
                            mode="contained"
                            onPress={handleRegister}
                            style={styles.button}
                            buttonColor="#3b82f6"
                            loading={loading}
                            disabled={loading || !username || !password || !confirmPassword || !serverIp}
                            icon="account-plus"
                        >
                            Create Account
                        </Button>

                        <Button
                            mode="text"
                            onPress={onSwitchToLogin}
                            style={styles.switchButton}
                            textColor="#3b82f6"
                        >
                            Already have an account? Sign In
                        </Button>
                    </View>
                </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    content: {
        maxWidth: 400,
        width: "100%",
        alignSelf: "center",
        padding: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontWeight: "bold",
        marginBottom: 8,
        textAlign: "center",
        color: '#f1f5f9',
    },
    subtitle: {
        marginBottom: 8,
        textAlign: "center",
        color: '#94a3b8',
    },
    form: {
        gap: 4,
    },
    sectionLabel: {
        marginBottom: 12,
        marginTop: 16,
        fontWeight: "600",
        color: '#e2e8f0',
    },
    ipRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 16,
    },
    ipInput: {
        flex: 2,
        backgroundColor: '#1e293b',
    },
    portInput: {
        flex: 1,
        backgroundColor: '#1e293b',
    },
    input: {
        marginBottom: 16,
        backgroundColor: '#1e293b',
    },
    button: {
        marginTop: 16,
        paddingVertical: 8,
    },
    switchButton: {
        marginTop: 8,
    },
    errorText: {
        color: '#ef4444',
        marginBottom: 12,
        textAlign: "center",
        backgroundColor: '#7f1d1d',
        padding: 12,
        borderRadius: 8,
    },
});
