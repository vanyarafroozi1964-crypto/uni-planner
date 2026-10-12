import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { AppData, buildNotification, expoWeekday, toMin } from './logic';

export const CHANNEL_ID = 'morning-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'یادآوری صبحگاهی کلاس‌ها',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 200, 250],
    lightColor: '#4F46E5',
  });
}

export async function getPermission(): Promise<{ granted: boolean; canAskAgain: boolean }> {
  const p = await Notifications.getPermissionsAsync();
  return { granted: p.granted, canAskAgain: p.canAskAgain };
}

/** در اندروید ۱۳+ باید کانال ساخته شده باشد تا پنجره مجوز نمایش داده شود */
export async function requestPermission(): Promise<boolean> {
  await ensureChannel();
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  const res = await Notifications.requestPermissionsAsync();
  return res.granted;
}

// جلوگیری از اجرای هم‌زمان چند زمان‌بندی
let chain: Promise<unknown> = Promise.resolve();

/**
 * همه اعلان‌های زمان‌بندی‌شده را پاک و بر اساس برنامه فعلی دوباره می‌سازد.
 * اعلان‌ها هفتگی و محلی‌اند و بدون اینترنت و با بسته بودن اپ توسط سیستم‌عامل اجرا می‌شوند.
 * خروجی: تعداد اعلان زمان‌بندی‌شده.
 */
export function rescheduleAll(data: AppData): Promise<number> {
  const run = async (): Promise<number> => {
    await ensureChannel();
    await Notifications.cancelAllScheduledNotificationsAsync();
    const s = data.settings;
    if (!s.notifEnabled) return 0;
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return 0;
    const mins = toMin(s.notifTime);
    let count = 0;
    for (const day of s.notifDays) {
      const { title, body } = buildNotification(day, data.classes);
      await Notifications.scheduleNotificationAsync({
        content: { title, body, color: '#4F46E5' },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: expoWeekday(day),
          hour: Math.floor(mins / 60),
          minute: mins % 60,
          channelId: CHANNEL_ID,
        },
      });
      count++;
    }
    return count;
  };
  const p = chain.then(run, run);
  chain = p.catch(() => undefined);
  return p;
}

/** اعلان آزمایشی ۵ ثانیه بعد (با محتوای واقعی امروز) */
export async function sendTest(data: AppData, day: number): Promise<void> {
  await ensureChannel();
  const { title, body } = buildNotification(day, data.classes);
  await Notifications.scheduleNotificationAsync({
    content: { title, body, color: '#4F46E5' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: CHANNEL_ID },
  });
}
