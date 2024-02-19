import { injectable } from 'inversify';
import { VoiceInfo } from '../../shared/types/play.type';

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
}
