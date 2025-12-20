import { View, ScrollView, StyleSheet, RefreshControl, StatusBar, TouchableOpacity, Animated } from "react-native";
import { Text, IconButton, FAB, Button } from "react-native-paper";
import { useState, useRef, useEffect } from "react";
import { useDeviceStore } from "../store/deviceStore";
import { useHomeStore } from "../store/homeStore";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../context/ThemeContext";
import EntityRenderer from "../renderer/EntityRenderer";
import Collapsible from "../components/Collapsible";
import { useNavigation } from "@react-navigation/native";

export default function DashboardScreen() {
    const navigation = useNavigation();
    const devices = useDeviceStore((s) => s.devices);
    const activeHome = useHomeStore((s) => s.activeHome);
    const user = useAuthStore((s) => s.user);
    const loadDevices = useDeviceStore((s) => s.loadDevices);
    const controlEntity = useDeviceStore((s) => s.controlEntity);
    const { theme, mode } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [expandedDevices, setExpandedDevices] = useState<Set<number>>(new Set());

    const onRefresh = async () => {
        if (activeHome) {
            setRefreshing(true);
            await loadDevices(activeHome.id);
            setRefreshing(false);
        }
    };

    const handleControl = async (entityId: number, data: any) => {
        try {
            await controlEntity(entityId, data);
        } catch (error) {
            console.error('❌ Control error:', error);
        }
    };

    const toggleDevice = (deviceId: number) => {
        setExpandedDevices((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(deviceId)) {
                newSet.delete(deviceId);
            } else {
                newSet.add(deviceId);
            }
            return newSet;
        });
    };

    const allEntities = devices.flatMap((device) =>
        device.entities.map((entity) => ({ device, entity }))
    );

    return (
        <>
            <StatusBar
                barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={theme.background}
            />
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {/* Sticky Header */}
                <View style={[styles.header, {
                    backgroundColor: theme.background,
                }]}>
                    <View>
                        <Text variant="headlineMedium" style={{ color: theme.text, fontWeight: 'bold' }}>
                            Devices
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.textSecondary }}>
                            {devices.length} device{devices.length !== 1 ? 's' : ''}
                        </Text>
                    </View>
                    {activeHome && (
                        <View style={styles.headerButtons}>
                            <Button
                                mode="contained"
                                icon="plus"
                                onPress={() => navigation.navigate('ManageDevices' as never)}
                                style={{ backgroundColor: theme.primary }}
                                labelStyle={{ color: '#FFFFFF' }}
                            >
                                Add Device
                            </Button>
                            <IconButton
                                icon="minus-circle"
                                size={24}
                                iconColor={theme.error}
                                onPress={() => navigation.navigate('RemoveDevices' as never)}
                                style={{ margin: 0, marginLeft: 8 }}
                            />
                        </View>
                    )}
                </View>

                <ScrollView
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    <View style={styles.statsContainer}>
                        <View style={[styles.statBox, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                            <Text variant="headlineSmall" style={{ color: theme.primary, fontWeight: 'bold' }}>
                                {devices.length}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                                Devices
                            </Text>
                        </View>

                        <View style={[styles.statBox, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                            <Text variant="headlineSmall" style={{ color: theme.success, fontWeight: 'bold' }}>
                                {devices.filter((d) => d.is_online).length}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                                Online
                            </Text>
                        </View>

                        <View style={[styles.statBox, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                            <Text variant="headlineSmall" style={{ color: theme.warning, fontWeight: 'bold' }}>
                                {allEntities.length}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                                Entities
                            </Text>
                        </View>
                    </View>

                    {/* Devices List */}
                    {devices.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text variant="titleLarge" style={{ color: theme.text }}>
                                No devices found
                            </Text>
                            <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginTop: 8 }}>
                                Add devices to get started
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.devicesContainer}>
                            {devices.map((device) => {
                                const isExpanded = expandedDevices.has(device.id);

                                return (
                                    <View key={device.id} style={styles.deviceSection}>
                                        {/* Device Header - Clickable */}
                                        <TouchableOpacity
                                            onPress={() => toggleDevice(device.id)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={[styles.deviceHeader, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                                                <View style={styles.deviceHeaderLeft}>
                                                    <Text variant="titleMedium" style={{ color: theme.text, fontWeight: 'bold' }}>
                                                        {device.name}
                                                    </Text>
                                                    <Text variant="bodySmall" style={{ color: theme.textSecondary, marginTop: 2 }}>
                                                        {device.node_name} • {device.entities.length} entities
                                                    </Text>
                                                </View>
                                                <View style={styles.deviceHeaderRight}>
                                                    <View style={[
                                                        styles.statusBadge,
                                                        { backgroundColor: device.is_online ? theme.success + '20' : theme.error + '20' }
                                                    ]}>
                                                        <View style={[
                                                            styles.statusDot,
                                                            { backgroundColor: device.is_online ? theme.success : theme.error }
                                                        ]} />
                                                        <Text variant="bodySmall" style={{
                                                            color: device.is_online ? theme.success : theme.error,
                                                            fontWeight: '600'
                                                        }}>
                                                            {device.is_online ? 'Online' : 'Offline'}
                                                        </Text>
                                                    </View>
                                                    <IconButton
                                                        icon={isExpanded ? "chevron-up" : "chevron-down"}
                                                        size={24}
                                                        iconColor={theme.textSecondary}
                                                        style={{ margin: 0 }}
                                                    />
                                                </View>
                                            </View>
                                        </TouchableOpacity>

                                        {/* Device Entities - Collapsible with Animation */}
                                        <Collapsible isExpanded={isExpanded}>
                                            {device.entities.length === 0 ? (
                                                <View style={[styles.noEntitiesContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                                                    <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                                                        No entities configured
                                                    </Text>
                                                </View>
                                            ) : (
                                                <View style={styles.entitiesGrid}>
                                                    {device.entities.map((entity) => (
                                                        <EntityRenderer
                                                            key={entity.id}
                                                            entity={entity}
                                                            device={device}
                                                            onControl={handleControl}
                                                        />
                                                    ))}
                                                </View>
                                            )}
                                        </Collapsible>
                                    </View>
                                );
                            })}
                        </View>
                    )
                    }
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
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 12,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    statBox: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        elevation: 1,
        borderWidth: 1,
    },
    devicesContainer: {
        paddingBottom: 16,
    },
    deviceSection: {
        marginBottom: 16,
    },
    deviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 8,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    deviceHeaderLeft: {
        flex: 1,
    },
    deviceHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    entitiesGrid: {
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 8,
    },
    noEntitiesContainer: {
        marginHorizontal: 16,
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        marginBottom: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 60,
    },
});
