module.exports = {
  config: {
    name: "help",
    aliases: ["اوامر", "أوامر", "المساعدة"],
    version: "1.0.0",
    author: "أبو هريرة",
    countDown: 5,
    role: 0,
    usePrefix: true,
    description: "عرض قائمة الأوامر أو تفاصيل أمر معين",
    category: "utility",
    guide: "{p}help [اسم الأمر]"
  },

  run: async ({ api, event, args, config }) => {
    const { threadID, messageID } = event;
    const prefix = config.prefix || ".";

    // جلب الأوامر من المتغير العام
    const allCommands = global.commands || new Map();

    if (allCommands.size === 0) {
      return api.sendMessage(
        `⌬ ━━ akira ━━ ⌬\n\n⚠️ لا توجد أوامر محملة حالياً.`,
        threadID,
        messageID
      );
    }

    // عرض تفاصيل أمر معين
    if (args[0]) {
      const name = args[0].toLowerCase();
      let command = allCommands.get(name);

      // البحث بالبدائل
      if (!command) {
        for (const [cmdName, cmd] of allCommands) {
          if (cmd.config.aliases && cmd.config.aliases.includes(name)) {
            command = cmd;
            break;
          }
        }
      }

      if (!command) {
        return api.sendMessage(
          `⌬ ━━ akira ━━ ⌬\n\n❌ الأمر "${name}" غير موجود.`,
          threadID,
          messageID
        );
      }

      const c = command.config;
      let msg = `⌬ ━━ akira ━━ ⌬\n\n`;
      msg += `📝 الاسم: ${c.name}\n`;
      msg += `📄 الوصف: ${c.description || "لا يوجد"}\n`;
      msg += `🔰 الفئة: ${c.category || "utility"}\n`;
      msg += `⚙️ الاستخدام: ${c.guide ? c.guide.replace("{p}", prefix) : prefix + c.name}\n`;
      msg += `⏱️ الانتظار: ${c.countDown || 5} ثانية\n`;
      msg += `👤 الصلاحية: ${c.role === 0 ? "الجميع" : c.role === 1 ? "المشرفين" : "المطور"}\n`;
      msg += `✍️ المطور: ${c.author || "أبو هريرة"}`;

      if (c.aliases && c.aliases.length > 0) {
        msg += `\n🔗 بدائل: ${c.aliases.join(", ")}`;
      }

      return api.sendMessage(msg, threadID, messageID);
    }

    // عرض قائمة الأوامر
    const categories = {};
    for (const [name, cmd] of allCommands) {
      const category = cmd.config.category || "utility";
      if (!categories[category]) categories[category] = [];
      categories[category].push(name);
    }

    let msg = `⌬ ━━ akira COMMANDS ━━ ⌬\n\n`;
    msg += `🤖 اسم البوت: ${config.botName || "akira"}\n`;
    msg += `🔑 البادئة: ${prefix}\n`;
    msg += `📊 عدد الأوامر: ${allCommands.size}\n\n`;
    msg += `📂 الفئات:\n\n`;

    for (const [category, cmds] of Object.entries(categories)) {
      msg += `「 ${category.toUpperCase()} 」\n`;
      msg += `${cmds.join(", ")}\n\n`;
    }

    msg += `💡 استخدم: ${prefix}help [اسم الأمر] للمزيد`;

    return api.sendMessage(msg, threadID, messageID);
  }
};