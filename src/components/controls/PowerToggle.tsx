import { View, StyleSheet } from 'react-native';
import { Text, Switch } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import * as Haptics from 'expo-haptics';

interface PowerToggleProps {
    value: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
    label?: string;
}

export default function PowerToggle({
    value,
    onChange,
    disabled,
    label,
}: PowerToggleProps) {
    const { theme } = useTheme();

    const handleChange = (newValue: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onChange(newValue);
    };

    return (
        <View style={styles.container}>
            <View style={styles.labelContainer}>
                <Text
                    variant="titleMedium"
                    style={[
                        styles.statusText,
                        { color: value ? theme.success : theme.textSecondary },
                    ]}
                >
                    {value ? 'ON' : 'OFF'}
                </Text>
                {label && (
                    <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                        {label}
                    </Text>
                )}
            </View>
            <Switch
                value={value}
                onValueChange={handleChange}
                disabled={disabled}
                color={theme.primary}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    labelContainer: {
        flex: 1,
    },
    statusText: {
        fontWeight: 'bold',
    },
});
