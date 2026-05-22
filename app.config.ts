import type { ConfigContext, ExpoConfig } from 'expo/config';

declare const require: <T = unknown>(path: string) => T;

type GoogleMobileAdsPluginConfig = {
  androidAppId: string;
  delayAppMeasurementInit: boolean;
  iosAppId: string;
  userTrackingUsageDescription: string;
};

type ExpoPlugin = NonNullable<ExpoConfig['plugins']>[number];
type AppJsonModule = { expo: ExpoConfig };

const appJson = require<AppJsonModule>('./app.json');

const GOOGLE_SAMPLE_ADMOB_PUBLISHER_ID = '3940256099942544';
const REAL_ADS_ENABLED_ENV_KEY = 'EXPO_PUBLIC_REAL_ADS_ENABLED';

export const GOOGLE_SAMPLE_ADMOB_APP_IDS = {
  android: 'ca-app-pub-3940256099942544~3347511713',
  ios: 'ca-app-pub-3940256099942544~1458002511',
} as const;

export const REAL_ADMOB_APP_ID_ENV_KEYS = {
  android: 'EXPO_PUBLIC_ADMOB_ANDROID_APP_ID',
  ios: 'EXPO_PUBLIC_ADMOB_IOS_APP_ID',
} as const;

export const ADMOB_APP_ID_PATTERN = /^ca-app-pub-\d{16}~\d{10}$/;

function readBooleanFlag(value: string | undefined, defaultValue: boolean): boolean {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return defaultValue;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return defaultValue;
}

function readEnvString(key: string, env: NodeJS.ProcessEnv): string | undefined {
  const value = env[key]?.trim();
  return value ? value : undefined;
}

function assertRealAdMobAppId(
  platform: keyof typeof REAL_ADMOB_APP_ID_ENV_KEYS,
  env: NodeJS.ProcessEnv,
): string {
  const envKey = REAL_ADMOB_APP_ID_ENV_KEYS[platform];
  const value = readEnvString(envKey, env);

  if (!value) {
    throw new Error(`${REAL_ADS_ENABLED_ENV_KEY}=true requires ${envKey}`);
  }

  if (!ADMOB_APP_ID_PATTERN.test(value)) {
    throw new Error(`${envKey} must be a Google Mobile Ads app id`);
  }

  if (
    value === GOOGLE_SAMPLE_ADMOB_APP_IDS[platform] ||
    value.includes(GOOGLE_SAMPLE_ADMOB_PUBLISHER_ID)
  ) {
    throw new Error(`${envKey} must not use Google's sample AdMob publisher id`);
  }

  return value;
}

export function resolveGoogleMobileAdsAppIds(env: NodeJS.ProcessEnv = process.env) {
  const realAdsEnabled = readBooleanFlag(env[REAL_ADS_ENABLED_ENV_KEY], false);

  if (!realAdsEnabled) {
    return {
      androidAppId: GOOGLE_SAMPLE_ADMOB_APP_IDS.android,
      iosAppId: GOOGLE_SAMPLE_ADMOB_APP_IDS.ios,
      realAdsEnabled,
    };
  }

  return {
    androidAppId: assertRealAdMobAppId('android', env),
    iosAppId: assertRealAdMobAppId('ios', env),
    realAdsEnabled,
  };
}

function isGoogleMobileAdsPlugin(
  plugin: ExpoPlugin,
): plugin is [string, GoogleMobileAdsPluginConfig] {
  return (
    Array.isArray(plugin) &&
    plugin[0] === 'react-native-google-mobile-ads' &&
    typeof plugin[1] === 'object' &&
    plugin[1] !== null
  );
}

function configureGoogleMobileAdsPlugin(plugin: ExpoPlugin): ExpoPlugin {
  if (!isGoogleMobileAdsPlugin(plugin)) return plugin;

  const appIds = resolveGoogleMobileAdsAppIds();

  return [
    plugin[0],
    {
      ...plugin[1],
      androidAppId: appIds.androidAppId,
      iosAppId: appIds.iosAppId,
    },
  ];
}

export default function getExpoConfig(context?: ConfigContext): ExpoConfig {
  const baseConfig: ExpoConfig = {
    ...appJson.expo,
    ...(context?.config ?? {}),
  };

  return {
    ...baseConfig,
    plugins: baseConfig.plugins?.map(configureGoogleMobileAdsPlugin),
  };
}
