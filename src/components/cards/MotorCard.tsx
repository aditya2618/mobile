import BaseCard from './BaseCard';
import PowerToggle from '../controls/PowerToggle';
import DirectionButtons from '../controls/DirectionButtons';
import SliderControl from '../controls/SliderControl';

interface MotorCardProps {
    entity: any;
    device: any;
    onControl: (data: any) => void;
}

export default function MotorCard({ entity, device, onControl }: MotorCardProps) {
    const speed = entity.state?.speed ?? 50;

    const handleMove = (direction: 'left' | 'right') => {
        onControl({ direction, steps: 100 }); // Move 100 steps in direction
    };

    const handleSpeed = (value: number) => {
        onControl({ speed: value });
    };

    return (
        <BaseCard
            icon="rotate-right"
            title={entity.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            subtitle={device.name}
            status={device.is_online ? 'online' : 'offline'}
        >
            <DirectionButtons
                onLeft={() => handleMove('left')}
                onRight={() => handleMove('right')}
                disabled={!device.is_online}
            />

            <SliderControl
                label="Speed"
                value={speed}
                onChange={handleSpeed}
                min={0}
                max={100}
                unit="%"
                disabled={!device.is_online}
            />
        </BaseCard>
    );
}
