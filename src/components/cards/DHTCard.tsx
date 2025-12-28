import BaseCard from './BaseCard';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';

interface DHTCardProps {
    entity: any;
    device: any;
}

export default function DHTCard({ entity, device }: DHTCardProps) {
    const { theme } = useTheme();

    // Handle both combined DHT format and individual sensor format
    const isCombined = entity.state?.temperature !== undefined || entity.state?.humidity !== undefined;

    if (isCombined) {
        // Combined DHT11/DHT22 format
        const temperature = entity.state?.temperature ?? '--';
        const humidity = entity.state?.humidity ?? '--';
        const precision = entity.hardware_type === 'dht22' ? 1 : 0;

        return (
            <BaseCard
                icon="thermometer"
                iconColor={theme.info}
                title={entity.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                subtitle={device.name}
                lastUpdated={entity.last_updated}
                status={device.is_online ? 'online' : 'offline'}
            >
                <View style={styles.readings}>
                    <View style={styles.reading}>
                        <Text variant="headlineMedium" style={{ color: theme.warning }}>
                            {typeof temperature === 'number' ? temperature.toFixed(precision) : temperature}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                            °C
                        </Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.divider }]} />

                    <View style={styles.reading}>
                        <Text variant="headlineMedium" style={{ color: theme.info }}>
                            {typeof humidity === 'number' ? humidity.toFixed(precision) : humidity}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                            %
                        </Text>
                    </View>
                </View>

                <View style={styles.labels}>
                    <Text variant="labelSmall" style={{ color: theme.textSecondary }}>
                        Temperature
                    </Text>
                    <Text variant="labelSmall" style={{ color: theme.textSecondary }}>
                        Humidity
                    </Text>
                </View>
            </BaseCard>
        );
    }

    // Individual sensor format (single value)
    let value: any = '--';
    if (entity.state !== null && typeof entity.state === 'object') {
        value = entity.state.value ?? '--';
    } else if (entity.state !== undefined && entity.state !== null) {
        value = entity.state;
    }
    const unit = entity.unit || '';

    // Determine icon and color based on entity name
    const isTemperature = entity.name.toLowerCase().includes('temperature');
    const isHumidity = entity.name.toLowerCase().includes('humidity');

    const icon = isTemperature ? 'thermometer' : isHumidity ? 'water-percent' : 'gauge';
    const color = isTemperature ? theme.warning : isHumidity ? theme.info : theme.primary;
    const displayUnit = unit || (isTemperature ? '°C' : isHumidity ? '%' : '');

    return (
        <BaseCard
            icon={icon}
            iconColor={device.is_online ? color : theme.textDisabled}
            title={entity.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            subtitle={device.name}
            lastUpdated={entity.last_updated}
            status={device.is_online ? 'online' : 'offline'}
        >
            {device.is_online ? (
                <View style={styles.singleReading}>
                    <Text variant="displaySmall" style={{ color, fontWeight: 'bold' }}>
                        {typeof value === 'number' ? value.toFixed(1) : value}
                    </Text>
                    <Text variant="titleMedium" style={{ color: theme.textSecondary, marginLeft: 8 }}>
                        {displayUnit}
                    </Text>
                </View>
            ) : (
                <View style={styles.offlineContainer}>
                    <Text variant="bodyLarge" style={{ color: theme.textDisabled }}>
                        Device Offline
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.textDisabled, marginTop: 4 }}>
                        No live data available
                    </Text>
                </View>
            )}
        </BaseCard>
    );
}

const styles = StyleSheet.create({
    readings: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginVertical: 12,
    },
    reading: {
        flex: 1,
        alignItems: 'center',
    },
    divider: {
        width: 1,
        height: 40,
    },
    labels: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 8,
    },
    singleReading: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'baseline',
        marginVertical: 16,
    },
    offlineContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
});
