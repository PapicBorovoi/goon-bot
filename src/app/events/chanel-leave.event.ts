import { Events, Client, VoiceState } from 'discord.js';
import { inject, injectable } from 'inversify';
import { Logger } from '@/shared/logger/logger.interface';
import { Component } from '../../shared/types/component.enum';
import { DiscordClient } from '../client';
import { AWAIT_TIME_AFTER_USER_DISCONNECT } from '../commands/command.const';

@injectable()
export class ChanelLeaveEvent {
  private readonly name = Events.VoiceStateUpdate;

  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.DiscordClient)
    private readonly discordClient: DiscordClient
  ) {}

  private execute(oldState: VoiceState, newState: VoiceState): void {
    if (
      oldState.channelId !== oldState.guild.members.me?.voice.channelId ||
      newState.channel
    ) {
      return;
    }

    if (!(oldState.channel!.members.size - 1)) {
      setTimeout(() => {
        if (!(oldState.channel!.members.size - 1)) {
          oldState.guild.members.me?.voice.disconnect();
        }
      }, AWAIT_TIME_AFTER_USER_DISCONNECT);
    }
  }

  public init() {
    this.discordClient.client.on(this.name, (oldState, newState) =>
      this.execute(oldState, newState)
    );
  }
}
