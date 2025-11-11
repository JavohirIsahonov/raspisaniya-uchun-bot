const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const readline = require("readline");

const token = "8234260460:AAGtMKfgmDt4Q7rFEOnT73F5fysa_tlgbxY";

const groupChatId = -1002971513569;

const bot = new TelegramBot(token, { polling: false });

function loadUsers() {
  try {
    const data = fs.readFileSync("users.json", "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("❌ users.json faylini o'qishda xatolik:", error);
    return {};
  }
}

async function sendMessageToAll(message) {
  const users = loadUsers();
  let successCount = 0;
  let failCount = 0;

  console.log("\n📤 Xabar yuborilmoqda...\n");

  for (const [userId, userData] of Object.entries(users)) {
    const chatId = userData.chatId;

    if (chatId === groupChatId) {
      console.log(`⏭️  Guruh o'tkazib yuborildi: ${userData.name || "9 a"}`);
      continue;
    }

    try {
      await bot.sendMessage(chatId, message);
      console.log(`✅ Yuborildi: ${userData.name || chatId}`);
      successCount++;
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Xato (${userData.name || chatId}):`, error.message);
      failCount++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`📊 Natija:`);
  console.log(`   ✅ Muvaffaqiyatli: ${successCount}`);
  console.log(`   ❌ Xatolik: ${failCount}`);
  console.log(`   📝 Jami: ${successCount + failCount}`);
  console.log("=".repeat(50) + "\n");
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("=".repeat(50));
console.log("📨 XABAR YUBORISH DASTURI");
console.log("=".repeat(50));
console.log("Barcha foydalanuvchilarga yubormoqchi bo'lgan");
console.log("xabaringizni yozing va ENTER bosing:");
console.log("(Guruhga xabar yuborilmaydi)\n");

rl.question("Xabar: ", (message) => {
  if (message.trim().length === 0) {
    console.log("❌ Xabar bo'sh bo'lishi mumkin emas!");
    rl.close();
    return;
  }

  rl.question("\n⚠️  Ishonchingiz komilmi? (ha/yo'q): ", (answer) => {
    if (answer.toLowerCase() === "ha" || answer.toLowerCase() === "yes") {
      sendMessageToAll(message.trim())
        .then(() => {
          console.log("✅ Jarayon tugadi!");
          rl.close();
          process.exit(0);
        })
        .catch((err) => {
          console.error("❌ Xatolik:", err);
          rl.close();
          process.exit(1);
        });
    } else {
      console.log("❌ Bekor qilindi!");
      rl.close();
      process.exit(0);
    }
  });
});

