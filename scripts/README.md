# Database Scripts

This directory contains utility scripts for database management.

## 📋 Available Scripts

### Migration Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `pnpm db:generate` | Generate migration from schema changes | Automatically runs Drizzle Kit |
| `pnpm db:migrate` | Apply migrations to database | Apply all pending migrations |
| `pnpm db:push` | Push schema directly (dev only) | Bypass migrations for development |
| `pnpm db:studio` | Open Drizzle Studio GUI | Visual database browser |
| `pnpm db:drop` | Drop all tables (danger!) | Clean database for testing |
| `pnpm migration:generate` | Generate migration with custom name | `pnpm migration:generate --name=add_refresh_tokens` |
| `pnpm migration:list` | List all migrations | View migration history |

### Seed Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `pnpm seed:create-user` | Create a new user | `pnpm seed:create-user --email=admin@example.com --password=admin123 --role=admin` |
| `pnpm seed:list-users` | List all users | View all users in database |

## 🚀 Usage Examples

### 1. Create a Migration with Custom Name

```bash
# Step 1: Make changes to app.schema.ts
# Step 2: Generate migration with custom name

# With pnpm/yarn:
pnpm migration:generate --name=add_refresh_tokens

# With npm (note the -- separator):
npm run migration:generate -- --name=add_refresh_tokens

# Step 3: Apply the migration
pnpm db:migrate
```

### 2. Create Admin User

```bash
# Create admin user

# With pnpm/yarn:
pnpm seed:create-user --email=admin@wedtech.com --password=admin123 --role=admin

# With npm (note the -- separator):
npm run seed:create-user -- --email=admin@wedtech.com --password=admin123 --role=admin

# Create regular user
pnpm seed:create-user --email=user@wedtech.com --password=user123 --role=user --firstName=John --lastName=Doe
```

### 3. List Users

```bash
# List all users
pnpm seed:list-users
```

### 4. List Migrations

```bash
# View migration history
pnpm migration:list
```

## 📁 File Structure

```
scripts/
├── generate-migration.ts  # Migration generator with custom names
├── seed.ts               # User seed script
├── generate-openapi.ts   # OpenAPI spec generator
└── README.md            # This file
```

## 🔧 Migration Naming Convention

Use descriptive names with underscores:

- `add_refresh_tokens`
- `create_users_table` 
- `add_index_to_email`
- `modify_user_role_column`
- `drop_old_tables`

## ⚠️ Important Notes

1. **Always backup database** before running migrations
2. **Test migrations** in development first
3. **Never modify migration files** after they've been applied to production
4. **Use `db:push` only in development** - not for production

## 🐛 Troubleshooting

### Migration fails
- Check database connection in `.env`
- Verify schema changes are valid
- Check for syntax errors in migration SQL

### Seed script fails
- Ensure database is running
- Check if user already exists
- Verify password hashing works

### Drizzle Studio not connecting
- Check database credentials
- Ensure database is accessible
- Verify network connectivity

## 📚 Related Files

- `drizzle.config.ts` - Drizzle configuration
- `src/core/database/schema/app.schema.ts` - Database schema
- `.env.example` - Environment variables template