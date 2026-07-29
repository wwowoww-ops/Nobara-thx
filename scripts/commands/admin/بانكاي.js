const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "بانكاي",
  aliases: ["kick", "طرد"],
  version: "2.0",
  credits: "أبو هريرة",
  countDown: 5,
  role: 1,
  description: "طرد عضو مع صورة بانكاي (GIF)",
  commandCategory: "admin",
  usages: "بانكاي [@منشن] أو رد على رسالة",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, mentions, messageReply } = event;

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const isAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);
    const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID());

    if (!isAdmin) {
      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n⛔ هذا الأمر للأدمن فقط!`,
        threadID,
        messageID
      );
    }

    if (!isBotAdmin) {
      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n⚠️ يجب أن أكون أدمن في المجموعة لاستخدام هذا الأمر`,
        threadID,
        messageID
      );
    }

    let targetID;

    if (messageReply) {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else {
      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n📝 الاستخدام:\n• بانكاي @منشن\n• أو قم بالرد على رسالة العضو`,
        threadID,
        messageID
      );
    }

    if (!targetID) {
      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n❌ لم يتم تحديد العضو المستهدف.`,
        threadID,
        messageID
      );
    }

    // ═══════════════════════════════════════════════
    // 🛡️ حماية المطور
    // ═══════════════════════════════════════════════
    const config = JSON.parse(fs.readFileSync("./config.json", 'utf8'));
    const devUID = config.adminUIDs?.[0] || "61578581225040";

    if (targetID === devUID) {
      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n🛡️ لا يمكن طرد المطور!`,
        threadID,
        messageID
      );
    }

    if (targetID === api.getCurrentUserID()) {
      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n😅 لا يمكنني طرد نفسي!`,
        threadID,
        messageID
      );
    }

    // منع طرد الأدمن
    const targetIsAdmin = threadInfo.adminIDs.some(admin => admin.id === targetID);
    if (targetIsAdmin) {
      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n⚠️ لا يمكن طرد أدمن.`,
        threadID,
        messageID
      );
    }

    // جلب اسم العضو
    let userName = "العضو";
    try {
      const userInfo = await api.getUserInfo(targetID);
      userName = userInfo[targetID]?.name || "العضو";
    } catch (e) {}

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🖼️ تحميل صورة بانكاي (GIF)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);
    const pathImg = path.join(cacheDir, `bankai_${Date.now()}.gif`);

    let imageAttachment = null;

    try {
      const response = await axios.get(
        "https://www.image2url.com/r2/default/gifs/1784918159700-c4c984fc-ae25-4b9e-9e95-c4339273808f.gif",
        { responseType: "arraybuffer", timeout: 15000 }
      );
      fs.writeFileSync(pathImg, Buffer.from(response.data));
      
      if (fs.existsSync(pathImg)) {
        imageAttachment = fs.createReadStream(pathImg);
      }
    } catch (e) {
      console.log("❌ فشل تحميل الصورة:", e.message);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📨 إرسال رسالة الطرد
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const messageBody = `⌬ ━━ akira ━━ ⌬\n\n🔥 BANKAI! ZANKA NO TACHI 🔥\n\n(BLADE OF EMBER)\n\n✅ تم طرد العضو:\n📌 ${userName}\n🆔 ${targetID}`;

    if (imageAttachment) {
      await api.sendMessage(
        {
          body: messageBody,
          attachment: imageAttachment
        },
        threadID
      );
    } else {
      await api.sendMessage(messageBody, threadID);
    }

    // طرد العضو
    await api.removeUserFromGroup(targetID, threadID);

    // حذف الملفات المؤقتة
    try {
      if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
    } catch (_) {}

  } catch (error) {
    console.error("بانكاي - خطأ:", error);
    return api.sendMessage(
      `⌬ ━━ akira ━━ ⌬\n\n❌ حدث خطأ: ${error.message}`,
      threadID,
      messageID
    );
  }
};