#!/usr/bin/env ts-node
import { CLIApplication } from './cli/cli-application';
import { DeleteCommand } from './cli/command/delete.command';
import { DeployCommand } from './cli/command/deploy.command';
import { join } from 'node:path';
import 'reflect-metadata';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({ path: join(__dirname, '..', '.env') });

const bootstrap = () => {
  const cliApplication = new CLIApplication();
  cliApplication.registerCommands([new DeleteCommand(), new DeployCommand()]);

  cliApplication.processCommand(process.argv);
};

bootstrap();
