import { View, ScrollView, StyleSheet, RefreshControl, StatusBar } from "react-native";
import { Text } from "react-native-paper";
import { useState } from "react";
import { useDeviceStore } from "../store/deviceStore";
import { useHomeStore } from "../store/homeStore";
import { useTheme } from "../context/ThemeContext";
import EntityRenderer from "../renderer/EntityRenderer";

export default function DashboardScreen() {
    const devices = useDeviceStore((s) => s.devices);
    const activeHome = useHomeStore((s) => s.activeHome);
    const loadDevices = useDeviceStore((s) => s.loadDevices);
    const controlEntity = useDeviceStore((s) => s.controlEntity);
    const { theme, mode } = useTheme();
    const [refreshing, setRefreshing] = useState(false);

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
                <ScrollView
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    <View style={[styles.header, { backgroundColor: theme.background }]}>
                        <Text variant="bodyMedium" style={{ color: theme.textSecondary }}>
                            Welcome Home
                        </Text>
                        <Text variant="headlineLarge" style={{ color: theme.text, fontWeight: 'bold' }}>
                            {activeHome?.name || "My Home"}
                        </Text>
                    </View>

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

                    {allEntities.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text variant="titleLarge" style={{ color: theme.text }}>
                                No devices found
                            </Text>
                            <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginTop: 8 }}>
                                Add devices to get started
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.entitiesContainer}>
                            {allEntities.map(({ device, entity }) => (
                                <EntityRenderer
                                    key={`${device.id}-${entity.id}`}
                                    entity={entity}
                                    device={device}
                                    onControl={handleControl}
                                />
                            ))}
                        </View>
                    )}
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
        padding: 20,
        paddingTop: 50,
        paddingBottom: 20,
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
    entitiesContainer: {
        paddingBottom: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 60,
    },
});
