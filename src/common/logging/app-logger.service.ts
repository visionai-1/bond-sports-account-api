import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppLoggerService {
  private readonly logger = new Logger();

  log(message: string, context?: string, meta?: Record<string, unknown>): void {
    this.logger.log(this.format(message, meta), context);
  }

  warn(
    message: string,
    context?: string,
    meta?: Record<string, unknown>,
  ): void {
    this.logger.warn(this.format(message, meta), context);
  }

  error(
    message: string,
    trace?: string,
    context?: string,
    meta?: Record<string, unknown>,
  ): void {
    this.logger.error(this.format(message, meta), trace, context);
  }

  private format(message: string, meta?: Record<string, unknown>): string {
    if (!meta) {
      return message;
    }
    try {
      return `${message} ${JSON.stringify(meta)}`;
    } catch {
      return message;
    }
  }
}
