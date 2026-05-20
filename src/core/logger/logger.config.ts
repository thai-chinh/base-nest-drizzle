export const loggerConfig = {
  forRoutes: ['*'],
  pinoHttp: {
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              singleLine: true,
              colorize: true,
              translateTime: 'HH:MM:ss.l',
              ignore:
                'pid,hostname,req.headers.authorization,req.headers.cookie,req.body.password,req.body.token',
              levelFirst: true,
            },
          }
        : undefined,
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    serializers: {
      err: (err: any) => ({
        type: err.type,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
        code: err.code,
      }),
      error: (err: any) => ({
        type: err.type,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
        code: err.code,
      }),
      req: (req: any) => {
        // Production: chỉ log essentials
        if (process.env.NODE_ENV === 'production') {
          return {
            method: req.method,
            url: req.url,
            userAgent: req.headers['user-agent'],
            ip: req.ip,
          };
        }
        // Development: log chi tiết
        return {
          method: req.method,
          url: req.url,
          headers: {
            'user-agent': req.headers['user-agent'],
            'content-type': req.headers['content-type'],
            referer: req.headers.referer,
          },
          ip: req.ip,
          hostname: req.hostname,
          protocol: req.protocol,
        };
      },
      res: (res: any) => ({
        statusCode: res.statusCode,
        // Production: không log response time trong serializer
        // Development: có thể thêm nếu cần
      }),
    },
    customProps: (req: any) => ({
      // Correlation ID cho tracing
      correlationId: req.id,
      // Environment context
      env: process.env.NODE_ENV,
      // Service name
      service: 'wedtech-be',
      // Timestamp (Pino tự thêm, nhưng có thể custom)
      timestamp: new Date().toISOString(),
    }),
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.token',
        'req.body.accessToken',
        'req.body.refreshToken',
        'req.body.email', // Redact email trong body
        'req.body.phone', // Redact phone trong body
        'res.headers["set-cookie"]',
        '*.password',
        '*.token',
        '*.secret',
        '*.key',
      ],
      censor: '[REDACTED]',
    },
    // Production: bỏ log HTTP request/response nếu không cần
    autoLogging: process.env.NODE_ENV === 'production' ? false : true,
    // Custom log level cho production
    customLogLevel: (req: any, res: any, err: any) => {
      if (err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      if (res.statusCode >= 300) return 'silent'; // redirects
      return 'info';
    },
    // Production: chỉ log slow requests (> 1s)
    // Note: Fastify doesn't have getResponseTime(), so we'll simplify
    customSuccessMessage: (req: any, res: any) => {
      // For Fastify, we can't easily get response time here
      // Just log all requests in dev, minimal in prod
      if (process.env.NODE_ENV === 'production') {
        return ''; // Don't log successful requests in production
      }
      return `${req.method} ${req.url} ${res.statusCode}`;
    },
    // Production: chỉ log errors
    customErrorMessage: (req: any, res: any, err: any) => {
      return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
    },
  },
};
