#!/usr/bin/env ts-node
/**
 * Generate Migration with Custom Name
 * 
 * Usage:
 * pnpm migration:generate --name=add_refresh_tokens
 * pnpm migration:generate --name=create_users_table
 */

import 'dotenv/config';
import { execSync } from 'child_process';
import { readdirSync, renameSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Parse command line arguments
function parseArgs() {
  // Get all args after the script name
  // npm/pnpm may pass arguments differently
  const args = process.argv.slice(2);
  const parsed: Record<string, string | boolean> = {};

  // Special handling for npm/pnpm differences
  // npm run script -- --name=value  (uses -- separator)
  // pnpm script --name=value         (direct)
  
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

function generateMigration(name: string) {
  console.log(`🚀 Generating migration: ${name}`);
  
  try {
    // Run drizzle-kit generate
    execSync('pnpm db:generate', { stdio: 'inherit' });
    
    // Find the latest migration file
    const migrationsDir = join(process.cwd(), 'drizzle');
    const files = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (files.length === 0) {
      console.log('❌ No migration files found');
      return;
    }
    
    const latestFile = files[files.length - 1];
    const oldPath = join(migrationsDir, latestFile);
    
    // Extract the number prefix (e.g., "0001" from "0001_initial.sql")
    const match = latestFile.match(/^(\d+)_/);
    if (!match) {
      console.log(`⚠️  Could not extract number from filename: ${latestFile}`);
      console.log(`   Keeping original name: ${latestFile}`);
      return;
    }
    
    const number = match[1];
    const newFileName = `${number}_${name.replace(/[^a-zA-Z0-9_]/g, '_')}.sql`;
    const newPath = join(migrationsDir, newFileName);
    
    // Rename the file
    renameSync(oldPath, newPath);
    
    // Try to update journal.json if it exists
    try {
      const journalPath = join(migrationsDir, 'meta', '_journal.json');
      if (existsSync(journalPath)) {
        const journal = JSON.parse(readFileSync(journalPath, 'utf-8'));
        
        // Find the latest entry (should be the last one)
        if (journal.entries && journal.entries.length > 0) {
          const latestEntry = journal.entries[journal.entries.length - 1];
          
          // Update tag to match our filename (without .sql extension)
          const tagName = newFileName.replace('.sql', '');
          latestEntry.tag = tagName;
          
          writeFileSync(journalPath, JSON.stringify(journal, null, 2));
          console.log(`📝 Updated journal tag to: ${tagName}`);
        }
      }
    } catch (journalError) {
      console.log('⚠️  Could not update journal (not critical):', (journalError as Error).message);
    }
    
    console.log(`✅ Migration generated and renamed:`);
    console.log(`   From: ${latestFile}`);
    console.log(`   To:   ${newFileName}`);
    console.log(`\n📁 Location: ${migrationsDir}`);
    console.log(`\n🔧 To apply migration: pnpm db:migrate`);
    
  } catch (error) {
    console.error('❌ Error generating migration:', error);
    process.exit(1);
  }
}

function listMigrations() {
  const migrationsDir = join(process.cwd(), 'drizzle');
  
  try {
    const files = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (files.length === 0) {
      console.log('📭 No migration files found');
      return;
    }
    
    console.log(`📋 Found ${files.length} migration(s):\n`);
    
    files.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });
    
    console.log(`\n📁 Location: ${migrationsDir}`);
    
  } catch (error) {
    console.error('❌ Error listing migrations:', error);
    process.exit(1);
  }
}

// Main execution
async function main() {
  const args = parseArgs();
  
  if (args.help || args.h === true) {
    console.log(`
Migration Generator Script
==========================

Usage:
  pnpm migration:generate --name=<migration_name>
  pnpm migration:list

Options:
  --name=<name>    Name for the migration (required for generate)
  --help, -h       Show this help message

Examples:
  npm migration:generate --name=add_refresh_tokens
  npm migration:generate --name=create_users_table
  npm migration:generate --name=add_index_to_email
  npm migration:list

Note:
  - This script runs "pnpm db:generate" first
  - Then renames the latest migration file with your custom name
  - Migration names should use underscores (e.g., add_refresh_tokens)
    `);
    return;
  }

  if (args.list) {
    listMigrations();
  } else if (typeof args.name === 'string' && args.name) {
    generateMigration(args.name);
  } else {
    console.error('❌ Error: Migration name is required');
    console.error('Usage: pnpm migration:generate --name=<migration_name>');
    console.error('Example: pnpm migration:generate --name=add_refresh_tokens');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { generateMigration, listMigrations };