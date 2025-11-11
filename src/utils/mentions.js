const {
  MessageMentions: { USERS_PATTERN, CHANNELS_PATTERN, ROLES_PATTERN },
} = require("discord.js");

const CUSTOM_EMOJI_PATTERN = /<:(.*?):(\d{17,19})>/g;

const cleanMemberMentions = (message, members, users = null) => {
  let cleaned = message;

  // First, try to replace using the members collection (guild members with displayName)
  if (members && members.size > 0) {
    members.forEach((member, id) => {
      // Replace both <@id> and <@!id> formats, escape the ID for regex
      const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const mentionPattern = new RegExp(`<@!?${escapedId}>`, "g");
      cleaned = cleaned.replace(mentionPattern, member.displayName);
    });
  }

  // Fallback to users collection if provided (for users not in guild)
  if (users && users.size > 0) {
    users.forEach((user, id) => {
      // Only replace if not already replaced by a member (check if mention still exists)
      const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const mentionPattern = new RegExp(`<@!?${escapedId}>`, "g");
      // Replace if the pattern still exists in the cleaned message
      cleaned = cleaned.replace(mentionPattern, user.username);
    });
  }

  // Remove any remaining user mentions that weren't found (shouldn't happen, but just in case)
  cleaned = cleaned.replace(USERS_PATTERN, "");

  return cleaned;
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
