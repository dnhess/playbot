// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import {
  AttachmentBuilder,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import { levelSchema } from '../Schemas/level';

const canvacord = require('canvacord');

export const data = new SlashCommandBuilder()
  .setName('rank')
  .addUserOption((option) =>
    option
      .setName('user')
      .setDescription('The user to get the rank of')
      .setRequired(false)
  )
  .setDescription('Get your rank in the discord server!');

export const execute = async (interaction: CommandInteraction) => {
  const { options, user, guild } = interaction;

  const Member = options.getUser('user') || user;

  const member = guild.members.cache.get(Member.id);

  const Data = await levelSchema.findOne({
    guildId: guild.id,
    userId: member.id,
  });

  const embed = new EmbedBuilder()
    .setColor('#7E47F3')
    .setDescription(
      `:white_check_mark: **${member.user.username}** has no rank yet!`
    );

  if (!Data) {
    return interaction.reply({ embeds: [embed] });
  }
  await interaction.deferReply();

  const Required = Data.level * 20 + 20;

  const rank = new canvacord.Rank()
    .setAvatar(member.user.displayAvatarURL({ forceStatic: true }))
    .setCurrentXP(Data.XP)
    .setRequiredXP(Required)
    .setRank(1, 'RANK', false)
    .setLevel(Data.level, 'Level')
    .setUsername(member.user.username)
    .setDiscriminator(member.user.discriminator);

  const Card = await rank.build();

  const attachment = new AttachmentBuilder(Card, { name: 'rank.png' });

  const embed2 = new EmbedBuilder()
    .setColor('#7E47F3')
    .setTitle(`${member.user.username}'s Level/Rank`)
    .setImage('attachment://rank.png');

  return interaction.editReply({ embeds: [embed2], files: [attachment] });
};
