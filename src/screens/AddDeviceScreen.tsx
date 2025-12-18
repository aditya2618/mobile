import { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, TextInput, Button, Card } from "react-native-paper";

export default function AddDeviceScreen({ navigation }: any) {
    const [deviceIp, setDeviceIp] = useState("");
    const [loading, setLoading] = useState(false);

    const handleScan = () => {
        // TODO: Implement QR code scanning
        console.log("Scan QR code");
    };

    const handleManualAdd = async () => {
        setLoading(true);
        try {
            // TODO: Implement manual device registration
            console.log("Adding device:", deviceIp);
            // Call API to register device
        } catch (err) {
            console.error("Error adding device:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="headlineSmall" style={styles.title}>
                        Add New Device
                    </Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        Connect your ESP32 device to your smart home
                    </Text>

                    <View style={styles.section}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Option 1: Scan QR Code
                        </Text>
                        <Button
                            mode="contained"
                            icon="qrcode-scan"
                            onPress={handleScan}
                            style={styles.button}
                        >
                            Scan QR Code
                        </Button>
                    </View>

                    <View style={styles.divider}>
                        <View style={styles.line} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.line} />
                    </View>

                    <View style={styles.section}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Option 2: Manual Entry
                        </Text>
                        <TextInput
                            label="Device IP Address"
                            value={deviceIp}
                            onChangeText={setDeviceIp}
                            placeholder="192.168.1.100"
                            mode="outlined"
                            style={styles.input}
                        />
                        <Button
                            mode="contained"
                            onPress={handleManualAdd}
                            loading={loading}
                            disabled={!deviceIp || loading}
                            style={styles.button}
                        >
                            Add Device
                        </Button>
                    </View>

                    <Card style={styles.infoCard}>
                        <Card.Content>
                            <Text variant="bodySmall" style={styles.infoText}>
                                💡 Make sure your ESP32 device is connected to the same network
                                and powered on before adding it.
                            </Text>
                        </Card.Content>
                    </Card>
                </Card.Content>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#0a0a0a",
    },
    card: {
        backgroundColor: "#1e1e2e",
        borderRadius: 16,
    },
    title: {
        color: "#fff",
        fontWeight: "bold",
        marginBottom: 8,
    },
    subtitle: {
        color: "#aaa",
        marginBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: "#fff",
        marginBottom: 12,
    },
    input: {
        marginBottom: 12,
        backgroundColor: "#16162a",
    },
    button: {
        marginTop: 8,
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 24,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: "#333",
    },
    dividerText: {
        color: "#666",
        paddingHorizontal: 16,
    },
    infoCard: {
        backgroundColor: "#4CAF5020",
        borderRadius: 12,
        marginTop: 16,
    },
    infoText: {
        color: "#4CAF50",
    },
});
