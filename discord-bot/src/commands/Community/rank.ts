// @ts-nocheck
import { BuiltInGraphemeProvider, Font, RankCardBuilder } from 'canvacord';
import type { CommandInteraction } from 'discord.js';
import {
  AttachmentBuilder,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import config from '../../config';

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

  let Data = await fetch(
    `${config.BACKEND_URL}/guild/${guild.id}/user/${member.id}/rank`
  );

  if (Data.status === 404) {
    return interaction.reply(`No rank found for ${member.user.username}`);
  }

  if (Data.status !== 200) {
    return interaction.reply(
      `There was an error getting the rank for ${member.user.username}`
    );
  }

  Data = await Data.json();

  const embed = new EmbedBuilder()
    .setColor('#7E47F3')
    .setDescription(
      `:white_check_mark: **${member.user.username}** has no rank yet!`
    );

  if (!Data) {
    return interaction.reply({ embeds: [embed] });
  }

  const toNextLevel = 5 * Data.level ** 2 + 50 * Data.level + 100;
  Font.loadDefault();

  const rank = new RankCardBuilder()
    .setAvatar(
      member?.displayAvatarURL({ forceStatic: true }) ||
        member.user.displayAvatarURL({ forceStatic: true })
    )
    .setDisplayName(member?.nickname || member?.user?.username)
    .setUsername(`@${member?.user?.username}`)
    .setCurrentXP(Data.XP)
    .setRequiredXP(toNextLevel)
    .setProgressCalculator((currentLevelXP, nextLevelXP) =>
      Math.round((currentLevelXP / nextLevelXP) * 100)
    )
    .setLevel(Data.level)
    .setStatus('none')
    .setGraphemeProvider(BuiltInGraphemeProvider.FluentEmojiFlat)
    .setStyles({
      container: 'text-2xl',
    });

  const Card = await rank.build({
    format: 'png',
  });

  const attachment = new AttachmentBuilder(Card, { name: 'rank.png' });

  return interaction.reply({ files: [attachment] });
};
