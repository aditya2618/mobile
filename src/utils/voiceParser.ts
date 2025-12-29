/**
 * Voice Command Parser
 * Parses spoken commands into structured actions for device control
 */

export interface ParsedCommand {
    action: 'on' | 'off' | 'set' | 'scene' | 'brightness' | 'speed' | 'unknown';
    target: string;
    value?: number;
    raw: string;
}

export interface MatchedEntity {
    id: number;
    name: string;
    type: string;
    deviceName: string;
    score: number;
}

export interface MatchedScene {
    id: number;
    name: string;
    score: number;
}

/**
 * Parse a voice command into a structured action
 */
export function parseVoiceCommand(transcript: string): ParsedCommand {
    const text = transcript.toLowerCase().trim();

    // Scene commands: "run movie time", "activate good night"
    const scenePatterns = [
        /^(?:run|activate|start|execute)\s+(.+?)(?:\s+scene)?$/i,
        /^(.+?)\s+scene$/i,
    ];

    for (const pattern of scenePatterns) {
        const match = text.match(pattern);
        if (match) {
            return {
                action: 'scene',
                target: match[1].trim(),
                raw: transcript,
            };
        }
    }

    // On/Off commands: "turn on fan", "switch off light"
    const onOffPatterns = [
        /^(?:turn|switch)\s+(on|off)\s+(?:the\s+)?(.+)$/i,
        /^(.+?)\s+(on|off)$/i,
    ];

    for (const pattern of onOffPatterns) {
        const match = text.match(pattern);
        if (match) {
            const action = match[1].toLowerCase() === 'on' || match[2]?.toLowerCase() === 'on' ? 'on' : 'off';
            const target = match[2] || match[1];
            return {
                action: action,
                target: target.replace(/^the\s+/, '').trim(),
                raw: transcript,
            };
        }
    }

    // Brightness/Dim commands: "set light to 50%", "dim bedroom to 30"
    const brightnessPatterns = [
        /^(?:set|dim)\s+(?:the\s+)?(.+?)\s+(?:to|at)\s+(\d+)\s*%?$/i,
        /^(?:set|change)\s+(?:the\s+)?(.+?)\s+brightness\s+(?:to|at)\s+(\d+)\s*%?$/i,
    ];

    for (const pattern of brightnessPatterns) {
        const match = text.match(pattern);
        if (match) {
            return {
                action: 'brightness',
                target: match[1].trim(),
                value: parseInt(match[2], 10),
                raw: transcript,
            };
        }
    }

    // Speed commands: "set fan speed to 3"
    const speedPatterns = [
        /^(?:set)\s+(?:the\s+)?(.+?)\s+speed\s+(?:to|at)\s+(\d+)$/i,
    ];

    for (const pattern of speedPatterns) {
        const match = text.match(pattern);
        if (match) {
            return {
                action: 'speed',
                target: match[1].trim(),
                value: parseInt(match[2], 10),
                raw: transcript,
            };
        }
    }

    return {
        action: 'unknown',
        target: text,
        raw: transcript,
    };
}

/**
 * Calculate similarity score between two strings (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    // Exact match
    if (s1 === s2) return 1;

    // Contains match
    if (s2.includes(s1) || s1.includes(s2)) {
        return 0.8;
    }

    // Word overlap
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);

    let matches = 0;
    for (const word of words1) {
        if (words2.some(w => w.includes(word) || word.includes(w))) {
            matches++;
        }
    }

    return matches / Math.max(words1.length, words2.length);
}

/**
 * Find best matching entity from list
 */
export function findMatchingEntity(
    target: string,
    entities: Array<{ id: number; name: string; entity_type: string; deviceName?: string }>
): MatchedEntity | null {
    let bestMatch: MatchedEntity | null = null;
    let bestScore = 0.3; // Minimum threshold

    for (const entity of entities) {
        // Check entity name
        let score = calculateSimilarity(target, entity.name);

        // Also check device name + entity name combination
        if (entity.deviceName) {
            const combinedName = `${entity.deviceName} ${entity.name}`;
            const combinedScore = calculateSimilarity(target, combinedName);
            score = Math.max(score, combinedScore);
        }

        if (score > bestScore) {
            bestScore = score;
            bestMatch = {
                id: entity.id,
                name: entity.name,
                type: entity.entity_type,
                deviceName: entity.deviceName || '',
                score,
            };
        }
    }

    return bestMatch;
}

/**
 * Find best matching scene from list
 */
export function findMatchingScene(
    target: string,
    scenes: Array<{ id: number; name: string }>
): MatchedScene | null {
    let bestMatch: MatchedScene | null = null;
    let bestScore = 0.3;

    for (const scene of scenes) {
        // Remove emoji from scene name for matching
        const cleanName = scene.name.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/u, '');
        const score = calculateSimilarity(target, cleanName);

        if (score > bestScore) {
            bestScore = score;
            bestMatch = {
                id: scene.id,
                name: scene.name,
                score,
            };
        }
    }

    return bestMatch;
}

/**
 * Get example commands for help
 */
export function getExampleCommands(): string[] {
    return [
        'Turn on living room light',
        'Turn off fan',
        'Set bedroom light to 50%',
        'Run good night scene',
        'Dim kitchen to 30%',
    ];
}
