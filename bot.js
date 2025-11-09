const TelegramBot = require("node-telegram-bot-api");
const readline = require("readline");

// Sizning bot tokeningiz
const token = "8234260460:AAGtMKfgmDt4Q7rFEOnT73F5fysa_tlgbxY";

// Sizning guruh ID
const chatId = "-1002971513569";

// Bot yaratamiz
const bot = new TelegramBot(token, { polling: false });

// Terminaldan o‘qish uchun interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: ">> ",
});

console.log("Terminalga yozing va xabar guruhga yuboriladi!");
rl.prompt();

rl.on("line", (line) => {
  if (line.trim().length > 0) {
    bot.sendMessage(chatId, line.trim())
      .then(() => console.log("✅ Xabar yuborildi!"))
      .catch((err) => console.error("❌ Xato:", err));
  }
  rl.prompt();
}).on("close", () => {
  console.log("Dastur tugatildi.");
  process.exit(0);
});
