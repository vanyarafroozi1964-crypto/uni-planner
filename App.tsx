import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Settings from './src/screens/Settings';
import Tasks from './src/screens/Tasks';
import Today from './src/screens/Today';
import Week from './src/screens/Week';
import { StoreProvider, useApp } from './src/store';
import { ROW, Txt } from './src/ui';

export type Tab = 'today' | 'week' | 'tasks' | 'settings';
const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'today', label: 'امروز', icon: '🏠' },
  { key: 'week', label: 'برنامه هفته', icon: '📅' },
  { key: 'tasks', label: 'کارها', icon: '✅' },
  { key: 'settings', label: 'تنظیمات', icon: '⚙️' },
];

function Celebration() {
  const { celebrateKey, theme } = useApp();
  const [show, setShow] = useState(false);
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!celebrateKey) return; // فقط با تکمیل واقعی همه کارها (نه با ورود به صفحه)
    setShow(true);
    scale.setValue(0.3);
    opacity.setValue(0);
    const anim = Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
      Animated.delay(2400),
      Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]);
    anim.start(({ finished }) => { if (finished) setShow(false); });
    return () => anim.stop();
  }, [celebrateKey, scale, opacity]);

  if (!show) return null;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity, backgroundColor: '#000A', alignItems: 'center', justifyContent: 'center' }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => setShow(false)} />
      <Animated.View pointerEvents="none" style={{ transform: [{ scale }], backgroundColor: theme.card, borderRadius: 24, padding: 28, marginHorizontal: 32, alignItems: 'center' }}>
        <Text style={{ fontSize: 72 }}>🎉</Text>
        <Txt size={20} bold style={{ textAlign: 'center', marginTop: 8 }}>آفرین! تمام برنامه امروزت رو انجام دادی</Txt>
      </Animated.View>
    </Animated.View>
  );
}

function Shell() {
  const { ready, theme } = useApp();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('today');

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (tab !== 'today') { setTab('today'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [tab]);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={theme.primary} /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <View style={{ flex: 1 }}>
        {tab === 'today' && <Today go={setTab} />}
        {tab === 'week' && <Week />}
        {tab === 'tasks' && <Tasks />}
        {tab === 'settings' && <Settings />}
      </View>
      <View style={{ flexDirection: ROW, backgroundColor: theme.card, borderTopWidth: 1, borderTopColor: theme.border, paddingBottom: insets.bottom }}>
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ fontSize: 20, opacity: on ? 1 : 0.55 }}>{t.icon}</Text>
              <Txt size={11} bold={on} color={on ? theme.primary : theme.sub} style={{ textAlign: 'center', marginTop: 2 }}>{t.label}</Txt>
            </Pressable>
          );
        })}
      </View>
      <Celebration />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
