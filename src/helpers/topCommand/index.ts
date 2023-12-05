import fetch from 'cross-fetch';
import { EmbedBuilder } from 'discord.js';

import type { UserCounts } from '../../commands/Playbite/top';
import config from '../../config';
import { convertGameResponseToGameData } from '../../interfaces/IGame';

export const fetchGamesWithTopUsersOverOneDayEmbed = async () => {
  const games = await fetch(`${config.BASE_API_URL}/feed?plat=web`);

  const gamesJson = await games.json();

  const gamesData = convertGameResponseToGameData(
    gamesJson.filter((game: { title: string }) => game.title === 'All Games')[0]
  );

  // Build an array of promises to fetch the top user for each game. The fetch url is formatted like this: https://api.playbite.com/api/games/6f8a4196-7700-4776-9737-fb573c606d20/rankings?type=day
  const promises = gamesData.map((game) =>
    fetch(`${config.BASE_API_URL}/games/${game.id}/rankings?type=day`).then(
      (res) => res.json()
    )
  );

  const results = await Promise.all(promises);

  const topUsers = results.map((result, index) => {
    let user = result[0];
    if (!user) {
      user = {
        name: 'Cannot find user',
      };
    }

    user.game = gamesData[index].name;
    return user;
  });

  // Also store the count of games that each user has won
  const userCounts: UserCounts = {};

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

  return embeds;
};
