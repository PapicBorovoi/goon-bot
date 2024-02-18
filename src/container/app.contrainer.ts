import { Container } from 'inversify';
import { Component } from '../shared/types/component.enum';
import { PinoLogger } from '../shared/logger/pino-loger';
import { Application } from '../app/application';
import { Logger } from '../shared/logger/logger.interface';
import { CommandRepository } from '../app/commands/command.repository';
import { DiscordClient } from '../app/client';

export const getAppContainer = () => {
  const container = new Container();

  container.bind<Logger>(Component.Logger).to(PinoLogger).inSingletonScope();
  container
    .bind<Application>(Component.Application)
    .to(Application)
    .inSingletonScope();
  container
    .bind<CommandRepository>(Component.CommandRepository)
    .to(CommandRepository)
    .inSingletonScope();
  container
    .bind<DiscordClient>(Component.DiscordClient)
    .to(DiscordClient)
    .inSingletonScope();

  return container;
};
