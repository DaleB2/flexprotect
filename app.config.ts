import 'dotenv/config';

export default {
  expo: {
    name: "Flex ID Guard",
    slug: "flex-id-guard",
    scheme: "flexidguard",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: { image: "./assets/icon.png", resizeMode: "contain", backgroundColor: "#ffffff" },
    ios: { supportsTablet: true },
    android: { adaptiveIcon: { foregroundImage: "./assets/icon.png", backgroundColor: "#ffffff" } },
    web: { bundler: "metro" },
    plugins: [],
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      appUrl: process.env.EXPO_PUBLIC_APP_URL,
      hibpApiKey: process.env.EXPO_PUBLIC_HIBP_API_KEY,
      hibpUserAgent: process.env.EXPO_PUBLIC_HIBP_USER_AGENT,
    }
  }
};
