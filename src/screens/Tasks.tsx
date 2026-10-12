import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { TaskRow } from '../components';
import { TaskForm } from '../forms';
import { DAY_NAMES, Task, addDays, dayIndexOf, formatJalali, progress, sortTasks, toFa, ymd } from '../logic';
import { useApp } from '../store';
import { Btn, Card, ProgressBar, ROW, Txt } from '../ui';

export default function Tasks() {
  const { data, now, theme, toggleTask } = useApp();
  const today = ymd(now);
  const [date, setDate] = useState(today);
  const [editing, setEditing] = useState<Task | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const all = data.tasks.filter((t) => t.date === date);
  const todo = sortTasks(all.filter((t) => !t.done));
  const done = sortTasks(all.filter((t) => t.done));
  const pr = progress(all);
  const rel = date === today ? 'امروز' : date === addDays(today, 1) ? 'فردا' : date === addDays(today, -1) ? 'دیروز' : '';

  const open = (t: Task | null) => { setEditing(t); setFormOpen(true); };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View style={{ flexDirection: ROW, alignItems: 'center', marginBottom: 12 }}>
          <Txt size={24} bold style={{ flex: 1 }}>کارهای روزانه</Txt>
          <Btn small label="＋ کار" onPress={() => open(null)} />
        </View>

        <View style={{ flexDirection: ROW, alignItems: 'center', marginBottom: 12 }}>
          <Btn small kind="ghost" label="›" onPress={() => setDate(addDays(date, -1))} />
          <View style={{ flex: 1 }}>
            <Txt bold size={16} style={{ textAlign: 'center' }}>{rel ? `${rel} — ` : ''}{DAY_NAMES[dayIndexOf(date)]}</Txt>
            <Txt sub size={13} style={{ textAlign: 'center' }}>{formatJalali(date)}</Txt>
          </View>
          <Btn small kind="ghost" label="‹" onPress={() => setDate(addDays(date, 1))} />
        </View>
        {date !== today ? <Btn small kind="ghost" label="برگشت به امروز" onPress={() => setDate(today)} style={{ marginBottom: 12 }} /> : null}

        <Card>
          <View style={{ flexDirection: ROW, alignItems: 'baseline', marginBottom: 8 }}>
            <Txt size={24} bold color={theme.success}>{toFa(pr.percent)}٪</Txt>
            <Txt sub style={{ marginStart: 10 }}>{pr.total ? `${toFa(pr.done)} انجام‌شده · ${toFa(pr.total - pr.done)} باقی‌مانده` : 'کاری ثبت نشده'}</Txt>
          </View>
          <ProgressBar percent={pr.percent} />
        </Card>

        {todo.length ? <Txt bold size={15} style={{ marginBottom: 8 }}>باقی‌مانده</Txt> : null}
        {todo.map((t) => <TaskRow key={t.id} task={t} onToggle={() => toggleTask(t.id)} onPress={() => open(t)} />)}
        {done.length ? <Txt bold size={15} sub style={{ marginBottom: 8, marginTop: 8 }}>انجام‌شده</Txt> : null}
        {done.map((t) => <TaskRow key={t.id} task={t} onToggle={() => toggleTask(t.id)} onPress={() => open(t)} />)}
        {!all.length ? <Txt sub style={{ textAlign: 'center', marginTop: 24 }}>برای این روز کاری ثبت نشده. با «＋ کار» اضافه کن.</Txt> : null}
      </ScrollView>
      <TaskForm visible={formOpen} initial={editing} defaultDate={date} onClose={() => setFormOpen(false)} />
    </View>
  );
}
