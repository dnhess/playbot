// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import {
  ChannelType,
  PermissionsBitField,
  SlashCommandBuilder,
} from 'discord.js';

import { reactionRoles } from '../../Schemas/reactionRoles';

export const data = new SlashCommandBuilder()
  .setName('remove-role')
  .setDescription('Removes a reaction role from a message')
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
  .addStringOption((option) =>
    option
      .setName('emoji')
      .setDescription('The emoji to remove')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

const extractNameAndId = (str) => {
  const match = str.match(/<:([^:]+):(\d+)>/);
  if (match) {
    const name = match?.[1];
    const id = match?.[2];
    return { name, id };
  }
  return { name: str, id: null };
};

// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction) => {
  // Get all items from the interaction
  const channel = interaction.options.getChannel('channel');
  const message = interaction.options.getString('message');
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

  // Find emoji in guild that is formatted as <name:id>
  const { name: emojiName, id: emojiId } = extractNameAndId(emoji);

  // Find the reaction in the message
  const reaction = messageInChannel.reactions.cache.find(
    (r) => r.emoji.id === emojiId && r.emoji.name === emojiName
  );

  // If the reaction is not found, reply with an error

  if (!reaction) {
    return interaction.reply({
      content: 'I could not find that reaction',
      ephemeral: true,
    });
  }

  // Remove all reactions of the emoji
  await reaction.remove();

  // Remove the reaction from the DB
  await reactionRoles.deleteOne({
    guildId: interaction.guild.id,
    messageId: messageInChannel.id,
    emoji,
    channelId: channel.id,
  });

  // Reply with a success message
  return interaction.reply({
    content: 'Successfully removed the reaction',
    ephemeral: true,
  });
};
