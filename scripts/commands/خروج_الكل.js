const chalk = require('chalk');
const fs = require('fs');

module.exports.config = {
  name: "خروج_الكل",
  aliases: ["leaveall", "مغادرة_الكل"],
  version: "1.0",
  credits: "أبو هريرة",
  countDown: 10,
  role: 2,
  description: "مغادرة جميع المجموعات (للمطور فقط)",
  commandCategory: "developer",
  usages: "خروج_الكل [تأكيد]",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  try {
    // ✅ التحقق من المطور
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    const devUID = config.adminUIDs?.[0] || "61578581225040";

    if (senderID != devUID) {
      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n⛔ هذا الأمر للمطور فقط!`,
        threadID,
        messageID
      );
    }

    // ✅ طلب تأكيد
    if (!args[0] || args[0] !== "تأكيد") {
      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n⚠️ تحذير! أنت على وشك مغادرة جميع المجموعات.\n\n📌 هذا الإجراء لا يمكن التراجع عنه!\n\n📝 للتأكيد: خروج_الكل تأكيد`,
        threadID,
        messageID
      );
    }

    api.setMessageReaction("⏳", messageID, () => {}, true);

    // جلب جميع المجموعات
    const inbox = await api.getThreadList(500, null, ["INBOX"]);
    const groupList = inbox.filter(group => group.isGroup == true);

    if (groupList.length === 0) {
      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n⚠️ البوت ليس داخل أي مجموعة.`,
        threadID,
        messageID
      );
    }

    let leftCount = 0;
    let failCount = 0;

    // إرسال رسالة بدء
    await api.sendMessage(
      `⌬ ━━ akira ━━ ⌬\n\n🔄 جاري مغادرة ${groupList.length} مجموعة...`,
      threadID,
      messageID
    );

    // مغادرة كل مجموعة
    for (const group of groupList) {
      try {
        await api.removeUserFromGroup(api.getCurrentUserID(), group.threadID);
        leftCount++;
        console.log(chalk.green(`[AKIRA] ✅ تم مغادرة: ${group.name || group.threadID}`));
        // تأخير بسيط لتجنب الحظر
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        failCount++;
        console.log(chalk.red(`[AKIRA] ❌ فشل مغادرة: ${group.name || group.threadID} - ${e.message}`));
      }
    }

    api.setMessageReaction("✅", messageID, () => {}, true);

    // التقرير النهائي
    return api.sendMessage(
      `⌬ ━━ akira ━━ ⌬\n\n📊 تقرير مغادرة المجموعات:\n\n✅ تم المغادرة: ${leftCount} مجموعة\n❌ فشل: ${failCount} مجموعة\n📌 المجموع: ${groupList.length}`,
      threadID,
      messageID
    );

  } catch (error) {
    console.log(chalk.red(`[AKIRA LEAVEALL ERROR] ${error.message}`));
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage(
      `⌬ ━━ akira ━━ ⌬\n\n⚠️ حدث خطأ في النظام.\n📝 ${error.message}`,
      threadID,
      messageID
    );
  }
};