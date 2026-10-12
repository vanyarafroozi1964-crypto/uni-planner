// منطق خالص برنامه (بدون وابستگی به React Native) تا مستقیماً قابل تست باشد.

export type Priority = 'high' | 'medium' | 'low';
export type ThemeMode = 'system' | 'light' | 'dark';

export interface ClassItem {
  id: string;
  name: string;
  day: number; // 0 = شنبه ... 6 = جمعه
  start: string; // HH:MM
  end: string; // HH:MM
  teacher?: string;
  place?: string;
  color: string;
}

export interface Task {
  id: string;
  date: string; // YYYY-MM-DD (میلادی، ذخیره‌سازی)
  title: string;
  priority: Priority;
  deadline?: string; // HH:MM اختیاری
  done: boolean;
}

export interface Settings {
  notifEnabled: boolean;
  notifTime: string;
  notifDays: number[];
  soundOn: boolean;
  theme: ThemeMode;
}

export interface AppData {
  version: 1;
  classes: ClassItem[];
  tasks: Task[];
  settings: Settings;
}

export const DAY_NAMES = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
export const DAY_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
export const PALETTE = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#14B8A6', '#F97316', '#64748B'];
export const PRIORITY_LABEL: Record<Priority, string> = { high: 'بالا', medium: 'متوسط', low: 'کم' };
const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
const JALALI_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

export const uid = (): string => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// ---------- ارقام و ساعت ----------
const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
export const toFa = (v: string | number): string => String(v).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

export function toEn(s: string): string {
  return s
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[٫.：]/g, ':');
}

const pad = (n: number): string => String(n).padStart(2, '0');

/** ورودی‌هایی مثل 8، 8:30، 830، ۰۸:۳۰ را به HH:MM تبدیل می‌کند؛ نامعتبر ⇒ null */
export function normalizeTime(input: string): string | null {
  const s = toEn(String(input)).trim();
  let h = 0;
  let m = 0;
  let mt = s.match(/^(\d{1,2}):(\d{1,2})$/);
  if (mt) {
    h = Number(mt[1]);
    m = Number(mt[2]);
  } else if ((mt = s.match(/^(\d{1,2})$/))) {
    h = Number(mt[1]);
  } else if ((mt = s.match(/^(\d{1,2})(\d{2})$/))) {
    h = Number(mt[1]);
    m = Number(mt[2]);
  } else return null;
  if (h > 23 || m > 59) return null;
  return `${pad(h)}:${pad(m)}`;
}

export const toMin = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export function formatDuration(min: number): string {
  if (min < 1) return 'کمتر از یک دقیقه';
  if (min < 60) return `${toFa(min)} دقیقه`;
  if (min < 1440) {
    const h = Math.floor(min / 60);
    const r = min % 60;
    return r ? `${toFa(h)} ساعت و ${toFa(r)} دقیقه` : `${toFa(h)} ساعت`;
  }
  return `${toFa(Math.floor(min / 1440))} روز`;
}

// ---------- تاریخ ----------
export const ymd = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseYmd = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};
export function addDays(s: string, n: number): string {
  const d = parseYmd(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
}
/** شنبه = 0 ... جمعه = 6 */
export const dayIndex = (d: Date): number => (d.getDay() + 1) % 7;
export const dayIndexOf = (s: string): number => dayIndex(parseYmd(s));

export function toJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 355666 + 365 * gy + Math.trunc((gy2 + 3) / 4) - Math.trunc((gy2 + 99) / 100) + Math.trunc((gy2 + 399) / 400) + gd + gdm[gm - 1];
  let jy = -1595 + 33 * Math.trunc(days / 12053);
  days %= 12053;
  jy += 4 * Math.trunc(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.trunc((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.trunc(days / 31) : 7 + Math.trunc((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return [jy, jm, jd];
}

export function formatJalali(s: string): string {
  const [y, m, d] = s.split('-').map(Number);
  const [jy, jm, jd] = toJalali(y, m, d);
  return `${toFa(jd)} ${JALALI_MONTHS[jm - 1]} ${toFa(jy)}`;
}

// ---------- کلاس‌ها ----------
export const sortClasses = (list: ClassItem[]): ClassItem[] =>
  [...list].sort((a, b) => toMin(a.start) - toMin(b.start) || toMin(a.end) - toMin(b.end));

export const classesOfDay = (classes: ClassItem[], day: number): ClassItem[] => sortClasses(classes.filter((c) => c.day === day));

export const overlaps = (a: ClassItem, b: ClassItem): boolean =>
  a.day === b.day && toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);

export const findConflicts = (classes: ClassItem[], cand: ClassItem): ClassItem[] =>
  classes.filter((c) => c.id !== cand.id && overlaps(c, cand));

export function conflictIds(classes: ClassItem[]): Set<string> {
  const ids = new Set<string>();
  for (let i = 0; i < classes.length; i++)
    for (let j = i + 1; j < classes.length; j++)
      if (overlaps(classes[i], classes[j])) {
        ids.add(classes[i].id);
        ids.add(classes[j].id);
      }
  return ids;
}

export interface NextInfo {
  item: ClassItem;
  offsetDays: number;
  minutesUntil: number;
  ongoing: boolean;
}

export function nextClass(classes: ClassItem[], now: Date): NextInfo | null {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = dayIndex(now);
  for (let off = 0; off <= 7; off++) {
    for (const c of classesOfDay(classes, (today + off) % 7)) {
      const s = toMin(c.start);
      const e = toMin(c.end);
      if (off === 0) {
        if (nowMin >= s && nowMin < e) return { item: c, offsetDays: 0, minutesUntil: 0, ongoing: true };
        if (s > nowMin) return { item: c, offsetDays: 0, minutesUntil: s - nowMin, ongoing: false };
      } else {
        return { item: c, offsetDays: off, minutesUntil: off * 1440 - nowMin + s, ongoing: false };
      }
    }
  }
  return null;
}

// ---------- اعلان ----------
/** weekday در expo-notifications: یکشنبه = 1 ... شنبه = 7 */
export const expoWeekday = (day: number): number => (day === 0 ? 7 : day);

export function buildNotification(day: number, classes: ClassItem[]): { title: string; body: string } {
  const list = classesOfDay(classes, day);
  if (list.length === 0) return { title: 'امروز کلاس نداری 🎉', body: 'یک روز آزاد! کارهای روزانه‌ات رو مرور کن.' };
  const lines = list.map((c) => `${toFa(c.start)}–${toFa(c.end)}  ${c.name}${c.place ? ` · ${c.place}` : ''}`);
  return { title: `امروز ${toFa(list.length)} کلاس داری`, body: lines.join('\n') };
}

// ---------- وظایف ----------
export function sortTasks(list: Task[]): Task[] {
  return [...list].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (p) return p;
    const da = a.deadline ? toMin(a.deadline) : 9999;
    const db = b.deadline ? toMin(b.deadline) : 9999;
    return da - db;
  });
}

export function progress(tasks: Task[]): { done: number; total: number; percent: number } {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

// ---------- داده ----------
export const defaultSettings = (): Settings => ({
  notifEnabled: false,
  notifTime: '07:00',
  notifDays: [0, 1, 2, 3, 4],
  soundOn: true,
  theme: 'system',
});

export const defaultData = (): AppData => ({ version: 1, classes: [], tasks: [], settings: defaultSettings() });

const optStr = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 80) : undefined);

/** داده خام (مثلاً از فایل پشتیبان) را اعتبارسنجی و پاک‌سازی می‌کند. نامعتبر ⇒ null */
export function sanitizeData(raw: unknown): AppData | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, any>;
  if (!Array.isArray(r.classes) || !Array.isArray(r.tasks)) return null;
  const used = new Set<string>();
  const newId = (v: unknown): string => {
    let id = typeof v === 'string' && v && !used.has(v) ? v : uid();
    while (used.has(id)) id = uid();
    used.add(id);
    return id;
  };
  const classes: ClassItem[] = [];
  for (const c of r.classes) {
    if (!c || typeof c.name !== 'string' || !c.name.trim()) continue;
    const start = normalizeTime(c.start);
    const end = normalizeTime(c.end);
    const day = Number(c.day);
    if (!start || !end || !Number.isInteger(day) || day < 0 || day > 6 || toMin(end) <= toMin(start)) continue;
    classes.push({
      id: newId(c.id),
      name: c.name.trim().slice(0, 80),
      day,
      start,
      end,
      teacher: optStr(c.teacher),
      place: optStr(c.place),
      color: typeof c.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(c.color) ? c.color : PALETTE[0],
    });
  }
  const tasks: Task[] = [];
  for (const t of r.tasks) {
    if (!t || typeof t.title !== 'string' || !t.title.trim()) continue;
    if (typeof t.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(t.date)) continue;
    tasks.push({
      id: newId(t.id),
      date: t.date,
      title: t.title.trim().slice(0, 120),
      priority: t.priority === 'high' || t.priority === 'low' ? t.priority : 'medium',
      deadline: typeof t.deadline === 'string' ? normalizeTime(t.deadline) ?? undefined : undefined,
      done: t.done === true,
    });
  }
  const d = defaultSettings();
  const s = (r.settings && typeof r.settings === 'object' ? r.settings : {}) as Record<string, any>;
  const days: number[] = Array.isArray(s.notifDays)
    ? Array.from(new Set<number>(s.notifDays.map(Number).filter((n: number) => Number.isInteger(n) && n >= 0 && n <= 6))).sort()
    : d.notifDays;
  const settings: Settings = {
    notifEnabled: s.notifEnabled === true,
    notifTime: typeof s.notifTime === 'string' ? normalizeTime(s.notifTime) ?? d.notifTime : d.notifTime,
    notifDays: days,
    soundOn: s.soundOn !== false,
    theme: s.theme === 'light' || s.theme === 'dark' ? s.theme : 'system',
  };
  return { version: 1, classes, tasks, settings };
}
