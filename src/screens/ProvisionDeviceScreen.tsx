import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    StatusBar,
    Alert,
} from 'react-native';
import { Text, Button, Card, TextInput, ProgressBar, ActivityIndicator } from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';
import { provisioningAPI } from '../api/provisionClient';
import { DeviceClient } from '../api/deviceClient';
import { useHomeStore } from '../store/homeStore';
import { logger } from '../utils/logger';

type ProvisionStep = 'prepare' | 'connect' | 'configure' | 'reconnect' | 'waiting' | 'complete';

export default function ProvisionDeviceScreen({ navigation }: any) {
    const { theme, mode } = useTheme();
    const selectedHome = useHomeStore((s) => s.selectedHome);

    // Step management
    const [currentStep, setCurrentStep] = useState<ProvisionStep>('prepare');
    const [progress, setProgress] = useState(0.2);

    // Data states
    const [deviceName, setDeviceName] = useState('');
    const [wifiSSID, setWifiSSID] = useState('');
    const [wifiPassword, setWifiPassword] = useState('');

    // MQTT Manual Config
    const [mqttBroker, setMqttBroker] = useState('');
    const [mqttPort, setMqttPort] = useState('1883');

    // Provisioning states
    const [provisioningId, setProvisioningId] = useState('');
    const [mqttConfig, setMqttConfig] = useState<any>(null);
    const [deviceInfo, setDeviceInfo] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

    // Check if home is selected on mount
    useEffect(() => {
        if (!selectedHome) {
            Alert.alert(
                'No Home Selected',
                'Please select a home first before adding devices.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        }
    }, [selectedHome]);

    // Intercept back navigation to handle cleanup
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', async (e: any) => {
            // If completed or not yet provisioned, let it pass
            if (currentStep === 'complete' || !provisioningId) {
                return;
            }

            // Prevent default behavior
            e.preventDefault();

            // Auto-cancel without confirming (since user already pressed back)
            // or we could show an alert. Given the user's request, we should just clean up.
            try {
                if (provisioningId) {
                    await provisioningAPI.cancelProvisioning(provisioningId);
                    logger.info('Provisioning cancelled and cleaned up on navigation');
                }
            } catch (err) {
                logger.error('Failed to rollback provisioning:', err);
            }

            // Dispatch the action again to actually go back
            navigation.dispatch(e.data.action);
        });

        return unsubscribe;
    }, [navigation, currentStep, provisioningId]);


    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
        };
    }, [pollingInterval]);

    const handleCancel = () => {
        navigation.goBack();
    };

    // Step 1: Pre-register device
    const handlePrepareDevice = async () => {
        if (!selectedHome) {
            Alert.alert('Error', 'No home selected');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Generate node name
            const nodeName = `esp32_device_${Date.now().toString().slice(-6)}`;

            // Pre-register device with backend
            const registrationResponse = await provisioningAPI.registerDevice(
                nodeName,
                selectedHome.id,
                deviceName || `ESP32 Device`
            );

            setProvisioningId(registrationResponse.provisioning_id);
            setMqttConfig(registrationResponse.mqtt_config);

            // Move to next step
            setCurrentStep('connect');
            setProgress(0.4);

        } catch (err: any) {
            setError(err.message || 'Failed to prepare device');
            Alert.alert('Preparation Failed', err.message);
        } finally {
            setLoading(false);
        }
    };

    // Step 2: User connects to ESP32 AP
    const handleDeviceConnected = async () => {
        try {
            setLoading(true);
            setError(null);

            // Try to get device info from ESP32
            const deviceClient = new DeviceClient('192.168.4.1');
            const info = await deviceClient.getDeviceInfo();

            setDeviceInfo(info);
            setCurrentStep('configure');
            setProgress(0.6);

        } catch (err: any) {
            setError('Failed to connect to device. Make sure you are connected to the ESP32 WiFi network.');
            Alert.alert(
                'Connection Failed',
                'Could not reach the ESP32 device. Please make sure you are connected to its WiFi network.',
                [
                    { text: 'Retry', onPress: handleDeviceConnected },
                    { text: 'Cancel', onPress: () => setCurrentStep('connect') }
                ]
            );
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Configure WiFi and MQTT
    const handleConfigureDevice = async () => {
        if (!wifiSSID) {
            Alert.alert('Error', 'Please enter WiFi SSID');
            return;
        }

        if (!mqttConfig) {
            Alert.alert('Error', 'MQTT configuration not available');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const deviceClient = new DeviceClient('192.168.4.1');

            // Send WiFi credentials
            await deviceClient.sendWiFiConfig(wifiSSID, wifiPassword);

            // Send MQTT configuration
            await deviceClient.sendMQTTConfig(
                mqttBroker,
                parseInt(mqttPort) || 1883,
                mqttConfig.topic_prefix,
                mqttConfig.node_name
            );

            // Restart device
            await deviceClient.restartDevice();

            // Move to reconnect step
            setCurrentStep('reconnect');
            setProgress(0.8);

        } catch (err: any) {
            setError(err.message || 'Failed to configure device');
            Alert.alert('Configuration Failed', err.message);
        } finally {
            setLoading(false);
        }
    };

    // Step 4: Poll for device connection
    const handleReconnected = () => {
        setCurrentStep('waiting');
        startPolling();
    };

    const startPolling = () => {
        let attempts = 0;
        const maxAttempts = 40; // 2 minutes (40 * 3 seconds)

        const interval = setInterval(async () => {
            attempts++;

            try {
                const status = await provisioningAPI.getProvisioningStatus(provisioningId);

                if (status.device.is_provisioned && status.device.is_online) {
                    clearInterval(interval);
                    setPollingInterval(null);
                    setCurrentStep('complete');
                    setProgress(1);
                } else if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    setPollingInterval(null);
                    Alert.alert(
                        'Timeout',
                        'Device did not connect within 2 minutes. It may still connect in the background. Check your devices list.',
                        [
                            { text: 'Keep Waiting', onPress: startPolling },
                            { text: 'Cancel Setup', onPress: handleCancel }
                        ]
                    );
                }
            } catch (err) {
                logger.error('Polling error:', err);
            }
        }, 3000);

        setPollingInterval(interval);
    };

    const handleComplete = () => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }
        navigation.goBack();
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 'prepare':
                return (
                    <View>
                        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
                            Prepare Device Setup
                        </Text>
                        <Text variant="bodyMedium" style={[styles.description, { color: theme.textSecondary }]}>
                            Register this device with your home
                        </Text>

                        <TextInput
                            label="Device Name (Optional)"
                            value={deviceName}
                            onChangeText={setDeviceName}
                            placeholder="e.g., Living Room Sensor"
                            mode="outlined"
                            style={styles.input}
                            outlineColor={theme.border}
                            activeOutlineColor={theme.primary}
                            textColor={theme.text}
                        />

                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                            <Button
                                mode="outlined"
                                onPress={handleCancel}
                                style={{ flex: 1 }}
                                textColor={theme.error}
                            >
                                Cancel
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handlePrepareDevice}
                                loading={loading}
                                disabled={loading}
                                style={{ flex: 1 }}
                                buttonColor={theme.primary}
                            >
                                Continue
                            </Button>
                        </View>
                    </View >
                );

            case 'connect':
                return (
                    <View>
                        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
                            Connect to Device
                        </Text>
                        <Text variant="bodyMedium" style={[styles.description, { color: theme.textSecondary }]}>
                            Connect your phone to the ESP32's WiFi access point
                        </Text>

                        <Card style={[styles.infoCard, { backgroundColor: `${theme.warning}10` }]}>
                            <Card.Content>
                                <Text variant="bodyMedium" style={{ color: theme.text, marginBottom: 12 }}>
                                    📱 Follow these steps:
                                </Text>
                                <Text variant="bodySmall" style={{ color: theme.text, marginBottom: 4 }}>
                                    1. Go to your phone's WiFi settings
                                </Text>
                                <Text variant="bodySmall" style={{ color: theme.text, marginBottom: 4 }}>
                                    2. Look for a network starting with <Text style={{ fontWeight: 'bold' }}>ESP32</Text> or <Text style={{ fontWeight: 'bold' }}>ESP-</Text>
                                </Text>
                                <Text variant="bodySmall" style={{ color: theme.text, marginBottom: 4 }}>
                                    3. Connect to that network (password is usually <Text style={{ fontWeight: 'bold' }}>12345678</Text>)
                                </Text>
                                <Text variant="bodySmall" style={{ color: theme.text }}>
                                    4. Return to this app
                                </Text>
                            </Card.Content>
                        </Card>

                        <Card style={[styles.infoCard, { backgroundColor: `${theme.primary}10` }]}>
                            <Card.Content>
                                <Text variant="bodySmall" style={{ color: theme.text }}>
                                    💡 Common ESP32 AP names: ESP32-DHT11-Setup, ESP-XXXX, ESP32-Device, etc.
                                </Text>
                            </Card.Content>
                        </Card>

                        <Card style={[styles.infoCard, { backgroundColor: `${theme.error}10` }]}>
                            <Card.Content>
                                <Text variant="bodySmall" style={{ color: theme.error }}>
                                    ⚠️ Your phone will show "No Internet" - this is normal!
                                </Text>
                            </Card.Content>
                        </Card>

                        <Button
                            mode="contained"
                            onPress={handleDeviceConnected}
                            loading={loading}
                            disabled={loading}
                            style={styles.button}
                            buttonColor={theme.primary}
                            icon="wifi"
                        >
                            I'm Connected to Device WiFi
                        </Button>
                    </View>
                );

            case 'configure':
                return (
                    <View>
                        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
                            Configure WiFi
                        </Text>
                        <Text variant="bodyMedium" style={[styles.description, { color: theme.textSecondary }]}>
                            Enter your home WiFi credentials
                        </Text>

                        {deviceInfo && (
                            <Card style={[styles.infoCard, { backgroundColor: `${theme.success}10` }]}>
                                <Card.Content>
                                    <Text variant="bodySmall" style={{ color: theme.text }}>
                                        ✓ Connected to device: {deviceInfo.chip_id}
                                    </Text>
                                </Card.Content>
                            </Card>
                        )}

                        <TextInput
                            label="WiFi SSID"
                            value={wifiSSID}
                            onChangeText={setWifiSSID}
                            placeholder="Your home WiFi name"
                            mode="outlined"
                            style={styles.input}
                            outlineColor={theme.border}
                            activeOutlineColor={theme.primary}
                            textColor={theme.text}
                            autoCapitalize="none"
                        />

                        <TextInput
                            label="WiFi Password"
                            value={wifiPassword}
                            onChangeText={setWifiPassword}
                            placeholder="Your home WiFi password"
                            mode="outlined"
                            style={styles.input}
                            outlineColor={theme.border}
                            activeOutlineColor={theme.primary}
                            textColor={theme.text}
                            secureTextEntry
                            autoCapitalize="none"
                        />

                        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>
                            MQTT Configuration
                        </Text>

                        <TextInput
                            label="MQTT Broker IP"
                            value={mqttBroker}
                            onChangeText={setMqttBroker}
                            placeholder="192.168.1.X"
                            mode="outlined"
                            style={styles.input}
                            outlineColor={theme.border}
                            activeOutlineColor={theme.primary}
                            textColor={theme.text}
                            autoCapitalize="none"
                            keyboardType="numeric"
                        />

                        <TextInput
                            label="MQTT Port"
                            value={mqttPort}
                            onChangeText={setMqttPort}
                            placeholder="1883"
                            mode="outlined"
                            style={styles.input}
                            outlineColor={theme.border}
                            activeOutlineColor={theme.primary}
                            textColor={theme.text}
                            keyboardType="numeric"
                        />

                        <Button
                            mode="contained"
                            onPress={handleConfigureDevice}
                            loading={loading}
                            disabled={loading || !wifiSSID}
                            style={styles.button}
                            buttonColor={theme.primary}
                        >
                            Send Configuration to Device
                        </Button>
                    </View>
                );

            case 'reconnect':
                return (
                    <View>
                        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
                            Reconnect to Home WiFi
                        </Text>
                        <Text variant="bodyMedium" style={[styles.description, { color: theme.textSecondary }]}>
                            The device is restarting. Reconnect your phone to your home WiFi.
                        </Text>

                        <Card style={[styles.infoCard, { backgroundColor: `${theme.warning}10` }]}>
                            <Card.Content>
                                <Text variant="bodyMedium" style={{ color: theme.text, marginBottom: 12 }}>
                                    📱 Follow these steps:
                                </Text>
                                <Text variant="bodySmall" style={{ color: theme.text, marginBottom: 4 }}>
                                    1. Go to your phone's WiFi settings
                                </Text>
                                <Text variant="bodySmall" style={{ color: theme.text, marginBottom: 4 }}>
                                    2. Connect to: <Text style={{ fontWeight: 'bold' }}>{wifiSSID}</Text>
                                </Text>
                                <Text variant="bodySmall" style={{ color: theme.text }}>
                                    3. Return to this app
                                </Text>
                            </Card.Content>
                        </Card>

                        <Button
                            mode="contained"
                            onPress={handleReconnected}
                            style={styles.button}
                            buttonColor={theme.primary}
                            icon="wifi"
                        >
                            I'm Back on Home WiFi
                        </Button>
                    </View>
                );

            case 'waiting':
                return (
                    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text, textAlign: 'center' }]}>
                            Looking for Device...
                        </Text>
                        <Text variant="bodyMedium" style={[styles.description, { color: theme.textSecondary, textAlign: 'center', marginBottom: 30 }]}>
                            Waiting for the device to connect to your home WiFi and come online.
                        </Text>

                        <ActivityIndicator animating={true} color={theme.primary} size="large" style={{ marginBottom: 30 }} />

                        <Card style={[styles.infoCard, { backgroundColor: `${theme.primary}10`, width: '100%' }]}>
                            <Card.Content>
                                <Text variant="bodySmall" style={{ color: theme.text }}>
                                    ⏳ This usually takes about 30-60 seconds.
                                </Text>
                                <Text variant="bodySmall" style={{ color: theme.text, marginTop: 8 }}>
                                    The device needs to:
                                    1. Restart
                                    2. Connect to WiFi
                                    3. Connect to the server
                                </Text>
                            </Card.Content>
                        </Card>
                    </View>
                );

            case 'complete':
                return (
                    <View>
                        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
                            Setup Complete! 🎉
                        </Text>
                        <Text variant="bodyMedium" style={[styles.description, { color: theme.textSecondary }]}>
                            Your device has been successfully configured and connected
                        </Text>

                        <Card style={[styles.successCard, { backgroundColor: `${theme.success}20` }]}>
                            <Card.Content>
                                <Text variant="titleMedium" style={{ color: theme.success, marginBottom: 8 }}>
                                    ✓ Device Connected
                                </Text>
                                <Text variant="bodySmall" style={{ color: theme.text, marginTop: 4 }}>
                                    Added to: {selectedHome?.name}
                                </Text>
                            </Card.Content>
                        </Card>

                        <Button
                            mode="contained"
                            onPress={handleComplete}
                            style={styles.button}
                            buttonColor={theme.primary}
                        >
                            Go to Devices
                        </Button>
                    </View>
                );
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
                        WiFi Provisioning
                    </Text>
                    <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Adding device to {selectedHome?.name || 'your home'}
                    </Text>
                    <ProgressBar progress={progress} color={theme.primary} style={styles.progressBar} />
                </View>

                <Card style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                    <Card.Content>
                        {error && (
                            <Card style={[styles.errorCard, { backgroundColor: `${theme.error}20` }]}>
                                <Card.Content>
                                    <Text style={{ color: theme.error }}>{error}</Text>
                                </Card.Content>
                            </Card>
                        )}
                        {renderStepContent()}
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
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        marginBottom: 16,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
    },
    card: {
        margin: 16,
        marginTop: 0,
        borderRadius: 16,
        elevation: 2,
    },
    sectionTitle: {
        marginBottom: 8,
        fontWeight: '600',
    },
    description: {
        marginBottom: 20,
    },
    input: {
        marginBottom: 12,
    },
    button: {
        marginTop: 16,
    },
    infoCard: {
        marginVertical: 16,
        borderRadius: 12,
    },
    successCard: {
        marginVertical: 16,
        borderRadius: 12,
    },
    errorCard: {
        marginBottom: 16,
        borderRadius: 12,
    },
});
