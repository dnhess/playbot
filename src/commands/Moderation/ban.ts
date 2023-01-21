// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import {
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Bans a user')
  .addUserOption((option) =>
    option.setName('user').setDescription('The user to ban').setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('reason')
      .setDescription('The reason for the ban')
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('duration')
      .setDescription('The duration of the ban Ex: 1 - 7 days')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers);

// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction, client) => {
  const user = interaction.options.getMember('user');
  const reason = interaction.options.getString('reason');
  const duration = interaction.options.getString('duration');

  const bannedUser = client.users.cache.get(user.id);

  // Ensure the user is not trying to ban themselves
  if (user.id === interaction.user.id) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('#7E47F3')
          .setDescription('You cannot ban yourself!'),
      ],
      ephemeral: true,
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
      ephemeral: true,
    });
  }

  // Ensure the user is not trying to ban a user with a higher role
  if (
    user.roles.highest.position >= interaction.member.roles.highest.position
  ) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('#7E47F3')
          .setDescription('You cannot ban a user with a higher role!'),
      ],
      ephemeral: true,
    });
  }

  // Ensure the user is managaable
  if (!user.manageable) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('#7E47F3')
          .setDescription('I cannot manage this user!'),
      ],
      ephemeral: true,
    });
  }

  try {
    // Send a message to the user
    await bannedUser
      .send(
        `You have been banned from ${interaction.guild.name} for ${reason} by ${interaction.user.username}`
      )
      // eslint-disable-next-line consistent-return
      .then(async () => {
        if (duration) {
          if (duration < 1 || duration > 7) {
            return interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setColor('#7E47F3')
                  .setDescription('The duration must be between 1 and 7 days!'),
              ],
              ephemeral: true,
            });
          }

          // Ban the user
          await interaction.guild.bans
            .create(user.id, {
              reason,
              days: duration,
            })
            .catch((err) => {
              console.log(err);

              return interaction.reply({
                embeds: [
                  new EmbedBuilder()
                    .setColor('#7E47F3')
                    .setDescription(
                      `:x: I was unable to ban ${user} for ${err}`
                    ),
                ],
                ephemeral: true,
              });
            });
        } else {
          await interaction.guild.bans
            .create(user.id, {
              reason,
            })
            .catch((err) => {
              console.log(err);

              return interaction.reply({
                embeds: [
                  new EmbedBuilder()
                    .setColor('#7E47F3')
                    .setDescription(
                      `:x: I was unable to ban ${user} for ${err}`
                    ),
                ],
                ephemeral: true,
              });
            });
        }
      });
  } catch (err) {
    console.log(err);
  }

  // Send a message to the channel
  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor('#7E47F3')
        .setDescription(
          `:white_check_mark: Successfully banned ${user} for ${reason}`
        ),
    ],
    ephemeral: true,
  });
};
