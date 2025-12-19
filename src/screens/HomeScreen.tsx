import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import { useDeviceStore } from '../store/deviceStore';
import { useHomeStore } from '../store/homeStore';

export default function HomeScreen() {
    const { theme, mode } = useTheme();
    const devices = useDeviceStore((s) => s.devices);
    const activeHome = useHomeStore((s) => s.activeHome);

    const isDark = mode === 'dark';

    // Calculate stats
    const totalDevices = devices.length;
    const onlineDevices = devices.filter((d) => d.is_online).length;
    const totalEntities = devices.reduce((sum, d) => sum + d.entities.length, 0);
    const sensors = devices.reduce(
        (sum, d) => sum + d.entities.filter((e) => e.entity_type === 'sensor').length,
        0
    );
    const actuators = devices.reduce(
        (sum, d) => sum + d.entities.filter((e) => e.is_controllable).length,
        0
    );

    const cardBg = isDark ? theme.card : '#FFFFFF';
    const borderColor = isDark ? 'transparent' : 'rgba(0,0,0,0.08)';

    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.background} />
            <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text variant="headlineMedium" style={{ color: theme.text, fontWeight: 'bold' }}>
                        Welcome Home
                    </Text>
                    <Text variant="bodyLarge" style={{ color: theme.textSecondary, marginTop: 4 }}>
                        {activeHome?.name || 'Smart Home'}
                    </Text>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <Card style={[styles.statCard, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                        <Card.Content>
                            <Text variant="displayMedium" style={{ color: theme.primary, fontWeight: 'bold' }}>
                                {totalDevices}
                            </Text>
                            <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginTop: 8 }}>
                                Total Devices
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.success, marginTop: 4 }}>
                                {onlineDevices} online
                            </Text>
                        </Card.Content>
                    </Card>

                    <Card style={[styles.statCard, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                        <Card.Content>
                            <Text variant="displayMedium" style={{ color: theme.info, fontWeight: 'bold' }}>
                                {totalEntities}
                            </Text>
                            <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginTop: 8 }}>
                                Total Entities
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.textSecondary, marginTop: 4 }}>
                                {sensors} sensors, {actuators} controls
                            </Text>
                        </Card.Content>
                    </Card>
                </View>

                {/* Quick Info */}
                <Card style={[styles.infoCard, { backgroundColor: cardBg, borderColor, borderWidth: 1, marginTop: 16 }]}>
                    <Card.Content>
                        <Text variant="titleLarge" style={{ color: theme.text, fontWeight: 'bold', marginBottom: 12 }}>
                            System Status
                        </Text>
                        <View style={[styles.statusRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
                            <Text style={{ color: theme.textSecondary }}>🌐 Network</Text>
                            <Text style={{ color: theme.success, fontWeight: '600' }}>Connected</Text>
                        </View>
                        <View style={[styles.statusRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
                            <Text style={{ color: theme.textSecondary }}>📡 WebSocket</Text>
                            <Text style={{ color: theme.success, fontWeight: '600' }}>Active</Text>
                        </View>
                        <View style={[styles.statusRow, { borderBottomWidth: 0 }]}>
                            <Text style={{ color: theme.textSecondary }}>🏠 Home</Text>
                            <Text style={{ color: theme.text, fontWeight: '600' }}>{activeHome?.name || 'N/A'}</Text>
                        </View>
                    </Card.Content>
                </Card>

                {/* Welcome Message */}
                <Card style={[styles.infoCard, { backgroundColor: cardBg, borderColor, borderWidth: 1, marginTop: 16, marginBottom: 24 }]}>
                    <Card.Content>
                        <Text variant="titleMedium" style={{ color: theme.text, marginBottom: 8, fontWeight: '600' }}>
                            📱 Smart Home Dashboard
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.textSecondary, lineHeight: 22 }}>
                            Your smart home is up and running! Navigate to the Devices tab to control your devices,
                            or check out Scenes to automate your home.
                        </Text>
                    </Card.Content>
                </Card>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: 60,
    },
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    infoCard: {
        marginHorizontal: 16,
        borderRadius: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
});
