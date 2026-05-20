import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.giahienhn.prepetualapp',
  appName: 'Prepetual',
  webDir: 'dist/public',
  server: {
    url: 'http://192.168.1.11:5000', // e.g., http://192.168.1.15:5000
    cleartext: true
  },
  plugins: {
    CapacitorCookies: {
      enabled: true,
    },
  }
};

export default config;
