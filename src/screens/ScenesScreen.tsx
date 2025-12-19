import { ScrollView, StyleSheet, View, StatusBar } from "react-native";
import { Text } from "react-native-paper";
import { useSceneStore } from "../store/sceneStore";
import { useHomeStore } from "../store/homeStore";
import { useTheme } from "../context/ThemeContext";
import SceneCard from "../components/SceneCard";

export default function ScenesScreen() {
    const scenes = useSceneStore((s) => s.scenes);
    const runScene = useSceneStore((s) => s.runScene);
    const activeHome = useHomeStore((s) => s.activeHome);
    const { theme, mode } = useTheme();

    const handleRunScene = async (sceneId: number) => {
        try {
            await runScene(sceneId);
        } catch (error) {
            console.error('Failed to run scene:', error);
        }
    };

    return (
        <>
            <StatusBar
                barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={theme.background}
            />
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <ScrollView style={styles.scrollView}>
                    <View style={[styles.header, { backgroundColor: theme.background }]}>
                        <Text variant="headlineLarge" style={[styles.title, { color: theme.text }]}>
                            Scenes
                        </Text>
                        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.textSecondary }]}>
                            {scenes.length} scene{scenes.length !== 1 ? "s" : ""} available
                        </Text>
                    </View>

                    {scenes.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text variant="bodyLarge" style={[styles.emptyText, { color: theme.text }]}>
                                No scenes configured
                            </Text>
                            <Text variant="bodySmall" style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                                Create scenes in the web dashboard
                            </Text>
                        </View>
                    ) : (
                        scenes.map((scene) => (
                            <SceneCard
                                key={scene.id}
                                scene={scene}
                                onRun={handleRunScene}
                            />
                        ))
                    )}

                    {activeHome?.role === "guest" && (
                        <View style={styles.notice}>
                            <Text variant="bodySmall" style={[styles.noticeText, { color: theme.textSecondary }]}>
                                👤 Guest mode: Some scenes may be restricted
                            </Text>
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
    scrollView: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: 50,
        paddingBottom: 20,
    },
    title: {
        fontWeight: "bold",
    },
    subtitle: {
        marginTop: 4,
    },
    emptyContainer: {
        alignItems: "center",
        padding: 40,
    },
    emptyText: {
        fontWeight: "600",
    },
    emptySubtext: {
        marginTop: 8,
    },
    notice: {
        margin: 16,
        padding: 12,
        borderRadius: 8,
        backgroundColor: "rgba(255, 193, 7, 0.1)",
    },
    noticeText: {
        textAlign: "center",
    },
});
