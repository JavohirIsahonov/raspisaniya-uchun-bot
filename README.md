# Telegram Schedule Bot

Bu Node.js yordamida yaratilgan Telegram bot bo'lib, sinf jadvallarini boshqarish uchun ishlatiladi. Bot admin paneli, huquqlar tizimi va avtomatik jadval yuborish funksiyalariga ega.

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
   - `index.js` faylidagi `token` o'zgaruvchisiga o'z tokeningizni kiriting

4. Birinchi adminni sozlash:
   - `admins.json` faylida o'z Telegram ID ingizni kiriting
   - ID ni `@userinfobot` orqali bilishingiz mumkin

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

### Oddiy foydalanuvchilar uchun:

- **`/start`** - Bot bilan tanishish va dars jadvali olish
- **Avtomatik jadval yuborish:**
  - Har kuni 06:30 da bugungi jadval
  - Har kuni 14:00 da ertangi jadval
  - Har kuni 19:00 da ertangi jadval
- **Vaqtga qarab jadval yuborish:**
  - 03:00-09:00 oralig'ida `/start` bosilsa - bugungi jadval
  - 13:00-23:59 oralig'ida `/start` bosilsa - ertangi jadval
- **Foydalanuvchi ma'lumotlari saqlash:**
  - Chat ID va ism JSON faylda saqlanadi
  - Qayta `/start` bosishda ism so'ralmaydi

### Adminlar uchun:

- **Admin paneli** - Reply keyboard orqali oson kirish
- **Dars jadvalini o'zgartirish** - Kun tanlab, yangi jadval yuborish
- **Yangi admin tayyorlash** - Boshqa adminlar yaratish (huquq kerak)
- **Huquqlar tizimi:**
  - 📝 Dars jadvalini o'zgartirish huquqi
  - ➕ Yangi admin saylash huquqi
  - Har bir admin o'z huquqlariga mos funksiyalarga ega

## Admin paneli qo'llanma

### Admin sifatida kirish:

1. `/start` buyrug'ini yuboring
2. Ikkita tugma ko'rinadi:
   - 👨‍💼 **Admin paneli**
   - 📚 **Dars jadvali**

### Dars jadvalini o'zgartirish:

1. **Admin paneli** → **📝 Dars jadvalini o'zgartirish**
2. Kun tanlang (Dushanba, Seshanba, va h.k.)
3. Hozirgi jadval va misol ko'rsatiladi
4. Yangi jadval yuboring (har bir fan alohida qatorda)
5. Jadval avtomatik saqlanadi

Misol:

```
Matematika
Fizika
Kimyo
Biologiya
```

### Yangi admin yaratish:

1. **Admin paneli** → **➕ Yangi admin tayyorlash**
2. Yangi admin ID sini kiriting
3. Huquqlarni tanlang:
   - ✅ Dars jadvalini o'zgartirish
   - ✅ Yangi admin saylash
4. **✅ Huquqlarni tasdiqlash** tugmasini bosing
5. Yangi admin yaratiladi va u `/start` bosib tizimga kirishi mumkin

## Qo'shimcha skriptlar

### Barcha foydalanuvchilarga xabar yuborish:

```bash
node text.js
```

Bu skript orqali `users.json` dagi barcha foydalanuvchilarga (guruhdan tashqari) bir xil xabar yuborishingiz mumkin.

### Guruhga xabar yuborish:

```bash
node bot.js
```

Terminaldan yozgan xabarlaringiz to'g'ridan-to'g'ri guruhga yuboriladi.

## Fayl tuzilishi

- `index.js` - Asosiy bot kodi (admin paneli, jadval yuborish)
- `raspisaniya.json` - Dars jadvallari ma'lumotlar bazasi
- `users.json` - Oddiy foydalanuvchilar ma'lumotlari
- `admins.json` - Adminlar va ularning huquqlari
- `text.js` - Barcha userlarga xabar yuborish skripti
- `bot.js` - Guruhga xabar yuborish skripti
- `package.json` - Loyiha konfiguratsiyasi

## Jadval formati

`raspisaniya.json` faylida jadvallar oddiy format bilan saqlanadi:

```json
{
  "9A": {
    "Dushanba": [
      "Matematika",
      "Fizika",
      "Kimyo",
      "Biologiya"
    ],
    "Seshanba": [
      "Ingliz tili",
      "Ona tili",
      "Tarix"
    ]
  }
}
```

Har bir fan alohida element sifatida massivda saqlanadi.

## Adminlar formati

`admins.json` faylida adminlar va huquqlari saqlanadi:

```json
{
  "123456789": {
    "chatId": 123456789,
    "name": "Admin ismi",
    "canEditSchedule": true,
    "canCreateAdmin": true
  }
}
```

- `canEditSchedule` - Dars jadvalini o'zgartirish huquqi
- `canCreateAdmin` - Yangi admin yaratish huquqi

## Texnologiyalar

- **Node.js** - Asosiy platforma
- **node-telegram-bot-api** - Telegram Bot API
- **node-cron** - Avtomatik xabar yuborish uchun
- **fs** - Fayl bilan ishlash (JSON ma'lumotlar bazasi)

## Xavfsizlik

- Bot tokeni kodda ochiq turadi - ishlab chiqarishda environment variable ishlatish tavsiya etiladi
- Admin ID lari `admins.json` da saqlanadi
- Faqat `admins.json` dagi foydalanuvchilar admin funksiyalariga kirishi mumkin

## Litsenziya

MIT