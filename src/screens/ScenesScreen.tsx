import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import SceneCard from '../components/SceneCard';
import { useSceneStore } from '../store/sceneStore';
import { useHomeStore } from '../store/homeStore';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

export default function ScenesScreen() {
    const navigation = useNavigation();
    const scenes = useSceneStore((s) => s.scenes);
    const runScene = useSceneStore((s) => s.runScene);
    const deleteScene = useSceneStore((s) => s.deleteScene);
    const createScene = useSceneStore((s) => s.createScene);
    const activeHome = useHomeStore((s) => s.activeHome);
    const { theme, mode } = useTheme();

    const [refreshing, setRefreshing] = useState(false);
    const isDark = mode === 'dark';

    const handleRefresh = async () => {
        setRefreshing(true);
        // Refresh logic here if needed
        setTimeout(() => setRefreshing(false), 1000);
    };

    const handleRunScene = async (sceneId: number) => {
        try {
            await runScene(sceneId);
            Alert.alert('Success', 'Scene executed successfully!');
        } catch (error) {
            console.error('Failed to run scene:', error);
            Alert.alert('Error', 'Failed to run scene');
        }
    };

    const handleEditScene = (sceneId: number) => {
        navigation.navigate('EditScene' as never, { sceneId } as never);
    };

    const handleDeleteScene = async (sceneId: number) => {
        try {
            await deleteScene(sceneId);
            Alert.alert('Success', 'Scene deleted successfully!');
        } catch (error) {
            console.error('Failed to delete scene:', error);
            Alert.alert('Error', 'Failed to delete scene');
        }
    };

    const handleDuplicateScene = async (sceneId: number) => {
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene) return;

        // Extract display name without emoji
        const emojiRegex = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/u;
        const displayName = scene.name.replace(emojiRegex, '');

        Alert.alert(
            'Duplicate Scene',
            `Create a copy of "${displayName}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Duplicate',
                    onPress: async () => {
                        try {
                            if (!activeHome) return;

                            const actionsData = scene.actions?.map(a => ({
                                entity: a.entity,
                                value: a.value,
                                order: a.order
                            })) || [];

                            await createScene(activeHome.id, `${scene.name} (Copy)`, actionsData);
                            Alert.alert('Success', 'Scene duplicated successfully!');
                        } catch (error) {
                            console.error('Failed to duplicate scene:', error);
                            Alert.alert('Error', 'Failed to duplicate scene');
                        }
                    }
                }
            ]
        );
    };

    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.background} />
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: theme.background }]}>
                    <View>
                        <Text variant="headlineMedium" style={{ color: theme.text, fontWeight: 'bold' }}>
                            Scenes
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.textSecondary }}>
                            {scenes.length} scene{scenes.length !== 1 ? 's' : ''}
                        </Text>
                    </View>
                    <Button
                        mode="contained"
                        icon="plus"
                        onPress={() => navigation.navigate('CreateScene' as never)}
                        style={{ backgroundColor: theme.primary }}
                        labelStyle={{ color: '#FFFFFF' }}
                    >
                        Create Scene
                    </Button>
                </View>

                <ScrollView
                    style={styles.content}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[theme.primary]}
                            tintColor={theme.primary}
                        />
                    }
                >
                    {scenes.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={{ fontSize: 48, marginBottom: 16 }}>🎬</Text>
                            <Text variant="titleLarge" style={{ color: theme.text, marginBottom: 8 }}>
                                No Scenes Yet
                            </Text>
                            <Text variant="bodyMedium" style={{ color: theme.textSecondary, textAlign: 'center' }}>
                                Create your first scene to control{'\n'}multiple devices at once
                            </Text>
                        </View>
                    ) : (
                        scenes.map((scene) => (
                            <SceneCard
                                key={scene.id}
                                scene={scene}
                                onRun={handleRunScene}
                                onEdit={handleEditScene}
                                onDelete={handleDeleteScene}
                                onDuplicate={handleDuplicateScene}
                            />
                        ))
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,  // Reduced from 60
        paddingBottom: 12, // Reduced from 16
    },
    content: {
        flex: 1,
        padding: 16,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
});
