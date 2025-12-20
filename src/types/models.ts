export interface User {
    id: number;
    username: string;
    email: string;
}

export interface Entity {
    id: number;
    name: string;
    entity_type: string;
    state: any;
    unit?: string;
    is_controllable: boolean;
    capabilities: Record<string, boolean>;
}

export interface Device {
    id: number;
    name: string;
    node_name: string;
    is_online: boolean;
    entities: Entity[];
}

export interface Home {
    id: number;
    name: string;
    role: "owner" | "family" | "guest";
}

export interface SceneAction {
    id: number;
    entity: number;
    entity_name: string;
    entity_type: string;
    value: any;
    order: number;
}

export interface Scene {
    id: number;
    home: number;
    name: string;
    actions?: SceneAction[];
}

export interface AutomationTrigger {
    id: number;
    entity: number;
    entity_name?: string;
    attribute: string;  // "temperature", "humidity", "state", etc.
    operator: ">" | "<" | "==";
    value: string;
}

export interface AutomationAction {
    id: number;
    entity?: number;
    entity_name?: string;
    scene?: number;
    scene_name?: string;
    command?: any;  // JSON object for entity control
}

export interface Automation {
    id: number;
    home: number;
    name: string;
    enabled: boolean;
    triggers: AutomationTrigger[];
    actions: AutomationAction[];
}
