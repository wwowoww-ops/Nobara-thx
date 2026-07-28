const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "الكلام",
  aliases: ["ممنوع_الكلام", "كتم"],
  version: "1.0",
  credits: "أبو هريرة",
  countDown: 5,
  hasPermssion: 1,
  description: "منع أو السماح بالكلام في المجموعة (طرد فوري للمخالف)",
  commandCategory: "admin",
  usages: "الكلام [ممنوع/مسموح]",
  cooldowns: 5
};

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

    // ملف التخزين
    const filePath = path.join(__dirname, "cache", "mute.json");
    if (!fs.existsSync(path.join(__dirname, "cache"))) {
      fs.mkdirSync(path.join(__dirname, "cache"), { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
    }

    let data = JSON.parse(fs.readFileSync(filePath));

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ❌ ممنوع (تفعيل منع الكلام)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (args[0] === "ممنوع" || args[0] === "منع" || args[0] === "on") {
      data[threadID] = { active: true };
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n🔇 تم منع الكلام!\n\n🚫 الأعضاء غير مسموح لهم بالكلام.\n📌 الأدمن فقط يستطيعون الكلام.\n⚠️ المخالف سيتم طرده فوراً.`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✅ مسموح (إيقاف منع الكلام)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (args[0] === "مسموح" || args[0] === "سماح" || args[0] === "off") {
      delete data[threadID];
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n🔊 تم السماح بالكلام!\n\n✅ يمكن للأعضاء التحدث الآن.`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📊 عرض الحالة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const status = data[threadID]?.active ? "ممنوع 🔇" : "مسموح 🔊";
    return api.sendMessage(
      `⌬ ━━ akira ━━ ⌬\n\n📊 حالة الكلام: ${status}\n\n📝 الاستخدام:\n• الكلام ممنوع (لتفعيل المنع)\n• الكلام مسموح (لإلغاء المنع)`,
      threadID,
      messageID
    );

  } catch (error) {
    console.log(chalk.red(`[AKIRA MUTE ERROR] ${error.message}`));
    return api.sendMessage(
      `⌬ ━━ akira ━━ ⌬\n\n⚠️ حدث خطأ في النظام.\n📝 ${error.message}`,
      threadID,
      messageID
    );
  }
};