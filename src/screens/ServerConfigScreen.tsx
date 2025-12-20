```typescript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, Surface, HelperText } from 'react-native-paper';
import { useServerConfigStore } from '../store/serverConfigStore';
import { StatusBar } from 'expo-status-bar';

export default function ServerConfigScreen({ onConfigured }: { onConfigured: () => void }) {
    const setServerConfig = useServerConfigStore((s) => s.setServerConfig);
    const loadServerConfig = useServerConfigStore((s) => s.loadServerConfig);
    const isConfigured = useServerConfigStore((s) => s.isConfigured);

    const [serverIp, setServerIp] = useState(''); // Changed initial state to empty string
    const [serverPort, setServerPort] = useState('8000');
    const [loading, setLoading] = useState(false);
    const [ipError, setIpError] = useState('');

    // Load saved config on mount
    useEffect(() => {
        loadServerConfig().then(() => {
            const store = useServerConfigStore.getState();
            if (store.isConfigured && store.serverIp) {
                setServerIp(store.serverIp);
                setServerPort(store.serverPort);
                // Auto-proceed if already configured
                onConfigured();
            }
        });
    }, []);

    const validateIP = (ip: string): boolean => {
        // Simple IP validation (IPv4)
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ip)) {
            setIpError('Invalid IP address format');
            return false;
        }

        const parts = ip.split('.');
        const valid = parts.every(part => {
            const num = parseInt(part, 10);
            return num >= 0 && num <= 255;
        });

        if (!valid) {
            setIpError('IP address parts must be between 0-255');
            return false;
        }

        setIpError('');
        return true;
    };

    const handleSave = async () => {
        if (!validateIP(serverIp)) {
            return;
        }

        setLoading(true);
        try {
            // Test connection before saving
            const testUrl = `http://${serverIp}:${serverPort}/api/homes/`;
console.log("Testing connection to:", testUrl);

const response = await fetch(testUrl, {
    method: 'GET',
    timeout: 5000,
} as any);

console.log("Connection test response:", response.status);

if (response.ok || response.status === 401) {
    // 200 OK or 401 Unauthorized means server is reachable
    console.log("Server is reachable, saving config...");
    await setServerConfig(serverIp, serverPort);
    console.log("Config saved, calling onConfigured");

    // Small delay to ensure state updates propagate
    setTimeout(() => {
        onConfigured();
    }, 100);
} else {
    Alert.alert('Error', `Server responded with status ${response.status}. Try again or use "Save Anyway".`);
    setLoading(false);
}
        } catch (error) {
    console.log("Connection test failed:", error);
    Alert.alert(
        'Connection Failed',
        `Could not connect to server at ${serverIp}:${serverPort}. Save anyway?`,
        [
            {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => setLoading(false)
            },
            {
                text: 'Save Anyway',
                onPress: async () => {
                    console.log("Saving anyway...");
                    await setServerConfig(serverIp, serverPort);
                    console.log("Config saved, calling onConfigured");

                    // Small delay to ensure state updates propagate
                    setTimeout(() => {
                        onConfigured();
                        setLoading(false);
                    }, 100);
                },
            },
        ]
    );
}
    };

return (
    <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
    >
        <StatusBar style="light" />
        <View style={styles.content}>
            <Surface style={styles.card} elevation={4}>
                <Text variant="headlineMedium" style={styles.title}>
                    🏠 Smart Home Server
                </Text>
                <Text variant="bodyMedium" style={styles.subtitle}>
                    Configure your server connection
                </Text>

                <View style={styles.form}>
                    <TextInput
                        label="Server IP Address"
                        value={serverIp}
                        onChangeText={(text) => {
                            setServerIp(text);
                            setIpError('');
                        }}
                        mode="outlined"
                        keyboardType="numeric"
                        placeholder="192.168.1.100"
                        style={styles.input}
                        error={!!ipError}
                        left={<TextInput.Icon icon="server-network" />}
                    />
                    {ipError ? (
                        <HelperText type="error" visible={!!ipError}>
                            {ipError}
                        </HelperText>
                    ) : null}

                    <TextInput
                        label="Server Port"
                        value={serverPort}
                        onChangeText={setServerPort}
                        mode="outlined"
                        keyboardType="numeric"
                        placeholder="8000"
                        style={styles.input}
                        left={<TextInput.Icon icon="network" />}
                    />

                    <View style={styles.exampleBox}>
                        <Text variant="labelSmall" style={styles.exampleLabel}>
                            Example:
                        </Text>
                        <Text variant="bodySmall" style={styles.exampleText}>
                            IP: 192.168.1.100{'\n'}
                            Port: 8000{'\n'}
                            {'\n'}
                            Server URL: http://{serverIp}:{serverPort}
                        </Text>
                    </View>

                    <Button
                        mode="contained"
                        onPress={handleSave}
                        loading={loading}
                        disabled={loading || !serverIp}
                        style={styles.button}
                        icon="content-save"
                    >
                        {loading ? 'Testing Connection...' : 'Save & Connect'}
                    </Button>
                </View>
            </Surface>

            <Text variant="bodySmall" style={styles.footer}>
                💡 You can find your server IP by running 'ipconfig' on Windows{'\n'}
                or 'ifconfig' on Linux/Mac
            </Text>
        </View>
    </KeyboardAvoidingView>
);
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        padding: 24,
        borderRadius: 16,
        backgroundColor: '#16213e',
    },
    title: {
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        color: '#94a3b8',
        marginBottom: 32,
        textAlign: 'center',
    },
    form: {
        gap: 16,
    },
    input: {
        backgroundColor: '#0f172a',
    },
    exampleBox: {
        backgroundColor: '#0f172a',
        padding: 16,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#3b82f6',
    },
    exampleLabel: {
        color: '#3b82f6',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    exampleText: {
        color: '#94a3b8',
        fontFamily: 'monospace',
    },
    button: {
        marginTop: 8,
        paddingVertical: 8,
    },
    footer: {
        color: '#64748b',
        textAlign: 'center',
        marginTop: 24,
        lineHeight: 20,
    },
});
