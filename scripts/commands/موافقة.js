const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "موافقة",
  aliases: ["approve", "approval"],
  version: "1.0",
  credits: "أبو هريرة",
  countDown: 5,
  hasPermssion: 1,
  description: "تشغيل أو إيقاف ميزة موافقة الأعضاء",
  commandCategory: "admin",
  usages: "موافقة [تشغيل/إيقاف]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  try {
    api.setMessageReaction("⏳", messageID, () => {}, true);

    // معلومات المجموعة
    const threadInfo = await api.getThreadInfo(threadID);

    // التحقق من الأدمن
    const isAdmin = threadInfo.adminIDs.some(
      admin => admin.id == senderID
    );

    if (!isAdmin) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n⛔ هذا الأمر للأدمن فقط.`,
        threadID,
        messageID
      );
    }

    // ملف التخزين
    const filePath = path.join(__dirname, "cache", "approval.json");

    // إنشاء الملف إذا غير موجود
    if (!fs.existsSync(path.join(__dirname, "cache"))) {
      fs.mkdirSync(path.join(__dirname, "cache"), { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
    }

    let data = JSON.parse(fs.readFileSync(filePath));

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // تشغيل
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (args[0] === "تشغيل" || args[0] === "on") {
      data[threadID] = true;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      api.setMessageReaction("✅", messageID, () => {}, true);
      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n✅ تم تشغيل ميزة موافقة الأعضاء.\n📌 سيتم قبول الأعضاء تلقائياً.`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // إيقاف
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (args[0] === "إيقاف" || args[0] === "off") {
      data[threadID] = false;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      api.setMessageReaction("✅", messageID, () => {}, true);
      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n✅ تم إيقاف ميزة موافقة الأعضاء.\n📌 لن يتم قبول الأعضاء تلقائياً.`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // عرض الحالة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const status = data[threadID] ? "مفعل ✅" : "معطل ❌";
    return api.sendMessage(
      `⌬ ━━ akira ━━ ⌬\n\n📊 حالة موافقة الأعضاء: ${status}\n\n📝 الاستخدام:\n• موافقة تشغيل (لتفعيل)\n• موافقة إيقاف (لإلغاء)`,
      threadID,
      messageID
    );

  } catch (error) {
    console.log(chalk.red(`[AKIRA APPROVAL ERROR] ${error.message}`));
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage(
      `⌬ ━━ akira ━━ ⌬\n\n⚠️ حدث خطأ في النظام.\n📝 ${error.message}`,
      threadID,
      messageID
    );
  }
};