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
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} iconColor={theme.text} />
                <View style={{ flex: 1 }}>
                    <Text variant="headlineSmall" style={{ color: theme.text, fontWeight: 'bold' }}>
                        ⚡ Energy Monitor
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                        Today's Usage
                    </Text>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ padding: 20 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.primary]} />
                }
            >
                {/* Today's Total Card */}
                <Card style={[styles.totalCard, { backgroundColor: theme.primary }]}>
                    <Card.Content>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <Text variant="titleMedium" style={{ color: '#FFFFFF', opacity: 0.9 }}>
                                Today's Energy Consumption
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                            <View>
                                <Text variant="headlineLarge" style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                                    {energyData.today.total_kwh.toFixed(2)}
                                </Text>
                                <Text variant="bodyMedium" style={{ color: '#FFFFFF', opacity: 0.8 }}>
                                    kWh
                                </Text>
                            </View>

                            <Divider style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />

                            <View style={{ alignItems: 'flex-end' }}>
                                <Text variant="headlineLarge" style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                                    ₹{energyData.today.total_cost.toFixed(2)}
                                </Text>
                                <Text variant="bodyMedium" style={{ color: '#FFFFFF', opacity: 0.8 }}>
                                    Cost
                                </Text>
                            </View>
                        </View>

                        <Text variant="bodySmall" style={{ color: '#FFFFFF', opacity: 0.7, marginTop: 12 }}>
                            {new Date(energyData.today.date).toLocaleDateString('en-IN', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </Text>
                    </Card.Content>
                </Card>

                {/* Top Consumers */}
                <View style={{ marginTop: 24 }}>
                    <Text variant="titleMedium" style={{ color: theme.text, fontWeight: 'bold', marginBottom: 12 }}>
                        Top Consumers
                    </Text>

                    {energyData.today.top_consumers.length === 0 ? (
                        <Card style={{ backgroundColor: cardBg }}>
                            <Card.Content>
                                <Text style={{ color: theme.textSecondary, textAlign: 'center', paddingVertical: 20 }}>
                                    No device usage recorded today
                                </Text>
                            </Card.Content>
                        </Card>
                    ) : (
                        energyData.today.top_consumers.map((consumer, index) => (
                            <Card key={consumer.entity__id} style={[styles.consumerCard, { backgroundColor: cardBg, marginBottom: 12 }]}>
                                <Card.Content>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <View style={[styles.rankBadge, {
                                                    backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : theme.primary + '20'
                                                }]}>
                                                    <Text style={{
                                                        color: index < 3 ? '#000' : theme.primary,
                                                        fontWeight: 'bold',
                                                        fontSize: 12
                                                    }}>
                                                        #{index + 1}
                                                    </Text>
                                                </View>
                                                <Text variant="bodyLarge" style={{ color: theme.text, fontWeight: '600', marginLeft: 8 }}>
                                                    {consumer.entity__name}
                                                </Text>
                                            </View>

                                            <Text variant="bodySmall" style={{ color: theme.textSecondary, marginTop: 4, marginLeft: 36 }}>
                                                On for {formatDuration(consumer.on_duration_seconds)}
                                            </Text>
                                        </View>

                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text variant="titleMedium" style={{ color: theme.primary, fontWeight: 'bold' }}>
                                                {consumer.estimated_kwh.toFixed(3)} kWh
                                            </Text>
                                            <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                                                ₹{consumer.estimated_cost?.toFixed(2) || '0.00'}
                                            </Text>
                                        </View>
                                    </View>
                                </Card.Content>
                            </Card>
                        ))
                    )}
                </View>

                {/* Info Card */}
                <Card style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', marginTop: 24 }}>
                    <Card.Content>
                        <Text variant="bodyMedium" style={{ color: theme.textSecondary, lineHeight: 20 }}>
                            💡 Energy consumption is calculated based on device on-time and estimated power usage.
                            Costs are calculated using your configured electricity rate.
                        </Text>
                    </Card.Content>
                </Card>

                <View style={{ height: 40 }} />
            </ScrollView>
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
    content: {
        flex: 1,
    },
    totalCard: {
        borderRadius: 16,
        elevation: 4,
    },
    consumerCard: {
        borderRadius: 12,
        elevation: 2,
    },
    rankBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
