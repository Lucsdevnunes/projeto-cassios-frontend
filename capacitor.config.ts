import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cassios.clima',
  appName: 'Cassios Clima',
  webDir: 'out',
  server: {
    androidScheme: 'http',
    cleartext: true,
    allowNavigation: ['192.168.137.1:3001']
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
