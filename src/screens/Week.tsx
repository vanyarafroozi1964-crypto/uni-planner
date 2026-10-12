import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ClassRow } from '../components';
import { ClassForm } from '../forms';
import { ClassItem, DAY_NAMES, DAY_SHORT, classesOfDay, conflictIds, dayIndex, toFa } from '../logic';
import { useApp } from '../store';
import { Btn, Card, Chip, ROW, Txt } from '../ui';

export default function Week() {
  const { data, now, theme } = useApp();
  const [mode, setMode] = useState<'day' | 'week'>('day');
  const [sel, setSel] = useState(dayIndex(now));
  const [editing, setEditing] = useState<ClassItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const conflicts = useMemo(() => conflictIds(data.classes), [data.classes]);

  const open = (c: ClassItem | null) => { setEditing(c); setFormOpen(true); };

  const renderDay = (d: number) => {
    const list = classesOfDay(data.classes, d);
    return list.length ? (
      list.map((c) => <ClassRow key={c.id} item={c} conflict={conflicts.has(c.id)} onPress={() => open(c)} />)
    ) : (
      <Card><Txt sub>کلاسی ثبت نشده.</Txt></Card>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View style={{ flexDirection: ROW, alignItems: 'center', marginBottom: 12 }}>
          <Txt size={24} bold style={{ flex: 1 }}>برنامه هفتگی</Txt>
          <Btn small label="＋ کلاس" onPress={() => open(null)} />
        </View>
        <View style={{ flexDirection: ROW, marginBottom: 4 }}>
          <Chip label="روزانه" selected={mode === 'day'} onPress={() => setMode('day')} />
          <Chip label="کل هفته" selected={mode === 'week'} onPress={() => setMode('week')} />
        </View>

        {mode === 'day' ? (
          <>
            <View style={{ flexDirection: ROW, marginBottom: 12 }}>
              {DAY_SHORT.map((s, i) => {
                const count = data.classes.filter((c) => c.day === i).length;
                const on = sel === i;
                return (
                  <View key={s} style={{ flex: 1, alignItems: 'center' }}>
                    <Btn small kind={on ? 'primary' : 'ghost'} label={s} onPress={() => setSel(i)} style={{ width: 40, paddingHorizontal: 0 }} />
                    <Txt size={11} sub style={{ textAlign: 'center', marginTop: 4 }}>{count ? toFa(count) : '·'}</Txt>
                  </View>
                );
              })}
            </View>
            <Txt bold size={16} style={{ marginBottom: 8 }}>{DAY_NAMES[sel]}</Txt>
            {renderDay(sel)}
          </>
        ) : (
          DAY_NAMES.map((n, i) => (
            <View key={n} style={{ marginBottom: 6 }}>
              <Txt bold size={16} color={i === dayIndex(now) ? theme.primary : theme.text} style={{ marginBottom: 8, marginTop: 8 }}>
                {n}{i === dayIndex(now) ? ' (امروز)' : ''}
              </Txt>
              {renderDay(i)}
            </View>
          ))
        )}
      </ScrollView>
      <ClassForm visible={formOpen} initial={editing} defaultDay={mode === 'day' ? sel : dayIndex(now)} onClose={() => setFormOpen(false)} />
    </View>
  );
}
