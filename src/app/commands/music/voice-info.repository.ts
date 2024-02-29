import { injectable } from 'inversify';
import { VoiceInfo, VoiceInfoUpdate } from '../../../shared/types/play.type';
import {
  ChatInputCommandInteraction,
  Guild,
  VoiceBasedChannel,
} from 'discord.js';
import {
  NoSubscriberBehavior,
  createAudioPlayer,
  joinVoiceChannel,
} from '@discordjs/voice';

@injectable()
export class VoiceInfoRepository {
  private readonly voiceInfo: Record<string, VoiceInfo> = {};

  constructor() {}

  public add(guildId: string, info: VoiceInfo): void {
    this.voiceInfo[guildId] = info;
  }

  public get(guildId: string): VoiceInfo | undefined {
    return this.voiceInfo[guildId];
  }

  public remove(guildId: string): void {
    delete this.voiceInfo[guildId];
  }

  public getAll(): Record<string, VoiceInfo> {
    return this.voiceInfo;
  }

  public update(guildId: string, info: VoiceInfoUpdate): void {
    this.voiceInfo[guildId] = {
      ...this.voiceInfo[guildId],
      ...info,
    };
  }

  public has(guildId: string): boolean {
    return guildId in this.voiceInfo;
  }

  public initNew(options: {
    guildId: string;
    interaction: ChatInputCommandInteraction;
    voiceChannel: VoiceBasedChannel;
    guild: Guild;
  }) {
    this.voiceInfo[options.guildId] = {
      player: createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Stop,
        },
      }),
      connection: joinVoiceChannel({
        channelId: options.voiceChannel.id,
        guildId: options.guildId,
        adapterCreator: options.guild.voiceAdapterCreator,
      }),
      firstPlay: true,
      firstInit: true,
      isBotConnected: false,
      queue: [],
    };
    return this.voiceInfo[options.guildId];
  }
}
