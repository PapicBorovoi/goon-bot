export const Component = {
  Logger: Symbol.for('Logger'),
  Application: Symbol.for('Application'),
  CommandRepository: Symbol.for('CommandRepository'),
  DiscordClient: Symbol.for('DiscordClient'),
  InteractionCreateEvent: Symbol.for('InteractionCreateEvent'),
  ReadyEvent: Symbol.for('ReadyEvent'),
  VoiceInfoRepository: Symbol.for('VoiceInfoRepository'),
  Command: Symbol.for('Command'),
  MusicService: Symbol.for('MusicService'),
  ChanelLeaveEvent: Symbol.for('ChanelLeaveEvent'),
} as const;
