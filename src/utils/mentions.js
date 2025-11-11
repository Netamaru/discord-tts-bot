const {
  MessageMentions: { USERS_PATTERN, CHANNELS_PATTERN, ROLES_PATTERN },
} = require("discord.js");

const CUSTOM_EMOJI_PATTERN = /<:(.*?):(\d{17,19})>/g;

const cleanMemberMentions = (message, members, users = null) => {
  return message.replace(USERS_PATTERN, (match, id) => {
    // First try to get from members (guild members with displayName)
    const member = members.get(id);
    if (member) {
      return member.displayName;
    }
    // Fallback to users if provided (for users not in guild)
    if (users) {
      const user = users.get(id);
      if (user) {
        return user.username;
      }
    }
    // If we can't find the user, return a generic name instead of the mention format
    // This shouldn't happen if message.mentions is used correctly, but provides a fallback
    return "";
  });
};

const cleanChannelMentions = (message, channels) => {
  return message.replace(CHANNELS_PATTERN, (_, id) => channels.get(id).name);
};

const cleanRoleMentions = (message, roles) => {
  return message.replace(ROLES_PATTERN, (_, id) => roles.get(id).name);
};

const cleanEmojis = (message) => {
  return message.replace(CUSTOM_EMOJI_PATTERN, (_, name) => name);
};

const cleanMessage = (message, { members, channels, roles, users = null }) => {
  let clean = message;

  clean = cleanMemberMentions(clean, members, users);
  clean = cleanChannelMentions(clean, channels);
  clean = cleanRoleMentions(clean, roles);
  clean = cleanEmojis(clean);

  return clean;
};

module.exports = {
  cleanMessage,
  cleanMemberMentions,
  cleanChannelMentions,
  cleanRoleMentions,
  cleanEmojis,
};
