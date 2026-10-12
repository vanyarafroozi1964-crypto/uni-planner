# برنامه من — برنامه دانشگاه و کارهای روزانه

React Native + Expo + TypeScript، فارسی/RTL، ذخیره‌سازی محلی، اعلان محلی هفتگی.

## اجرا
```bash
npm install
npx expo install --fix        # هم‌ترازکردن نسخه‌ها با SDK نصب‌شده
npm run typecheck && npm test # بررسی نوع‌ها + تست منطق
```
> اعلان‌ها و صدا را روی **گوشی واقعی با APK یا Development Build** آزمایش کن (Expo Go برای اعلان‌ها قابل اتکا نیست).

## ساخت APK
قبل از ساخت، `android.package` را در `app.json` به شناسه‌ی دلخواه خودت تغییر بده.
```bash
npm i -g eas-cli && eas login
eas build -p android --profile preview     # خروجی: APK قابل نصب
```
یا ساخت محلی (نیازمند Android SDK و JDK):
```bash
npx expo prebuild -p android && cd android && ./gradlew assembleRelease
```

## نکات اندروید
- اعلان‌ها هفتگی و محلی‌اند؛ سیستم‌عامل آن‌ها را بدون اینترنت و با اپ بسته اجرا می‌کند و پس از ری‌استارت گوشی بازیابی می‌شوند.
- ذخیره‌سازی انرژی/بهینه‌سازی باتری در برخی برندها ممکن است اعلان را دیر کند؛ برای اپ غیرفعالش کن.
- پشتیبان‌گیری: متن JSON از منوی اشتراک‌گذاری؛ بازیابی: جای‌گذاری همان متن در تنظیمات.
