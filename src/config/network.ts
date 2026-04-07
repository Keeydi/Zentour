import { Platform } from 'react-native';

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export function getApiBaseUrl(): string {
  const explicitUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (explicitUrl) {
    return stripTrailingSlash(explicitUrl);
  }

  // Default to local development endpoints.
  // Android emulator needs 10.0.2.2 to reach host machine.
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001';
  }

  return 'http://localhost:3001';
}

export function getWebSocketUrl(): string {
  const explicitWsUrl = process.env.EXPO_PUBLIC_WS_URL?.trim();
  if (explicitWsUrl) {
    return stripTrailingSlash(explicitWsUrl);
  }

  const apiBaseUrl = getApiBaseUrl();
  if (apiBaseUrl.startsWith('https://')) {
    return `wss://${apiBaseUrl.slice('https://'.length)}`;
  }
  if (apiBaseUrl.startsWith('http://')) {
    return `ws://${apiBaseUrl.slice('http://'.length)}`;
  }
  return apiBaseUrl;
}
