const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const fca = require('ws3-fca');
const axios = require('axios');
const express = require('express');

// --- تحميل الإعدادات ---
const globalConfig = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const appState = JSON.parse(fs.readFileSync('appState.json', 'utf8'));

const app = express();
const PORT = process.env.PORT || 28140;

// سيرفر الاستمرارية
app.get('/', (req, res) => res.status(200).send('akira • ONLINE ⚡'));
app.listen(PORT, () => console.log(chalk.cyan(`[Server] Web Server is running on port ${PORT}`)));

const commands = new Map();
const events = new Map();
const commandsDir = path.join(__dirname, 'scripts', 'commands');
const eventsDir = path.join(__dirname, 'scripts', 'events');

const abstractBox = chalk.hex('#55FFFF')('═══════════════✨akira✨═══════════════');

// --- تحميل الأوامر ---
fs.readdirSync(commandsDir).forEach(file => {
  if (file.endsWith('.js')) {
    const command = require(path.join(commandsDir, file));
    commands.set(command.config.name.toLowerCase(), command);
    console.log(chalk.green(`✨ Loaded Command: ${command.config.name}`));
  }
});

global.commands = commands;

// --- تحميل الأحداث ---
if (fs.existsSync(eventsDir)) {
  fs.readdirSync(eventsDir).forEach(file => {
    if (file.endsWith('.js')) {
      const eventHandler = require(path.join(eventsDir, file));
      events.set(eventHandler.name.toLowerCase(), eventHandler);
      console.log(chalk.magenta(`✨ Loaded Event: ${eventHandler.name}`));
    }
  });
}

console.log(chalk.cyan(`📊 عدد الأحداث: ${events.size}`));

// --- تشغيل البوت ---
fca({ appState }, (err, api) => {
  if (err) return console.error(chalk.red('🔥 Login Failed! Check AppState.'));

  console.log(chalk.cyan(`🌟 ${globalConfig.botName} جاهز للعمل على ريندر! 🌟`));

  api.listenMqtt((err, event) => {
    if (err || !event) return;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. معالجة الرسائل
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (event.type === 'message') {
      const { body, senderID, threadID, messageID } = event;

      api.getUserInfo(senderID, (err, info) => {
        const name = info[senderID]?.name || 'Unknown';
        console.log(abstractBox);
        console.log(chalk.cyan(`👤 العضو: ${name}\n💬 الرسالة: ${body || '[مرفق]'}\n🧵 المجموعة: ${threadID}`));
        console.log(abstractBox);
      });

      const autoDL = events.get('socialmediadownloader');
      if (autoDL) autoDL.handle({ api, event });

      if (!body) return;
      const msgLower = body.toLowerCase().trim();
      const prefix = globalConfig.prefix;

      let noPrefixCmd = [...commands.values()].find(c => c.config.usePrefix === false && (msgLower === c.config.name || c.config.aliases?.includes(msgLower)));
      if (noPrefixCmd) return noPrefixCmd.run({ api, event, args: msgLower.split(/\s+/), config: globalConfig });

      if (body.startsWith(prefix)) {
        const args = body.slice(prefix.length).trim().split(/\s+/);
        const cmdName = args.shift().toLowerCase();
        const command = commands.get(cmdName) || [...commands.values()].find(c => c.config.aliases?.includes(cmdName));

        if (command) {
          if (command.config.adminOnly && !globalConfig.adminUIDs.includes(senderID)) {
            return api.sendMessage("انغلع يا فلاح", threadID, messageID);
          }
          command.run({ api, event, args, config: globalConfig });
        }
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. معالجة أحداث المجموعات
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (event.type === 'event') {
      if (event.logMessageType === 'log:subscribe') {
        const join = events.get('join') || events.get('انضمام');
        if (join) join.handle({ api, event });
      }
      if (event.logMessageType === 'log:unsubscribe') {
        const leave = events.get('leave') || events.get('مغادرة');
        if (leave) leave.handle({ api, event });
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. معالجة الأحداث العامة (منع الكلام، الخ)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✅ هذا القسم الجديد يشغل جميع الأحداث
    for (const [name, eventHandler] of events) {
      try {
        if (eventHandler.handle && event.type !== 'message') {
          eventHandler.handle({ api, event });
        }
      } catch (e) {
        console.log(chalk.red(`[EVENT ERROR] ${name}: ${e.message}`));
      }
    }

  });
});