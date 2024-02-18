import { inject, injectable } from 'inversify';
import { Logger } from 'shared/logger/logger.interface';
import { Component } from '../shared/types/component.enum';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { CommandRepository } from './commands/command.repository';
import { DiscordClient } from './client';
import { Command } from './commands/command.interface';
import { ReadyEvent } from './events/ready.event';
import { InteractionCreateEvent } from './events/interaction-create.event';

@injectable()
export class Application {
  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.CommandRepository)
    private readonly commandRepository: CommandRepository,
    @inject(Component.DiscordClient)
    private readonly discordClient: DiscordClient,
    @inject(Component.ReadyEvent) private readonly readyEvent: ReadyEvent,
    @inject(Component.InteractionCreateEvent)
    private readonly interactionCreateEvent: InteractionCreateEvent
  ) {}

  private async initCommands(): Promise<void> {
    const commandPath = path.join(__dirname, 'commands');
    const commandFiles = fs
      .readdirSync(commandPath)
      .filter(
        (file) => file.split('.')[file.split('.').length - 2] === 'command'
      );

    for (const file of commandFiles) {
      const filePath = path.join(commandPath, file);

      const command: Command = await import(filePath);

      if ('data' in command && 'execute' in command) {
        this.commandRepository.add(command);
      } else {
        this.logger.warn(
          `[WARNING] The command at ${filePath} is 
          missing a required "data" or "execute" property.`
        );
      }
    }

    this.discordClient.client.login(process.env.TOKEN);
    this.logger.info('Application initialized', 'Application');
  }

  private initEvents() {
    this.readyEvent.init();
    this.interactionCreateEvent.init();
  }

  public async init(): Promise<void> {
    await this.initCommands();
    this.initEvents();
  }
}
