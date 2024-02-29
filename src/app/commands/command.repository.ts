import { Collection } from 'discord.js';
import { inject, injectable } from 'inversify';
import { Logger } from 'src/shared/logger/logger.interface';
import { Component } from '../../shared/types/component.enum';
import { Command } from './command.interface';

@injectable()
export class CommandRepository {
  private readonly commands: Collection<string, Command>;

  constructor(@inject(Component.Logger) private readonly logger: Logger) {
    this.commands = new Collection();
  }

  public add(command: Command): void {
    this.commands.set(command.data.name, command);
    this.logger.info(`Command ${command.data.name} added to repository.`);
  }

  public get(name: string): Command | undefined {
    return this.commands.get(name);
  }

  public getAll(): Collection<string, Command> {
    return this.commands;
  }
}
