import { Card, Text, IconButton } from "react-native-paper";
import { View, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";

export default function SceneCard({ scene, onRun }: any) {
    return (
        <Card
            style={styles.card}
            onPress={() => {
                if (scene.enabled) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onRun(scene.id);
                }
            }}
        >
            <Card.Content>
                <View style={styles.content}>
                    <View>
                        <Text variant="titleMedium" style={styles.title}>
                            {scene.name}
                        </Text>
                        <Text variant="bodySmall" style={styles.status}>
                            {scene.enabled ? "Ready" : "Disabled"}
                        </Text>
                    </View>

                    <IconButton
                        icon={scene.icon || "play"}
                        size={28}
                        iconColor={scene.enabled ? "#4CAF50" : "#666"}
                    />
                </View>
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        margin: 8,
        backgroundColor: "#1e1e2e",
        borderRadius: 12,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    title: {
        color: "#fff",
        fontWeight: "600",
    },
    status: {
        color: "#aaa",
        marginTop: 4,
    },
});
