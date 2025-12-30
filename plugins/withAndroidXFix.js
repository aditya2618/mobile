/**
 * Expo Config Plugin to fix AndroidX manifest merger conflict
 * Creates/modifies the debug AndroidManifest.xml with tools:replace
 */
const {
    withAndroidManifest,
    withDangerousMod
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Plugin to modify the main AndroidManifest.xml
function withAndroidXManifestFix(config) {
    return withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults;

        // Ensure the tools namespace is declared
        if (!androidManifest.manifest.$['xmlns:tools']) {
            androidManifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
        }

        // Add tools:replace to the application element
        const application = androidManifest.manifest.application?.[0];
        if (application) {
            application.$['tools:replace'] = 'android:appComponentFactory';
        }

        return config;
    });
}

// Plugin to create the debug AndroidManifest.xml with the fix
function withDebugManifestFix(config) {
    return withDangerousMod(config, [
        'android',
        async (config) => {
            const projectRoot = config.modRequest.projectRoot;
            const debugManifestDir = path.join(projectRoot, 'android', 'app', 'src', 'debug');
            const debugManifestPath = path.join(debugManifestDir, 'AndroidManifest.xml');

            // Create debug directory if it doesn't exist
            if (!fs.existsSync(debugManifestDir)) {
                fs.mkdirSync(debugManifestDir, { recursive: true });
            }

            // Write the debug manifest with tools:replace
            const debugManifestContent = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <application
        tools:replace="android:appComponentFactory"
        android:usesCleartextTraffic="true">
    </application>
</manifest>
`;

            fs.writeFileSync(debugManifestPath, debugManifestContent);
            console.log('✅ Created debug AndroidManifest.xml with tools:replace fix');

            return config;
        }
    ]);
}

module.exports = function withAndroidXFix(config) {
    config = withAndroidXManifestFix(config);
    config = withDebugManifestFix(config);
    return config;
};
