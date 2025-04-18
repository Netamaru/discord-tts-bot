const logger = require("@greencoast/logger");
const { cleanMessage } = require("../../utils/mentions");
const { getCantConnectToChannelReason } = require("../../utils/channel");

class TTSChannelHandler {
  constructor(client) {
    this.client = client;
  }

  initialize() {
    this.client.on("messageCreate", this.handleMessage.bind(this));
  }

  async handleMessage(message) {
    try {
      if (message.author.bot || !message.guild || message.content?.length < 1) {
        return;
      }

      const { channel: memberChannel } = message.member.voice;
      if (!memberChannel) {
        return;
      }

      const channelSettings = await this.client.ttsSettings.get(
        message.channel,
      );
      if (!channelSettings || !channelSettings.provider) {
        return;
      }

      return await this.handleSay(message, channelSettings);
    } catch (error) {
      logger.error(
        `Something happened when handling the TTS channel ${message.channel.name} with message from ${message.member.displayName}`,
      );
      logger.error(error);
    }
  }

  async handleSay(message, channelSettings) {
    const localizer = this.client.localizer.getLocalizer(message.guild);
    const ttsPlayer = this.client.getTTSPlayer(message.guild);
    const connection = ttsPlayer.voice.getConnection();

    const settings = await this.client.ttsSettings.getCurrentForChannel(
      message.channel,
    );
    const extras = settings[channelSettings.provider];

    const {
      me: { voice: myVoice },
      name: guildName,
      members,
      channels,
      roles,
    } = message.guild;
    const { channel: memberChannel } = message.member.voice;
    const myChannel = myVoice?.channel;

    const messageIntro = this.client.config.get("ENABLE_WHO_SAID")
      ? `${message.member.displayName} said `
      : "";
    const textToSay = cleanMessage(`${messageIntro}${message.content}`, {
      members: members.cache,
      channels: channels.cache,
      roles: roles.cache,
    });

    if (!memberChannel) {
      return;
    }

    if (connection) {
      if (myChannel !== memberChannel) {
        return;
      }

      return ttsPlayer.say(textToSay, channelSettings.provider, extras);
    }

    const cantConnectReason = getCantConnectToChannelReason(memberChannel);
    if (cantConnectReason) {
      return message.reply({
        content: localizer.t(cantConnectReason),
        ephemeral: true,
      });
    }

    await ttsPlayer.voice.connect(memberChannel);
    logger.info(`Joined ${memberChannel.name} in ${guildName}.`);
    return ttsPlayer.say(textToSay, channelSettings.provider, extras);
  }
}

module.exports = TTSChannelHandler;
