const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const token = '8234260460:AAGtMKfgmDt4Q7rFEOnT73F5fysa_tlgbxY';
const bot = new TelegramBot(token, { polling: true });

// Fayllar yo'li
const scheduleFile = path.join(__dirname, 'raspisaniya.json');
const usersFile = path.join(__dirname, 'users.json');

// Foydalanuvchilar ma'lumotlarini yuklash
function loadUsers() {
    try {
        const data = fs.readFileSync(usersFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Foydalanuvchilar faylini o\'qishda xatolik:', error);
        return {};
    }
}

// Foydalanuvchilar ma'lumotlarini saqlash
function saveUsers(users) {
    try {
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Foydalanuvchilar faylini saqlashda xatolik:', error);
        return false;
    }
}

// Foydalanuvchilarni yuklash
let users = loadUsers();

function loadSchedule() {
    try {
        const data = fs.readFileSync(scheduleFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Jadval faylini o\'qishda xatolik:', error);
        return {};
    }
}

function saveSchedule(schedule) {
    try {
        fs.writeFileSync(scheduleFile, JSON.stringify(schedule, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Jadval faylini saqlashda xatolik:', error);
        return false;
    }
}

// Vaqt soatini tekshirish funksiyalari
function getCurrentHour() {
    const now = new Date();
    return now.getHours();
}

function isSchoolTimeForToday() {
    const hour = getCurrentHour();
    return hour >= 3 && hour < 9; // 03:00 - 09:00
}

function isTimeForTomorrow() {
    const hour = getCurrentHour();
    return hour >= 13 && hour <= 23; // 13:05 - 23:59
}



function getDayName(dayIndex) {
    const days = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    return days[dayIndex];
}

function getTodaySchedule() {
    const today = new Date();
    const dayName = getDayName(today.getDay());
    const schedule = loadSchedule();
    
    if (schedule['9A'] && schedule['9A'][dayName]) {
        return {
            day: dayName,
            subjects: schedule['9A'][dayName]
        };
    }
    return null;
}

function getTomorrowSchedule() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayName = getDayName(tomorrow.getDay());
    const schedule = loadSchedule();
    
    if (schedule['9A'] && schedule['9A'][dayName]) {
        return {
            day: dayName,
            subjects: schedule['9A'][dayName]
        };
    }
    return null;
}

// Jadval formatini tayyorlash (faqat fanlar)
function formatScheduleSimple(scheduleData) {
    if (!scheduleData) {
        return 'Bugun dars yo\'q! 🎉';
    }
    
    let message = `📅 ${scheduleData.day} kuni darslari:\n\n`;
    scheduleData.subjects.forEach((subject, index) => {
        message += `${index + 1}. ${subject}\n`;
    });
    
    return message;
}



// /start buyrug'i
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Foydalanuvchi mavjudligini tekshirish
    const existingUser = Object.values(users).find(user => user.chatId === chatId);
    
    if (existingUser) {
        // Mavjud foydalanuvchi - faqat jadval yuborish
        // Vaqtga qarab jadval yuborish
        if (isSchoolTimeForToday()) {
            // 03:00 - 09:00 oralig'ida bugungi jadval
            const todaySchedule = getTodaySchedule();
            if (todaySchedule) {
                const scheduleMessage = `📚 ${existingUser.name}, bugungi dars jadvali:\n\n` + formatScheduleSimple(todaySchedule);
                bot.sendMessage(chatId, scheduleMessage);
            }
        } else if (isTimeForTomorrow()) {
            // 13:05 - 23:59 oralig'ida ertangi jadval
            const tomorrowSchedule = getTomorrowSchedule();
            if (tomorrowSchedule) {
                const scheduleMessage = `📅 ${existingUser.name}, ertangi kun uchun dars jadvali:\n\n` + formatScheduleSimple(tomorrowSchedule);
                bot.sendMessage(chatId, scheduleMessage);
            }
        } else {
            // Oddiy vaqtda bugungi jadval
            const todaySchedule = getTodaySchedule();
            if (todaySchedule) {
                const scheduleMessage = `📚 ${existingUser.name}, bugungi dars jadvali:\n\n` + formatScheduleSimple(todaySchedule);
                bot.sendMessage(chatId, scheduleMessage);
            }
        }
    } else {
        // Yangi foydalanuvchi
        users[userId] = { chatId: chatId, waitingForName: true };
        bot.sendMessage(chatId, 'Assalomu alaykum! Iltimos, ismingizni kiriting:');
    }
});

// Ism kiritilishini kutish
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    
    // Buyruqlarni ignore qilish
    if (text && text.startsWith('/')) return;
    
    if (users[userId] && users[userId].waitingForName) {
        users[userId].name = text;
        users[userId].waitingForName = false;
        
        // Foydalanuvchi ma'lumotlarini saqlash
        saveUsers(users);
        
        const welcomeMessage = `Xush kelibsiz, ${text}! Bugundan boshlab men sizga kunlik dars jadvalini yuborib boraman. O'zgartirish uchun /edit buyrug'ini yuboring.`;
        bot.sendMessage(chatId, welcomeMessage);
        
        // Vaqtga qarab jadval yuborish
        if (isSchoolTimeForToday()) {
            const todaySchedule = getTodaySchedule();
            if (todaySchedule) {
                const scheduleMessage = `📚 ${text}, bugungi dars jadvali:\n\n` + formatScheduleSimple(todaySchedule);
                bot.sendMessage(chatId, scheduleMessage);
            }
        } else if (isTimeForTomorrow()) {
            const tomorrowSchedule = getTomorrowSchedule();
            if (tomorrowSchedule) {
                const scheduleMessage = `📅 ${text}, ertangi kun uchun dars jadvali:\n\n` + formatScheduleSimple(tomorrowSchedule);
                bot.sendMessage(chatId, scheduleMessage);
            }
        } else {
            // Oddiy vaqtda bugungi jadval
            const todaySchedule = getTodaySchedule();
            if (todaySchedule) {
                const scheduleMessage = `📚 ${text}, bugungi dars jadvali:\n\n` + formatScheduleSimple(todaySchedule);
                bot.sendMessage(chatId, scheduleMessage);
            }
        }
    }
});

bot.onText(/\/edit/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (!users[userId] || !users[userId].name) {
        bot.sendMessage(chatId, 'Avval /start buyrug\'ini yuboring va ismingizni kiriting.');
        return;
    }
    
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Dushanba', callback_data: 'edit_Dushanba' }],
                [{ text: 'Seshanba', callback_data: 'edit_Seshanba' }],
                [{ text: 'Chorshanba', callback_data: 'edit_Chorshanba' }],
                [{ text: 'Payshanba', callback_data: 'edit_Payshanba' }],
                [{ text: 'Juma', callback_data: 'edit_Juma' }],
                [{ text: 'Shanba', callback_data: 'edit_Shanba' }]
            ]
        }
    };
    
    bot.sendMessage(chatId, 'Qaysi kunning jadvalini o\'zgartirmoqchisiz?', keyboard);
});

bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    
    if (data.startsWith('edit_')) {
        const day = data.replace('edit_', '');
        const schedule = loadSchedule();
        
        if (schedule['9A'] && schedule['9A'][day]) {
            const currentSchedule = schedule['9A'][day];
            let message = `${day} kuni hozirgi jadvali:\n\n`;
            currentSchedule.forEach((subject, index) => {
                // Faqat fan nomini ko'rsatish
                const subjectName = subject.split(' ')[0];
                message += `${index + 1}. ${subjectName}\n`;
            });
            message += '\nYangi jadval kiriting (fan nomi va vaqti bilan, masalan: Biologiya 08:00 - 08:45)\nHar bir fanni alohida qatorga yozing:';
            
            users[userId].editingDay = day;
            bot.sendMessage(chatId, message);
        }
    }
    
    bot.answerCallbackQuery(callbackQuery.id);
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    
    if (text && text.startsWith('/')) return;
    
    if (users[userId] && users[userId].editingDay && !users[userId].waitingForName) {
        const day = users[userId].editingDay;
        const newSubjects = text.split('\n').filter(subject => subject.trim() !== '');
        
        const schedule = loadSchedule();
        if (!schedule['9A']) schedule['9A'] = {};
        
        schedule['9A'][day] = newSubjects;
        
        if (saveSchedule(schedule)) {
            bot.sendMessage(chatId, `✅ ${day} kunining jadvali muvaffaqiyatli yangilandi!`);
            
            // Yangilangan jadvalini ko'rsatish (oddiy format)
            const updatedScheduleData = {
                day: day,
                subjects: newSubjects
            };
            const simpleSchedule = formatScheduleSimple(updatedScheduleData);
            bot.sendMessage(chatId, `${day} kuni yangi jadvali:\n\n${simpleSchedule}`);
        } else {
            bot.sendMessage(chatId, '❌ Jadvalni saqlashda xatolik yuz berdi. Qaytadan urinib ko\'ring.');
        }
        
        delete users[userId].editingDay;
        // Foydalanuvchi ma'lumotlarini saqlash
        saveUsers(users);
    }
});

// Avtomatik jadval yuborish - har kuni 06:30 da bugungi jadval
cron.schedule('30 6 * * *', () => {
    console.log('Ertalabki jadval yuborilmoqda...');
    const todaySchedule = getTodaySchedule();
    
    if (todaySchedule) {
        const message = '🌅 Xayrli tong! Bugungi dars jadvali:\n\n' + formatScheduleSimple(todaySchedule);
        
        // Barcha foydalanuvchilarga yuborish
        Object.values(users).forEach(user => {
            if (user.name && user.chatId) {
                bot.sendMessage(user.chatId, message);
            }
        });
    }
});

// Avtomatik jadval yuborish - har kuni 19:00 da ertangi jadval
cron.schedule('0 19 * * *', () => {
    console.log('Kechki jadval yuborilmoqda...');
    const tomorrowSchedule = getTomorrowSchedule();
    
    if (tomorrowSchedule) {
        const message = '🌙 Kechki salom! Ertangi kun uchun dars jadvali:\n\n' + formatScheduleSimple(tomorrowSchedule);
        
        // Barcha foydalanuvchilarga yuborish
        Object.values(users).forEach(user => {
            if (user.name && user.chatId) {
                bot.sendMessage(user.chatId, message);
            }
        });
    }
});

// Avtomatik jadval yuborish - har kuni 14:00 da ertangi jadval
cron.schedule('0 14 * * *', () => {
    console.log('14:00 da ertangi jadval yuborilmoqda...');
    const tomorrowSchedule = getTomorrowSchedule();
    
    if (tomorrowSchedule) {
        const message = '📅 Ertangi kun uchun dars jadvali:\n\n' + formatScheduleSimple(tomorrowSchedule);
        
        // Barcha foydalanuvchilarga yuborish
        Object.values(users).forEach(user => {
            if (user.name && user.chatId) {
                bot.sendMessage(user.chatId, message);
            }
        });
    }
});

console.log('Bot ishga tushdi! Foydalanuvchilar /start buyrug\'ini yuborishlari mumkin.');

bot.on('error', (error) => {
    console.error('Bot xatoligi:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});