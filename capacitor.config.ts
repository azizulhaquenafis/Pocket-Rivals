import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "com.pocketrivals.games",
  appName: "Pocket Rivals",
  webDir: "dist",
  backgroundColor: "#f8f5eb",
  android: { backgroundColor: "#f8f5eb", allowMixedContent: false },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 500,
      backgroundColor: "#f8f5eb",
      showSpinner: false,
      androidScaleType: "CENTER_INSIDE",
    },
  },
};
export default config;
