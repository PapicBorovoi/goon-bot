import { Events, Interaction } from 'discord.js';
import { inject, injectable } from 'inversify';
import { CommandRepository } from '../commands/command.repository';
import { Component } from '../../shared/types/component.enum';
import { DiscordClient } from '../client';
import { Logger } from '../../shared/logger/logger.interface';

@injectable()
export class InteractionCreateEvent {
  private readonly name = Events.InteractionCreate;

  constructor(
    @inject(Component.CommandRepository)
    private readonly commandRepository: CommandRepository,
    @inject(Component.DiscordClient)
    private readonly discordClient: DiscordClient,
    @inject(Component.Logger) private readonly logger: Logger
  ) {}

  private async execute(interaction: Interaction) {
    if (!interaction.isCommand()) return;

    const command = this.commandRepository.get(interaction.commandName);

    if (!command) {
      console.error('no command found');
      return;
    }

    try {
      await command.execute(interaction);
      this.logger.info(
        `Command ${interaction.commandName} at ${interaction.guild?.name} executed`,
        'InteractionCreateEvent'
      );
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'There was an error while executing this command!',
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: 'There was an error while executing this command!',
          ephemeral: true,
        });
      }
    }
  }

  public init() {
    this.discordClient.client.on(this.name, async (interaction: Interaction) =>
      this.execute(interaction)
    );
  }
}
