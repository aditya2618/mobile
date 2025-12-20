import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, Divider, Button, IconButton } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import { useHomeStore } from '../store/homeStore';
import { useDeviceStore } from '../store/deviceStore';
import { useAuthStore } from '../store/authStore';
import { useState, useEffect } from 'react';
import { wsClient } from '../api/websocket';

export default function SystemStatusScreen() {
    const { theme, mode } = useTheme();
    const homes = useHomeStore((s) => s.homes);
    const activeHome = useHomeStore((s) => s.activeHome);
    const devices = useDeviceStore((s) => s.devices);
    const loadDevices = useDeviceStore((s) => s.loadDevices);
    const user = useAuthStore((s) => s.user);

    const [refreshing, setRefreshing] = useState(false);
    const [wsConnected, setWsConnected] = useState(false);
    const [apiStatus, setApiStatus] = useState<'online' | 'offline'>('online');
    const [apiResponseTime, setApiResponseTime] = useState<number>(0);

    const isDark = mode === 'dark';
    const cardBg = isDark ? theme.cardBackground : '#FFFFFF';
    const borderColor = isDark ? 'transparent' : 'rgba(0,0,0,0.08)';

    useEffect(() => {
        // Check WebSocket status once on mount
        const isConnected = wsClient.isConnected();
        console.log('📡 WebSocket status on mount:', isConnected);
        setWsConnected(isConnected);

        // Test API connection on mount
        testApiConnection();
    }, []);

    const testApiConnection = async () => {
        const startTime = Date.now();
        try {
            await useHomeStore.getState().loadHomes();
            const responseTime = Date.now() - startTime;
            setApiResponseTime(responseTime);
            setApiStatus('online');
            console.log('API connection test: online,', responseTime, 'ms');
        } catch (error) {
            setApiStatus('offline');
            console.log('API connection test: offline');
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);

        // Manually check WebSocket status
        const isConnected = wsClient.isConnected();
        console.log('🔄 Manual WebSocket check:', isConnected);
        setWsConnected(isConnected);

        await testApiConnection();
        if (activeHome) {
            await loadDevices(activeHome.id);
        }
        setRefreshing(false);
    };

    // Calculate statistics
    const totalDevices = devices.length;
    const onlineDevices = devices.filter(d => d.is_online).length;
    const offlineDevices = totalDevices - onlineDevices;
    const onlinePercentage = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0;
    const totalEntities = devices.reduce((sum, d) => sum + (d.entities?.length || 0), 0);
    const controllableEntities = devices.reduce((sum, d) =>
        sum + (d.entities?.filter(e => e.is_controllable)?.length || 0), 0
    );

    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.background} />
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text variant="headlineMedium" style={{ color: theme.text, fontWeight: 'bold' }}>
                        System Status
                    </Text>
                    <IconButton
                        icon="refresh"
                        size={24}
                        iconColor={theme.primary}
                        onPress={onRefresh}
                    />
                </View>

                <ScrollView
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[theme.primary]}
                            tintColor={theme.primary}
                        />
                    }
                >
                    {/* Connectivity Section */}
                    <View style={styles.section}>
                        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
                            🌐 Connectivity
                        </Text>

                        <Card style={[styles.card, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                            <Card.Content>
                                <View style={styles.statusRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text variant="bodyLarge" style={{ color: theme.text, fontWeight: '600' }}>
                                            API Server
                                        </Text>
                                        <Text variant="bodySmall" style={{ color: theme.textSecondary, marginTop: 4 }}>
                                            Response: {apiResponseTime}ms
                                        </Text>
                                    </View>
                                    <View style={styles.statusBadge}>
                                        <View style={[styles.statusDot, {
                                            backgroundColor: apiStatus === 'online' ? '#10b981' : '#ef4444'
                                        }]} />
                                        <Text variant="bodyMedium" style={{
                                            color: apiStatus === 'online' ? '#10b981' : '#ef4444',
                                            fontWeight: '600'
                                        }}>
                                            {apiStatus === 'online' ? 'Online' : 'Offline'}
                                        </Text>
                                    </View>
                                </View>

                                <Divider style={{ marginVertical: 12 }} />

                                <View style={styles.statusRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text variant="bodyLarge" style={{ color: theme.text, fontWeight: '600' }}>
                                            WebSocket
                                        </Text>
                                        <Text variant="bodySmall" style={{ color: theme.textSecondary, marginTop: 4 }}>
                                            Real-time updates
                                        </Text>
                                    </View>
                                    <View style={styles.statusBadge}>
                                        <View style={[styles.statusDot, {
                                            backgroundColor: wsConnected ? '#10b981' : '#ef4444'
                                        }]} />
                                        <Text variant="bodyMedium" style={{
                                            color: wsConnected ? '#10b981' : '#ef4444',
                                            fontWeight: '600'
                                        }}>
                                            {wsConnected ? 'Active' : 'Inactive'}
                                        </Text>
                                    </View>
                                </View>
                            </Card.Content>
                        </Card>
                    </View>

                    {/* Statistics Section */}
                    <View style={styles.section}>
                        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
                            📊 Statistics
                        </Text>

                        <View style={styles.statsGrid}>
                            <Card style={[styles.statCard, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                                <Card.Content style={{ alignItems: 'center' }}>
                                    <Text variant="headlineMedium" style={{ color: theme.primary, fontWeight: 'bold' }}>
                                        {homes.length}
                                    </Text>
                                    <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginTop: 4 }}>
                                        Homes
                                    </Text>
                                </Card.Content>
                            </Card>

                            <Card style={[styles.statCard, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                                <Card.Content style={{ alignItems: 'center' }}>
                                    <Text variant="headlineMedium" style={{ color: theme.primary, fontWeight: 'bold' }}>
                                        {totalDevices}
                                    </Text>
                                    <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginTop: 4 }}>
                                        Devices
                                    </Text>
                                </Card.Content>
                            </Card>

                            <Card style={[styles.statCard, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                                <Card.Content style={{ alignItems: 'center' }}>
                                    <Text variant="headlineMedium" style={{ color: theme.primary, fontWeight: 'bold' }}>
                                        {totalEntities}
                                    </Text>
                                    <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginTop: 4 }}>
                                        Entities
                                    </Text>
                                </Card.Content>
                            </Card>
                        </View>
                    </View>

                    {/* Device Health Section */}
                    <View style={styles.section}>
                        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
                            ❤️ Device Health
                        </Text>

                        <Card style={[styles.card, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                            <Card.Content>
                                <View style={styles.healthRow}>
                                    <Text variant="bodyLarge" style={{ color: theme.text }}>
                                        🟢 Online Devices
                                    </Text>
                                    <Text variant="titleLarge" style={{ color: '#10b981', fontWeight: 'bold' }}>
                                        {onlineDevices}
                                    </Text>
                                </View>

                                <View style={styles.healthRow}>
                                    <Text variant="bodyLarge" style={{ color: theme.text }}>
                                        🔴 Offline Devices
                                    </Text>
                                    <Text variant="titleLarge" style={{ color: '#ef4444', fontWeight: 'bold' }}>
                                        {offlineDevices}
                                    </Text>
                                </View>

                                <View style={styles.healthRow}>
                                    <Text variant="bodyLarge" style={{ color: theme.text }}>
                                        Uptime Percentage
                                    </Text>
                                    <Text variant="titleLarge" style={{ color: theme.primary, fontWeight: 'bold' }}>
                                        {onlinePercentage}%
                                    </Text>
                                </View>
                            </Card.Content>
                        </Card>
                    </View>

                    {/* System Information Section */}
                    <View style={styles.section}>
                        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
                            ℹ️ System Information
                        </Text>

                        <Card style={[styles.card, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                            <Card.Content>
                                <View style={styles.infoRow}>
                                    <Text variant="bodyMedium" style={{ color: theme.textSecondary }}>
                                        Username
                                    </Text>
                                    <Text variant="bodyMedium" style={{ color: theme.text, fontWeight: '600' }}>
                                        {user?.username || 'N/A'}
                                    </Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <Text variant="bodyMedium" style={{ color: theme.textSecondary }}>
                                        Active Home
                                    </Text>
                                    <Text variant="bodyMedium" style={{ color: theme.text, fontWeight: '600' }}>
                                        {activeHome?.name || 'None'}
                                    </Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <Text variant="bodyMedium" style={{ color: theme.textSecondary }}>
                                        App Version
                                    </Text>
                                    <Text variant="bodyMedium" style={{ color: theme.text, fontWeight: '600' }}>
                                        1.0.0
                                    </Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <Text variant="bodyMedium" style={{ color: theme.textSecondary }}>
                                        Platform
                                    </Text>
                                    <Text variant="bodyMedium" style={{ color: theme.text, fontWeight: '600' }}>
                                        Mobile
                                    </Text>
                                </View>
                            </Card.Content>
                        </Card>
                    </View>

                    {/* Quick Actions */}
                    <View style={[styles.section, { marginBottom: 32 }]}>
                        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
                            🔧 Quick Actions
                        </Text>

                        <View style={styles.actionsGrid}>
                            <Button
                                mode="outlined"
                                onPress={onRefresh}
                                icon="refresh"
                                style={{ flex: 1 }}
                                textColor={theme.primary}
                            >
                                Refresh
                            </Button>
                            <Button
                                mode="outlined"
                                onPress={testApiConnection}
                                icon="wan"
                                style={{ flex: 1 }}
                                textColor={theme.primary}
                            >
                                Test API
                            </Button>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        paddingBottom: 16,
    },
    section: {
        marginTop: 16,
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    card: {
        marginHorizontal: 16,
        borderRadius: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
    },
    statCard: {
        flex: 1,
        borderRadius: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    healthRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
    },
});
