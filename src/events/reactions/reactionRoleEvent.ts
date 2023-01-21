import type {
  Client,
  MessageReaction,
  PartialMessageReaction,
  PartialUser,
  User,
} from 'discord.js';

import { reactionRoles } from '../../Schemas/reactionRoles';

export const reactionRoleEvent = async (
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser,
  client: Client
) => {
  console.log('Reaction role event fired');
  // If the user is a bot, return
  if (user.bot) return;

  // If the message is not in a guild, return
  if (!reaction.message.guild) return;

  // If the reaction is partial, fetch it
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Something went wrong when fetching the message: ', error);
      return;
    }
  }

  if (user.partial) {
    try {
      await user.fetch();
    } catch (error) {
      console.error('Something went wrong when fetching the user: ', error);
      return;
    }
  }

  console.log(`Fetching reaction role for ${reaction.message.guild.name}...`);
  console.log(
    `Reaction role emoji: ${reaction.emoji.id || reaction.emoji.name}`
  );
  console.log(`Reaction role message ID: ${reaction.message.id}`);
  console.log(`Reaction role channel ID: ${reaction.message.channel.id}`);
  console.log(`Reaction role guild ID: ${reaction.message.guild.id}`);

  // Fetch the emoji from the guild
  const emojiInGuild = reaction.message.guild.emojis.cache.find(
    (e) =>
      e.name?.includes(reaction?.emoji.name || '') || e.id === reaction.emoji.id
  );

  // If the emoji is not found, return
  if (!emojiInGuild) return;

  console.log(`Reaction role emoji ID: ${emojiInGuild}`);

  // Find the reaction role in the database
  reactionRoles.findOne(
    {
      guildId: reaction.message.guild.id,
      channelId: reaction.message.channel.id,
      messageId: reaction.message.id,
      emoji: emojiInGuild,
    },
    async (err: any, data: any) => {
      if (err) throw err;
      console.log(data);
      if (!reaction.message.guild) return;
      if (data) {
        console.log(`Reaction role found for ${reaction.message.guild.name}!`);
        const member = reaction.message.guild.members.cache.get(user.id);
        console.log(`Member: ${member?.user.tag} (${member?.id})`);
        if (!member) return;

        // Check if bot has higher role than the role to add
        const botUser = reaction.message.guild.members.cache.get(
          client.user?.id || ''
        );

        if (!botUser) return;

        const botHighestRole = botUser.roles.highest;

        const roleToAdd = reaction.message.guild.roles.cache.get(data.roleId);

        if (!roleToAdd) return;

        if (botHighestRole.position <= roleToAdd.position) {
          console.log(
            `Bot has lower role than the role to add (${roleToAdd.name})`
          );
          try {
            member.send(
              `I don't have the permission to add the role ${roleToAdd.name} to you. Please contact a server administrator.`
            );
          } catch (error) {
            console.error(
              `Could not send message to ${member.user.tag} (${member.id})`
            );
          }
          return;
        }

        // If the member already has the role, remove it
        if (member.roles.cache.has(data.roleId)) {
          console.log(`Removing role ${data.roleId} from ${member.user.tag}`);
          member.roles.remove(data.roleId);
        } else {
          console.log(`Adding role ${data.roleId} to ${member.user.tag}`);
          member.roles.add(data.roleId);
        }
      }
    }
  );
};
