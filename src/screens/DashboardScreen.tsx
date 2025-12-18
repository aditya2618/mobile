import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { Text, Card, Chip, IconButton } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { useDeviceStore } from "../store/deviceStore";
import { useHomeStore } from "../store/homeStore";

export default function DashboardScreen() {
    const devices = useDeviceStore((s) => s.devices);
    const activeHome = useHomeStore((s) => s.activeHome);
    const loadDevices = useDeviceStore((s) => s.loadDevices);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        if (activeHome) {
            setRefreshing(true);
            await loadDevices(activeHome.id);
            setRefreshing(false);
        }
    };

    const getEntityIcon = (type: string) => {
        const icons: Record<string, string> = {
            light: "lightbulb",
            fan: "fan",
            switch: "toggle-switch",
            sensor: "gauge",
            temperature: "thermometer",
            humidity: "water-percent",
            motion: "motion-sensor",
        };
        return icons[type] || "home-automation";
    };

    return (
        <LinearGradient
            colors={["#0a0a0a", "#1a1a2e", "#16213e"]}
            style={styles.gradient}
        >
            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text variant="headlineLarge" style={styles.title}>
                            {activeHome?.name || "Home"}
                        </Text>
                        <Text variant="bodyMedium" style={styles.subtitle}>
                            {devices.length} device{devices.length !== 1 ? "s" : ""} connected
                        </Text>
                    </View>
                    <View style={styles.headerButtons}>
                        <IconButton
                            icon="plus-circle"
                            size={28}
                            iconColor="#4CAF50"
                            onPress={() => console.log("Add device - TODO")}
                        />
                        <IconButton
                            icon="cog"
                            size={28}
                            iconColor="#4CAF50"
                            onPress={() => { }}
                        />
                    </View>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsRow}>
                    <Card style={styles.statCard}>
                        <Card.Content>
                            <View style={styles.statContent}>
                                <IconButton icon="lightbulb-on" size={24} iconColor="#FFC107" />
                                <View>
                                    <Text variant="titleLarge" style={styles.statNumber}>
                                        {devices.reduce(
                                            (acc, d) =>
                                                acc +
                                                d.entities.filter((e) => e.entity_type === "light")
                                                    .length,
                                            0
                                        )}
                                    </Text>
                                    <Text variant="bodySmall" style={styles.statLabel}>
                                        Lights
                                    </Text>
                                </View>
                            </View>
                        </Card.Content>
                    </Card>

                    <Card style={styles.statCard}>
                        <Card.Content>
                            <View style={styles.statContent}>
                                <IconButton icon="devices" size={24} iconColor="#4CAF50" />
                                <View>
                                    <Text variant="titleLarge" style={styles.statNumber}>
                                        {devices.filter((d) => d.is_online).length}
                                    </Text>
                                    <Text variant="bodySmall" style={styles.statLabel}>
                                        Online
                                    </Text>
                                </View>
                            </View>
                        </Card.Content>
                    </Card>
                </View>

                {/* Devices */}
                {devices.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Card.Content style={styles.emptyContent}>
                            <IconButton icon="home-off" size={48} iconColor="#666" />
                            <Text variant="titleMedium" style={styles.emptyText}>
                                No devices found
                            </Text>
                            <Text variant="bodySmall" style={styles.emptySubtext}>
                                Add devices to get started
                            </Text>
                        </Card.Content>
                    </Card>
                ) : (
                    devices.map((device) => (
                        <Card key={device.id} style={styles.deviceCard}>
                            <Card.Content>
                                <View style={styles.deviceHeader}>
                                    <View style={styles.deviceTitleRow}>
                                        <IconButton
                                            icon="router-wireless"
                                            size={24}
                                            iconColor="#4CAF50"
                                        />
                                        <View style={styles.deviceInfo}>
                                            <Text variant="titleMedium" style={styles.deviceName}>
                                                {device.name}
                                            </Text>
                                            <Text variant="bodySmall" style={styles.deviceNode}>
                                                {device.node_name}
                                            </Text>
                                        </View>
                                    </View>
                                    <Chip
                                        mode="flat"
                                        style={
                                            device.is_online ? styles.onlineChip : styles.offlineChip
                                        }
                                        textStyle={styles.chipText}
                                    >
                                        {device.is_online ? "Online" : "Offline"}
                                    </Chip>
                                </View>

                                {/* Entities */}
                                {device.entities.length > 0 && (
                                    <View style={styles.entitiesContainer}>
                                        {device.entities.map((entity) => (
                                            <View key={entity.id} style={styles.entityRow}>
                                                <IconButton
                                                    icon={getEntityIcon(entity.entity_type)}
                                                    size={20}
                                                    iconColor="#4CAF50"
                                                />
                                                <View style={styles.entityInfo}>
                                                    <Text variant="bodyMedium" style={styles.entityName}>
                                                        {entity.name}
                                                    </Text>
                                                    <Text
                                                        variant="bodySmall"
                                                        style={styles.entityState}
                                                    >
                                                        {typeof entity.state === "object"
                                                            ? JSON.stringify(entity.state)
                                                            : entity.state}{" "}
                                                        {entity.unit || ""}
                                                    </Text>
                                                </View>
                                                {entity.is_controllable && (
                                                    <IconButton
                                                        icon="chevron-right"
                                                        size={20}
                                                        iconColor="#666"
                                                    />
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </Card.Content>
                        </Card>
                    ))
                )}
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        marginTop: 8,
    },
    headerButtons: {
        flexDirection: "row",
        gap: -8,
    },
    title: {
        color: "#fff",
        fontWeight: "bold",
    },
    subtitle: {
        color: "#aaa",
        marginTop: 4,
    },
    statsRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: "#1e1e2e",
        borderRadius: 16,
    },
    statContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    statNumber: {
        color: "#fff",
        fontWeight: "bold",
    },
    statLabel: {
        color: "#999",
    },
    deviceCard: {
        backgroundColor: "#1e1e2e",
        borderRadius: 16,
        marginBottom: 16,
    },
    deviceHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    deviceTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flex: 1,
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        color: "#fff",
        fontWeight: "600",
    },
    deviceNode: {
        color: "#888",
        marginTop: 2,
    },
    onlineChip: {
        backgroundColor: "#4CAF5020",
    },
    offlineChip: {
        backgroundColor: "#f4433620",
    },
    chipText: {
        fontSize: 12,
        color: "#4CAF50",
    },
    entitiesContainer: {
        marginTop: 8,
        gap: 8,
    },
    entityRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#16162a",
        borderRadius: 12,
        paddingRight: 8,
    },
    entityInfo: {
        flex: 1,
    },
    entityName: {
        color: "#fff",
    },
    entityState: {
        color: "#999",
        marginTop: 2,
    },
    emptyCard: {
        backgroundColor: "#1e1e2e",
        borderRadius: 16,
        marginTop: 40,
    },
    emptyContent: {
        alignItems: "center",
        paddingVertical: 40,
    },
    emptyText: {
        color: "#fff",
        marginTop: 16,
    },
    emptySubtext: {
        color: "#666",
        marginTop: 8,
    },
});
