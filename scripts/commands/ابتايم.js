const os = require('os');
const chalk = require('chalk');
const fs = require('fs');

module.exports.config = {
  name: "ابتايم",
  aliases: ["up", "السيرفر"],
  version: "1.5",
  credits: "أبو هريرة",
  countDown: 5,
  hasPermssion: 0,
  description: "عرض إحصائيات السيرفر ووقت التشغيل",
  commandCategory: "utility",
  usages: "ابتايم",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;

  try {
    api.setMessageReaction("⏳", messageID, () => {}, true);

    // حساب وقت التشغيل (Uptime)
    const uptimeSeconds = process.uptime();
    const days = Math.floor(uptimeSeconds / (3600 * 24));
    const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);

    // حساب الذاكرة (Memory)
    const usedMemory = process.memoryUsage().rss / 1024 / 1024;
    const totalMemory = os.totalmem() / 1024 / 1024;
    
    // معلومات النظام
    const platform = os.platform();
    const arch = os.arch();
    const cpuModel = os.cpus()[0].model;
    const ping = Date.now() - event.timestamp;

    // عدد المجموعات
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    const botName = config.botName || "akira";
    const adminName = config.adminName || "أبو هريرة";

    const response = `
⌬ ━━ akira SYSTEM ━━ ⌬

⏱️ وقت التشغيل:
${days} يوم، ${hours} ساعة، ${minutes} دقيقة

📊 الإحصائيات:
• سرعة الاستجابة: ${ping}ms
• الذاكرة المستخدمة: ${usedMemory.toFixed(2)} MB
• إجمالي الذاكرة: ${totalMemory.toFixed(0)} MB

🖥️ النظام:
• نظام التشغيل: ${platform} (${arch})
• المعالج: ${cpuModel}

🤖 البوت:
• الاسم: ${botName}
• المطور: ${adminName}
• الحالة: 🟢 ONLINE

⌬ ━━━━━━━━━━━━━━━━ ⌬`;

    api.sendMessage(response, threadID, () => {
      api.setMessageReaction("✅", messageID, () => {}, true);
    }, messageID);

    console.log(chalk.green(`[AKIRA] ✅ تم عرض الإحصائيات`));

  } catch (error) {
    console.log(chalk.red(`[AKIRA ERROR] ${error.message}`));
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage(
      `⌬ ━━ akira ━━ ⌬\n\n⚠️ فشل جلب إحصائيات السيرفر.\n📝 ${error.message}`,
      threadID,
      messageID
    );
  }
};