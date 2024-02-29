import { inject, injectable, multiInject } from 'inversify';
import { Logger } from '@/shared/logger/logger.interface';
import { Component } from '../shared/types/component.enum';
import { CommandRepository } from './commands/command.repository';
import { DiscordClient } from './client';
import { Command } from './commands/command.interface';
import { ReadyEvent } from './events/ready.event';
import { InteractionCreateEvent } from './events/interaction-create.event';
import { ChanelLeaveEvent } from './events/chanel-leave.event';

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
    private readonly interactionCreateEvent: InteractionCreateEvent,
    @multiInject(Component.Command) private readonly commands: Command[],
    @inject(Component.ChanelLeaveEvent)
    private readonly chanelLeaveEvent: ChanelLeaveEvent
  ) {}

  private async initCommands(): Promise<void> {
    for (const command of this.commands) {
      this.commandRepository.add(command);
    }
  }

  private initEvents() {
    this.readyEvent.init();
    this.interactionCreateEvent.init();
    this.chanelLeaveEvent.init();
  }

  private async login(): Promise<void> {
    await this.discordClient.client.login(process.env.TOKEN);
    this.logger.info('Application initialized', 'Application');
  }

  public async init(): Promise<void> {
    await this.initCommands();
    this.initEvents();
    await this.login();
  }
}
