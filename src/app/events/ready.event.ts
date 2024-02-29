import { Events, Client } from 'discord.js';
import { inject, injectable } from 'inversify';
import { Logger } from 'src/shared/logger/logger.interface';
import { Component } from '../../shared/types/component.enum';
import { DiscordClient } from '../client';

@injectable()
export class ReadyEvent {
  private readonly name = Events.ClientReady;

  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.DiscordClient)
    private readonly discordClient: DiscordClient
  ) {}

  private execute(client: Client): void {
    if (!client.user) {
      throw new Error('Client user is not defined');
    }
    this.logger.info(`Ready! Logged in as ${client.user.tag}`, 'ReadyEvent');
  }

  public init() {
    this.discordClient.client.once(this.name, (client) => this.execute(client));
  }
}
