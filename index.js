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

// Muhim darslarni tekshirish
function getImportantSubjects() {
    return ['Algebra', 'Geometriya', 'Fizika', 'Kimyo', 'Biologiya', 'Informatika', 'Ingliz tili'];
}

function hasImportantClasses(scheduleData) {
    if (!scheduleData || !scheduleData.subjects) return false;
    
    const importantSubjects = getImportantSubjects();
    return scheduleData.subjects.some(subject => {
        const subjectName = subject.split(' ')[0]; // Faqat fan nomini olish
        return importantSubjects.includes(subjectName);
    });
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
        // Faqat fan nomini olish
        const subjectName = subject.split(' ')[0];
        message += `${index + 1}. ${subjectName}\n`;
    });
    
    return message;
}

// Jadval formatini tayyorlash (vaqtlar bilan)
function formatScheduleWithTimes(scheduleData) {
    if (!scheduleData) {
        return 'Bugun dars yo\'q! 🎉';
    }
    
    let message = `📅 ${scheduleData.day} kuni darslari:\n\n`;
    scheduleData.subjects.forEach((subject, index) => {
        // Fanning nomi va vaqtini alohida ajratish
        const parts = subject.split(' ');
        const timeIndex = parts.findIndex(part => part.includes(':'));
        
        if (timeIndex !== -1) {
            const subjectName = parts.slice(0, timeIndex).join(' ');
            const timeSlot = parts.slice(timeIndex).join(' ');
            message += `${index + 1}. ${subjectName}\n   ⏰ ${timeSlot}\n\n`;
        } else {
            message += `${index + 1}. ${subject}\n\n`;
        }
    });
    
    return message;
}

// Vaqtlarni ko'rish tugmasi
function getViewTimesKeyboard(day) {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: '⏰ Vaqtlarni ko\'rish', callback_data: `view_times_${day}` }]
            ]
        }
    };
}

// /start buyrug'i
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Foydalanuvchi mavjudligini tekshirish
    const existingUser = Object.values(users).find(user => user.chatId === chatId);
    
    if (existingUser) {
        // Mavjud foydalanuvchi
        bot.sendMessage(chatId, `Xush kelibsiz, ${existingUser.name}!`);
        
        // Vaqtga qarab jadval yuborish
        if (isSchoolTimeForToday()) {
            // 03:00 - 09:00 oralig'ida bugungi jadval
            const todaySchedule = getTodaySchedule();
            if (todaySchedule) {
                const scheduleMessage = '📚 Bugungi dars jadvali:\n\n' + formatScheduleSimple(todaySchedule);
                const keyboard = getViewTimesKeyboard(todaySchedule.day);
                bot.sendMessage(chatId, scheduleMessage, keyboard);
            }
        } else if (isTimeForTomorrow()) {
            // 13:05 - 23:59 oralig'ida ertangi jadval
            const tomorrowSchedule = getTomorrowSchedule();
            if (tomorrowSchedule) {
                const scheduleMessage = '📅 Ertangi kun uchun dars jadvali:\n\n' + formatScheduleSimple(tomorrowSchedule);
                const keyboard = getViewTimesKeyboard(tomorrowSchedule.day);
                bot.sendMessage(chatId, scheduleMessage, keyboard);
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
                const scheduleMessage = '📚 Bugungi dars jadvali:\n\n' + formatScheduleSimple(todaySchedule);
                const keyboard = getViewTimesKeyboard(todaySchedule.day);
                bot.sendMessage(chatId, scheduleMessage, keyboard);
            }
        } else if (isTimeForTomorrow()) {
            const tomorrowSchedule = getTomorrowSchedule();
            if (tomorrowSchedule) {
                const scheduleMessage = '📅 Ertangi kun uchun dars jadvali:\n\n' + formatScheduleSimple(tomorrowSchedule);
                const keyboard = getViewTimesKeyboard(tomorrowSchedule.day);
                bot.sendMessage(chatId, scheduleMessage, keyboard);
            }
        } else {
            // Oddiy vaqtda bugungi jadval
            const todaySchedule = getTodaySchedule();
            if (todaySchedule) {
                const scheduleMessage = formatScheduleSimple(todaySchedule);
                const keyboard = getViewTimesKeyboard(todaySchedule.day);
                bot.sendMessage(chatId, scheduleMessage, keyboard);
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
    } else if (data.startsWith('view_times_')) {
        const day = data.replace('view_times_', '');
        const schedule = loadSchedule();
        
        if (schedule['9A'] && schedule['9A'][day]) {
            const scheduleData = {
                day: day,
                subjects: schedule['9A'][day]
            };
            const detailedMessage = formatScheduleWithTimes(scheduleData);
            bot.sendMessage(chatId, detailedMessage);
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
            const keyboard = getViewTimesKeyboard(day);
            bot.sendMessage(chatId, `${day} kuni yangi jadvali:\n\n${simpleSchedule}`, keyboard);
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
        const keyboard = getViewTimesKeyboard(todaySchedule.day);
        
        // Barcha foydalanuvchilarga yuborish
        Object.values(users).forEach(user => {
            if (user.name && user.chatId) {
                bot.sendMessage(user.chatId, message, keyboard);
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
        const keyboard = getViewTimesKeyboard(tomorrowSchedule.day);
        
        // Barcha foydalanuvchilarga yuborish
        Object.values(users).forEach(user => {
            if (user.name && user.chatId) {
                bot.sendMessage(user.chatId, message, keyboard);
            }
        });
    }
});

// Muhim darslar haqida har 2 soatda eslatma (13:00 dan 23:00 gacha)
cron.schedule('0 13,15,17,19,21,23 * * *', () => {
    console.log('Muhim darslar eslatmasi tekshirilmoqda...');
    const tomorrowSchedule = getTomorrowSchedule();
    
    if (tomorrowSchedule && hasImportantClasses(tomorrowSchedule)) {
        const importantSubjects = getImportantSubjects();
        const tomorrowImportant = tomorrowSchedule.subjects.filter(subject => {
            const subjectName = subject.split(' ')[0];
            return importantSubjects.includes(subjectName);
        });
        
        let message = '⚠️ Eslatma! Ertaga muhim darslaringiz bor:\n\n';
        tomorrowImportant.forEach((subject, index) => {
            const parts = subject.split(' ');
            const timeIndex = parts.findIndex(part => part.includes(':'));
            
            if (timeIndex !== -1) {
                const subjectName = parts.slice(0, timeIndex).join(' ');
                const timeSlot = parts.slice(timeIndex).join(' ');
                message += `📚 ${subjectName} - ${timeSlot}\n`;
            }
        });
        message += '\n📝 Tayyorgarlik ko\'ring!';
        
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