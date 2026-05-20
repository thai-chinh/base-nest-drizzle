---
name: nestjs-patterns
description: NestJS architecture patterns for modules, controllers, providers, DTO validation, guards, interceptors, config, and production-grade TypeScript backends.
origin: ECC
---

# NestJS Development Patterns

Production-grade NestJS patterns for modular TypeScript backends.

## When to Activate

- Building NestJS APIs or services
- Structuring modules, controllers, and providers
- Adding DTO validation, guards, interceptors, or exception filters
- Configuring environment-aware settings and database integrations
- Testing NestJS units or HTTP endpoints

## Project Structure

```text
src/
├── app.module.ts
├── main.ts
├── config/           ← registerAs() config factories
├── common/           ← guards, pipes, filters, interceptors, utils, exceptions
├── core/             ← database, redis, queue, storage, logger (infrastructure)
└── modules/
    └── [feature]/
        ├── [feature].module.ts
        ├── [feature].service.ts      ← business logic
        ├── [feature].repository.ts   ← data access (extends BaseRepository)
        ├── controllers/
        │   ├── [feature].controller.ts
        │   └── index.ts
        └── dto/
            ├── create-[feature].dto.ts
            ├── update-[feature].dto.ts
            ├── query-[feature].dto.ts
            ├── [feature]-response.dto.ts
            └── index.ts
```

- Keep domain code inside feature modules.
- Put cross-cutting filters, decorators, guards, and interceptors in `common/`.
- Keep DTOs close to the module that owns them.
- This project uses **Fastify**, not Express — use `FastifyRequest`/`FastifyReply` types.

## Bootstrap and Global Validation

This project uses **Fastify** as the HTTP adapter.

```ts
async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
    { bufferLogs: true },
  );

  app.useLogger(app.get(Logger)); // nestjs-pino

  app.useGlobalPipes(
    new TrimPipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TimeoutInterceptor(80000),
    new TransformInterceptor(),
  );

  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024, files: 5 } });
  await app.register(helmet);
  await app.register(compress);

  app.enableCors({ origin: process.env.CORS_ORIGIN || '*', credentials: true });

  await app.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' });
}
```

- Always enable `whitelist` and `forbidNonWhitelisted`.
- `enableImplicitConversion: false` — use `@Type(() => Number)` explicitly in DTOs.
- Use `FastifyRequest` / `FastifyReply` types, not Express `Request` / `Response`.

## Modules, Controllers, and Providers

```ts
@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }
}

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async create(dto: CreateUserDto) {
    return this.usersRepo.create(dto);
  }
}
```

- Controllers should stay thin: parse HTTP input, call a provider, return response DTOs.
- Put business logic in injectable services, not controllers.
- Export only the providers other modules genuinely need.

## DTOs and Validation

```ts
export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(2, 80)
  name!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
```

- Validate every request DTO with `class-validator`.
- Use dedicated response DTOs or serializers instead of returning ORM entities directly.
- Avoid leaking internal fields such as password hashes, tokens, or audit columns.

## Auth, Guards, and Request Context

This project uses a single `AuthGuard` in `src/common/guards/auth.guard.ts`.

```ts
// Protect a controller
@UseGuards(AuthGuard)
@Controller('posts')
export class PostsController {
  @Get('me')
  getMyPosts(@CurrentUser('id') userId: bigint) {
    return this.postsService.findByUser(userId);
  }
}

// Mark a route as public (skip auth)
@Public()
@Post('login')
login(@Body() dto: LoginDto) { ... }
```

- `@CurrentUser()` — gets full user object from request
- `@CurrentUser('id')` — gets `id` as `bigint`
- `@Public()` — skips `AuthGuard` for that route
- The guard sets `request.user = { id, email, role, status }`
- Role-based access: check `user.role` in the service, not a separate guard

## Exception Filters and Error Shape

```ts
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();

    if (exception instanceof HttpException) {
      return response.status(exception.getStatus()).json({
        path: request.url,
        error: exception.getResponse(),
      });
    }

    return response.status(500).json({
      path: request.url,
      error: 'Internal server error',
    });
  }
}
```

- Keep one consistent error envelope across the API.
- Throw framework exceptions for expected client errors; log and wrap unexpected failures centrally.

## Config and Environment Validation

```ts
ConfigModule.forRoot({
  isGlobal: true,
  load: [configuration],
  validate: validateEnv,
});
```

- Validate env at boot, not lazily at first request.
- Keep config access behind typed helpers or config services.
- Split dev/staging/prod concerns in config factories instead of branching throughout feature code.

## Persistence and Transactions

- All repositories extend `BaseRepository` from `@/core/database`
- Inject `DATABASE_CONNECTION` token, not `DrizzleDB` directly
- Services own transactions — pass `tx?: Transaction` down to repositories
- Do not let controllers coordinate multi-step writes directly
- See `drizzle-patterns` skill for full repository patterns

## Testing

```ts
describe('UsersController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [UsersModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });
});
```

- Unit test providers in isolation with mocked dependencies.
- Add request-level tests for guards, validation pipes, and exception filters.
- Reuse the same global pipes/filters in tests that you use in production.

## Production Defaults

- Enable structured logging and request correlation ids.
- Terminate on invalid env/config instead of booting partially.
- Prefer async provider initialization for DB/cache clients with explicit health checks.
- Keep background jobs and event consumers in their own modules, not inside HTTP controllers.
- Make rate limiting, auth, and audit logging explicit for public endpoints.
