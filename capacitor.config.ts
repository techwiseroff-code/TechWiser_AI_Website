import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.techwiser.aibuilder',
  appName: 'TechWiser AI Builder',
  webDir: 'out',

  // Point to your live deployed website
  server: {
    url: 'https://www.techwiser.in',
    androidScheme: "https",
    cleartext: true,
  },

  // Android-specific configuration
  android: {
    // Allow mixed content (HTTP within HTTPS) if needed
    allowMixedContent: true,
    // Use Chrome Custom Tabs for OAuth redirects
    captureInput: true,
    // Background color while loading
    backgroundColor: '#050505',
  },

  // Splash screen plugin configuration
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#050505',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#10b981',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#050505',
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
  },
};

export default config;
