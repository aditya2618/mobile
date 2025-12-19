import BaseCard from './BaseCard';
import PowerToggle from '../controls/PowerToggle';

interface GenericSwitchCardProps {
    entity: any;
    device: any;
    onControl: (data: any) => void;
}

export default function GenericSwitchCard({ entity, device, onControl }: GenericSwitchCardProps) {
    // Handle different state formats
    const isOn =
        entity.state?.value === 'ON' ||
        entity.state?.value === true ||
        entity.state?.power === 'ON' ||
        entity.state?.power === true ||
        entity.state === 'ON' ||
        entity.state === true;

    const handleToggle = (value: boolean) => {
        // Send in the format the backend expects
        onControl({ value: value ? 'ON' : 'OFF' });
    };

    // Smart icon detection based on entity name
    const getIcon = () => {
        const name = entity.name.toLowerCase();
        if (name.includes('pump') || name.includes('water')) return 'pump';
        if (name.includes('valve')) return 'valve';
        if (name.includes('fan')) return 'fan';
        if (name.includes('heater') || name.includes('heat')) return 'fire';
        if (name.includes('light') || name.includes('lamp') || name.includes('bulb')) return 'lightbulb';
        if (name.includes('relay')) return 'electric-switch';
        return 'toggle-switch';
    };

    return (
        <BaseCard
            icon={getIcon()}
            iconColor={isOn ? '#FFC107' : undefined}
            title={entity.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            subtitle={device.name}
            status={device.is_online ? 'online' : 'offline'}
            highlight={isOn}
        >
            <PowerToggle
                value={isOn}
                onChange={handleToggle}
                disabled={!device.is_online}
            />
        </BaseCard>
    );
}
