import BaseCard from './BaseCard';
import PowerToggle from '../controls/PowerToggle';
import SliderControl from '../controls/SliderControl';

interface LightCardProps {
    entity: any;
    device: any;
    onControl: (data: any) => void;
}

export default function LightCard({ entity, device, onControl }: LightCardProps) {
    const isOn = entity.state?.power || entity.state === 'ON' || entity.state === true;
    const brightness = entity.state?.brightness ?? 100;
    const supportsBrightness = entity.capabilities?.supports_brightness;

    const handlePowerToggle = (value: boolean) => {
        onControl({ power: value ? 'ON' : 'OFF' });
    };

    const handleBrightness = (value: number) => {
        onControl({ brightness: value });
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
                    max={100}
                    unit="%"
                    disabled={!device.is_online}
                />
            )}
        </BaseCard>
    );
}
