import { Card, Text, IconButton, Switch } from "react-native-paper";
import { View, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";

interface FanCardProps {
    device: any;
    entity: any;
    onToggle: (entityId: number) => void;
    disabled?: boolean;
}

export default function FanCard({ device, entity, onToggle, disabled }: FanCardProps) {
    const isOn = entity.state === 'ON' || entity.state === true;
    const speed = entity.state?.speed || 0;

    return (
        <Card
            style={[styles.card, isOn && styles.cardActive]}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggle(entity.id);
            }}
        >
            <Card.Content style={styles.content}>
                {/* Top Row: Icon + Speed */}
                <View style={styles.topRow}>
                    <View style={[styles.iconContainer, isOn && styles.iconActiveContainer]}>
                        <IconButton
                            icon="fan"
                            size={28}
                            iconColor={isOn ? "#4CAF50" : "#666"}
                        />
                    </View>
                    <View style={styles.speedContainer}>
                        <Text variant="bodySmall" style={styles.speedLabel}>Speed</Text>
                        <Text variant="titleMedium" style={styles.speedValue}>
                            {isOn ? (speed || "100") + "%" : "0%"}
                        </Text>
                    </View>
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
        borderColor: "#4CAF50",
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
        backgroundColor: "#E8F5E9",
    },
    speedContainer: {
        alignItems: "flex-end",
    },
    speedLabel: {
        color: "#999",
        fontSize: 11,
    },
    speedValue: {
        color: "#4CAF50",
        fontWeight: "bold",
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
