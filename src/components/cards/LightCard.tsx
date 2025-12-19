import { View, Text } from 'react-native';
import BaseCard from './BaseCard';
import PowerToggle from '../controls/PowerToggle';
import SliderControl from '../controls/SliderControl';
import ColorPicker from '../controls/ColorPicker';

interface LightCardProps {
    entity: any;
    device: any;
    onControl: (data: any) => void;
}

export default function LightCard({ entity, device, onControl }: LightCardProps) {
    // Improved state detection - handle different state formats
    const state = entity.state || {};
    console.log(`🔍 ${entity.name} state:`, JSON.stringify(state));
    const isOn = state.state === 'ON' || state.power === 'ON' || state.power === true;
    const brightness = state.brightness ?? 255;
    const supportsBrightness = entity.capabilities?.brightness;

    // Color support detection - multiple methods for compatibility
    const capabilities = entity.capabilities || {};
    const hasColorCapability = capabilities.color === true || capabilities.rgb === true;
    const hasColorMode = state.color_mode === 'rgb' || state.color_mode === 'rgbw';
    const hasColorInState = state.color && typeof state.color === 'object';

    const supportsRGB = hasColorCapability || hasColorMode || hasColorInState;
    const supportsWhite = capabilities.white === true || capabilities.rgbw === true || state.color_mode === 'rgbw';
    const color = state.color || { r: 255, g: 255, b: 255, w: 255 };

    // Debug log
    console.log(`💡 Light: ${entity.name}, capabilities:`, capabilities, `state.color_mode: ${state.color_mode}, supportsRGB: ${supportsRGB}, isOn: ${isOn}`);

    const handlePowerToggle = (value: boolean) => {
        onControl({ power: value ? 'ON' : 'OFF' });
    };

    const handleBrightness = (value: number) => {
        onControl({ brightness: value });
    };

    const handleColorChange = (newColor: { r: number; g: number; b: number; w?: number }) => {
        onControl({ color: newColor });
    };

    return (
        <BaseCard
            icon="lightbulb"
            iconColor={isOn ? '#FFC107' : undefined}
            title={entity.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            subtitle={device.name}
            status={device.is_online ? 'online' : 'offline'}
            highlight={isOn}
        >
            <PowerToggle
                value={isOn}
                onChange={handlePowerToggle}
                disabled={!device.is_online}
            />

            {supportsBrightness && isOn && (
                <SliderControl
                    label="Brightness"
                    value={brightness}
                    onChange={handleBrightness}
                    min={0}
                    max={255}
                    unit=""
                    disabled={!device.is_online}
                />
            )}

            {/* RGB/RGBW Color Picker - TESTING ALWAYS SHOW */}
            <View style={{ backgroundColor: '#000000', padding: 10 }}>
                <Text style={{ color: '#00FF00' }}>
                    TEST: supportsRGB={String(supportsRGB)}, isOn={String(isOn)}
                </Text>
            </View>
            <ColorPicker
                color={color}
                onChange={handleColorChange}
                disabled={false}
                supportsWhite={supportsWhite}
            />
        </BaseCard>
    );
}
