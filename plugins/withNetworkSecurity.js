const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = ({ config }) => {
    return withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults.manifest;

        // Add network security config to application tag
        if (androidManifest.application && androidManifest.application[0]) {
            androidManifest.application[0].$['android:networkSecurityConfig'] = '@xml/network_security_config';
            androidManifest.application[0].$['android:usesCleartextTraffic'] = 'true';
        }

        return config;
    });
};
