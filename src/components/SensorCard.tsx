import { Card, Text, IconButton } from "react-native-paper";
import { View, StyleSheet } from "react-native";

interface SensorCardProps {
    device: any;
    entity: any;
}

export default function SensorCard({ device, entity }: SensorCardProps) {
    const formatValue = (state: any) => {
        if (typeof state === 'object' && state !== null) {
            if ('value' in state) return state.value;
            return Object.values(state)[0];
        }
        return state;
    };

    const value = formatValue(entity.state);
    const unit = entity.unit || "";

    // Determine icon based on sensor type
    const getIcon = () => {
        const name = entity.name.toLowerCase();
        if (name.includes("temp")) return "thermometer";
        if (name.includes("hum")) return "water-percent";
        if (name.includes("light")) return "brightness-6";
        if (name.includes("motion")) return "motion-sensor";
        return "chip";
    };

    return (
        <Card style={styles.card}>
            <Card.Content style={styles.content}>
                {/* Top Row: Icon + Value */}
                <View style={styles.topRow}>
                    <View style={styles.iconContainer}>
                        <IconButton
                            icon={getIcon()}
                            size={28}
                            iconColor="#2196F3"
                        />
                    </View>
                    <View style={styles.valueContainer}>
                        <Text variant="headlineSmall" style={styles.value}>
                            {value !== null && value !== undefined ? value : "--"}
                        </Text>
                        <Text variant="bodySmall" style={styles.unit}>{unit}</Text>
                    </View>
                </View>

                {/* Device Name */}
                <Text variant="titleMedium" style={styles.deviceName}>
                    {entity.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>

                {/* Bottom: Device Type */}
                <View style={styles.bottomRow}>
                    <Text variant="bodySmall" style={styles.deviceType}>
                        {device.name}
                    </Text>
                    <Text variant="bodySmall" style={styles.readOnly}>
                        Read-only
                    </Text>
                </View>
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        borderRadius: 24,
        flex: 1,
        margin: 8,
        minHeight: 180,
        elevation: 2,
    },
    content: {
        padding: 16,
        height: "100%",
        justifyContent: "space-between",
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: "#E3F2FD",
        justifyContent: "center",
        alignItems: "center",
    },
    valueContainer: {
        alignItems: "flex-end",
    },
    value: {
        color: "#2196F3",
        fontWeight: "bold",
    },
    unit: {
        color: "#999",
        marginTop: -4,
    },
    deviceName: {
        color: "#1a1a1a",
        fontWeight: "bold",
        marginTop: 12,
    },
    deviceType: {
        color: "#999",
    },
    bottomRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 8,
    },
    readOnly: {
        color: "#bbb",
        fontSize: 11,
    },
});
