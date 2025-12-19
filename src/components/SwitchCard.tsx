import { Card, Text, IconButton, Switch } from "react-native-paper";
import { View, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";

interface SwitchCardProps {
    device: any;
    entity: any;
    onToggle: (entityId: number) => void;
    disabled?: boolean;
}

export default function SwitchCard({ device, entity, onToggle, disabled }: SwitchCardProps) {
    const isOn = entity.state === 'ON' || entity.state === true;

    return (
        <Card
            style={[styles.card, isOn && styles.cardActive]}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggle(entity.id);
            }}
        >
            <Card.Content style={styles.content}>
                {/* Top Row: Icon + State */}
                <View style={styles.topRow}>
                    <View style={[styles.iconContainer, isOn && styles.iconActiveContainer]}>
                        <IconButton
                            icon="toggle-switch"
                            size={28}
                            iconColor={isOn ? "#9C27B0" : "#666"}
                        />
                    </View>
                    <Text variant="bodySmall" style={styles.stateText}>
                        {isOn ? "On" : "Off"}
                    </Text>
                </View>

                {/* Device Name */}
                <Text variant="titleMedium" style={styles.deviceName}>
                    {entity.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>

                {/* Bottom Row: Status + Toggle */}
                <View style={styles.bottomRow}>
                    <Text variant="bodySmall" style={styles.deviceType}>
                        {device.name}
                    </Text>
                    <Switch
                        value={isOn}
                        onValueChange={() => onToggle(entity.id)}
                        disabled={disabled || !device.is_online}
                        color="#4CAF50"
                    />
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
    cardActive: {
        backgroundColor: "#fff",
        borderColor: "#9C27B0",
        borderWidth: 1,
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
        backgroundColor: "#f5f5f5",
        justifyContent: "center",
        alignItems: "center",
    },
    iconActiveContainer: {
        backgroundColor: "#F3E5F5",
    },
    stateText: {
        color: "#666",
        fontWeight: "600",
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
});
