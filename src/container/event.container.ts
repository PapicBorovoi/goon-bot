import { Container } from 'inversify';
import { InteractionCreateEvent } from '../app/events/interaction-create.event';
import { ReadyEvent } from '../app/events/ready.event';
import { Component } from '../shared/types/component.enum';

export const getEventContainer = () => {
  const container = new Container();

  container
    .bind<InteractionCreateEvent>(Component.InteractionCreateEvent)
    .to(InteractionCreateEvent)
    .inSingletonScope();
  container
    .bind<ReadyEvent>(Component.ReadyEvent)
    .to(ReadyEvent)
    .inSingletonScope();

  return container;
};
