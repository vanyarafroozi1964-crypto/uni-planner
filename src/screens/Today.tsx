import React from 'react';
import { ScrollView, View } from 'react-native';
import { ClassRow, TaskRow } from '../components';
import { DAY_NAMES, classesOfDay, dayIndex, formatDuration, formatJalali, nextClass, progress, sortTasks, toFa, toMin, ymd } from '../logic';
import { useApp } from '../store';
import { Btn, Card, ProgressBar, ROW, Txt } from '../ui';
import type { Tab } from '../../App';

function greeting(h: number): string {
  if (h < 5) return 'شب بخیر 🌙';
  if (h < 12) return 'صبح بخیر ☀️';
  if (h < 17) return 'ظهر بخیر 🌤';
  if (h < 21) return 'عصر بخیر 🌇';
  return 'شب بخیر 🌙';
}

export default function Today({ go }: { go: (t: Tab) => void }) {
  const { data, now, theme, toggleTask } = useApp();
  const today = ymd(now);
  const di = dayIndex(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const todays = classesOfDay(data.classes, di);
  const next = nextClass(data.classes, now);
  const tasks = sortTasks(data.tasks.filter((t) => t.date === today));
  const pr = progress(tasks);

  let when = '';
  if (next) {
    if (next.ongoing) when = `در حال برگزاری — ${formatDuration(toMin(next.item.end) - nowMin)} تا پایان`;
    else if (next.offsetDays === 0) when = `${formatDuration(next.minutesUntil)} دیگر شروع می‌شود`;
    else if (next.offsetDays === 1) when = `فردا، ساعت ${toFa(next.item.start)}`;
    else when = `${DAY_NAMES[(di + next.offsetDays) % 7]}، ساعت ${toFa(next.item.start)}`;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Txt size={24} bold>{greeting(now.getHours())}</Txt>
      <Txt sub style={{ marginBottom: 16, marginTop: 2 }}>{DAY_NAMES[di]}، {formatJalali(today)}</Txt>

      <Card style={{ borderColor: theme.primary, borderWidth: 1.5 }}>
        <Txt size={13} bold color={theme.primary}>{next?.ongoing ? 'کلاس فعلی' : 'کلاس بعدی'}</Txt>
        {next ? (
          <View style={{ flexDirection: ROW, alignItems: 'stretch', marginTop: 8 }}>
            <View style={{ width: 6, borderRadius: 3, backgroundColor: next.item.color }} />
            <View style={{ flex: 1, marginHorizontal: 10 }}>
              <Txt size={19} bold>{next.item.name}</Txt>
              <Txt sub style={{ marginTop: 2 }}>{toFa(next.item.start)} تا {toFa(next.item.end)}{next.item.place ? ` · ${next.item.place}` : ''}</Txt>
              <Txt color={theme.primary} bold size={14} style={{ marginTop: 6 }}>{when}</Txt>
            </View>
          </View>
        ) : (
          <View style={{ marginTop: 8 }}>
            <Txt sub style={{ marginBottom: 10 }}>هنوز کلاسی در برنامه ثبت نشده.</Txt>
            <Btn small label="افزودن کلاس" onPress={() => go('week')} />
          </View>
        )}
      </Card>

      <Txt bold size={16} style={{ marginBottom: 8, marginTop: 4 }}>کلاس‌های امروز</Txt>
      {todays.length ? todays.map((c) => <ClassRow key={c.id} item={c} />) : <Card><Txt sub>امروز کلاس نداری 🎉</Txt></Card>}

      <View style={{ flexDirection: ROW, alignItems: 'center', marginTop: 8, marginBottom: 8 }}>
        <Txt bold size={16} style={{ flex: 1 }}>پیشرفت امروز</Txt>
        <Btn small kind="ghost" label="همه کارها" onPress={() => go('tasks')} />
      </View>
      <Card>
        {pr.total ? (
          <>
            <View style={{ flexDirection: ROW, alignItems: 'baseline', marginBottom: 8 }}>
              <Txt size={26} bold color={theme.success}>{toFa(pr.percent)}٪</Txt>
              <Txt sub style={{ marginStart: 10 }}>{toFa(pr.done)} از {toFa(pr.total)} کار انجام شد</Txt>
            </View>
            <ProgressBar percent={pr.percent} />
          </>
        ) : (
          <>
            <Txt sub style={{ marginBottom: 10 }}>برای امروز کاری ثبت نشده.</Txt>
            <Btn small label="افزودن کار" onPress={() => go('tasks')} />
          </>
        )}
      </Card>
      {tasks.slice(0, 5).map((t) => <TaskRow key={t.id} task={t} onToggle={() => toggleTask(t.id)} onPress={() => go('tasks')} />)}
    </ScrollView>
  );
}
