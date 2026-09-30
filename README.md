# Divar Deal Agent

نسخه اولیه ایجنت برای پیدا کردن فرصت‌های خرید زیر قیمت بازار.

## هدف V1

- دریافت آگهی‌های عمومی برای شهر مشخص
- اعمال سقف قیمت (پیش‌فرض: ۵ میلیون تومان)
- تشخیص محصول و مدل
- مقایسه با قیمت مرجع بازار
- گزارش فقط فرصت‌های زیر قیمت
- آماده برای اضافه شدن تلگرام و موتور امتیازدهی

## نصب

```bash
npm install
cp .env.example .env
npm run test:divar
```

در PowerShell ویندوز:

```powershell
Copy-Item .env.example .env
npm install
npm run test:divar
```

## اجرا

```bash
npm run dev
```

سپس:

- `GET /health`
- `GET /test/divar`

## متغیرهای محیطی

```env
PORT=3000
MAX_PRICE_TOMAN=5000000
DIVAR_CITY=tabriz
MIN_DISCOUNT_PERCENT=15
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

> فایل `.env` در Git commit نمی‌شود.

## وضعیت فعلی

این نسخه فقط اتصال پایه به صفحه عمومی دیوار را تست می‌کند. اگر سایت پاسخ مناسب ندهد، مسیر جمع‌آوری داده عوض می‌شود و هیچ مکانیزم دور زدن محدودیت سایت اضافه نخواهد شد.
