const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const token = '8234260460:AAGtMKfgmDt4Q7rFEOnT73F5fysa_tlgbxY';
const bot = new TelegramBot(token, { polling: true });

// Fayllar yo'li
const scheduleFile = path.join(__dirname, 'raspisaniya.json');
const usersFile = path.join(__dirname, 'users.json');
const adminsFile = path.join(__dirname, 'admins.json');

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

// Adminlar ma'lumotlarini yuklash
function loadAdmins() {
    try {
        const data = fs.readFileSync(adminsFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Adminlar faylini o\'qishda xatolik:', error);
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

// Adminlar ma'lumotlarini saqlash
function saveAdmins(admins) {
    try {
        fs.writeFileSync(adminsFile, JSON.stringify(admins, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Adminlar faylini saqlashda xatolik:', error);
        return false;
    }
}

// Foydalanuvchilarni yuklash
let users = loadUsers();
let admins = loadAdmins();

// Admin ekanligini tekshirish
function isAdmin(userId) {
    return admins[userId] !== undefined;
}

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

// Adminlar uchun asosiy menyu
function getAdminMainKeyboard() {
    return {
        keyboard: [
            ['👨‍💼 Admin paneli', '📚 Dars jadvali']
        ],
        resize_keyboard: true,
        one_time_keyboard: false
    };
}

// Admin paneli tugmalari (huquqlarga qarab)
function getAdminPanelKeyboard(userId) {
    const admin = admins[userId];
    const buttons = [];
    
    if (admin.canEditSchedule) {
        buttons.push(['📝 Dars jadvalini o\'zgartirish']);
    }
    
    if (admin.canCreateAdmin) {
        buttons.push(['➕ Yangi admin tayyorlash']);
    }
    
    buttons.push(['🔙 Orqaga']);
    
    return {
        keyboard: buttons,
        resize_keyboard: true,
        one_time_keyboard: false
    };
}

// Oddiy foydalanuvchilar uchun dars jadvali yuborish
function sendScheduleToUser(chatId, userName) {
    if (isSchoolTimeForToday()) {
        const todaySchedule = getTodaySchedule();
        if (todaySchedule) {
            const scheduleMessage = `📚 ${userName}, bugungi dars jadvali:\n\n` + formatScheduleSimple(todaySchedule);
            bot.sendMessage(chatId, scheduleMessage);
        }
    } else if (isTimeForTomorrow()) {
        const tomorrowSchedule = getTomorrowSchedule();
        if (tomorrowSchedule) {
            const scheduleMessage = `📅 ${userName}, ertangi kun uchun dars jadvali:\n\n` + formatScheduleSimple(tomorrowSchedule);
            bot.sendMessage(chatId, scheduleMessage);
        }
    } else {
        const todaySchedule = getTodaySchedule();
        if (todaySchedule) {
            const scheduleMessage = `📚 ${userName}, bugungi dars jadvali:\n\n` + formatScheduleSimple(todaySchedule);
            bot.sendMessage(chatId, scheduleMessage);
        }
    }
}

// /start buyrug'i
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Admin tekshiruvi
    if (isAdmin(userId)) {
        const admin = admins[userId];
        const welcomeMessage = `Assalomu alaykum, ${admin.name}! 👋\n\nSiz admin sifatida tizimga kirdingiz.`;
        bot.sendMessage(chatId, welcomeMessage, {
            reply_markup: getAdminMainKeyboard()
        });
        return;
    }
    
    // Oddiy foydalanuvchilar uchun
    const existingUser = Object.values(users).find(user => user.chatId === chatId);
    
    if (existingUser) {
        sendScheduleToUser(chatId, existingUser.name);
    } else {
        // Yangi foydalanuvchi
        users[userId] = { chatId: chatId, waitingForName: true };
        bot.sendMessage(chatId, 'Assalomu alaykum! Iltimos, ismingizni kiriting:');
    }
});

// Xabarlarni qayta ishlash
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    
    // Buyruqlarni ignore qilish
    if (text && text.startsWith('/')) return;
    
    // Admin ekanligi tekshiruvi
    if (isAdmin(userId)) {
        handleAdminMessage(msg);
        return;
    }
    
    // Oddiy foydalanuvchilar uchun
    if (users[userId] && users[userId].waitingForName) {
        users[userId].name = text;
        users[userId].waitingForName = false;
        
        saveUsers(users);
        
        const welcomeMessage = `Xush kelibsiz, ${text}! Bugundan boshlab men sizga kunlik dars jadvalini yuborib boraman.`;
        bot.sendMessage(chatId, welcomeMessage);
        
        sendScheduleToUser(chatId, text);
    } else if (users[userId] && users[userId].editingDay && !users[userId].waitingForName) {
        const day = users[userId].editingDay;
        const newSubjects = text.split('\n').filter(subject => subject.trim() !== '');
        
        const schedule = loadSchedule();
        if (!schedule['9A']) schedule['9A'] = {};
        
        schedule['9A'][day] = newSubjects;
        
        if (saveSchedule(schedule)) {
            bot.sendMessage(chatId, `✅ ${day} kunining jadvali muvaffaqiyatli yangilandi!`);
            
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
        saveUsers(users);
    }
});

// Admin xabarlarini qayta ishlash
function handleAdminMessage(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    const admin = admins[userId];
    
    // Admin state tekshiruvi
    if (admin.waitingForAdminId) {
        handleNewAdminId(chatId, userId, text);
        return;
    }
    
    if (admin.editingDay) {
        handleScheduleEdit(chatId, userId, text);
        return;
    }
    
    // Menu tugmalari
    switch (text) {
        case '👨‍💼 Admin paneli':
            bot.sendMessage(chatId, 'Admin paneli:', {
                reply_markup: getAdminPanelKeyboard(userId)
            });
            break;
            
        case '📚 Dars jadvali':
            sendScheduleToUser(chatId, admin.name);
            break;
            
        case '📝 Dars jadvalini o\'zgartirish':
            if (admin.canEditSchedule) {
                showDaySelector(chatId, userId, 'admin_edit');
            } else {
                bot.sendMessage(chatId, '❌ Sizda bu huquq yo\'q!');
            }
            break;
            
        case '➕ Yangi admin tayyorlash':
            if (admin.canCreateAdmin) {
                admin.waitingForAdminId = true;
                saveAdmins(admins);
                bot.sendMessage(chatId, 'Yangi admin ID sini kiriting:');
            } else {
                bot.sendMessage(chatId, '❌ Sizda bu huquq yo\'q!');
            }
            break;
            
        case '🔙 Orqaga':
            bot.sendMessage(chatId, 'Asosiy menyu:', {
                reply_markup: getAdminMainKeyboard()
            });
            break;
    }
}

// Kun tanlash menyusini ko'rsatish
function showDaySelector(chatId, userId, prefix) {
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Dushanba', callback_data: `${prefix}_Dushanba` }],
                [{ text: 'Seshanba', callback_data: `${prefix}_Seshanba` }],
                [{ text: 'Chorshanba', callback_data: `${prefix}_Chorshanba` }],
                [{ text: 'Payshanba', callback_data: `${prefix}_Payshanba` }],
                [{ text: 'Juma', callback_data: `${prefix}_Juma` }],
                [{ text: 'Shanba', callback_data: `${prefix}_Shanba` }]
            ]
        }
    };
    
    bot.sendMessage(chatId, 'Qaysi kunning jadvalini o\'zgartirmoqchisiz?', keyboard);
}

// Yangi admin ID ni qayta ishlash
function handleNewAdminId(chatId, userId, text) {
    const newAdminId = text.trim();
    
    if (!/^\d+$/.test(newAdminId)) {
        bot.sendMessage(chatId, '❌ Noto\'g\'ri ID format! Faqat raqamlar kiriting.');
        return;
    }
    
    // Admin allaqachon mavjudligini tekshirish
    if (admins[newAdminId]) {
        bot.sendMessage(chatId, '❌ Bu foydalanuvchi allaqachon admin!');
        admins[userId].waitingForAdminId = false;
        saveAdmins(admins);
        return;
    }
    
    // Yangi admin ma'lumotlarini saqlash
    admins[userId].newAdminId = newAdminId;
    admins[userId].waitingForAdminId = false;
    
    saveAdmins(admins);
    
    // Huquqlarni tanlash
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '📝 Dars jadvalini o\'zgartirish', callback_data: 'perm_edit_schedule' }
                ],
                [
                    { text: '➕ Yangi admin saylash', callback_data: 'perm_create_admin' }
                ],
                [
                    { text: '✅ Huquqlarni tasdiqlash', callback_data: 'perm_confirm' }
                ]
            ]
        }
    };
    
    bot.sendMessage(chatId, 'Qaysi huquqlarni berasiz?\n(Bir nechta tanlashingiz mumkin)', keyboard);
}

// Dars jadvalini tahrirlash
function handleScheduleEdit(chatId, userId, text) {
    const admin = admins[userId];
    const day = admin.editingDay;
    const newSubjects = text.split('\n').filter(subject => subject.trim() !== '');
    
    const schedule = loadSchedule();
    if (!schedule['9A']) schedule['9A'] = {};
    
    schedule['9A'][day] = newSubjects;
    
    if (saveSchedule(schedule)) {
        bot.sendMessage(chatId, `✅ ${day} kunining jadvali muvaffaqiyatli yangilandi!`);
        
        const updatedScheduleData = {
            day: day,
            subjects: newSubjects
        };
        const simpleSchedule = formatScheduleSimple(updatedScheduleData);
        bot.sendMessage(chatId, `${day} kuni yangi jadvali:\n\n${simpleSchedule}`);
    } else {
        bot.sendMessage(chatId, '❌ Jadvalni saqlashda xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    }
    
    delete admin.editingDay;
    saveAdmins(admins);
    
    // Admin menyuga qaytish
    bot.sendMessage(chatId, 'Asosiy menyu:', {
        reply_markup: getAdminMainKeyboard()
    });
}

// Callback querylarni qayta ishlash
bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    
    // Admin dars jadvalini o'zgartirish
    if (data.startsWith('admin_edit_')) {
        const day = data.replace('admin_edit_', '');
        const schedule = loadSchedule();
        
        if (schedule['9A'] && schedule['9A'][day]) {
            const currentSchedule = schedule['9A'][day];
            let message = `${day} kuni hozirgi jadvali:\n\n`;
            currentSchedule.forEach((subject, index) => {
                message += `${index + 1}. ${subject}\n`;
            });
            message += '\n📝 Yangi jadval kiriting:\n\n';
            message += '▪️ Har bir fanni alohida qatorga yozing\n';
            message += '▪️ Misol:\n';
            message += '   Matematika\n';
            message += '   Fizika\n';
            message += '   Kimyo\n';
            
            admins[userId].editingDay = day;
            saveAdmins(admins);
            bot.sendMessage(chatId, message);
        }
    }
    
    // Huquqlarni tanlash
    if (data.startsWith('perm_')) {
        const admin = admins[userId];
        
        if (!admin.newAdminPermissions) {
            admin.newAdminPermissions = {
                canEditSchedule: false,
                canCreateAdmin: false
            };
        }
        
        if (data === 'perm_edit_schedule') {
            admin.newAdminPermissions.canEditSchedule = !admin.newAdminPermissions.canEditSchedule;
            saveAdmins(admins);
            
            const status = admin.newAdminPermissions.canEditSchedule ? '✅' : '❌';
            const keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: `${admin.newAdminPermissions.canEditSchedule ? '✅' : '📝'} Dars jadvalini o\'zgartirish`, callback_data: 'perm_edit_schedule' }
                        ],
                        [
                            { text: `${admin.newAdminPermissions.canCreateAdmin ? '✅' : '➕'} Yangi admin saylash`, callback_data: 'perm_create_admin' }
                        ],
                        [
                            { text: '✅ Huquqlarni tasdiqlash', callback_data: 'perm_confirm' }
                        ]
                    ]
                }
            };
            
            bot.editMessageReplyMarkup(keyboard.reply_markup, {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id
            });
        } else if (data === 'perm_create_admin') {
            admin.newAdminPermissions.canCreateAdmin = !admin.newAdminPermissions.canCreateAdmin;
            saveAdmins(admins);
            
            const keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: `${admin.newAdminPermissions.canEditSchedule ? '✅' : '📝'} Dars jadvalini o\'zgartirish`, callback_data: 'perm_edit_schedule' }
                        ],
                        [
                            { text: `${admin.newAdminPermissions.canCreateAdmin ? '✅' : '➕'} Yangi admin saylash`, callback_data: 'perm_create_admin' }
                        ],
                        [
                            { text: '✅ Huquqlarni tasdiqlash', callback_data: 'perm_confirm' }
                        ]
                    ]
                }
            };
            
            bot.editMessageReplyMarkup(keyboard.reply_markup, {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id
            });
        } else if (data === 'perm_confirm') {
            const newAdminId = admin.newAdminId;
            const permissions = admin.newAdminPermissions;
            
            if (!permissions.canEditSchedule && !permissions.canCreateAdmin) {
                bot.sendMessage(chatId, '❌ Kamida bitta huquq tanlang!');
                bot.answerCallbackQuery(callbackQuery.id);
                return;
            }
            
            // Yangi adminni yaratish
            admins[newAdminId] = {
                chatId: parseInt(newAdminId),
                name: 'Yangi admin',
                canEditSchedule: permissions.canEditSchedule,
                canCreateAdmin: permissions.canCreateAdmin
            };
            
            // Tozalash
            delete admin.newAdminId;
            delete admin.newAdminPermissions;
            
            saveAdmins(admins);
            
            let permissionsText = '🔐 Huquqlar:\n';
            if (permissions.canEditSchedule) permissionsText += '   ✅ Dars jadvalini o\'zgartirish\n';
            if (permissions.canCreateAdmin) permissionsText += '   ✅ Yangi admin saylash\n';
            
            bot.sendMessage(chatId, `✅ Yangi admin muvaffaqiyatli yaratildi!\n\nAdmin ID: ${newAdminId}\n${permissionsText}\n\nAdmin /start buyrug'ini yuborib tizimga kirishi mumkin.`);
            
            // Admin menyuga qaytish
            bot.sendMessage(chatId, 'Asosiy menyu:', {
                reply_markup: getAdminMainKeyboard()
            });
        }
    }
    
    bot.answerCallbackQuery(callbackQuery.id);
});

// Avtomatik jadval yuborish - har kuni 06:30 da bugungi jadval (Toshkent vaqti bo'yicha)
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
}, {
    timezone: 'Asia/Tashkent'
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
}, {
    timezone: 'Asia/Tashkent'
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
}, {
    timezone: 'Asia/Tashkent'
});

console.log('Bot ishga tushdi! Foydalanuvchilar /start buyrug\'ini yuborishlari mumkin.');

bot.on('error', (error) => {
    console.error('Bot xatoligi:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});
