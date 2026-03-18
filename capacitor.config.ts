import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.afrocuisto.app',
    appName: 'AfroCuisto',
    webDir: 'dist',
    plugins: {
        StatusBar: {
            style: 'DARK',          // DARK = icônes noires → visibles sur fond blanc
            backgroundColor: '#00000000', // Status bar transparente depuis le tout début !
            overlaysWebView: true,  // La barre superpose le contenu web dès le chargement natif
        },
    },
};

export default config;
