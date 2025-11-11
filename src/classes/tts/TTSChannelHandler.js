/* eslint-disable max-statements */
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

  /**
   * Removes links and emojis from a message
   * @param {string} content - The message content to clean
   * @returns {string} - The cleaned message content
   */
  removeLinksAndEmojis(content) {
    let cleaned = content;

    // Remove URLs
    const urlRegex = /https?:\/\/[^\s]+/gi;
    cleaned = cleaned.replace(urlRegex, "");

    // Remove custom Discord emojis (both static and animated)
    const customEmojiRegex = /<a?:\w+:\d{17,19}>/g;
    cleaned = cleaned.replace(customEmojiRegex, "");

    // Remove Unicode emojis
    const unicodeEmojiRegex =
      /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{24C2}-\u{1F251}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{200D}]|[\u{23CF}]|[\u{23E9}-\u{23FA}]|[\u{2B50}]|[\u{2B55}]/gu;
    cleaned = cleaned.replace(unicodeEmojiRegex, "");

    // Clean up extra whitespace and trim
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    return cleaned;
  }

  async handleMessage(message) {
    const originalContent = message.content;
    try {
      if (message.author.bot || !message.guild || message.content?.length < 1) {
        return;
      }

      // Remove links and emojis from the message
      const cleanedContent = this.removeLinksAndEmojis(message.content);

      // Suppress message if only links/emojis were present (no text left)
      if (!cleanedContent || cleanedContent.length < 1) {
        return;
      }

      // Replace message content with cleaned version for processing
      message.content = cleanedContent;

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
    } finally {
      // Always restore original content
      message.content = originalContent;
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
      members: {
        me: { voice: myVoice },
      },
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
    // Use message.mentions for accurate mention resolution
    // message.mentions is based on the original message, so it should have all mentions
    const mentionedMembers = message.mentions.members || null;
    const mentionedChannels = message.mentions.channels || null;
    const mentionedRoles = message.mentions.roles || null;
    const mentionedUsers = message.mentions.users || null;

    // Build a members collection from mentions, falling back to cache lookup if needed
    const membersToUse =
      mentionedMembers && mentionedMembers.size > 0
        ? mentionedMembers
        : (() => {
            // If no mentions, create empty collection
            // Otherwise, build from mentioned user IDs using cache
            const membersCollection = new Map();
            if (mentionedUsers && mentionedUsers.size > 0) {
              mentionedUsers.forEach((user, id) => {
                const member = members.cache.get(id);
                if (member) {
                  membersCollection.set(id, member);
                }
              });
            }
            return membersCollection;
          })();

    const channelsToUse =
      mentionedChannels && mentionedChannels.size > 0
        ? mentionedChannels
        : new Map();
    const rolesToUse =
      mentionedRoles && mentionedRoles.size > 0 ? mentionedRoles : new Map();

    const textToSay = cleanMessage(`${messageIntro}${message.content}`, {
      members: membersToUse,
      channels: channelsToUse,
      roles: rolesToUse,
      users: mentionedUsers,
    });

    if (!memberChannel) {
      // return message.reply(localizer.t('command.say.no_channel'));
      return;
    }

    if (connection) {
      if (myChannel !== memberChannel) {
        // return message.reply(localizer.t("command.say.different_channel"));
        return;
      }

      return ttsPlayer.say(textToSay, channelSettings.provider, extras);
    }

    const cantConnectReason = getCantConnectToChannelReason(memberChannel);
    if (cantConnectReason) {
      return message.reply(localizer.t(cantConnectReason));
    }

    await ttsPlayer.voice.connect(memberChannel);
    logger.info(`Joined ${memberChannel.name} in ${guildName}.`);
    // await message.reply(
    //   localizer.t("command.say.joined", { channel: memberChannel.toString() }),
    // );
    return ttsPlayer.say(textToSay, channelSettings.provider, extras);
  }
}

module.exports = TTSChannelHandler;
