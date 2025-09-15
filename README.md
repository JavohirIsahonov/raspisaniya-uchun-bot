# Telegram Schedule Bot

Bu Node.js yordamida yaratilgan Telegram bot bo'lib, sinf jadvallarini boshqarish uchun ishlatiladi.

## O'rnatish

1. Loyihani klonlash:
```bash
git clone <repository-url>
cd telegram-schedule-bot
```

2. Dependencylarni o'rnatish:
```bash
npm install
```

3. Bot token olish:
   - Telegram'da @BotFather'ga murojaat qiling
   - Yangi bot yarating va tokenni oling
   - `index.js` faylidagi `YOUR_BOT_TOKEN_HERE` qismini o'z tokeningiz bilan almashtiring

## Ishlatish

Botni ishga tushirish:
```bash
npm start
```

Development uchun (auto-restart):
```bash
npm run dev
```

## Bot funksiyalari

- **`/start`** - Bot bilan tanishish va foydalanuvchi ma'lumotlarini saqlash
- **`/edit`** - Jadval o'zgartirish
- **Avtomatik jadval yuborish:**
  - Har kuni 06:30 da bugungi jadval
  - Har kuni 19:00 da ertangi jadval
- **Vaqtga qarab jadval yuborish:**
  - 03:00-09:00 oralig'ida `/start` bosilsa - bugungi jadval
  - 13:05-23:59 oralig'ida `/start` bosilsa - ertangi jadval
- **Muhim darslar eslatmasi:**
  - 13:00 dan 23:00 gacha har 2 soatda
  - Faqat muhim darslar bo'lsa eslatma yuboradi
- **Foydalanuvchi ma'lumotlari saqlash:**
  - Chat ID va ism JSON faylda saqlanadi
  - Qayta `/start` bosishda ism so'ralmaydi

## Fayl tuzilishi

- `index.js` - Asosiy bot kodi
- `raspisaniya.json` - Dars jadvallari ma'lumotlar bazasi
- `users.json` - Foydalanuvchilar ma'lumotlari (chat ID va ismlar)
- `package.json` - Loyiha konfiguratsiyasi

## Jadval formati

JSON faylda jadvallar vaqt ko'rsatkichlari bilan saqlanadi:
```json
{
  "9A": {
    "Dushanba": ["Biologiya 08:00 - 08:45", "Kimyo 08:55 - 09:40", ...],
    "Seshanba": ["Fizika 08:00 - 08:45", "Matematika 08:55 - 09:40", ...],
    ...
  }
}
```

Har bir dars uchun format: `Fan nomi vaqt_boshlanishi - vaqt_tugashi`
Masalan: `Biologiya 08:00 - 08:45`