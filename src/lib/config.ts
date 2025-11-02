import Constants from "expo-constants";
const extra = Constants.expoConfig?.extra as any;

export const SUPABASE_URL = extra?.supabaseUrl as string;
export const SUPABASE_ANON_KEY = extra?.supabaseAnonKey as string;
export const APP_URL = extra?.appUrl as string;
export const HIBP_API_KEY = extra?.hibpApiKey as string | undefined;
export const HIBP_USER_AGENT = extra?.hibpUserAgent as string | undefined;
