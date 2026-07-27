const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports.config = {
  name: "اكيرا",
  aliases: ["ai", "ذكاء"],
  version: "1.3",
  credits: "أبو هريرة",
  countDown: 2,
  hasPermssion: 0,
  description: "ذكاء اصطناعي سريع جداً",
  commandCategory: "ai",
  usages: "اكيرا [سؤال]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const query = args.join(" ");

  try {
    if (!query) {
      return api.sendMessage(
        `⌬ ━━ akira AI ━━ ⌬\n\n⚠️ اكتب سؤالك بعد الأمر.\nمثال: اكيرا من أنت؟`,
        threadID,
        messageID
      );
    }

    api.setMessageReaction("⏳", messageID, () => {}, true);

    const res = await axios.get(
      `https://text.pollinations.ai/${encodeURIComponent(query)}?model=openai`
    );

    const respond = res.data;

    api.sendMessage(
      `⌬ ━━ akira AI ━━ ⌬\n\n💬 ${respond}`,
      threadID,
      (err, info) => {
        if (err) return;

        api.setMessageReaction("✅", messageID, () => {}, true);

        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID
        });
      },
      messageID
    );

  } catch (error) {
    api.setMessageReaction("❌", messageID, () => {}, true);

    api.sendMessage(
      `⌬ ━━ akira AI ━━ ⌬\n\n⚠️ حدث خطأ في الذكاء الاصطناعي.\n📝 ${error.message}`,
      threadID,
      messageID
    );

    console.log(chalk.red(`[AKIRA AI ERROR] ${error.message}`));
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;

  try {
    if (senderID != handleReply.author) return;

    api.setMessageReaction("⏳", messageID, () => {}, true);

    const res = await axios.get(
      `https://text.pollinations.ai/${encodeURIComponent(body)}?model=openai`
    );

    const respond = res.data;

    api.sendMessage(
      `⌬ ━━ akira AI ━━ ⌬\n\n💬 ${respond}`,
      threadID,
      (err, info) => {
        if (err) return;

        api.setMessageReaction("✅", messageID, () => {}, true);

        global.client.handleReply.push({
          name: "اكيرا",
          messageID: info.messageID,
          author: senderID
        });
      },
      messageID
    );

  } catch (error) {
    api.setMessageReaction("❌", messageID, () => {}, true);

    api.sendMessage(
      `⌬ ━━ akira AI ━━ ⌬\n\n⚠️ حدث خطأ أثناء الرد.\n📝 ${error.message}`,
      threadID,
      messageID
    );

    console.log(chalk.red(`[AKIRA REPLY ERROR] ${error.message}`));
  }
};