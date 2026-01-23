import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Text, Card, ActivityIndicator, Divider, IconButton } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useHomeStore } from '../store/homeStore';
import { useEnergyStore } from '../store/energyStore';
import { useNavigation } from '@react-navigation/native';

export default function EnergyDashboardScreen() {
    const { theme, mode } = useTheme();
    const navigation = useNavigation();
    const selectedHome = useHomeStore((s) => s.selectedHome);
    const { energyData, loading, loadEnergyData } = useEnergyStore();
    const [refreshing, setRefreshing] = useState(false);

    const isDark = mode === 'dark';
    const cardBg = isDark ? theme.cardBackground : '#FFFFFF';

    useEffect(() => {
        if (selectedHome) {
            loadEnergyData(selectedHome.id);
        }
    }, [selectedHome]);

    const handleRefresh = async () => {
        if (!selectedHome) return;
        setRefreshing(true);
        await loadEnergyData(selectedHome.id);
        setRefreshing(false);
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    if (loading && !energyData) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={{ color: theme.text, marginTop: 16 }}>Loading energy data...</Text>
                </View>
            </View>
        );
    }

    if (!energyData) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>
                        No energy data available yet.{'\n'}Turn your devices on/off to start tracking!
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} iconColor={theme.text} />
                <View style={{ flex: 1 }}>
                    <Text variant="headlineSmall" style={{ color: theme.text, fontWeight: 'bold' }}>
                        ⚡ Energy Monitor
                    </Text>
                </View>
            </View>

            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>🚧</Text>
                <Text variant="headlineMedium" style={{ color: theme.text, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>
                    Coming Soon
                </Text>
                <Text variant="bodyLarge" style={{ color: theme.textSecondary, textAlign: 'center' }}>
                    We are working hard to bring you detailed energy monitoring statistics. Stay tuned!
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
});
