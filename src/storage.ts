import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData, defaultData, sanitizeData } from './logic';

const KEY = 'uniplanner:data:v1';

export async function loadData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return defaultData();
    return sanitizeData(JSON.parse(raw)) ?? defaultData();
  } catch {
    return defaultData();
  }
}

export async function saveData(data: AppData): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}
