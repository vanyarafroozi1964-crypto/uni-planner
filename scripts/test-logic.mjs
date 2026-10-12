import assert from 'node:assert/strict';
import * as L from '../src/logic.ts';

let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok -', name); };
const C = (o) => ({ id: o.id ?? L.uid(), name: 'x', day: 0, start: '08:00', end: '09:00', color: '#4F46E5', ...o });

t('toFa / toEn', () => { assert.equal(L.toFa('08:30'), '۰۸:۳۰'); assert.equal(L.toEn('۰۸٫۳۰'), '08:30'); });
t('normalizeTime', () => {
  for (const [i, o] of [['8', '08:00'], ['8:5', '08:05'], ['830', '08:30'], ['1430', '14:30'], ['۰۸:۳۰', '08:30'], ['23:59', '23:59'], ['24:00', null], ['12:60', null], ['', null], ['abc', null], ['12345', null]])
    assert.equal(L.normalizeTime(i), o, `input ${i}`);
});
t('jalali conversion (known dates)', () => {
  assert.deepEqual(L.toJalali(2026, 3, 21), [1405, 1, 1]);
  assert.deepEqual(L.toJalali(2025, 3, 21), [1404, 1, 1]);
  assert.deepEqual(L.toJalali(2024, 3, 20), [1403, 1, 1]);
  assert.deepEqual(L.toJalali(2026, 1, 1), [1404, 10, 11]);
  assert.deepEqual(L.toJalali(2026, 10, 11), [1405, 7, 19]);
  assert.equal(L.formatJalali('2026-10-11'), '۱۹ مهر ۱۴۰۵');
});
t('day index: شنبه=0 ... جمعه=6', () => {
  assert.equal(L.dayIndexOf('2026-10-10'), 0); // شنبه
  assert.equal(L.dayIndexOf('2026-10-11'), 1); // یکشنبه
  assert.equal(L.dayIndexOf('2026-10-16'), 6); // جمعه
});
t('addDays across month/year', () => { assert.equal(L.addDays('2026-12-31', 1), '2027-01-01'); assert.equal(L.addDays('2026-03-01', -1), '2026-02-28'); });
t('conflicts', () => {
  const a = C({ id: 'a', start: '08:00', end: '09:30' });
  assert.equal(L.overlaps(a, C({ start: '09:00', end: '10:00' })), true);
  assert.equal(L.overlaps(a, C({ start: '09:30', end: '11:00' })), false); // لمس لبه تداخل نیست
  assert.equal(L.overlaps(a, C({ day: 1, start: '08:00', end: '09:00' })), false);
  assert.equal(L.findConflicts([a], { ...a }).length, 0); // خودش با خودش تداخل ندارد (ویرایش)
  assert.deepEqual([...L.conflictIds([a, C({ id: 'b', start: '09:00', end: '10:00' }), C({ id: 'c', start: '12:00', end: '13:00' })])].sort(), ['a', 'b']);
});
t('sortClasses by start', () => {
  const s = L.sortClasses([C({ id: '2', start: '10:00', end: '11:00' }), C({ id: '1', start: '08:00', end: '09:00' })]);
  assert.deepEqual(s.map((x) => x.id), ['1', '2']);
});
t('nextClass', () => {
  const cl = [C({ id: 'a', day: 1, start: '08:00', end: '09:30' }), C({ id: 'b', day: 1, start: '14:00', end: '15:00' }), C({ id: 'c', day: 3, start: '10:00', end: '11:00' })];
  const at = (h, m) => new Date(2026, 9, 11, h, m); // یکشنبه
  assert.equal(L.nextClass(cl, at(7, 0)).item.id, 'a');
  assert.equal(L.nextClass(cl, at(7, 0)).minutesUntil, 60);
  const on = L.nextClass(cl, at(8, 30));
  assert.equal(on.item.id, 'a'); assert.equal(on.ongoing, true);
  assert.equal(L.nextClass(cl, at(10, 0)).item.id, 'b');
  const later = L.nextClass(cl, at(16, 0));
  assert.equal(later.item.id, 'c'); assert.equal(later.offsetDays, 2);
  assert.equal(later.minutesUntil, 2 * 1440 - 16 * 60 + 10 * 60);
  assert.equal(L.nextClass([], at(8, 0)), null);
  // تنها کلاس همین روزِ گذشته ⇒ هفته بعد
  assert.equal(L.nextClass([C({ id: 'z', day: 1, start: '08:00', end: '09:00' })], at(12, 0)).offsetDays, 7);
});
t('notification content', () => {
  const cl = [C({ day: 0, name: 'ریاضی', start: '10:00', end: '11:30', place: 'کلاس ۲۰۱' }), C({ day: 0, name: 'فیزیک', start: '08:00', end: '09:30' })];
  const n = L.buildNotification(0, cl);
  assert.equal(n.title, 'امروز ۲ کلاس داری');
  assert.equal(n.body.split('\n')[0], '۰۸:۰۰–۰۹:۳۰  فیزیک');
  assert.ok(n.body.includes('کلاس ۲۰۱'));
  assert.ok(L.buildNotification(2, cl).title.includes('کلاس نداری'));
  assert.equal(L.expoWeekday(0), 7); assert.equal(L.expoWeekday(1), 1); assert.equal(L.expoWeekday(6), 6);
});
t('progress & sortTasks', () => {
  const tk = [
    { id: '1', date: 'd', title: 'a', priority: 'low', done: true },
    { id: '2', date: 'd', title: 'b', priority: 'high', done: false, deadline: '18:00' },
    { id: '3', date: 'd', title: 'c', priority: 'high', done: false, deadline: '09:00' },
    { id: '4', date: 'd', title: 'd', priority: 'medium', done: false },
  ];
  assert.deepEqual(L.progress(tk), { done: 1, total: 4, percent: 25 });
  assert.deepEqual(L.progress([]), { done: 0, total: 0, percent: 0 });
  assert.deepEqual(L.sortTasks(tk).map((x) => x.id), ['3', '2', '4', '1']);
});
t('sanitizeData: round trip + invalid input', () => {
  const d = L.defaultData();
  d.classes.push(C({ id: 'a', name: 'ریاضی', teacher: 'دکتر الف' }));
  d.tasks.push({ id: 't', date: '2026-10-11', title: 'تمرین', priority: 'high', deadline: '20:00', done: true });
  const back = L.sanitizeData(JSON.parse(JSON.stringify(d)));
  assert.deepEqual(back, { ...d, classes: [{ ...d.classes[0], place: undefined }] });
  assert.equal(L.sanitizeData(null), null);
  assert.equal(L.sanitizeData({ classes: 1, tasks: [] }), null);
  const bad = L.sanitizeData({ classes: [{ name: 'x', day: 9, start: '08:00', end: '09:00' }, { name: 'y', day: 1, start: '10:00', end: '09:00' }, { name: '', day: 1, start: '08:00', end: '09:00' }], tasks: [{ title: 't', date: 'bad' }], settings: { notifTime: 'zzz', notifDays: [1, 1, 9, 'a'] } });
  assert.equal(bad.classes.length, 0); assert.equal(bad.tasks.length, 0);
  assert.equal(bad.settings.notifTime, '07:00'); assert.deepEqual(bad.settings.notifDays, [1]);
});
t('formatDuration', () => { assert.equal(L.formatDuration(35), '۳۵ دقیقه'); assert.equal(L.formatDuration(90), '۱ ساعت و ۳۰ دقیقه'); assert.equal(L.formatDuration(2880), '۲ روز'); });

console.log(`\n${n} test groups passed`);
