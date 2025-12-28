import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Switch, Icon } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { Entity, Device } from '../../types/models';

interface ModernDeviceCardProps {
    entity: Entity;
    device: Device;
    onControl: (entityId: number, data: any) => void;
}

export default function ModernDeviceCard({ entity, device, onControl }: ModernDeviceCardProps) {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    // Determine State
    const isOn =
        entity.state?.value === 'ON' ||
        entity.state?.value === true ||
        entity.state?.power === 'ON' ||
        entity.state?.power === true ||
        entity.state === 'ON' ||
        entity.state === true;

    // Handle Toggle
    const handleToggle = () => {
        onControl(entity.id, { value: !isOn });
    };

    // Determine Icon
    const getIcon = () => {
        const name = entity.name.toLowerCase();
        if (name.includes('light') || name.includes('lamp')) return 'lightbulb';
        if (name.includes('fan')) return 'fan';
        if (name.includes('ac') || name.includes('air')) return 'air-conditioner';
        if (name.includes('tv') || name.includes('media')) return 'television';
        if (name.includes('speaker')) return 'speaker';
        return 'power-plug';
    };

    const icon = getIcon();
    const isActive = isOn;
    const activeColor = theme.primary; // e.g., Orange or Blue from theme
    const inactiveColor = theme.textDisabled;

    const cardBg = isDark ? theme.cardBackground : '#FFFFFF';

    return (
        <View style={[
            styles.card,
            {
                backgroundColor: cardBg,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
            }
        ]}>
            {/* Top Row: Icon and Toggle */}
            <View style={styles.topRow}>
                <View style={[
                    styles.iconCircle,
                    {
                        backgroundColor: isActive ? activeColor + '20' : theme.surfaceBackground,
                    }
                ]}>
                    <Icon
                        source={icon}
                        size={24}
                        color={isActive ? activeColor : inactiveColor}
                    />
                </View>

                {entity.is_controllable && (
                    <Switch
                        value={isActive}
                        onValueChange={handleToggle}
                        color={activeColor}
                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />
                )}
            </View>

            {/* Bottom Row: Name and Status */}
            <View style={styles.bottomRow}>
                <Text
                    variant="titleMedium"
                    numberOfLines={1}
                    style={{
                        fontWeight: 'bold',
                        color: theme.text,
                        fontSize: 16
                    }}
                >
                    {entity.name.replace(/_/g, ' ')}
                </Text>
                <Text
                    variant="bodySmall"
                    numberOfLines={1}
                    style={{
                        color: theme.textSecondary,
                        marginTop: 4
                    }}
                >
                    {device.node_name || 'Home'} • {isOn ? 'On' : 'Off'}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 24,
        padding: 16,
        margin: 6,
        flex: 1, // To fill grid column
        minHeight: 140,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomRow: {
        marginTop: 16,
    }
});
