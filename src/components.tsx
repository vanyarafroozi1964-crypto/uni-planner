import React from 'react';
import { Pressable, View } from 'react-native';
import { ClassItem, PRIORITY_LABEL, Task, toFa } from './logic';
import { useApp } from './store';
import { ROW, Txt } from './ui';

export function ClassRow({ item, conflict, onPress }: { item: ClassItem; conflict?: boolean; onPress?: () => void }) {
  const { theme } = useApp();
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: ROW, alignItems: 'stretch', backgroundColor: theme.card, borderRadius: 14, borderWidth: 1, borderColor: conflict ? theme.warn : theme.border, marginBottom: 10, overflow: 'hidden' }}
    >
      <View style={{ width: 6, backgroundColor: item.color }} />
      <View style={{ flex: 1, padding: 12 }}>
        <Txt bold size={16}>{item.name}</Txt>
        <Txt sub size={13} style={{ marginTop: 4 }}>{toFa(item.start)} تا {toFa(item.end)}</Txt>
        {item.teacher || item.place ? (
          <Txt sub size={13} style={{ marginTop: 2 }}>
            {[item.teacher, item.place].filter(Boolean).join(' · ')}
          </Txt>
        ) : null}
        {conflict ? <Txt size={12} bold color={theme.warn} style={{ marginTop: 4 }}>⚠ تداخل زمانی با کلاس دیگر</Txt> : null}
      </View>
    </Pressable>
  );
}

export function TaskRow({ task, onToggle, onPress }: { task: Task; onToggle: () => void; onPress?: () => void }) {
  const { theme } = useApp();
  const pc = task.priority === 'high' ? theme.danger : task.priority === 'medium' ? theme.warn : theme.success;
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: ROW, alignItems: 'center', backgroundColor: theme.card, borderRadius: 14, borderWidth: 1, borderColor: theme.border, padding: 12, marginBottom: 8 }}
    >
      <Pressable
        onPress={onToggle}
        hitSlop={10}
        style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: task.done ? theme.success : theme.sub, backgroundColor: task.done ? theme.success : 'transparent', alignItems: 'center', justifyContent: 'center' }}
      >
        {task.done ? <Txt size={16} bold color="#FFFFFF" style={{ textAlign: 'center' }}>✓</Txt> : null}
      </Pressable>
      <View style={{ flex: 1, marginHorizontal: 12 }}>
        <Txt size={16} sub={task.done} style={task.done ? { textDecorationLine: 'line-through' } : undefined}>{task.title}</Txt>
        <View style={{ flexDirection: ROW, alignItems: 'center', marginTop: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: pc, marginEnd: 6 }} />
          <Txt size={12} sub>اولویت {PRIORITY_LABEL[task.priority]}</Txt>
          {task.deadline ? <Txt size={12} sub style={{ marginStart: 12 }}>⏰ مهلت {toFa(task.deadline)}</Txt> : null}
        </View>
      </View>
    </Pressable>
  );
}
