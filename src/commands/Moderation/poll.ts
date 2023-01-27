// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import {
  ChannelType,
  PermissionsBitField,
  SlashCommandBuilder,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('poll')
  .setDescription('Creates or ends a poll!')
  .addSubcommandGroup((group) =>
    group
      .setName('create')
      .setDescription('Creates a poll')
      .addSubcommand((subcommand) =>
        subcommand
          .setName('single')
          .setDescription('Creates a single choice poll')
          .addChannelOption((option) =>
            option
              .setName('channel')
              .setDescription('The channel to send the poll in')
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName('question')
              .setDescription('The question to ask')
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName('items')
              .setDescription('The items to choose from')
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName('emoji')
              .setDescription('The custom emoji to use')
              .setRequired(false)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName('multiple')
          .setDescription('Creates a multiple choice poll')
          .addChannelOption((option) =>
            option
              .setName('channel')
              .setDescription('The channel to send the poll in')
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName('question')
              .setDescription('The question to ask')
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName('items')
              .setDescription('The items to choose from')
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName('emoji')
              .setDescription('The custom emoji to use')
              .setRequired(false)
          )
      )
  )
  .addSubcommandGroup((group) =>
    group
      .setName('end')
      .setDescription('Ends a poll')
      .addSubcommand((subcommand) =>
        subcommand
          .setName('message link')
          .setDescription('Ends a poll by message link')
          .addStringOption((option) =>
            option
              .setName('message')
              .setDescription('The ID or link to the message')
              .setRequired(true)
          )
      )
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction) => {
  const subcommandGroup = interaction.options.getSubcommandGroup();
  const subcommand = interaction.options.getSubcommand();

  if (subcommandGroup === 'create') {
    const channel = interaction.options.getChannel('channel');
    const question = interaction.options.getString('question');
    const items = interaction.options.getString('items');
    const emoji = interaction.options.getString('emoji');

    const itemArray = items.split(', ');

    if (subcommand === 'single') {
      const embed = {
        title: question,
        description: itemArray.join(''),
        color: 0x0099ff,
      };

      const message = await channel.send({ embeds: [embed] });

      itemArray.forEach(() => {
        message.react(emoji);
      });
    } else if (subcommand === 'multiple') {
      const embed = {
        title: question,
        description: itemArray.join(''),
        color: 0x0099ff,
      };

      const message = await channel.send({ embeds: [embed] });

      itemArray.forEach(() => {
        message.react(emoji);
      });
    }
  } else if (subcommandGroup === 'end') {
    const message = interaction.options.getString('message');

    const messageID = message.split('/').pop();

    const messageToEdit = await interaction.channel.messages.fetch(messageID);

    const embed = messageToEdit.embeds[0];

    embed.footer = {
      text: 'Poll ended',
    };

    messageToEdit.edit({ embeds: [embed] });
  }
};
