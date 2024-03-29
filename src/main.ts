import 'reflect-metadata';
import { getCommandContainer } from './container/command.container';
import { Application } from './app/application';
import { getAppContainer } from './container/app.contrainer';
import { Component } from './shared/types/component.enum';
import 'dotenv/config';
import { Container } from 'inversify';
import { getEventContainer } from './container/event.container';

const bootstrap = async () => {
  const container = Container.merge(
    getAppContainer(),
    getEventContainer(),
    getCommandContainer()
  );

  const application = container.get<Application>(Component.Application);
  application.init();
};

bootstrap();
