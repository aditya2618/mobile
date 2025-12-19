import { Card, Text, IconButton } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface BaseCardProps {
    icon: string;
    iconColor?: string;
    title: string;
    subtitle?: string;
    lastUpdated?: string;
    children: React.ReactNode;
    highlight?: boolean;
    status?: 'online' | 'offline';
}

export default function BaseCard({
    icon,
    iconColor,
    title,
    subtitle,
    lastUpdated,
    children,
    highlight,
    status,
}: BaseCardProps) {
    const { theme } = useTheme();

    const formatTime = (timestamp: string) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = Math.floor((now.getTime() - time.getTime()) / 1000);

        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <Card
            style={[
                styles.card,
                {
                    backgroundColor: theme.cardBackground,
                    borderColor: highlight ? theme.primary : theme.border,
                },
                highlight && styles.highlight,
            ]}
        >
            <Card.Content>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <IconButton
                            icon={icon}
                            size={24}
                            iconColor={iconColor || theme.primary}
                        />
                    </View>

                    <View style={styles.titleContainer}>
                        <Text variant="titleMedium" style={{ color: theme.text }}>
                            {title}
                        </Text>
                        {subtitle && (
                            <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                                {subtitle}
                            </Text>
                        )}
                    </View>

                    {status && (
                        <View
                            style={[
                                styles.statusDot,
                                {
                                    backgroundColor:
                                        status === 'online' ? theme.success : theme.error,
                                },
                            ]}
                        />
                    )}
                </View>

                {/* Content */}
                <View style={styles.content}>{children}</View>

                {/* Footer */}
                {lastUpdated && (
                    <Text
                        variant="bodySmall"
                        style={[styles.timestamp, { color: theme.textDisabled }]}
                    >
                        Updated: {formatTime(lastUpdated)}
                    </Text>
                )}
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 8,
        marginVertical: 6,
        borderRadius: 16,
        elevation: 2,
    },
    highlight: {
        borderWidth: 1.5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        marginRight: 8,
    },
    titleContainer: {
        flex: 1,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    content: {
        marginTop: 8,
    },
    timestamp: {
        marginTop: 12,
        fontSize: 11,
    },
});
