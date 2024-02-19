import { AudioPlayer, VoiceConnection } from '@discordjs/voice';

export type VoiceInfo = {
  player: AudioPlayer;
  connection: VoiceConnection;
  firstPlay: boolean;
  firstInit: boolean;
  isBotConnected: boolean;
  queue: string[];
};
