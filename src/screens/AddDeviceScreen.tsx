import { useState } from "react";
import { View, StyleSheet, ScrollView, StatusBar } from "react-native";
import { Text, TextInput, Button, Card } from "react-native-paper";
import { useTheme } from "../context/ThemeContext";

export default function AddDeviceScreen({ navigation }: any) {
    const { theme, mode } = useTheme();
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
        <>
            <StatusBar
                barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={theme.background}
            />
            <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.header}>
                    <Text variant="headlineMedium" style={[styles.title, { color: theme.text }]}>
                        Add New Device
                    </Text>
                    <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Connect your ESP32 device to your smart home
                    </Text>
                </View>

                <Card style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                    <Card.Content>
                        <View style={styles.section}>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
                                Option 1: WiFi Provisioning (Recommended)
                            </Text>
                            <Text variant="bodySmall" style={[styles.description, { color: theme.textSecondary }]}>
                                Easy setup wizard for new ESP32 devices
                            </Text>
                            <Button
                                mode="contained"
                                icon="wifi-settings"
                                onPress={() => navigation.navigate('ProvisionDevice')}
                                style={styles.button}
                                buttonColor={theme.primary}
                            >
                                Start WiFi Setup
                            </Button>
                        </View>

                        <View style={styles.divider}>
                            <View style={[styles.line, { backgroundColor: theme.border }]} />
                            <Text style={[styles.dividerText, { color: theme.textSecondary }]}>OR</Text>
                            <View style={[styles.line, { backgroundColor: theme.border }]} />
                        </View>

                        <View style={styles.section}>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
                                Option 2: Scan QR Code
                            </Text>
                            <Button
                                mode="contained"
                                icon="qrcode-scan"
                                onPress={handleScan}
                                style={styles.button}
                                buttonColor={theme.primary}
                            >
                                Scan QR Code
                            </Button>
                        </View>

                        <View style={styles.divider}>
                            <View style={[styles.line, { backgroundColor: theme.border }]} />
                            <Text style={[styles.dividerText, { color: theme.textSecondary }]}>OR</Text>
                            <View style={[styles.line, { backgroundColor: theme.border }]} />
                        </View>

                        <View style={styles.section}>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
                                Option 3: Manual Entry
                            </Text>
                            <TextInput
                                label="Device IP Address"
                                value={deviceIp}
                                onChangeText={setDeviceIp}
                                placeholder="192.168.1.100"
                                mode="outlined"
                                style={styles.input}
                                outlineColor={theme.border}
                                activeOutlineColor={theme.primary}
                                textColor={theme.text}
                            />
                            <Button
                                mode="contained"
                                onPress={handleManualAdd}
                                loading={loading}
                                disabled={!deviceIp || loading}
                                style={styles.button}
                                buttonColor={theme.primary}
                            >
                                Add Device
                            </Button>
                        </View>
                    </Card.Content>
                </Card>

                <Card style={[styles.infoCard, { backgroundColor: `${theme.success}20` }]}>
                    <Card.Content>
                        <Text variant="bodySmall" style={{ color: theme.success }}>
                            💡 Make sure your ESP32 device is connected to the same network
                            and powered on before adding it.
                        </Text>
                    </Card.Content>
                </Card>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: 50,
    },
    title: {
        fontWeight: "bold",
        marginBottom: 8,
    },
    subtitle: {
        marginBottom: 16,
    },
    card: {
        margin: 16,
        marginTop: 0,
        borderRadius: 16,
        elevation: 2,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        marginBottom: 12,
        fontWeight: "600",
    },
    description: {
        marginBottom: 8,
    },
    input: {
        marginBottom: 12,
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
    },
    dividerText: {
        paddingHorizontal: 16,
    },
    infoCard: {
        margin: 16,
        borderRadius: 12,
    },
});
