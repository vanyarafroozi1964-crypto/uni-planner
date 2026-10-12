import React, { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import {
  ClassItem, DAY_NAMES, PALETTE, PRIORITY_LABEL, Priority, Task, addDays, dayIndexOf, findConflicts,
  formatJalali, normalizeTime, toFa, toMin, uid,
} from './logic';
import { useApp } from './store';
import { Btn, Chip, Field, ROW, Sheet, Txt } from './ui';

const TIME_HINT = 'مثلاً ۰۸:۳۰ یا ۸۳۰';

export function ClassForm({ visible, initial, defaultDay, onClose }: { visible: boolean; initial: ClassItem | null; defaultDay: number; onClose: () => void }) {
  const { data, addClass, updateClass, deleteClass } = useApp();
  const [name, setName] = useState('');
  const [day, setDay] = useState(0);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [teacher, setTeacher] = useState('');
  const [place, setPlace] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  const [touched, setTouched] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible) return;
    setErr({});
    setTouched(!!initial);
    if (initial) {
      setName(initial.name); setDay(initial.day); setStart(toFa(initial.start)); setEnd(toFa(initial.end));
      setTeacher(initial.teacher ?? ''); setPlace(initial.place ?? ''); setColor(initial.color);
    } else {
      const free = PALETTE.find((p) => !data.classes.some((c) => c.color === p));
      setName(''); setDay(defaultDay); setStart(''); setEnd(''); setTeacher(''); setPlace('');
      setColor(free ?? PALETTE[data.classes.length % PALETTE.length]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initial]);

  const onName = (v: string) => {
    setName(v);
    if (!touched) {
      const same = data.classes.find((c) => c.name.trim() === v.trim() && v.trim());
      if (same) setColor(same.color);
    }
  };

  const save = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'نام درس را وارد کن';
    const s = normalizeTime(start);
    const en = normalizeTime(end);
    if (!s) e.start = `ساعت شروع نامعتبر است (${TIME_HINT})`;
    if (!en) e.end = `ساعت پایان نامعتبر است (${TIME_HINT})`;
    if (s && en && toMin(en) <= toMin(s)) e.end = 'ساعت پایان باید بعد از شروع باشد';
    setErr(e);
    if (Object.keys(e).length) return;
    const item: ClassItem = {
      id: initial?.id ?? uid(), name: name.trim(), day, start: s!, end: en!,
      teacher: teacher.trim() || undefined, place: place.trim() || undefined, color,
    };
    const doSave = () => { initial ? updateClass(item) : addClass(item); onClose(); };
    const conf = findConflicts(data.classes, item);
    if (conf.length) {
      Alert.alert('تداخل زمانی', `این کلاس در همین روز با «${conf.map((c) => c.name).join('، ')}» تداخل دارد. باز هم ذخیره شود؟`, [
        { text: 'بازگشت', style: 'cancel' },
        { text: 'ذخیره با تداخل', onPress: doSave },
      ]);
    } else doSave();
  };

  const remove = () =>
    Alert.alert('حذف کلاس', `«${initial?.name}» حذف شود؟`, [
      { text: 'انصراف', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => { deleteClass(initial!.id); onClose(); } },
    ]);

  return (
    <Sheet visible={visible} onClose={onClose} title={initial ? 'ویرایش کلاس' : 'افزودن کلاس'}>
      <Field label="نام درس" value={name} onChangeText={onName} error={err.name} placeholder="مثلاً ریاضی ۲" />
      <Txt size={13} sub style={{ marginBottom: 6 }}>روز</Txt>
      <View style={{ flexDirection: ROW, flexWrap: 'wrap' }}>
        {DAY_NAMES.map((d, i) => <Chip key={d} label={d} selected={day === i} onPress={() => setDay(i)} />)}
      </View>
      <View style={{ flexDirection: ROW, marginTop: 4 }}>
        <View style={{ flex: 1, marginEnd: 8 }}>
          <Field label="شروع" value={start} onChangeText={setStart} error={err.start} keyboardType="numbers-and-punctuation" placeholder="۰۸:۰۰" />
        </View>
        <View style={{ flex: 1, marginStart: 8 }}>
          <Field label="پایان" value={end} onChangeText={setEnd} error={err.end} keyboardType="numbers-and-punctuation" placeholder="۰۹:۳۰" />
        </View>
      </View>
      <Field label="استاد (اختیاری)" value={teacher} onChangeText={setTeacher} />
      <Field label="مکان (اختیاری)" value={place} onChangeText={setPlace} placeholder="مثلاً کلاس ۲۰۱" />
      <Txt size={13} sub style={{ marginBottom: 8 }}>رنگ</Txt>
      <View style={{ flexDirection: ROW, flexWrap: 'wrap', marginBottom: 16 }}>
        {PALETTE.map((p) => (
          <Pressable key={p} onPress={() => { setColor(p); setTouched(true); }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: p, marginEnd: 10, marginBottom: 10, borderWidth: color === p ? 4 : 0, borderColor: '#FFFFFF88', alignItems: 'center', justifyContent: 'center' }}>
            {color === p ? <Txt bold color="#FFFFFF" style={{ textAlign: 'center' }}>✓</Txt> : null}
          </Pressable>
        ))}
      </View>
      <Btn label="ذخیره" onPress={save} />
      {initial ? <Btn label="حذف کلاس" kind="danger" onPress={remove} style={{ marginTop: 10 }} /> : null}
    </Sheet>
  );
}

export function TaskForm({ visible, initial, defaultDate, onClose }: { visible: boolean; initial: Task | null; defaultDate: string; onClose: () => void }) {
  const { addTask, updateTask, deleteTask } = useApp();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [priority, setPriority] = useState<Priority>('medium');
  const [deadline, setDeadline] = useState('');
  const [err, setErr] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible) return;
    setErr({});
    setTitle(initial?.title ?? '');
    setDate(initial?.date ?? defaultDate);
    setPriority(initial?.priority ?? 'medium');
    setDeadline(initial?.deadline ? toFa(initial.deadline) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initial]);

  const save = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'عنوان کار را وارد کن';
    let dl: string | undefined;
    if (deadline.trim()) {
      const n = normalizeTime(deadline);
      if (!n) e.deadline = `ساعت نامعتبر است (${TIME_HINT})`;
      else dl = n;
    }
    setErr(e);
    if (Object.keys(e).length) return;
    const t: Task = { id: initial?.id ?? uid(), date, title: title.trim(), priority, deadline: dl, done: initial?.done ?? false };
    initial ? updateTask(t) : addTask(t);
    onClose();
  };

  const remove = () =>
    Alert.alert('حذف کار', `«${initial?.title}» حذف شود؟`, [
      { text: 'انصراف', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => { deleteTask(initial!.id); onClose(); } },
    ]);

  return (
    <Sheet visible={visible} onClose={onClose} title={initial ? 'ویرایش کار' : 'افزودن کار'}>
      <Field label="عنوان" value={title} onChangeText={setTitle} error={err.title} placeholder="مثلاً تمرین فیزیک" />
      <Txt size={13} sub style={{ marginBottom: 6 }}>تاریخ</Txt>
      <View style={{ flexDirection: ROW, alignItems: 'center', marginBottom: 12 }}>
        <Btn small kind="ghost" label="›" onPress={() => setDate(addDays(date, -1))} />
        <Txt bold style={{ flex: 1, textAlign: 'center' }}>{DAY_NAMES[dayIndexOf(date)]}، {formatJalali(date)}</Txt>
        <Btn small kind="ghost" label="‹" onPress={() => setDate(addDays(date, 1))} />
      </View>
      <Txt size={13} sub style={{ marginBottom: 6 }}>اولویت</Txt>
      <View style={{ flexDirection: ROW, flexWrap: 'wrap' }}>
        {(['high', 'medium', 'low'] as Priority[]).map((p) => <Chip key={p} label={PRIORITY_LABEL[p]} selected={priority === p} onPress={() => setPriority(p)} />)}
      </View>
      <Field label="مهلت — ساعت (اختیاری)" value={deadline} onChangeText={setDeadline} error={err.deadline} keyboardType="numbers-and-punctuation" placeholder="خالی = بدون مهلت" />
      <Btn label="ذخیره" onPress={save} />
      {initial ? <Btn label="حذف کار" kind="danger" onPress={remove} style={{ marginTop: 10 }} /> : null}
    </Sheet>
  );
}
