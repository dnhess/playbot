/* eslint-disable no-param-reassign */
// @ts-nocheck
import { BuiltInGraphemeProvider, Font, LeaderboardBuilder } from 'canvacord';
import type { CommandInteraction } from 'discord.js';
import {
  AttachmentBuilder,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import config from '../../config';

const missingImage =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAAAAAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAAgACADAREAAhEBAxEB/8QAGwAAAgEFAAAAAAAAAAAAAAAABgcFAgMECAn/xAAnEAABAwMEAgICAwAAAAAAAAABAgMEBQYRABIhMQcTFFEIQSIycf/EABoBAAIDAQEAAAAAAAAAAAAAAAUGAQMEAAf/xAAsEQABAgYBAwIFBQAAAAAAAAABAhEAAwQFITESBkFhE1EVMoGRsSIjcaHw/9oADAMBAAIRAxEAPwDn3T4YnSUR/alBUf2MnROKZi+CSWjZin/jJ4qo3jO3798meS36GmvoTIjtsQvashWdreMkno5UBjoYzrzmd1lc6i7T7ZaqMTDKLElTa2fbuGDvDfR9MyF2+XcKyq9NKt4xkaG3UP8AYzA5d/h3xTGsyfdlgXg7X0U6WGJfuirYKEFIKClIB7yTkkDA45B0TtvUNzmXFFFdKb0uaSUsQrRLuX/oOe5xE1nTNJ8MXW22rE1SCHw2xoBt+TjsIR1UhJhOobB7Tu/r0CTwfvjGnMwmypnqB4krcSn0OOqQFFsqKcdk4GpEZ6o5Ahw0qo3N5suS0rHqk+PEgU5Hw4ao0IH48dDe5fAI3na2VYJHOTnGlKopaPpKlq7pJBUtf6lOr5lEsO2MltGGemuFZ1QqlsiwlCQeIIBHtvOSwiu/7ttOnW1L8XeNnKhJozs9UifMn7CXnW/4JUhScZ4TkYACQrgqOSYs9vr6qsF2uqUpmcQlIS+AckEHXttz3bAjTdqq2Wel+G25RWp3WSAz9mPj7Yw+4SlxvtvPIShGPXxkggkY4xn9cnTcYU6VJSnMYcCaYYWpDq0LIISUgEZOO9QIumIC8GHD4Zg1Sp3GZdt3SzRpNKp0meqatoOFDaWylzak8EkKI5I4Jxk8aAdTTqeXRCVUyTNTMUlPEFnJLhzsBx51mN3TcqoNyE2TMTLVLBVyUHAAwS2iQ/iA99USPJdZjzDIbWtaUOlG0rGe9p5Ge9HJRUpCSoMfZ3bw/eBVwlqRUzAFcs/MxD+c5H5gduNDR2r9m5acISNwJCfr71YY6lJbUWKNTKXNd2VOvR4KSAUqLanADnncOOP8OdZp65qEvKRyPs7fbcGqOmp5qmnzQn6E/fWP4MOOhXj4utRoqp9bnzalKp71PcmLb9SW2nkbQFkEqc2DogZOEg560qTbZdatX7oSmWFBXEF3KS7jTcj7nGSGhsl1topA8pSlTWIC9MCGAOC/EdwCTgGFfVY9AU456rrS5sGW1oZcIVnsAHBGMkEnvTYmZOUAShvDjH5hWm09CASJud/KS/jtkeYgJTERtayxUUyMYwQytO77761YkqOw31jHMlykvwmP9CI//9k=';

export const data = new SlashCommandBuilder()
  .setName('xp-leaderboard')
  .setDescription('This command returns the xp leaderboard for the server');

// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction) => {
  const { guild } = interaction;

  const embed1 = new EmbedBuilder()
    .setColor('#7E47F3')
    .setDescription(`:x: No one is on the leaderboard yet!`);

  const guildDataResponse = await fetch(
    `${config.BACKEND_URL}/guild/${guild.id}/leaderboard`
  );

  if (guildDataResponse.status !== 200) {
    return interaction.reply(`There was an error getting the leaderboard.`);
  }

  const guildData = await guildDataResponse.json();

  if (!guildData.length) {
    return interaction.editReply({ embeds: [embed1] });
  }

  // Fetch all the users in the guild
  const users = await guild.members.fetch();

  // Map the guild data to the users and the corresponding guildData object
  // eslint-disable-next-line array-callback-return
  guildData.map((user: any, index: number) => {
    const guildUser = users.get(user.userId);

    if (!guildUser) {
      return;
    }

    user.avatar =
      guildUser.displayAvatarURL({ forceStatic: true }) ||
      guildUser.user.displayAvatarURL({ forceStatic: true }) ||
      missingImage;
    user.username = guildUser.user.username;
    user.displayName = guildUser.nickname || guildUser.user.username;
    if (user.displayName.length > 23) {
      user.displayName = `${user.displayName.slice(0, 23)}...`;
    }
    user.xp = user.totalXP;
    user.rank = index + 1;

    // Delete guildId, userId, XP, totalXP, XP from the guildData object
    delete user.guildId;
    delete user.userId;
    delete user.XP;
    delete user.totalXP;
    delete user.updatedAt;
  });

  // Uncomment this when in dev mode
  // guildData.pop()

  Font.loadDefault();

  const lb = new LeaderboardBuilder()
    .setHeader({
      image: guild.iconURL({ dynamic: true }) || missingImage,
      title: `${guild.name}`,
      subtitle: 'Rankings',
    })
    .setPlayers(guildData)
    .setGraphemeProvider(BuiltInGraphemeProvider.Noto)
    .setTextStyles({
      abbreviate: false,
    });

  const Card = await lb
    .build({
      format: 'png',
    })
    .catch((err) => console.log(err));

  const attachment = new AttachmentBuilder(Card, { name: 'lb.png' });

  return interaction.reply({ files: [attachment] });
};
