#!/usr/bin/env node

/**
 * Production URL Fix Script
 * This script ensures all API URLs are properly configured for production deployment
 */

import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing production URLs for deployment...\n');

// Configuration
const PRODUCTION_API_URL = 'https://generic-wholesale-backend.onrender.com/api';
const PRODUCTION_FRONTEND_URL = 'https://www.genericwholesale.pk';

// Files to update
const filesToUpdate = [
  {
    path: 'src/config/api.config.js',
    replacements: [
      {
        search: /https:\/\/generic-wholesale-backend\.onrender\.com\/api/g,
        replace: PRODUCTION_API_URL
      }
    ]
  },
  {
    path: 'server/.env',
    replacements: [
      {
        search: /FRONTEND_URL=.*/,
        replace: `FRONTEND_URL=${PRODUCTION_FRONTEND_URL}`
      },
      {
        search: /NODE_ENV=.*/,
        replace: 'NODE_ENV=production'
      }
    ]
  },
  {
    path: 'render.yaml',
    replacements: [
      {
        search: /value: https:\/\/generic-wholesale-backend\.onrender\.com\/api/,
        replace: `value: ${PRODUCTION_API_URL}`
      },
      {
        search: /value: https:\/\/www\.genericwholesale\.pk/,
        replace: `value: ${PRODUCTION_FRONTEND_URL}`
      }
    ]
  }
];

// Function to update file content
function updateFile(filePath, replacements) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    replacements.forEach(({ search, replace }) => {
      if (content.match(search)) {
        content = content.replace(search, replace);
        updated = true;
      }
    });

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
let totalUpdated = 0;

filesToUpdate.forEach(({ path: filePath, replacements }) => {
  if (updateFile(filePath, replacements)) {
    totalUpdated++;
  }
});

console.log(`\n🎉 Production URL fix complete!`);
console.log(`📊 Files updated: ${totalUpdated}/${filesToUpdate.length}`);

// Additional checks
console.log('\n🔍 Verification:');

// Check if .env file has correct settings
try {
  const envContent = fs.readFileSync('server/.env', 'utf8');
  const hasProductionEnv = envContent.includes('NODE_ENV=production');
  const hasCorrectFrontendUrl = envContent.includes(PRODUCTION_FRONTEND_URL);
  
  console.log(`   NODE_ENV=production: ${hasProductionEnv ? '✅' : '❌'}`);
  console.log(`   Correct FRONTEND_URL: ${hasCorrectFrontendUrl ? '✅' : '❌'}`);
} catch (error) {
  console.log('   ⚠️  Could not verify server/.env file');
}

// Check if API config has correct URL
try {
  const apiConfigContent = fs.readFileSync('src/config/api.config.js', 'utf8');
  const hasCorrectApiUrl = apiConfigContent.includes(PRODUCTION_API_URL);
  
  console.log(`   Correct API URL: ${hasCorrectApiUrl ? '✅' : '❌'}`);
} catch (error) {
  console.log('   ⚠️  Could not verify API config file');
}

console.log('\n📋 Next Steps:');
console.log('1. Commit these changes to your repository');
console.log('2. Deploy to Render using the updated configuration');
console.log('3. Set environment variables in Render dashboard');
console.log('4. Test the deployed application');

console.log('\n🌐 URLs to test after deployment:');
console.log(`   Frontend: ${PRODUCTION_FRONTEND_URL}`);
console.log(`   Backend API: ${PRODUCTION_API_URL}`);
console.log(`   Health Check: ${PRODUCTION_API_URL.replace('/api', '')}/health`);