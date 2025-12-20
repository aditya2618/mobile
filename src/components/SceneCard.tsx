import { Card, Text, IconButton } from "react-native-paper";
import { View, StyleSheet, Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";

interface SceneCardProps {
    scene: any;
    onRun: (sceneId: number) => void;
    onEdit?: (sceneId: number) => void;
    onDelete?: (sceneId: number) => void;
    onDuplicate?: (sceneId: number) => void;
}

export default function SceneCard({ scene, onRun, onEdit, onDelete, onDuplicate }: SceneCardProps) {
    const { theme, mode } = useTheme();

    const isDark = mode === 'dark';
    const cardBg = isDark ? theme.cardBackground : '#FFFFFF';
    const borderColor = isDark ? 'transparent' : 'rgba(0,0,0,0.08)';

    // Extract icon emoji from scene name
    const getIcon = () => {
        // Match any emoji at the start of the string
        const emojiRegex = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
        const match = scene.name.match(emojiRegex);
        return match ? match[0] : '🎬';
    };

    const getDisplayName = () => {
        // Remove emoji and any following space from the start
        return scene.name.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/u, '');
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Scene',
            `Are you sure you want to delete "${getDisplayName()}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => onDelete?.(scene.id)
                }
            ]
        );
    };

    const handleDuplicate = () => {
        onDuplicate?.(scene.id);
    };

    return (
        <Card
            style={[
                styles.card,
                {
                    backgroundColor: cardBg,
                    borderColor,
                    borderWidth: 1,
                }
            ]}
        >
            <Card.Content style={{ paddingVertical: 8, paddingHorizontal: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    {/* Large Icon */}
                    <Text style={{ fontSize: 48, lineHeight: 48 }}>
                        {getIcon()}
                    </Text>

                    {/* Scene info */}
                    <View style={{ flex: 1 }}>
                        {/* Scene name */}
                        <Text variant="titleMedium" style={[styles.title, { color: theme.text }]}>
                            {getDisplayName()}
                        </Text>

                        {/* Action count below name */}
                        <Text variant="bodySmall" style={[styles.subtitle, { color: theme.textSecondary, fontSize: 11, marginTop: 2 }]}>
                            {scene.actions?.length || 0} action{scene.actions?.length !== 1 ? 's' : ''}
                        </Text>

                        {/* Edit, Duplicate, Delete buttons */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 0, marginTop: 4 }}>
                            <IconButton
                                icon="pencil-outline"
                                size={16}
                                iconColor={theme.primary}
                                onPress={() => onEdit?.(scene.id)}
                                style={{ margin: 0, padding: 0 }}
                            />
                            <IconButton
                                icon="content-copy"
                                size={16}
                                iconColor={theme.primary}
                                onPress={() => onDuplicate?.(scene.id)}
                                style={{ margin: 0, padding: 0 }}
                            />
                            <IconButton
                                icon="delete-outline"
                                size={16}
                                iconColor={theme.error}
                                onPress={handleDelete}
                                style={{ margin: 0, padding: 0 }}
                            />
                        </View>
                    </View>

                    {/* Play button on the right */}
                    <IconButton
                        icon="play-circle"
                        size={40}
                        iconColor={theme.primary}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            onRun(scene.id);
                        }}
                        style={{ margin: 0 }}
                    />
                </View>
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 6, // Reduced from 8
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    content: { // Kept existing content style for now, as the instruction only provided a partial styles object
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    title: {
        fontWeight: "600",
    },
    subtitle: {
        marginTop: 2, // Reduced from 4
    },
    // New styles from instruction, but not used in the component's JSX
    cardContent: {
        padding: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leftSection: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        fontSize: 32,
    },
    textContainer: {
        flex: 1,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 4,
        marginTop: 8,
    },
});
