// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import {
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('unban')
  .setDescription('Unbans a user')
  .addUserOption((option) =>
    option.setName('user').setDescription('The user to unban').setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('reason')
      .setDescription('The reason for the ban')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers);

// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction) => {
  const user = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason');

  const bannedUser = client.users.cache.get(user.id);

  // Ensure the user is not trying to ban themselves
  if (user.id === interaction.user.id) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('#7E47F3')
          .setDescription('You cannot ban yourself!'),
      ],
    });
  }

  // Ensure the user is not trying to ban the bot
  if (user.id === client.user.id) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('#7E47F3')
          .setDescription('You cannot ban me!'),
      ],
    });
  }

  // Ensure the user is not trying to ban a user with a higher role
  if (
    interaction.member.roles.highest.position <= user.roles.highest.position
  ) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('#7E47F3')
          .setDescription('You cannot ban a user with a higher role!'),
      ],
    });
  }

  // Ban the user

  await interaction.guild.members.ban(user, {
    reason,
  });

  // Send a message to the user
  await bannedUser.send({
    embeds: [
      new EmbedBuilder()
        .setColor('#7E47F3')
        .setDescription(
          `You have been banned from ${interaction.guild.name} | ${reason}`
        ),
    ],
  });

  // Send a message to the channel
  await interaction.reply(
    {
      embeds: [
        new EmbedBuilder()
          .setColor('#7E47F3')
          .setDescription(
            `:white_check_mark: Successfully banned ${user} for ${reason}`
          ),
      ],
    },
    { ephemeral: true }
  );
};
