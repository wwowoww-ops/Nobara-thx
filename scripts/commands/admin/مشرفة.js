const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports.config = {
  name: "مشرف",
  aliases: ["vip", "المميزين"],
  version: "1.0",
  credits: "أبو هريرة",
  countDown: 5,
  hasPermssion: 1,
  description: "إدارة قائمة الأعضاء المميزين (إضافة، حذف، عرض)",
  commandCategory: "admin",
  usages: "مشرف [قائمة/إضافة/حذف] [@منشن]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, mentions, senderID } = event;
  const vipFilePath = path.join(__dirname, '../../assets/vip.json');

  // التأكد من وجود المجلد والملف
  if (!fs.existsSync(path.join(__dirname, '../../assets'))) {
    fs.mkdirSync(path.join(__dirname, '../../assets'), { recursive: true });
  }
  if (!fs.existsSync(vipFilePath)) {
    fs.writeFileSync(vipFilePath, JSON.stringify({ vips: [] }, null, 2));
  }

  let vipData = JSON.parse(fs.readFileSync(vipFilePath, 'utf8'));

  try {
    api.setMessageReaction("⏳", messageID, () => {}, true);

    // قراءة config.json للمطور
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    const devUID = config.adminUIDs?.[0] || "61578581225040";
    const isDev = senderID == devUID;

    // التحقق من صلاحية الأدمن
    const threadInfo = await api.getThreadInfo(threadID);
    const isAdmin = threadInfo.adminIDs.some(admin => admin.id == senderID);

    if (!isDev && !isAdmin) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n⛔ هذا الأمر للأدمن والمطور فقط.`,
        threadID,
        messageID
      );
    }

    const command = args[0];

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. عرض القائمة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "قائمة" || command === "list") {
      if (vipData.vips.length === 0) {
        return api.sendMessage(
          `⌬ ━━ akira ━━ ⌬\n\n📜 لا يوجد أعضاء مميزين حالياً.`,
          threadID,
          messageID
        );
      }

      let msgText = `⌬ ━━ akira VIP ━━ ⌬\n\n📋 قائمة الأعضاء المميزين (${vipData.vips.length}):\n\n`;
      for (let i = 0; i < vipData.vips.length; i++) {
        msgText += `${i + 1}. ${vipData.vips[i].name}\n🆔 ${vipData.vips[i].id}\n\n`;
      }

      api.setMessageReaction("👑", messageID, () => {}, true);
      return api.sendMessage(msgText, threadID, messageID);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. إضافة عضو (للمطور فقط)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "إضافة" || command === "add") {
      if (!isDev) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(
          `⌬ ━━ akira ━━ ⌬\n\n⛔ هذا الأمر للمطور فقط.`,
          threadID,
          messageID
        );
      }

      if (Object.keys(mentions).length === 0) {
        return api.sendMessage(
          `⌬ ━━ akira ━━ ⌬\n\n📝 استخدم: مشرف إضافة @منشن`,
          threadID,
          messageID
        );
      }

      const id = Object.keys(mentions)[0];
      const name = mentions[id].replace(/@/g, '');

      if (vipData.vips.some(v => v.id === id)) {
        return api.sendMessage(
          `⌬ ━━ akira ━━ ⌬\n\n⚠️ هذا المستخدم موجود بالفعل في القائمة.`,
          threadID,
          messageID
        );
      }

      vipData.vips.push({ id, name });
      fs.writeFileSync(vipFilePath, JSON.stringify(vipData, null, 2));
      api.setMessageReaction("✅", messageID, () => {}, true);
      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n✅ تم إضافة [ ${name} ] إلى قائمة المميزين.`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. حذف عضو (للمطور فقط)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "حذف" || command === "remove") {
      if (!isDev) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(
          `⌬ ━━ akira ━━ ⌬\n\n⛔ هذا الأمر للمطور فقط.`,
          threadID,
          messageID
        );
      }

      if (Object.keys(mentions).length === 0) {
        return api.sendMessage(
          `⌬ ━━ akira ━━ ⌬\n\n📝 استخدم: مشرف حذف @منشن`,
          threadID,
          messageID
        );
      }

      const id = Object.keys(mentions)[0];
      const index = vipData.vips.findIndex(v => v.id === id);

      if (index === -1) {
        return api.sendMessage(
          `⌬ ━━ akira ━━ ⌬\n\n⚠️ هذا المستخدم ليس في القائمة.`,
          threadID,
          messageID
        );
      }

      const removedName = vipData.vips[index].name;
      vipData.vips.splice(index, 1);
      fs.writeFileSync(vipFilePath, JSON.stringify(vipData, null, 2));
      api.setMessageReaction("✅", messageID, () => {}, true);
      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n✅ تم حذف [ ${removedName} ] من قائمة المميزين.`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 4. دليل الاستخدام
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    return api.sendMessage(
      `⌬ ━━ akira VIP ━━ ⌬\n\n📝 طريقة الاستخدام:\n\n• مشرف قائمة - عرض المميزين\n• مشرف إضافة @منشن - إضافة عضو (للمطور)\n• مشرف حذف @منشن - حذف عضو (للمطور)`,
      threadID,
      messageID
    );

  } catch (error) {
    console.log(chalk.red(`[AKIRA VIP ERROR] ${error.message}`));
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage(
      `⌬ ━━ akira ━━ ⌬\n\n⚠️ حدث خطأ في النظام.\n📝 ${error.message}`,
      threadID,
      messageID
    );
  }
};