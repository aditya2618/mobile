import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { useTheme } from '../../context/ThemeContext';
import * as Haptics from 'expo-haptics';

interface SliderControlProps {
    label: string;
    value: number;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    onChange: (value: number) => void;
    disabled?: boolean;
}

export default function SliderControl({
    label,
    value,
    min = 0,
    max = 100,
    step = 1,
    unit = '%',
    onChange,
    disabled,
}: SliderControlProps) {
    const { theme } = useTheme();

    const handleChange = (newValue: number) => {
        Haptics.selectionAsync();
        onChange(Math.round(newValue));
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text variant="bodyMedium" style={{ color: theme.text }}>
                    {label}
                </Text>
                <Text variant="titleMedium" style={{ color: theme.primary }}>
                    {value}{unit}
                </Text>
            </View>
            <Slider
                style={styles.slider}
                value={value}
                onValueChange={handleChange}
                minimumValue={min}
                maximumValue={max}
                step={step}
                minimumTrackTintColor={theme.primary}
                maximumTrackTintColor={theme.border}
                thumbTintColor={theme.primary}
                disabled={disabled}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    slider: {
        width: '100%',
        height: 40,
    },
});
