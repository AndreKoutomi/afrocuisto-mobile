import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.afrocuisto.app',
    appName: 'AfroCuisto',
    webDir: 'dist',
    plugins: {
        StatusBar: {
            style: 'DARK',
            backgroundColor: '#f3f4f6', // Vous pouvez ajuster cette couleur si besoin
            overlaysWebView: false,  // Empêche la barre de se superposer au contenu web
        },
    },
};

export default config;
