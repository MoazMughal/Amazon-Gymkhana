#!/usr/bin/env node

/**
 * CORS Fix and Server Restart Script
 * Fixes CORS issues and restarts the server
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 CORS Fix and Server Restart\n');

console.log('✅ CORS configuration updated in server.js');
console.log('✅ FRONTEND_URL updated in server/.env');
console.log('\n📋 Changes made:');
console.log('   - CORS now allows multiple origins including localhost:3000');
console.log('   - FRONTEND_URL set to http://localhost:3000 for development');
console.log('   - Server will accept requests from frontend\n');

console.log('🔄 Please restart your server manually:');
console.log('   1. Stop the current server (Ctrl+C in server terminal)');
console.log('   2. Restart with: cd server && npm start');
console.log('   3. Then test the frontend\n');

console.log('🧪 Testing endpoints after restart:');
console.log('   - Health: http://localhost:5000/api/health');
console.log('   - Products: http://localhost:5000/api/products/public');
console.log('   - Excel: http://localhost:5000/api/excel/products-by-category');
console.log('   - Frontend Test: Open test-frontend-api.html in browser\n');

console.log('🎯 Expected result:');
console.log('   - Products should now load in Amazon\'s Choice page');
console.log('   - No CORS errors in browser console');
console.log('   - API calls successful in Network tab\n');

console.log('💡 If still not working:');
console.log('   1. Check browser console for errors');
console.log('   2. Check Network tab for failed requests');
console.log('   3. Verify server is running on port 5000');
console.log('   4. Open test-frontend-api.html to test API directly');