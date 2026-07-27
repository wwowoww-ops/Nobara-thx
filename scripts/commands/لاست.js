const chalk = require('chalk');

module.exports.config = {
  name: "لاست",
  aliases: ["list", "groups"],
  version: "1.0",
  credits: "أبو هريرة",
  countDown: 5,
  role: 2,
  description: "عرض قائمة المجموعات والخروج منها",
  commandCategory: "developer",
  usages: "لاست",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  try {
    // التحقق من المطور
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    const adminUID = config.adminUIDs?.[0] || "61578581225040";

    if (senderID != adminUID) {
      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n⛔ هذا الأمر للمطور فقط!`,
        threadID,
        messageID
      );
    }

    api.setMessageReaction("⏳", messageID, () => {}, true);

    // جلب كل المجموعات
    const inbox = await api.getThreadList(100, null, ["INBOX"]);

    const groupList = inbox.filter(
      group => group.isGroup == true
    );

    if (groupList.length == 0) {
      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n⚠️ البوت ليس داخل أي مجموعة.`,
        threadID,
        messageID
      );
    }

    let msg = `⌬ ━━ akira GROUPS ━━ ⌬\n\n📋 قائمة المجموعات (${groupList.length}):\n\n`;

    groupList.forEach((group, index) => {
      msg += `${index + 1}. ${group.name || "بدون اسم"}\n`;
      msg += `🆔 ${group.threadID}\n\n`;
    });

    msg += "📌 رد برقم المجموعة ليخرج البوت منها.";

    api.sendMessage(
      msg,
      threadID,
      (err, info) => {
        if (err) return;

        global.client.handleReply.push({
          name: this.config.name,
          author: senderID,
          messageID: info.messageID,
          groups: groupList
        });

        api.setMessageReaction("✅", messageID, () => {}, true);
      },
      messageID
    );

  } catch (error) {
    console.log(chalk.red(`[AKIRA LIST ERROR] ${error.message}`));
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage(
      `⌬ ━━ akira ━━ ⌬\n\n⚠️ حدث خطأ في النظام.\n📝 ${error.message}`,
      threadID,
      messageID
    );
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;

  try {
    if (senderID != handleReply.author) return;

    const index = parseInt(body);

    if (isNaN(index)) {
      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n⚠️ اكتب رقم صحيح.`,
        threadID,
        messageID
      );
    }

    const selectedGroup = handleReply.groups[index - 1];

    if (!selectedGroup) {
      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n⚠️ هذا الرقم غير موجود.`,
        threadID,
        messageID
      );
    }

    api.setMessageReaction("⏳", messageID, () => {}, true);

    // خروج البوت من المجموعة
    api.removeUserFromGroup(
      api.getCurrentUserID(),
      selectedGroup.threadID,
      (err) => {
        if (err) {
          api.setMessageReaction("❌", messageID, () => {}, true);
          return api.sendMessage(
            `⌬ ━━ akira ━━ ⌬\n\n⚠️ فشل الخروج من المجموعة.\n📝 ${err.message}`,
            threadID,
            messageID
          );
        }

        api.setMessageReaction("✅", messageID, () => {}, true);
        return api.sendMessage(
          `⌬ ━━ akira ━━ ⌬\n\n✅ تم خروج البوت من:\n📌 ${selectedGroup.name}`,
          threadID,
          messageID
        );
      }
    );

  } catch (error) {
    console.log(chalk.red(`[AKIRA REPLY ERROR] ${error.message}`));
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage(
      `⌬ ━━ akira ━━ ⌬\n\n⚠️ حدث خطأ أثناء التنفيذ.\n📝 ${error.message}`,
      threadID,
      messageID
    );
  }
};