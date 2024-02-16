import { Container } from 'inversify';
import { Component } from '../shared/types/component.enum';
import { PinoLogger } from '../shared/logger/pino-loger';

export const getAppContainer = () => {
  const container = new Container();

  container.bind(Component.Logger).to(PinoLogger).inSingletonScope();

  return container;
};
