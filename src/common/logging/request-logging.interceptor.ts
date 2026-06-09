import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLoggerService } from './app-logger.service';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private static readonly CONTEXT = 'HTTP';

  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<{ method: string; url: string }>();
    const { method, url } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const statusCode = http.getResponse<{ statusCode: number }>()
            .statusCode;
          this.logger.log(
            `HTTP ${method} ${url} ${statusCode} ${Date.now() - start}ms`,
            RequestLoggingInterceptor.CONTEXT,
          );
        },
        error: (err: { status?: number }) => {
          const statusCode = err?.status ?? 500;
          this.logger.warn(
            `HTTP ${method} ${url} ${statusCode} ${Date.now() - start}ms`,
            RequestLoggingInterceptor.CONTEXT,
          );
        },
      }),
    );
  }
}
