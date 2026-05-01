import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@zoomi_session_device_id';

let cachedDeviceId: string | null = null;

export async function getOrCreateDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (stored) {
    cachedDeviceId = stored;
    return stored;
  }

  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  const newId = `device-${timestamp}-${random}`;

  await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
  cachedDeviceId = newId;
  return newId;
}
