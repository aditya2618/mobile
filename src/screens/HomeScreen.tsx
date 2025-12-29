import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Button, TextInput, Icon } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import { useDeviceStore } from '../store/deviceStore';
import { useHomeStore } from '../store/homeStore';
import { useAuthStore } from '../store/authStore';
import { useState, useEffect } from 'react';
import { smartApi } from '../api/smartClient';
import { NetworkMode, getNetworkModeLabel, getNetworkModeColor } from '../api/networkMode';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
    const navigation = useNavigation();
    const { theme, mode } = useTheme();
    const devices = useDeviceStore((s) => s.devices);
    const selectedHome = useHomeStore((s) => s.selectedHome);
    const homes = useHomeStore((s) => s.homes);
    const user = useAuthStore((s) => s.user);
    const createHome = useHomeStore((s) => s.createHome);
    const loadHomes = useHomeStore((s) => s.loadHomes);

    const [homeName, setHomeName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [networkMode, setNetworkMode] = useState<NetworkMode>('local');

    useEffect(() => {
        // Get current network mode
        setNetworkMode(smartApi.getMode());

        // Poll for network mode changes every 5 seconds
        const interval = setInterval(() => {
            setNetworkMode(smartApi.getMode());
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const isDark = mode === 'dark';

    // If no homes, show create home UI
    if (homes.length === 0) {
        const handleCreate = async () => {
            if (!homeName.trim()) {
                setError("Please enter a home name");
                return;
            }

            setLoading(true);
            setError("");

            try {
                console.log("Creating home:", homeName);
                await createHome(homeName.trim());
                console.log("✅ Home created successfully!");
                setHomeName("");
                // Reload homes
                await loadHomes();
            } catch (error: any) {
                console.error("❌ Failed to create home:", error);
                setError(error.response?.data?.error || error.message || "Failed to create home. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        return (
            <>
                <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.background} />
                <View style={[styles.createHomeContainer, { backgroundColor: theme.background }]}>
                    <View style={styles.createHomeContent}>
                        {/* Icon and Welcome */}
                        <View style={styles.createHomeHeader}>
                            <View style={[styles.iconCircle, { backgroundColor: isDark ? theme.primary + '20' : theme.primary + '15' }]}>
                                <Text style={[styles.createHomeIcon, { color: theme.primary }]}>
                                    🏡
                                </Text>
                            </View>
                            <Text variant="headlineMedium" style={[styles.createHomeTitle, { color: theme.text }]}>
                                Welcome to Your Smart Home
                            </Text>
                            <Text variant="bodyLarge" style={[styles.createHomeSubtitle, { color: theme.textSecondary }]}>
                                Let's get started by creating your first home
                            </Text>
                        </View>

                        {/* Form */}
                        <View style={styles.createHomeForm}>
                            <TextInput
                                label="Home Name"
                                value={homeName}
                                onChangeText={(text) => {
                                    setHomeName(text);
                                    setError("");
                                }}
                                mode="outlined"
                                placeholder="e.g., My Home, Beach House"
                                theme={{
                                    colors: {
                                        onSurfaceVariant: theme.textSecondary,
                                        outline: theme.border,
                                        primary: theme.primary,
                                    }
                                }}
                                textColor={theme.text}
                                style={[styles.createHomeInput, {
                                    backgroundColor: isDark ? theme.cardBackground : '#FFFFFF'
                                }]}
                                left={<TextInput.Icon icon="home-variant" color={theme.primary} />}
                                autoFocus
                            />

                            {error ? (
                                <View style={[styles.createHomeErrorContainer, {
                                    backgroundColor: isDark ? '#7f1d1d' : '#fee2e2',
                                    borderColor: isDark ? '#991b1b' : '#fca5a5',
                                }]}>
                                    <Text variant="bodySmall" style={[styles.createHomeError, {
                                        color: isDark ? '#fca5a5' : '#dc2626'
                                    }]}>
                                        {error}
                                    </Text>
                                </View>
                            ) : null}

                            <View style={[styles.createHomeHintContainer, {
                                backgroundColor: isDark ? theme.primary + '15' : theme.primary + '10',
                                borderColor: theme.primary + '30',
                            }]}>
                                <Text variant="bodySmall" style={[styles.createHomeHint, { color: theme.primary }]}>
                                    💡 You can add rooms and devices later
                                </Text>
                            </View>

                            <Button
                                mode="contained"
                                onPress={handleCreate}
                                style={styles.createHomeButton}
                                buttonColor={theme.primary}
                                loading={loading}
                                disabled={loading || !homeName.trim()}
                                icon="plus-circle"
                                contentStyle={styles.createHomeButtonContent}
                            >
                                Create My Home
                            </Button>
                        </View>
                    </View>
                </View>
            </>
        );
    }

    // Calculate stats
    const totalDevices = devices.length;
    const onlineDevices = devices.filter((d) => d.is_online).length;
    const totalEntities = devices.reduce((sum, d) => sum + d.entities.length, 0);
    const sensors = devices.reduce(
        (sum, d) => sum + d.entities.filter((e) => e.entity_type === 'sensor').length,
        0
    );
    const actuators = devices.reduce(
        (sum, d) => sum + d.entities.filter((e) => e.is_controllable).length,
        0
    );

    const cardBg = isDark ? theme.cardBackground : '#FFFFFF';
    const borderColor = isDark ? 'transparent' : 'rgba(0,0,0,0.08)';

    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.background} />
            <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <Text variant="titleLarge" style={{ color: theme.text, fontWeight: 'bold' }}>
                            Welcome, {user?.username || 'User'}
                        </Text>
                        <Text variant="bodyLarge" style={{ color: theme.textSecondary, marginTop: 4 }}>
                            {selectedHome?.name || 'Smart Home'}
                        </Text>
                    </View>
                    {/* Voice Command Button */}
                    <TouchableOpacity
                        style={[styles.voiceButton, { backgroundColor: theme.primary }]}
                        onPress={() => (navigation as any).navigate('VoiceCommand')}
                        activeOpacity={0.8}
                    >
                        <Icon source="microphone" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Connection Status Card */}
                <Card style={[
                    styles.connectionCard,
                    {
                        backgroundColor: networkMode === 'cloud' ? '#2196F3' : networkMode === 'local' ? '#4CAF50' : '#FFC107',
                        borderWidth: 0,
                    }
                ]}>
                    <Card.Content style={styles.connectionCardContent}>
                        <Icon
                            source={networkMode === 'cloud' ? 'cloud' : networkMode === 'local' ? 'home' : 'wifi-off'}
                            size={24}
                            color="#FFFFFF"
                        />
                        <View style={{ marginLeft: 12 }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
                                {networkMode === 'cloud' ? 'Connected to Cloud Network' : networkMode === 'local' ? 'Connected to Local Network' : 'Offline'}
                            </Text>
                        </View>
                    </Card.Content>
                </Card>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <Card style={[styles.statCard, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                        <Card.Content>
                            <Text variant="displayMedium" style={{ color: theme.primary, fontWeight: 'bold' }}>
                                {totalDevices}
                            </Text>
                            <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginTop: 8 }}>
                                Total Devices
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.success, marginTop: 4 }}>
                                {onlineDevices} online
                            </Text>
                        </Card.Content>
                    </Card>

                    <Card style={[styles.statCard, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                        <Card.Content>
                            <Text variant="displayMedium" style={{ color: theme.info, fontWeight: 'bold' }}>
                                {totalEntities}
                            </Text>
                            <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginTop: 8 }}>
                                Total Entities
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.textSecondary, marginTop: 4 }}>
                                {sensors} sensors, {actuators} controls
                            </Text>
                        </Card.Content>
                    </Card>
                </View>

                {/* Quick Info */}
                <Card style={[styles.infoCard, { backgroundColor: cardBg, borderColor, borderWidth: 1, marginTop: 16 }]}>
                    <Card.Content>
                        <Text variant="titleLarge" style={{ color: theme.text, fontWeight: 'bold', marginBottom: 12 }}>
                            System Status
                        </Text>
                        <View style={[styles.statusRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
                            <Text style={{ color: theme.textSecondary }}>🌐 Network</Text>
                            <Text style={{ color: theme.success, fontWeight: '600' }}>Connected</Text>
                        </View>
                        <View style={[styles.statusRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
                            <Text style={{ color: theme.textSecondary }}>📡 WebSocket</Text>
                            <Text style={{ color: theme.success, fontWeight: '600' }}>Active</Text>
                        </View>
                        <View style={[styles.statusRow, { borderBottomWidth: 0 }]}>
                            <Text style={{ color: theme.textSecondary }}>🏠 Home</Text>
                            <Text style={{ color: theme.text, fontWeight: '600' }}>{selectedHome?.name || 'N/A'}</Text>
                        </View>
                    </Card.Content>
                </Card>

                {/* Welcome Message */}
                <Card style={[styles.infoCard, { backgroundColor: cardBg, borderColor, borderWidth: 1, marginTop: 16, marginBottom: 24 }]}>
                    <Card.Content>
                        <Text variant="titleMedium" style={{ color: theme.text, marginBottom: 8, fontWeight: '600' }}>
                            📱 Smart Home Dashboard
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.textSecondary, lineHeight: 22 }}>
                            Your smart home is up and running! Navigate to the Devices tab to control your devices,
                            or check out Scenes to automate your home.
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
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 20,
        paddingTop: 60,
        paddingBottom: 12,
    },
    voiceButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    connectionRow: {
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    connectionCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    connectionCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    connectionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    infoCard: {
        marginHorizontal: 16,
        borderRadius: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    // Create Home Styles
    createHomeContainer: {
        flex: 1,
    },
    createHomeContent: {
        flex: 1,
        justifyContent: "center",
        maxWidth: 450,
        width: "100%",
        alignSelf: "center",
        padding: 32,
    },
    createHomeHeader: {
        alignItems: "center",
        marginBottom: 40,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    createHomeIcon: {
        fontSize: 56,
    },
    createHomeTitle: {
        fontWeight: "bold",
        marginBottom: 12,
        textAlign: "center",
    },
    createHomeSubtitle: {
        textAlign: "center",
        lineHeight: 24,
        paddingHorizontal: 16,
    },
    createHomeForm: {
        gap: 20,
    },
    createHomeInput: {
        fontSize: 16,
    },
    createHomeButton: {
        marginTop: 8,
    },
    createHomeButtonContent: {
        paddingVertical: 8,
    },
    createHomeErrorContainer: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    createHomeError: {
        textAlign: "center",
    },
    createHomeHintContainer: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    createHomeHint: {
        textAlign: "center",
        fontWeight: '500',
    },
});
