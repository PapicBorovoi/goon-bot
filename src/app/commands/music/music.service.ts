import { inject, injectable } from 'inversify';
import { Component } from '../../../shared/types/component.enum';
import { VoiceInfoRepository } from './voice-info.repository';
import {
  joinVoiceChannel,
  VoiceConnectionStatus,
  AudioPlayerStatus,
  createAudioResource,
} from '@discordjs/voice';
import {
  ChatInputCommandInteraction,
  VoiceBasedChannel,
  Guild,
} from 'discord.js';
import { VoiceInfo } from '@/shared/types/play.type';
import { AWAIT_TIME_BEFORE_DISCONNECT } from '../command.const';
import * as play from 'play-dl';
import { Logger } from '@/shared/logger/logger.interface';

type Options = {
  guildId: string;
  interaction: ChatInputCommandInteraction;
  voiceChannel: VoiceBasedChannel;
  guild: Guild;
};

@injectable()
export class MusicService {
  constructor(
    @inject(Component.VoiceInfoRepository)
    private readonly voiceInfoRepository: VoiceInfoRepository,
    @inject(Component.Logger) private readonly logger: Logger
  ) {}

  private handlePlayerIdle = async (guildId: string) => {
    const info = this.voiceInfoRepository.get(guildId);

    if (!info) {
      this.logger.warn('VoiceInfo not found');
      return;
    }

    if (info.queue.length > 0) {
      const name = info.queue.shift();

      const audio = await play.stream(name!);

      const resource = createAudioResource(audio.stream, {
        inputType: audio.type,
      });

      info.player.play(resource);

      info.connection.subscribe(info.player);
    } else {
      this.voiceInfoRepository.update(guildId, {
        firstPlay: true,
      });

      setTimeout(() => {
        if (info.player.state.status !== AudioPlayerStatus.Idle) {
          return;
        }
        if (
          info.connection.state.status !== VoiceConnectionStatus.Destroyed &&
          info.connection.state.status !== VoiceConnectionStatus.Disconnected
        ) {
          info.connection.destroy();
        }
        info.isBotConnected = false;
      }, AWAIT_TIME_BEFORE_DISCONNECT);
    }
  };

  public async addNewVoiceInfo(options: Options) {
    const info = this.voiceInfoRepository.initNew(options);

    this.connect(info, options);

    if (info.firstInit) {
      info.connection.on(VoiceConnectionStatus.Disconnected, () => {
        this.voiceInfoRepository.update(options.guildId, {
          queue: [],
          isBotConnected: false,
          firstPlay: true,
        });
        info.player.stop(true);
      });
      info.connection.on(VoiceConnectionStatus.Destroyed, () => {
        this.voiceInfoRepository.update(options.guildId, {
          queue: [],
          isBotConnected: false,
          firstPlay: true,
        });
        info.player.stop(true);
      });
      info.connection.on(VoiceConnectionStatus.Ready, () => {
        this.voiceInfoRepository.update(options.guildId, {
          isBotConnected: true,
        });
      });

      info.player.on(
        AudioPlayerStatus.Idle,
        async () => await this.handlePlayerIdle(options.guildId)
      );
      info.firstInit = false;
    }
    return info;
  }

  public async connect(info: VoiceInfo, options: Options) {
    if (!info.isBotConnected) {
      info.connection = joinVoiceChannel({
        channelId: options.voiceChannel.id,
        guildId: options.guildId,
        adapterCreator: options.guild.voiceAdapterCreator,
      });
    }
  }
}
