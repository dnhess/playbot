import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

import * as commandModules from './commands';
import config from './config';

type Command = {
  data: unknown;
};

const commands = [];

// eslint-disable-next-line no-restricted-syntax
for (const module of Object.values<Command>(commandModules)) {
  commands.push(module.data);
}

const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN);

// and deploy your commands!
(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    // TODO: Remove config.GUILD_ID to deploy global commands
    // If NODE_ENV is production, deploy global commands
    if (process.env.NODE_ENV === 'production') {
      await rest.put(Routes.applicationCommands(config.CLIENT_ID), {
        body: commands,
      });
    } else {
      await rest.put(
        Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
        { body: commands }
      );
    }

    console.log(
      `Successfully reloaded ${commands.length} application (/) commands.`
    );

    // Stop the process
    process.exit(0);
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();
