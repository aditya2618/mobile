import BaseCard from './BaseCard';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';

interface BME280CardProps {
    entity: any;
    device: any;
}

export default function BME280Card({ entity, device }: BME280CardProps) {
    const { theme } = useTheme();

    // BME280 provides temperature, humidity, and pressure
    const temperature = entity.state?.temperature ?? '--';
    const humidity = entity.state?.humidity ?? '--';
    const pressure = entity.state?.pressure ?? '--';

    return (
        <BaseCard
            icon="gauge"
            iconColor={theme.info}
            title={entity.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            subtitle={device.name}
            lastUpdated={entity.last_updated}
            status={device.is_online ? 'online' : 'offline'}
        >
            <View style={styles.grid}>
                <View style={styles.reading}>
                    <Text variant="titleMedium" style={{ color: theme.warning }}>
                        {typeof temperature === 'number' ? temperature.toFixed(1) : temperature}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                        Temperature (°C)
                    </Text>
                </View>

                <View style={styles.reading}>
                    <Text variant="titleMedium" style={{ color: theme.info }}>
                        {typeof humidity === 'number' ? humidity.toFixed(1) : humidity}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                        Humidity (%)
                    </Text>
                </View>

                <View style={styles.reading}>
                    <Text variant="titleMedium" style={{ color: theme.primary }}>
                        {typeof pressure === 'number' ? pressure.toFixed(0) : pressure}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                        Pressure (hPa)
                    </Text>
                </View>
            </View>
        </BaseCard>
    );
}

const styles = StyleSheet.create({
    grid: {
        marginVertical: 8,
        gap: 12,
    },
    reading: {
        alignItems: 'center',
        padding: 8,
    },
});
