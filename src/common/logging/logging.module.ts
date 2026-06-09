import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppLoggerService } from './app-logger.service';
import { RequestLoggingInterceptor } from './request-logging.interceptor';

@Global()
@Module({
  providers: [
    AppLoggerService,
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
  ],
  exports: [AppLoggerService],
})
export class LoggingModule {}
