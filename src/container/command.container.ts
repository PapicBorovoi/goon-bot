import { SkipCommand } from '../app/commands/skip.command';
import { PlayCommand } from './../app/commands/play.command';
import { Command } from '../app/commands/command.interface';
import { CommandRepository } from './../app/commands/command.repository';
import { VoiceInfoRepository } from '../app/commands/music/voice-info.repository';
import { Component } from './../shared/types/component.enum';
import { Container } from 'inversify';
import { MusicService } from '../app/commands/music/music.service';
import { ClearCommand } from '@/app/commands/clear.command';

export const getCommandContainer = () => {
  const container = new Container();

  container
    .bind<VoiceInfoRepository>(Component.VoiceInfoRepository)
    .to(VoiceInfoRepository)
    .inSingletonScope();
  container
    .bind<CommandRepository>(Component.CommandRepository)
    .to(CommandRepository)
    .inSingletonScope();
  container.bind<Command>(Component.Command).to(PlayCommand).inSingletonScope();
  container
    .bind<MusicService>(Component.MusicService)
    .to(MusicService)
    .inSingletonScope();
  container.bind<Command>(Component.Command).to(SkipCommand).inSingletonScope();
  container
    .bind<Command>(Component.Command)
    .to(ClearCommand)
    .inSingletonScope();

  return container;
};
