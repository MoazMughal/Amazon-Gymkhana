#!/usr/bin/env node

/**
 * Development Startup Script
 * Helps start both frontend and backend for development
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Generic Wholesale - Development Startup\n');

// Check if server directory exists
const serverPath = join(__dirname, 'server');
if (!fs.existsSync(serverPath)) {
  console.error('❌ Server directory not found!');
  console.log('📁 Expected path:', serverPath);
  process.exit(1);
}

// Check if server/.env exists
const serverEnvPath = join(serverPath, '.env');
if (!fs.existsSync(serverEnvPath)) {
  console.error('❌ Server .env file not found!');
  console.log('📁 Expected path:', serverEnvPath);
  console.log('💡 Create server/.env with database and email configuration');
  process.exit(1);
}

console.log('✅ Server directory found');
console.log('✅ Server .env file found');

// Function to start a process
function startProcess(command, args, cwd, name, color) {
  console.log(`\n🔄 Starting ${name}...`);
  
  const process = spawn(command, args, {
    cwd: cwd,
    stdio: 'pipe',
    shell: true
  });

  // Handle stdout
  process.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`${color}[${name}]${'\x1b[0m'} ${output}`);
    }
  });

  // Handle stderr
  process.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`${color}[${name}]${'\x1b[0m'} ${output}`);
    }
  });

  // Handle process exit
  process.on('close', (code) => {
    console.log(`\n${color}[${name}]${'\x1b[0m'} Process exited with code ${code}`);
  });

  return process;
}

// Colors for console output
const colors = {
  backend: '\x1b[34m',  // Blue
  frontend: '\x1b[32m', // Green
  reset: '\x1b[0m'
};

console.log('\n📋 Starting development servers...');
console.log('   Backend: http://localhost:5000');
console.log('   Frontend: http://localhost:3000');
console.log('   Press Ctrl+C to stop both servers\n');

// Start backend server
const backendProcess = startProcess(
  'npm', 
  ['start'], 
  serverPath, 
  'Backend', 
  colors.backend
);

// Wait a bit for backend to start, then start frontend
setTimeout(() => {
  const frontendProcess = startProcess(
    'npm', 
    ['run', 'dev'], 
    __dirname, 
    'Frontend', 
    colors.frontend
  );

  // Handle Ctrl+C to stop both processes
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping development servers...');
    
    backendProcess.kill('SIGINT');
    frontendProcess.kill('SIGINT');
    
    setTimeout(() => {
      console.log('✅ Development servers stopped');
      process.exit(0);
    }, 2000);
  });

}, 3000);

// Keep the main process alive
process.stdin.resume();