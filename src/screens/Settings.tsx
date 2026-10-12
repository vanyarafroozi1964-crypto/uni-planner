import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, Share, Switch, View } from 'react-native';
import { DAY_NAMES, ThemeMode, normalizeTime, sanitizeData, dayIndex, toFa } from '../logic';
import { getPermission, requestPermission, sendTest } from '../notifications';
import { playDone } from '../sound';
import { useApp } from '../store';
import { Btn, Card, Chip, Field, ROW, Sheet, Txt } from '../ui';

function SwitchRow({ label, sub, value, onChange }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
  const { theme } = useApp();
  return (
    <View style={{ flexDirection: ROW, alignItems: 'center' }}>
      <View style={{ flex: 1 }}>
        <Txt bold>{label}</Txt>
        {sub ? <Txt size={12} sub style={{ marginTop: 2 }}>{sub}</Txt> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: theme.primary, false: theme.border }} thumbColor="#FFFFFF" />
    </View>
  );
}

export default function Settings() {
  const { data, now, scheduledCount, updateSettings, replaceAll } = useApp();
  const s = data.settings;
  const [timeText, setTimeText] = useState(toFa(s.notifTime));
  const [timeErr, setTimeErr] = useState('');
  const [granted, setGranted] = useState<boolean | null>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreText, setRestoreText] = useState('');
  const [restoreErr, setRestoreErr] = useState('');

  const refreshPerm = useCallback(() => { getPermission().then((p) => setGranted(p.granted)).catch(() => setGranted(false)); }, []);
  useEffect(refreshPerm, [refreshPerm]);

  const askPermission = async (): Promise<boolean> => {
    const ok = await requestPermission();
    setGranted(ok);
    if (!ok) {
      Alert.alert('مجوز اعلان لازم است', 'برای دریافت یادآوری، اجازه ارسال اعلان را در تنظیمات گوشی فعال کن.', [
        { text: 'بعداً', style: 'cancel' },
        { text: 'باز کردن تنظیمات', onPress: () => Linking.openSettings() },
      ]);
    }
    return ok;
  };

  const toggleNotif = async (v: boolean) => {
    if (v && !(await askPermission())) return;
    updateSettings({ notifEnabled: v });
  };

  const commitTime = () => {
    const n = normalizeTime(timeText);
    if (!n) { setTimeErr('ساعت نامعتبر است (مثلاً ۰۷:۰۰)'); return; }
    setTimeErr('');
    setTimeText(toFa(n));
    if (n !== s.notifTime) updateSettings({ notifTime: n });
  };

  const toggleDay = (d: number) => {
    const days = s.notifDays.includes(d) ? s.notifDays.filter((x) => x !== d) : [...s.notifDays, d].sort();
    updateSettings({ notifDays: days });
  };

  const test = async () => {
    if (!(await askPermission())) return;
    await sendTest(data, dayIndex(now));
    Alert.alert('اعلان آزمایشی', 'تا ۵ ثانیه دیگر یک اعلان با محتوای امروز می‌آید. می‌توانی اپ را ببندی.');
  };

  const backup = async () => {
    try {
      await Share.share({ title: 'پشتیبان برنامه من', message: JSON.stringify(data, null, 2) });
    } catch {
      Alert.alert('خطا', 'اشتراک‌گذاری پشتیبان انجام نشد.');
    }
  };

  const restore = () => {
    let parsed: unknown;
    try { parsed = JSON.parse(restoreText.trim()); } catch { setRestoreErr('متن واردشده JSON معتبر نیست.'); return; }
    const d = sanitizeData(parsed);
    if (!d) { setRestoreErr('ساختار پشتیبان نامعتبر است.'); return; }
    Alert.alert('بازیابی اطلاعات', `${toFa(d.classes.length)} کلاس و ${toFa(d.tasks.length)} کار بازیابی می‌شود و جایگزین همه اطلاعات فعلی خواهد شد. ادامه می‌دهی؟`, [
      { text: 'انصراف', style: 'cancel' },
      { text: 'بازیابی', style: 'destructive', onPress: () => { replaceAll(d); setTimeText(toFa(d.settings.notifTime)); setRestoreOpen(false); setRestoreText(''); setRestoreErr(''); } },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <Txt size={24} bold style={{ marginBottom: 12 }}>تنظیمات</Txt>

      <Card>
        <SwitchRow label="یادآوری صبحگاهی کلاس‌ها" sub="اعلان محلی؛ بدون نیاز به اینترنت" value={s.notifEnabled} onChange={toggleNotif} />
        <View style={{ height: 14 }} />
        <Field label="ساعت یادآوری" value={timeText} onChangeText={(v) => { setTimeText(v); setTimeErr(''); }} onEndEditing={commitTime} onBlur={commitTime} error={timeErr} keyboardType="numbers-and-punctuation" />
        <Txt size={13} sub style={{ marginBottom: 6 }}>روزهای فعال</Txt>
        <View style={{ flexDirection: ROW, flexWrap: 'wrap' }}>
          {DAY_NAMES.map((n, i) => <Chip key={n} label={n} selected={s.notifDays.includes(i)} onPress={() => toggleDay(i)} />)}
        </View>
        <Txt size={12} sub style={{ marginTop: 4 }}>
          {granted === false ? 'مجوز اعلان داده نشده است. ' : ''}
          {s.notifEnabled && granted ? `${toFa(scheduledCount)} اعلان هفتگی زمان‌بندی شده است.` : ''}
        </Txt>
        <View style={{ flexDirection: ROW, marginTop: 12 }}>
          {granted === false ? <Btn small label="درخواست مجوز" onPress={askPermission} style={{ marginEnd: 8 }} /> : null}
          <Btn small kind="ghost" label="ارسال اعلان آزمایشی" onPress={test} />
        </View>
        <Txt size={12} sub style={{ marginTop: 12, lineHeight: 20 }}>
          نکته: اعلان‌ها را خود اندروید اجرا می‌کند و با بسته بودن اپ هم کار می‌کنند، اما حالت‌های صرفه‌جویی باتری در برخی گوشی‌ها (مثل شیائومی، هوآوی، سامسونگ) می‌توانند اعلان را دیر کنند یا حذف کنند. اگر اعلان نیامد، «بهینه‌سازی باتری» را برای این اپ غیرفعال کن.
        </Txt>
      </Card>

      <Card>
        <SwitchRow label="صدای تکمیل کارها" sub="فقط وقتی همه کارهای امروز انجام شد" value={s.soundOn} onChange={(v) => updateSettings({ soundOn: v })} />
        <Btn small kind="ghost" label="پخش آزمایشی صدا" onPress={() => playDone()} style={{ marginTop: 12, alignSelf: 'flex-end' }} />
      </Card>

      <Card>
        <Txt bold style={{ marginBottom: 10 }}>تم</Txt>
        <View style={{ flexDirection: ROW, flexWrap: 'wrap' }}>
          {([['system', 'خودکار'], ['light', 'روشن'], ['dark', 'تاریک']] as [ThemeMode, string][]).map(([m, l]) => (
            <Chip key={m} label={l} selected={s.theme === m} onPress={() => updateSettings({ theme: m })} />
          ))}
        </View>
      </Card>

      <Card>
        <Txt bold style={{ marginBottom: 4 }}>پشتیبان‌گیری و بازیابی</Txt>
        <Txt size={12} sub style={{ marginBottom: 12, lineHeight: 20 }}>
          «پشتیبان‌گیری» همه اطلاعات را به‌صورت متن JSON در منوی اشتراک‌گذاری باز می‌کند (مثلاً ذخیره در یادداشت‌ها یا ارسال به تلگرام). برای بازیابی، همان متن را اینجا جای‌گذاری کن.
        </Txt>
        <View style={{ flexDirection: ROW }}>
          <Btn small label="پشتیبان‌گیری" onPress={backup} style={{ marginEnd: 8 }} />
          <Btn small kind="ghost" label="بازیابی" onPress={() => setRestoreOpen(true)} />
        </View>
      </Card>

      <Sheet visible={restoreOpen} onClose={() => setRestoreOpen(false)} title="بازیابی از پشتیبان">
        <Field label="متن JSON پشتیبان را اینجا جای‌گذاری کن" value={restoreText} onChangeText={(v) => { setRestoreText(v); setRestoreErr(''); }} error={restoreErr} multiline numberOfLines={8} style={{ minHeight: 160, textAlignVertical: 'top', textAlign: 'left', writingDirection: 'ltr' }} autoCapitalize="none" autoCorrect={false} />
        <Btn label="بازیابی" onPress={restore} />
      </Sheet>
    </ScrollView>
  );
}
