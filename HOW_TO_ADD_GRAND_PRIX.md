# راهنمای اضافه کردن Grand Prix جدید

این راهنما نحوه اضافه کردن یک Grand Prix جدید به dashboard را توضیح می‌دهد.

---

## روش 1: استفاده از API (پیشنهادی) 🎉

**هیچ کاری لازم نیست!**

Dashboard به صورت خودکار از Jolpica F1 API داده‌های جدید را دریافت می‌کند:
- مسابقات جدید خودکار نمایش داده می‌شوند
- نتایج به محض available شدن در API بروز می‌شوند
- Cache هر 30 دقیقه refresh می‌شود

---

## روش 2: اضافه کردن دستی (Fallback)

اگر API در دسترس نیست یا داده‌های محلی می‌خواهید، این مراحل را دنبال کنید:

### مرحله 1: اضافه کردن به Calendar

فایل: `public/data/calendar.json`

```json
{
  "season": 2026,
  "source": "Manual Entry",
  "asOfDate": "2026-09-19",
  "totalRounds": 25,
  "races": [
    // ... مسابقات قبلی
    {
      "round": 25,
      "name": "New Grand Prix Name",
      "circuit": "Circuit Name",
      "locality": "City Name",
      "country": "Country Name",
      "flag": "🏁",
      "date": "2026-12-15",
      "weekendDates": "13 - 15 Dec",
      "isSprint": false,
      "status": "upcoming"
    }
  ]
}
```

### فیلدهای اجباری:

| فیلد | نوع | توضیح | مثال |
|------|-----|-------|------|
| `round` | number | شماره دور مسابقه | `25` |
| `name` | string | نام رسمی Grand Prix | `"Singapore Grand Prix"` |
| `circuit` | string | نام پیست | `"Marina Bay Street Circuit"` |
| `locality` | string | شهر | `"Singapore"` |
| `country` | string | کشور | `"Singapore"` |
| `flag` | string | emoji پرچم | `"🇸🇬"` |
| `date` | string | تاریخ مسابقه (ISO format) | `"2026-10-04"` |
| `weekendDates` | string | بازه تاریخ آخر هفته | `"02 - 04 Oct"` |
| `isSprint` | boolean | آیا هفته Sprint است؟ | `false` |
| `status` | string | وضعیت مسابقه | `"upcoming"` |

### فیلدهای اختیاری:

| فیلد | نوع | توضیح | مثال |
|------|-----|-------|------|
| `winner` | string | برنده مسابقه (فقط برای completed) | `"Max Verstappen (Red Bull)"` |
| `podium` | array | سه نفر اول (فقط برای completed) | `["P1", "P2", "P3"]` |
| `notes` | string | یادداشت اضافی | `"Street circuit"` |

### وضعیت‌های معتبر `status`:

- `"upcoming"` - مسابقات آینده
- `"next"` - مسابقه بعدی (فقط یکی)
- `"completed"` - مسابقه برگزار شده
- `"cancelled"` - مسابقه لغو شده

---

### مرحله 2: اضافه کردن نتایج (اختیاری)

فایل: `public/data/results.json`

```json
{
  "season": 2026,
  "asOfRound": 25,
  "asOfDate": "2026-12-15",
  "source": "Manual Entry",
  "pointsSystem": "25-18-15-12-10-8-6-4-2-1",
  "races": {
    // ... نتایج قبلی
    "25": {
      "round": 25,
      "name": "New Grand Prix Name",
      "date": "2026-12-15",
      "circuit": "Circuit Name",
      "results": [
        {
          "pos": 1,
          "driver": "Max Verstappen",
          "code": "VER",
          "team": "Red Bull Racing",
          "points": 25,
          "status": "Finished"
        },
        {
          "pos": 2,
          "driver": "Charles Leclerc",
          "code": "LEC",
          "team": "Ferrari",
          "points": 18,
          "status": "Finished"
        },
        {
          "pos": null,
          "driver": "Lewis Hamilton",
          "code": "HAM",
          "team": "Mercedes",
          "points": 0,
          "status": "DNF"
        }
      ]
    }
  }
}
```

### فیلدهای Result Entry:

| فیلد | نوع | توضیح | مثال |
|------|-----|-------|------|
| `pos` | number \| null | موقعیت نهایی (null برای DNF/DNS) | `1` |
| `driver` | string | نام کامل راننده | `"Max Verstappen"` |
| `code` | string | کد 3 حرفی راننده | `"VER"` |
| `team` | string | نام تیم | `"Red Bull Racing"` |
| `points` | number | امتیاز کسب شده | `25` |
| `status` | string | وضعیت نهایی | `"Finished"` |

### وضعیت‌های معتبر Result:

- `"Finished"` - به پایان رسیده
- `"DNF"` - Did Not Finish
- `"DNS"` - Did Not Start
- `"NC"` - Not Classified
- `"+1 Lap"`, `"+2 Laps"`, etc.

---

## مرحله 3: Validation

بعد از ویرایش، چک کنید:

1. **JSON معتبر است:**
```bash
# استفاده از jq برای validation
cat public/data/calendar.json | jq . > /dev/null && echo "Valid JSON" || echo "Invalid JSON"
```

2. **TypeScript errors نداریم:**
```bash
npm run typecheck
```

3. **Build موفق است:**
```bash
npm run build
```

---

## مرحله 4: تست در Browser

```bash
npm run dev
```

بروید به `http://localhost:5173/grand-prix` و:
- ✅ Grand Prix جدید در لیست نمایش داده می‌شود
- ✅ فیلترها کار می‌کنند
- ✅ جستجو کار می‌کند
- ✅ Modal جزئیات باز می‌شود
- ✅ نتایج (اگر اضافه کرده‌اید) نمایش داده می‌شوند

---

## نکات مهم

### 🏁 پرچم‌های کشورها

لیست کامل پرچم‌ها در `src/models/grandPrix.ts`:

```typescript
export const COUNTRY_FLAGS: Record<string, string> = {
  'Australia': '🇦🇺',
  'Austria': '🇦🇹',
  'Azerbaijan': '🇦🇿',
  'Bahrain': '🇧🇭',
  'Belgium': '🇧🇪',
  'Brazil': '🇧🇷',
  'Canada': '🇨🇦',
  'China': '🇨🇳',
  // ... و غیره
};
```

### ⚡ Sprint Weekends

برای مسابقات Sprint:
1. `"isSprint": true` را تنظیم کنید
2. یا نام circuit را به لیست `KNOWN_SPRINT_CIRCUITS` اضافه کنید

فایل: `src/models/grandPrix.ts`
```typescript
export const KNOWN_SPRINT_CIRCUITS = [
  'Shanghai International Circuit',
  'Miami International Autodrome',
  'Red Bull Ring',
  'Circuit of the Americas',
  'Interlagos',
  'Losail International Circuit',
];
```

### 📅 محاسبه Weekend Dates

فرمت: `"DD - DD MMM"`

مثال:
- Race date: `2026-10-04` (یکشنبه)
- Weekend dates: `"02 - 04 Oct"` (جمعه تا یکشنبه)

---

## خطاهای رایج

### ❌ خطای JSON Syntax
```
Unexpected token } in JSON
```
**راه حل:** از JSON validator استفاده کنید

### ❌ TypeScript Error
```
Property 'xxx' is missing in type 'GrandPrixRace'
```
**راه حل:** همه فیلدهای اجباری را اضافه کنید

### ❌ مسابقه نمایش داده نمی‌شود
**بررسی کنید:**
- `round` منحصر به فرد است؟
- `status` معتبر است؟
- `date` در فرمت ISO است؟

---

## پشتیبانی

اگر مشکلی داشتید:
1. گزارش کامل `REFACTORING_REPORT.md` را بخوانید
2. فایل‌های نمونه در `public/data/` را بررسی کنید
3. Console browser را برای errors چک کنید

---

**موفق باشید!** 🏎️💨
