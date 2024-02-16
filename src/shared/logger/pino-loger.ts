import { injectable } from 'inversify';
import { Logger as PinoInstance, pino, transport } from 'pino';
import { resolve } from 'node:path';
import { Logger } from './logger.interface';

@injectable()
export class PinoLogger implements Logger {
  private readonly logger: PinoInstance;

  constructor() {
    const fileTarget = resolve(__dirname, '..', '..', '..', 'logs', 'logs.log');

    this.logger = pino(
      {},
      transport({
        targets: [
          {
            target: 'pino/file',
            options: { destination: fileTarget, mkdir: true },
            level: 'debug',
          },
          { target: 'pino/file', options: {}, level: 'info' },
        ],
      })
    );
  }

  public info(message: string, ...args: unknown[]): void {
    this.logger.info({}, message, ...args);
  }

  public error(error: Error, message: string, ...args: unknown[]): void {
    this.logger.error(error, message, ...args);
  }

  public debug(message: string, ...args: unknown[]): void {
    this.logger.debug({}, message, ...args);
  }

  public warn(message: string, ...args: unknown[]): void {
    this.logger.warn({}, message, ...args);
  }
}
