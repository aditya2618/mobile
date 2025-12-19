import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ColorPickerProps {
    color: { r: number; g: number; b: number; w?: number };
    onChange: (color: { r: number; g: number; b: number; w?: number }) => void;
    disabled?: boolean;
    supportsWhite?: boolean;
}

export default function ColorPicker({ color, onChange, disabled, supportsWhite }: ColorPickerProps) {
    const { theme } = useTheme();

    // Convert RGB to hex for display
    const rgbToHex = (r: number, g: number, b: number) => {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    };

    const currentColor = rgbToHex(color.r ?? 255, color.g ?? 255, color.b ?? 255);

    // Preset colors
    const presetColors = [
        { name: 'Red', r: 255, g: 0, b: 0 },
        { name: 'Orange', r: 255, g: 165, b: 0 },
        { name: 'Yellow', r: 255, g: 255, b: 0 },
        { name: 'Green', r: 0, g: 255, b: 0 },
        { name: 'Cyan', r: 0, g: 255, b: 255 },
        { name: 'Blue', r: 0, g: 0, b: 255 },
        { name: 'Purple', r: 128, g: 0, b: 128 },
        { name: 'Magenta', r: 255, g: 0, b: 255 },
        { name: 'White', r: 255, g: 255, b: 255 },
    ];

    const handlePresetColor = (preset: { r: number; g: number; b: number }) => {
        onChange({ ...color, ...preset });
    };

    return (
        <View style={styles.container}>
            {/* Current Color Display */}
            <View style={[styles.colorDisplay, { backgroundColor: currentColor, borderColor: theme.border }]}>
                <Text style={styles.colorText}>
                    {currentColor.toUpperCase()}
                </Text>
            </View>

            {/* Preset Colors */}
            <View style={styles.presetsContainer}>
                {presetColors.map((preset) => (
                    <TouchableOpacity
                        key={preset.name}
                        style={[
                            styles.presetColor,
                            {
                                backgroundColor: rgbToHex(preset.r, preset.g, preset.b),
                                borderColor: theme.border,
                            },
                        ]}
                        onPress={() => handlePresetColor(preset)}
                        disabled={disabled}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
    },
    colorDisplay: {
        height: 60,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    colorText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    presetsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    presetColor: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
    },
});
