import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import * as Haptics from 'expo-haptics';

interface DirectionButtonsProps {
    onLeft: () => void;
    onRight: () => void;
    disabled?: boolean;
    leftIcon?: string;
    rightIcon?: string;
}

export default function DirectionButtons({
    onLeft,
    onRight,
    disabled,
    leftIcon = 'chevron-left',
    rightIcon = 'chevron-right',
}: DirectionButtonsProps) {
    const { theme } = useTheme();

    const handlePress = (callback: () => void) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        callback();
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={() => handlePress(onLeft)}
                disabled={disabled}
                style={[
                    styles.button,
                    { backgroundColor: theme.surfaceBackground, borderColor: theme.border },
                ]}
            >
                <IconButton
                    icon={leftIcon}
                    size={24}
                    iconColor={disabled ? theme.textDisabled : theme.primary}
                />
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => handlePress(onRight)}
                disabled={disabled}
                style={[
                    styles.button,
                    { backgroundColor: theme.surfaceBackground, borderColor: theme.border },
                ]}
            >
                <IconButton
                    icon={rightIcon}
                    size={24}
                    iconColor={disabled ? theme.textDisabled : theme.primary}
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 8,
    },
    button: {
        borderRadius: 12,
        borderWidth: 1,
    },
});
