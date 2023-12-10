// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import {
  ChannelType,
  PermissionsBitField,
  SlashCommandBuilder,
} from 'discord.js';

import { reactionRoles } from '../../Schemas/reactionRoles';

export const data = new SlashCommandBuilder()
  .setName('add-role')
  .setDescription('Adds a reaction role to a message')
  .addChannelOption((option) =>
    option
      .setName('channel')
      .setDescription('The channel the message is in')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('message')
      .setDescription('The ID or link to the message')
      .setRequired(true)
  )
  .addRoleOption((option) =>
    option
      .setName('role')
      .setDescription('The role to add once the user clicks the emoji')
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('emoji')
      .setDescription('The emoji to react with')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction) => {
  // Get all items from the interaction
  const channel = interaction.options.getChannel('channel');
  const message = interaction.options.getString('message');
  const role = interaction.options.getRole('role');
  const emoji = interaction.options.getString('emoji');

  // If the message is a link, get the ID from the link
  const messageId = message.includes('discord.com/channels')
    ? message.split('/').pop()
    : message;

  // Find the message in the channel
  const messageInChannel = await channel.messages.fetch(messageId);

  // If the message is not found, reply with an error
  if (!messageInChannel) {
    return interaction.reply({
      content: 'I could not find that message',
      ephemeral: true,
    });
  }

  const emojiInGuild = interaction.guild.emojis.cache.find(
    (e) => e.name?.includes(emoji) || e.id === emoji
  );
  const emojiId = emojiInGuild ? emojiInGuild.id : emoji;

  try {
    await messageInChannel.react(emojiId);
  } catch (error) {
    return interaction.reply({
      content: 'I could not react to that message',
      ephemeral: true,
    });
  }

  try {
    // Add the role to the database
    await reactionRoles.replaceOne(
      {
        guildId: interaction.guildId,
        messageId,
        emoji,
        channelId: channel.id,
      },
      {
        guildId: interaction.guildId,
        messageId,
        emoji,
        roleId: role.id,
        channelId: channel.id,
      },
      { upsert: true }
    );
  } catch (error) {
    console.log(error);
    return interaction.reply({
      content: 'I could not add that role to the database',
      ephemeral: true,
    });
  }

  // Reply with a success message
  return interaction.reply({
    content: `Successfully added the role ${role} to the message ${messageInChannel}!`,
    ephemeral: true,
  });
};
