import DHTCard from '../components/cards/DHTCard';
import BME280Card from '../components/cards/BME280Card';
import LightCard from '../components/cards/LightCard';
import MotorCard from '../components/cards/MotorCard';
import GenericSwitchCard from '../components/cards/GenericSwitchCard';

interface EntityRendererProps {
    entity: any;
    device: any;
    onControl: (entityId: number, data: any) => void;
}

export default function EntityRenderer({ entity, device, onControl }: EntityRendererProps) {
    const handleControl = (data: any) => {
        onControl(entity.id, data);
    };

    // ======================
    // SENSORS (Read-only)
    // ======================

    // DHT11/DHT22 - Temperature + Humidity
    if (entity.hardware_type === 'dht11' || entity.hardware_type === 'dht22') {
        return <DHTCard entity={entity} device={device} />;
    }

    // BME280 - Temperature + Humidity + Pressure
    if (entity.hardware_type === 'bme280') {
        return <BME280Card entity={entity} device={device} />;
    }

    // BMP280 - Temperature + Pressure (no humidity)
    if (entity.hardware_type === 'bmp280') {
        return <BME280Card entity={entity} device={device} />;
    }

    // DS18B20 - Single temperature sensor
    if (entity.hardware_type === 'ds18b20') {
        return <DHTCard entity={entity} device={device} />; // Reuse DHT layout
    }

    // PIR - Motion sensor
    if (entity.hardware_type === 'pir') {
        return <GenericSwitchCard entity={entity} device={device} onControl={handleControl} />;
    }

    // Reed Switch - Door/Window sensor
    if (entity.hardware_type === 'reed_switch') {
        return <GenericSwitchCard entity={entity} device={device} onControl={handleControl} />;
    }

    // Soil Moisture - Capacitive
    if (entity.hardware_type === 'soil_moisture_capacitive') {
        return <DHTCard entity={entity} device={device} />;
    }

    // BH1750 - Light sensor
    if (entity.hardware_type === 'bh1750') {
        return <DHTCard entity={entity} device={device} />;
    }

    // Ultrasonic - Distance sensor
    if (entity.hardware_type === 'ultrasonic_hcsr04') {
        return <DHTCard entity={entity} device={device} />;
    }

    // CO2 Sensor
    if (entity.hardware_type === 'co2_mhz19') {
        return <DHTCard entity={entity} device={device} />;
    }

    // =======================
    // ACTUATORS (Controllable)
    // =======================

    // LIGHTS
    if (entity.entity_type === 'light') {
        return <LightCard entity={entity} device={device} onControl={handleControl} />;
    }

    // STEPPER MOTORS
    if (entity.hardware_type === 'stepper_uln2003' ||
        entity.hardware_type === 'stepper_a4988' ||
        entity.entity_type === 'stepper') {
        return <MotorCard entity={entity} device={device} onControl={handleControl} />;
    }

    // FAN
    if (entity.entity_type === 'fan') {
        return <GenericSwitchCard entity={entity} device={device} onControl={handleControl} />;
    }

    // SWITCH type (generic switches, relays, lights configured as switches)
    if (entity.entity_type === 'switch') {
        return <GenericSwitchCard entity={entity} device={device} onControl={handleControl} />;
    }

    // SWITCH / RELAY / PUMP / VALVE / HEATER
    // All these are simple ON/OFF controls
    if (entity.is_controllable) {
        return <GenericSwitchCard entity={entity} device={device} onControl={handleControl} />;
    }

    // =======================
    // FALLBACK (Sensor)
    // =======================
    return <DHTCard entity={entity} device={device} />;
}
