import fetch from 'cross-fetch';
import type { CommandInteraction } from 'discord.js';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

import config from '../../config';
import { convertGameResponseToGameData } from '../../interfaces/IGame';

export const data = new SlashCommandBuilder()
  .setName('top')
  .setDescription('Get the top user in all the games over the last 24 hours');

export const execute = async (interaction: CommandInteraction) => {
  // Defer the reply
  await interaction.deferReply();

  // Fetch all the games
  const games = await fetch(`${config.BASE_API_URL}/feed?plat=web`);
  const gamesJson = await games.json();

  const gamesData = convertGameResponseToGameData(
    gamesJson.filter((game: { title: string }) => game.title === 'All')[0]
  );

  // Build an array of promises to fetch the top user for each game. The fetch url is formatted like this: https://api.playbite.com/api/games/6f8a4196-7700-4776-9737-fb573c606d20/rankings?type=day
  const promises = gamesData.map((game) =>
    fetch(`${config.BASE_API_URL}/games/${game.id}/rankings?type=day`).then(
      (res) => res.json()
    )
  );

  // Wait for all the promises to resolve
  const results = await Promise.all(promises);

  const topUsers = results.map((result, index) => {
    console.log(result);
    const user = result[0];
    user.game = gamesData[index].name;
    return user;
  });

  // Also store the count of games that each user has won
  const userCounts: {
    [key: string]: {
      count: number;
      games: {
        name: string;
        points: number;
      }[];
    };
  } = {};

  // Loop through the top users and increment the count for each user, also mark what game they won
  topUsers.forEach((user) => {
    if (!userCounts[user.name]) {
      userCounts[user.name] = {
        count: 1,
        games: [
          {
            name: user.game,
            points: user.points,
          },
        ],
      };
    } else {
      // eslint-disable-next-line no-plusplus
      userCounts[user.name].count++;
      userCounts[user.name].games.push({
        name: user.game,
        points: user.points,
      });
    }
  });
  // Sort the users by the count
  const sortedUsers = Object.keys(userCounts).sort(
    (a, b) => userCounts[b].count - userCounts[a].count
  );

  // The embeds will be split into pages of 10 users each
  const embeds: EmbedBuilder[] = [];

  // Loop through the sorted users and build the embeds
  for (let i = 0; i < sortedUsers.length; i += 10) {
    const embed = new EmbedBuilder()
      .setTitle('Users with top scores in the last 24 hours!')
      .setDescription(
        sortedUsers
          .slice(i, i + 10)
          .map(
            (user, index) =>
              `${i + index + 1}. **${user}** - ${userCounts[user].count} top ${
                userCounts[user].count > 1 ? 'scores' : 'score'
              } \n\`\`\`${userCounts[user].games
                .map((game) => `${game.name} (${game.points})\n`)
                .join('')}\`\`\``
          )
          .join('\n')
      )
      .setColor('#7E47F3')
      .setFooter({ text: 'Top users in the last 24 hours for all games' });

    embeds.push(embed);
  }

  // Send the embeds
  await interaction.editReply({
    embeds,
  });
};
