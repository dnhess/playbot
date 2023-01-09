import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  InteractionType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

import * as commandModules from './commands';
import config from './config';
import { messages } from './messages/messages';

const commands = Object(commandModules);

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}!`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  // if (!interaction.isCommand() || !interaction.isAutocomplete()) return;

  if (interaction.isChatInputCommand()) {
    console.log('IN HERE');
    const { commandName } = interaction;

    commands[commandName]?.execute(interaction, client);
  } else if (interaction.isAutocomplete()) {
    const { commandName } = interaction;
    console.log(`Command name: ${commandName}`);
    console.log(commands[commandName]);
    await commands[commandName]?.autocomplete(interaction, client);
  } else if (interaction.isButton()) {
    const { customId } = interaction;
    console.log(`Custom ID: ${customId}`);

    if (customId === 'welcome-modal-btn') {
      const welcomeModal = new ModalBuilder()
        .setTitle('Welcome to the server!')
        .setCustomId('welcome-modal');

      const playbiteUsernameInput = new TextInputBuilder()
        .setCustomId('playbite-username')
        .setLabel('Playbite Username')
        .setMinLength(3)
        .setStyle(TextInputStyle.Short);

      const playbiteFoundInput = new TextInputBuilder()
        .setCustomId('playbite-found')
        .setLabel('How did you hear about us?')
        .setMinLength(3)
        .setStyle(TextInputStyle.Paragraph);

      const firstActionRow = new ActionRowBuilder().addComponents(
        playbiteUsernameInput
      );
      const secondActionRow = new ActionRowBuilder().addComponents(
        playbiteFoundInput
      );
      console.log('Adding components');
      // @ts-ignore
      const modal = welcomeModal.addComponents(firstActionRow, secondActionRow);
      console.log('Showing modal');
      await interaction.showModal(modal);
    }
  } else if (interaction.type === InteractionType.ModalSubmit) {
    const { customId } = interaction;
    console.log(`Custom ID: ${customId}`);

    if (customId === 'welcome-modal') {
      const playbiteUsername =
        interaction.fields.getTextInputValue('playbite-username');
      const playbiteFound =
        interaction.fields.getTextInputValue('playbite-found');

      interaction.reply(
        'Thanks for submitting your info! We will review it soon!'
      );
      console.log('Checking for admin channel');
      // Send message to admin channel
      const adminChannel = client.channels.cache.find(
        // @ts-ignore
        (channel) => channel.name === 'admin' || channel.name === 'general'
      );
      console.log(`adminChannel:${adminChannel}`);
      if (!adminChannel) return;

      if (adminChannel) {
        const adminEmbed = new EmbedBuilder()
          .setTitle('Welcome Form Response')
          .setDescription(
            `Playbite Username: ${playbiteUsername}\nHow did you find us?:\n ${playbiteFound}`
          );

        // @ts-ignore
        adminChannel.send({ embeds: [adminEmbed] });
      }
    }
  }
});

// On message create, check if the message matches given text
// TODO: Figure out how to make this work by storing the message in a db so I don't have to redeploy the bot every time I want to change the message
client.on(Events.MessageCreate, (message) => {
  // If bot sent the message, ignore it
  if (message.author.username === client?.user?.username) return;
  messages.forEach((msg) => {
    if (message.content.toLocaleLowerCase().includes(msg.message)) {
      if (typeof msg.response === 'function') {
        message.channel.send(
          msg.response ? msg.response(message) : 'No response'
        );
      } else {
        message.channel.send(msg.response);
      }
    }
  });
});

// On user join, send a message to welcome them, DM the user with a modal to ask for their username
client.on(Events.GuildMemberAdd, (member) => {
  console.log('in here');
  const welcomeChannel = member.guild.channels.cache.find(
    (channel) => channel.name === 'general' || channel.name === 'welcome'
  );

  console.log('welcomeChannel', welcomeChannel);

  if (!welcomeChannel) return;

  if (welcomeChannel) {
    const welcomeEmbed = new EmbedBuilder()
      .setTitle('Welcome to the server!')
      .setDescription(
        `${member} has joined the server! Make sure to read the rules!`
      )
      .setThumbnail(member.user.avatarURL());

    // @ts-ignore
    welcomeChannel.send({ embeds: [welcomeEmbed] });
  }

  // Send a welcome DM to user with a modal to ask for their username
  const welcomeEmbed = new EmbedBuilder()
    .setTitle('Welcome to the server!')
    .setDescription(
      `Welcome to the server! Feel free to answer a few questions and get some free tickets!`
    );

  const buttonAction = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('welcome-modal-btn')
      .setLabel('Get Started')
      .setStyle(ButtonStyle.Primary)
  );

  // @ts-ignore
  member.send({ embeds: [welcomeEmbed], components: [buttonAction] });

  // const welcomeModal = new ModalBuilder()
  //   .setTitle('Welcome to the server!')
  //   .setCustomId('welcome-modal');

  // const playbiteUsernameInput = new TextInputBuilder()
  //   .setCustomId('playbite-username')
  //   .setPlaceholder('Playbite Username')
  //   .setMinLength(3);

  // const playbiteFoundInput = new TextInputBuilder()
  //   .setCustomId('playbite-found')
  //   .setPlaceholder('How did you hear about us?')
  //   .setMinLength(3);

  // const firstActionRow = new ActionRowBuilder().addComponents(
  //   playbiteUsernameInput
  // );
  // const secondActionRow = new ActionRowBuilder().addComponents(
  //   playbiteFoundInput
  // );

  // welcomeModal.addComponents(firstActionRow, secondActionRow);

  // await member.showModal(welcomeModal);

  // const modal = new ModalBuilder()
  //   .setTitle('Welcome to the server!')
  //   .setDescription('Please enter your username to get started!')
  //   .addTextInput((input) =>
  //     input
  //       .setCustomId('username')
  //       .setPlaceholder('Username')
  //       .setMinLength(3)
  //       .setMaxLength(12)
  //   )
  //   .addButton((button) =>
  //     button.setCustomId('submit').setLabel('Submit').setStyle('PRIMARY')
  //   );

  // member.send({ modal });
});

client.login(config.DISCORD_TOKEN);
