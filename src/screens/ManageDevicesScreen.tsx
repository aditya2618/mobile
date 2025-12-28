import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, FAB, Checkbox, Button, Divider, Portal, Modal } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import { useDeviceStore } from '../store/deviceStore';
import { useHomeStore } from '../store/homeStore';
import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface AvailableDevice {
    id: number;
    name: string;
    node_name: string;
    is_online: boolean;
    last_seen: string | null;
}

export default function ManageDevicesScreen() {
    const { theme, mode } = useTheme();
    const selectedHome = useHomeStore((s) => s.selectedHome);
    const loadDevices = useDeviceStore((s) => s.loadDevices);

    const [availableDevices, setAvailableDevices] = useState<AvailableDevice[]>([]);
    const [selectedDevices, setSelectedDevices] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const isDark = mode === 'dark';
    const cardBg = isDark ? theme.cardBackground : '#FFFFFF';
    const borderColor = isDark ? 'transparent' : 'rgba(0,0,0,0.08)';

    useEffect(() => {
        loadAvailableDevices();
    }, []);

    const loadAvailableDevices = async () => {
        if (!selectedHome) return;

        try {
            setRefreshing(true);
            const response = await apiClient.get(`/homes/${selectedHome.id}/devices/available/`);
            setAvailableDevices(response.data);
        } catch (error) {
            console.error('Failed to load available devices:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const toggleDevice = (deviceId: number) => {
        setSelectedDevices(prev =>
            prev.includes(deviceId)
                ? prev.filter(id => id !== deviceId)
                : [...prev, deviceId]
        );
    };

    const handleLinkDevices = async () => {
        if (!selectedHome || selectedDevices.length === 0) return;

        try {
            setLoading(true);
            await apiClient.post(`/homes/${selectedHome.id}/devices/link/`, {
                device_ids: selectedDevices
            });

            // Reload devices
            await loadDevices(selectedHome.id);
            await loadAvailableDevices();
            setSelectedDevices([]);
        } catch (error: any) {
            console.error('Failed to link devices:', error);
            alert(error.response?.data?.error || 'Failed to add devices');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.background} />
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text variant="headlineMedium" style={{ color: theme.text, fontWeight: 'bold' }}>
                        Manage Devices
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginTop: 4 }}>
                        Select devices to add to {selectedHome?.name}
                    </Text>
                </View>

                <ScrollView
                    style={styles.content}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={loadAvailableDevices}
                            colors={[theme.primary]}
                            tintColor={theme.primary}
                        />
                    }
                >
                    {availableDevices.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text variant="headlineSmall" style={{ color: theme.textSecondary, marginBottom: 8 }}>
                                🔍
                            </Text>
                            <Text variant="titleMedium" style={{ color: theme.text, marginBottom: 4 }}>
                                No Available Devices
                            </Text>
                            <Text variant="bodyMedium" style={{ color: theme.textSecondary, textAlign: 'center' }}>
                                All auto-discovered devices are already added to this home
                            </Text>
                        </View>
                    ) : (
                        <>
                            <Text variant="bodyMedium" style={{ color: theme.textSecondary, paddingHorizontal: 16, marginBottom: 12 }}>
                                {selectedDevices.length > 0
                                    ? `${selectedDevices.length} device(s) selected`
                                    : 'Tap to select devices'}
                            </Text>

                            {availableDevices.map((device) => (
                                <TouchableOpacity
                                    key={device.id}
                                    onPress={() => toggleDevice(device.id)}
                                    style={[
                                        styles.deviceItem,
                                        {
                                            backgroundColor: cardBg,
                                            borderColor: selectedDevices.includes(device.id) ? theme.primary : borderColor,
                                            borderWidth: selectedDevices.includes(device.id) ? 2 : 1,
                                        }
                                    ]}
                                >
                                    <View style={styles.deviceInfo}>
                                        <View style={{ flex: 1 }}>
                                            <Text variant="titleMedium" style={{ color: theme.text, fontWeight: '600' }}>
                                                {device.name}
                                            </Text>
                                            <Text variant="bodySmall" style={{ color: theme.textSecondary, marginTop: 2 }}>
                                                Node: {device.node_name}
                                            </Text>
                                            <View style={styles.statusRow}>
                                                <View style={[
                                                    styles.statusDot,
                                                    { backgroundColor: device.is_online ? '#10b981' : '#ef4444' }
                                                ]} />
                                                <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                                                    {device.is_online ? 'Online' : 'Offline'}
                                                </Text>
                                            </View>
                                        </View>
                                        <Checkbox
                                            status={selectedDevices.includes(device.id) ? 'checked' : 'unchecked'}
                                            onPress={() => toggleDevice(device.id)}
                                            color={theme.primary}
                                        />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}
                </ScrollView>

                {/* Action Buttons */}
                {selectedDevices.length > 0 && (
                    <View style={[styles.actionBar, {
                        backgroundColor: isDark ? theme.cardBackground : '#FFFFFF',
                        borderTopColor: borderColor,
                    }]}>
                        <Button
                            mode="outlined"
                            onPress={() => setSelectedDevices([])}
                            style={{ flex: 1 }}
                            textColor={theme.textSecondary}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleLinkDevices}
                            style={{ flex: 1 }}
                            buttonColor={theme.primary}
                            loading={loading}
                            disabled={loading}
                        >
                            Add {selectedDevices.length} Device{selectedDevices.length > 1 ? 's' : ''}
                        </Button>
                    </View>
                )}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: 60,
        paddingBottom: 16,
    },
    content: {
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    deviceItem: {
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 12,
        padding: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    deviceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    actionBar: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        borderTopWidth: 1,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
});
