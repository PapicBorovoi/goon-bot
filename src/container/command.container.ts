import { PlayCommand } from '../app/commands/play.command';
import { Command } from '../app/commands/command.interface';
import { CommandRepository } from './../app/commands/command.repository';
import { VoiceInfoRepository } from './../app/commands/voice-info.repository';
import { Component } from './../shared/types/component.enum';
import { Container } from 'inversify';

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

  return container;
};
