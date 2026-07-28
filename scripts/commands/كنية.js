const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// توليد كنية عشوائية
function generateNickname() {
  const names = [
    "🔥 عضو نشط",
    "⚡ محارب",
    "☕ عضو هادئ",
    "🛡️ محمي",
    "🎭 عضو مجهول",
    "💎 VIP عضو",
    "🚀 سوبر عضو",
    "🌟 مميز",
    "👑 ملكي",
    "🌙 قمري",
    "☀️ شمسي",
    "🌸 وردي",
    "🌺 زهري",
    "✨ نجمي"
  ];
  return names[Math.floor(Math.random() * names.length)];
}

module.exports.config = {
  name: "كنية",
  aliases: ["nickname", "رتب", "rank"],
  version: "1.0",
  credits: "أبو هريرة",
  countDown: 5,
  hasPermssion: 1,
  description: "تغيير كنية جميع الأعضاء كل 5 ثواني",
  commandCategory: "admin",
  usages: "كنية [تشغيل/إيقاف]",
  cooldowns: 5
};

// تشغيل / إيقاف النظام
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  try {
    // التحقق من صلاحية الأدمن
    const threadInfo = await api.getThreadInfo(threadID);
    const isAdmin = threadInfo.adminIDs.some(admin => admin.id == senderID);
    
    if (!isAdmin) {
      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n⛔ هذا الأمر للأدمن فقط.`,
        threadID,
        messageID
      );
    }

    // التحقق من أن البوت أدمن
    const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id == api.getCurrentUserID());
    if (!isBotAdmin) {
      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n⚠️ البوت ليس أدمن في المجموعة.`,
        threadID,
        messageID
      );
    }

    // تهيئة المتغير العام
    if (!global.nicknameSpam) global.nicknameSpam = {};
    if (!global.nicknameSpam[threadID]) global.nicknameSpam[threadID] = false;

    // تشغيل أو إيقاف
    if (args[0] === "تشغيل" || args[0] === "on") {
      global.nicknameSpam[threadID] = true;
      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n✅ تم تشغيل نظام تغيير الكنية كل 5 ثواني.\n📌 سيتم تغيير كنية جميع الأعضاء تلقائياً.`,
        threadID,
        messageID
      );
    } else if (args[0] === "إيقاف" || args[0] === "off") {
      global.nicknameSpam[threadID] = false;
      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n✅ تم إيقاف نظام تغيير الكنية.\n📌 لن يتم تغيير الكنية بعد الآن.`,
        threadID,
        messageID
      );
    }

    // عرض الحالة
    const status = global.nicknameSpam[threadID] ? "مفعل ✅" : "معطل ❌";
    return api.sendMessage(
      `⌬ ━━ akira ━━ ⌬\n\n📊 حالة نظام الكنية: ${status}\n\n📝 الاستخدام:\n• كنية تشغيل (لتفعيل)\n• كنية إيقاف (لإلغاء)`,
      threadID,
      messageID
    );

  } catch (error) {
    console.log(chalk.red(`[AKIRA NICKNAME ERROR] ${error.message}`));
    return api.sendMessage(
      `⌬ ━━ akira ━━ ⌬\n\n⚠️ حدث خطأ في النظام.\n📝 ${error.message}`,
      threadID,
      messageID
    );
  }
};

// النظام التلقائي (يعمل لكل مجموعة على حدة)
setInterval(async () => {
  if (!global.nicknameSpam) return;

  try {
    for (const threadID in global.nicknameSpam) {
      if (!global.nicknameSpam[threadID]) continue;

      try {
        const threadInfo = await api.getThreadInfo(threadID);
        const botID = api.getCurrentUserID();

        // التأكد من أن البوت أدمن
        const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id == botID);
        if (!isBotAdmin) continue;

        // تغيير كنية كل عضو
        for (const user of threadInfo.userInfo) {
          if (user.id == botID) continue; // تخطي البوت نفسه
          const nickname = generateNickname();
          api.changeNickname(nickname, threadID, user.id);
        }

        console.log(chalk.green(`[كنية] تم التحديث في ${threadID}`));
      } catch (err) {
        console.log(chalk.red(`[خطأ مجموعة] ${err.message}`));
      }
    }
  } catch (e) {
    console.log(chalk.red(`[خطأ عام] ${e.message}`));
  }
}, 5000);