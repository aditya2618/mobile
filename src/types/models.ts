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
