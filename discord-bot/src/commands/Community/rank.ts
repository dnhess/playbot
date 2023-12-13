// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import {
  AttachmentBuilder,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import { levelSchema } from '../../Schemas/level';

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

  const toNextLevel = 5 * Data.level ** 2 + 50 * Data.level + 100;

  const discrim =
    member?.user?.discriminator === '0' ? '0000' : member?.user?.discriminator;

  const rank = new canvacord.Rank()
    .setAvatar(member.user.displayAvatarURL({ forceStatic: true }))
    .setCurrentXP(Data.XP)
    .setRequiredXP(toNextLevel)
    .setRank(1, 'RANK', false)
    .setLevel(Data.level, 'Level')
    .setUsername(member?.user?.username)
    .setDiscriminator(discrim);

  const Card = await rank.build();

  const attachment = new AttachmentBuilder(Card, { name: 'rank.png' });

  const embed2 = new EmbedBuilder()
    .setColor('#7E47F3')
    .setImage('attachment://rank.png');

  return interaction.editReply({ embeds: [embed2], files: [attachment] });
};
