import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Provides information about user or server.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('user')
        .setDescription('Provides information about the user.')
        .addUserOption((option) =>
          option
            .setName('target')
            .setDescription('select user or leave it blank')
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('server')
        .setDescription('Provides information about the server.')
    )
    .setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction) {
    if (interaction.options.getSubcommand() === 'user') {
      const user = interaction.options.getUser('target');

      if (user) {
        await interaction.reply(`Username: ${user.username} 
        ID: ${user.id}`);
      } else {
        await interaction.reply(
          `Your username: ${interaction.user.username} 
          Your ID: ${interaction.user.id}`
        );
      }
    } else if (
      interaction.options.getSubcommand() === 'server' &&
      interaction.guild
    ) {
      await interaction.reply(
        `Server name: ${interaction.guild.name} 
        Total members: ${interaction.guild.memberCount}`
      );
    }
  },
};
