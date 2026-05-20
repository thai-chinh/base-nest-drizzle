#!/usr/bin/env ts-node
/**
 * Database Seed Script
 * 
 * Usage:
 * pnpm seed:create-user --email=admin@example.com --password=admin123 --role=admin
 * pnpm seed:create-user --email=user@example.com --password=user123 --role=user
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { hashPassword } from '../src/common/utils/crypto.util';
import { users } from '../src/core/database/schema/app.schema';
import { generateSnowflakeId } from '../src/common/utils/snowflake.util';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: Record<string, string | boolean> = {};

  for (const arg of args) {
    if (arg.startsWith('--')) {
      if (arg.includes('=')) {
        const [key, value] = arg.slice(2).split('=');
        parsed[key] = value || '';
      } else {
        // Flag without value (e.g., --list, --help)
        parsed[arg.slice(2)] = true;
      }
    }
  }

  return parsed;
}

async function createUser() {
  const args = parseArgs();
  
  const email = (typeof args.email === 'string' ? args.email : 'admin@gmail.com');
  const password = (typeof args.password === 'string' ? args.password : 'admin123');
  const role = (typeof args.role === 'string' ? args.role : 'admin');
  const firstName = (typeof args.firstName === 'string' ? args.firstName : 'Admin');
  const lastName = (typeof args.lastName === 'string' ? args.lastName : 'User');
  
  if (!email || !password) {
    console.error('Error: Email and password are required');
    console.error('Usage: pnpm seed:create-user --email=admin@gmail.com --password=admin123 --role=admin');
    process.exit(1);
  }

  // Database connection
  const connectionString = process.env.DATABASE_URL || 
    `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;
  
  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    console.log('🔍 Checking if user already exists...');
    
    // Check if user already exists
    const existingUsers = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    
    if (existingUsers.length > 0) {
      console.log(`⚠️  User with email "${email}" already exists`);
      console.log('User details:', {
        id: existingUsers[0].id.toString(),
        email: existingUsers[0].email,
        role: existingUsers[0].role,
        status: existingUsers[0].status,
      });
      return;
    }

    console.log('🔧 Creating new user...');
    
    // Generate Snowflake ID
    const userId = generateSnowflakeId();
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user
    const [newUser] = await db.insert(users).values({
      id: userId,
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      role,
      status: 1, // Active
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    console.log('✅ User created successfully!');
    console.log('📋 User details:');
    console.log({
      id: newUser.id.toString(),
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      status: newUser.status,
      createdAt: newUser.createdAt,
    });
    console.log('\n🔑 Login credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${role}`);

  } catch (error) {
    console.error('❌ Error creating user:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Main execution
async function main() {
  const args = parseArgs();
  const command = args._ || args.command || 'create';

  if (args.help || args.h) {
    console.log(`
Database Seed Script
====================

Commands:
  create    Create a new user (default)
  list      List all users

Usage:
  pnpm seed:create-user --email=admin@example.com --password=admin123 --role=admin
  pnpm seed:list-users

Options:
  --email=<email>        User email (required for create)
  --password=<password>  User password (required for create)
  --role=<role>          User role (default: admin)
  --firstName=<name>     First name (default: Admin)
  --lastName=<name>      Last name (default: User)
  --help, -h             Show this help message

Examples:
  pnpm seed:create-user --email=admin@wedtech.com --password=admin123 --role=admin
  pnpm seed:create-user --email=user@wedtech.com --password=user123 --role=user --firstName=John --lastName=Doe
  pnpm seed:list-users
    `);
    return;
  }

  await createUser();
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { createUser };