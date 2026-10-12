import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, useColorScheme } from 'react-native';
import { AppData, ClassItem, Settings, Task, defaultData, ymd } from './logic';
import { rescheduleAll } from './notifications';
import { playDone } from './sound';
import { loadData, saveData } from './storage';

export interface Theme {
  dark: boolean;
  bg: string;
  card: string;
  text: string;
  sub: string;
  border: string;
  primary: string;
  onPrimary: string;
  danger: string;
  success: string;
  warn: string;
  chip: string;
}

const LIGHT: Theme = { dark: false, bg: '#F5F6FA', card: '#FFFFFF', text: '#111827', sub: '#6B7280', border: '#E5E7EB', primary: '#4F46E5', onPrimary: '#FFFFFF', danger: '#DC2626', success: '#16A34A', warn: '#D97706', chip: '#E8EAF2' };
const DARK: Theme = { dark: true, bg: '#0B0F1A', card: '#151B2B', text: '#F3F4F6', sub: '#9CA3AF', border: '#273045', primary: '#818CF8', onPrimary: '#0B0F1A', danger: '#F87171', success: '#4ADE80', warn: '#FBBF24', chip: '#222B40' };

interface Store {
  ready: boolean;
  data: AppData;
  now: Date;
  theme: Theme;
  celebrateKey: number;
  scheduledCount: number;
  addClass: (c: ClassItem) => void;
  updateClass: (c: ClassItem) => void;
  deleteClass: (id: string) => void;
  addTask: (t: Task) => void;
  updateTask: (t: Task) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  replaceAll: (d: AppData) => void;
}

const Ctx = createContext<Store | null>(null);

export function useApp(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp خارج از StoreProvider');
  return v;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<AppData>(defaultData());
  const [now, setNow] = useState(new Date());
  const [celebrateKey, setCelebrateKey] = useState(0);
  const [scheduledCount, setScheduledCount] = useState(0);
  const ref = useRef<AppData>(data);
  const scheme = useColorScheme();

  const commit = useCallback((next: AppData) => {
    ref.current = next;
    setData(next);
    saveData(next).catch(() => undefined);
  }, []);

  // بارگذاری اولیه
  useEffect(() => {
    loadData().then((d) => {
      ref.current = d;
      setData(d);
      setReady(true);
    });
  }, []);

  // ساعت زنده + تازه‌سازی با بازگشت به اپ
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        setNow(new Date());
        rescheduleAll(ref.current).then(setScheduledCount).catch(() => undefined);
      }
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);

  // زمان‌بندی مجدد اعلان‌ها فقط وقتی برنامه کلاس‌ها یا تنظیمات اعلان تغییر کند
  const notifKey = useMemo(
    () => JSON.stringify([data.classes.map((c) => [c.day, c.start, c.end, c.name, c.place]), data.settings.notifEnabled, data.settings.notifTime, data.settings.notifDays]),
    [data.classes, data.settings.notifEnabled, data.settings.notifTime, data.settings.notifDays],
  );
  useEffect(() => {
    if (!ready) return;
    const id = setTimeout(() => {
      rescheduleAll(ref.current).then(setScheduledCount).catch(() => undefined);
    }, 300);
    return () => clearTimeout(id);
  }, [ready, notifKey]);

  const actions = useMemo(() => {
    const cur = () => ref.current;
    return {
      addClass: (c: ClassItem) => commit({ ...cur(), classes: [...cur().classes, c] }),
      updateClass: (c: ClassItem) => commit({ ...cur(), classes: cur().classes.map((x) => (x.id === c.id ? c : x)) }),
      deleteClass: (id: string) => commit({ ...cur(), classes: cur().classes.filter((x) => x.id !== id) }),
      addTask: (t: Task) => commit({ ...cur(), tasks: [...cur().tasks, t] }),
      updateTask: (t: Task) => commit({ ...cur(), tasks: cur().tasks.map((x) => (x.id === t.id ? t : x)) }),
      deleteTask: (id: string) => commit({ ...cur(), tasks: cur().tasks.filter((x) => x.id !== id) }),
      toggleTask: (id: string) => {
        const before = cur();
        const task = before.tasks.find((x) => x.id === id);
        if (!task) return;
        const tasks = before.tasks.map((x) => (x.id === id ? { ...x, done: !x.done } : x));
        commit({ ...before, tasks });
        // جشن فقط هنگام «انجام دادن» آخرین کار باقی‌مانده‌ی امروز (تغییر واقعی وضعیت)
        if (!task.done && task.date === ymd(new Date())) {
          const day = tasks.filter((x) => x.date === task.date);
          if (day.length > 0 && day.every((x) => x.done)) {
            if (before.settings.soundOn) playDone();
            setCelebrateKey((k) => k + 1);
          }
        }
      },
      updateSettings: (patch: Partial<Settings>) => commit({ ...cur(), settings: { ...cur().settings, ...patch } }),
      replaceAll: (d: AppData) => commit(d),
    };
  }, [commit]);

  const mode = data.settings.theme === 'system' ? scheme : data.settings.theme;
  const theme = mode === 'dark' ? DARK : LIGHT;

  const value: Store = { ready, data, now, theme, celebrateKey, scheduledCount, ...actions };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
