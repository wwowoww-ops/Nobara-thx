const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: "الكلام",
  handle: async function({ api, event }) {
    // التأكد من أن الحدث هو رسالة
    if (event.type !== "message" && event.type !== "message_reply") return;

    const { threadID, senderID, messageID } = event;

    try {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 📁 قراءة إعدادات منع الكلام
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const filePath = path.join(__dirname, '..', 'commands', 'admin', 'cache', 'mute.json');
      
      if (!fs.existsSync(filePath)) return;
      
      const data = JSON.parse(fs.readFileSync(filePath));
      
      // إذا لم تكن المجموعة في القائمة أو معطلة
      if (!data[threadID] || !data[threadID].active) return;

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ✅ التحقق من أن البوت أدمن
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const threadInfo = await new Promise((resolve, reject) => {
        api.getThreadInfo(threadID, (err, info) => {
          if (err) reject(err); else resolve(info);
        });
      });

      const isBotAdmin = threadInfo.adminIDs.some(
        admin => admin.id == api.getCurrentUserID()
      );

      if (!isBotAdmin) {
        console.log(chalk.yellow(`[AKIRA] البوت ليس أدمن في ${threadID}`));
        return;
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ✅ التحقق من أن المرسل ليس أدمن
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const isSenderAdmin = threadInfo.adminIDs.some(
        admin => admin.id == senderID
      );

      if (isSenderAdmin) return; // الأدمن يستطيع الكلام

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🗑️ حذف الرسالة
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      try {
        await api.unsendMessage(messageID);
      } catch (e) {
        console.log(chalk.yellow(`[AKIRA] فشل حذف الرسالة: ${e.message}`));
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🚫 طرد العضو فوراً
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      try {
        await api.removeUserFromGroup(senderID, threadID);
      } catch (e) {
        console.log(chalk.red(`[AKIRA] فشل طرد العضو: ${e.message}`));
        return;
      }

      // جلب اسم العضو
      let userName = "عضو";
      try {
        const userInfo = await new Promise((resolve, reject) => {
          api.getUserInfo(senderID, (err, info) => {
            if (err) reject(err); else resolve(info);
          });
        });
        userName = userInfo[senderID]?.name || "عضو";
      } catch (e) {}

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 📨 إرسال رسالة الطرد
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      await api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n🚫 تم طرد ${userName}!\n\n📌 سبب الطرد: التحدث أثناء منع الكلام.\n⚠️ الكلام ممنوع في هذه المجموعة.`,
        threadID
      );

      console.log(chalk.green(`[AKIRA] ✅ تم طرد ${userName} من ${threadID}`));

    } catch (error) {
      console.log(chalk.red(`[AKIRA] ❌ خطأ في منع الكلام: ${error.message}`));
    }
  }
};