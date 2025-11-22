// Script to replace all hardcoded localhost URLs with API config
const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/pages/seller/Profile.jsx',
  'src/pages/seller/Products.jsx',
  'src/pages/seller/Dashboard.jsx',
  'src/pages/seller/EditProfile.jsx',
  'src/pages/seller/AddProducts.jsx',
  'src/pages/seller/AddProduct.jsx',
  'src/pages/ResetPassword.jsx',
  'src/pages/Register.jsx',
  'src/pages/Login.jsx',
  'src/pages/ForgotPasswordToken.jsx',
  'src/pages/ForgotPassword.jsx',
  'src/pages/ExcelProducts.jsx',
  'src/pages/buyer/Dashboard.jsx',
  'src/pages/BestSellers.jsx',
  'src/pages/AmazonsChoice.jsx',
  'src/pages/auth/SupplierRegister.jsx',
  'src/pages/auth/SupplierLogin.jsx',
  'src/pages/auth/BuyerRegister.jsx',
  'src/pages/auth/BuyerLogin.jsx',
  'src/pages/admin/AddProduct.jsx',
  'src/pages/admin/Products.jsx',
  'src/pages/admin/UaeExcelImport.jsx',
  'src/pages/admin/ExcelImport.jsx',
  'src/pages/admin/Sellers.jsx',
  'src/pages/admin/SellerProducts.jsx',
  'src/pages/admin/SellerVerifications.jsx',
  'src/pages/admin/Buyers.jsx',
  'src/pages/admin/Dashboard.jsx',
  'src/pages/admin/EditProduct.jsx',
  'src/pages/admin/Login.jsx'
];

console.log('🔧 Fixing API URLs in all files...\n');

filesToFix.forEach(filePath => {
  try {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Skipping ${filePath} (not found)`);
      return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;
    
    // Check if apiConfig is already imported
    const hasApiConfigImport = content.includes("import apiConfig from '../config/api.config'") ||
                                content.includes('import apiConfig from \'../config/api.config\'') ||
                                content.includes("import apiConfig from '../../config/api.config'") ||
                                content.includes('import apiConfig from "../../config/api.config"');
    
    // Add import if not present
    if (!hasApiConfigImport && content.includes('http://localhost:5000')) {
      // Determine correct import path based on file location
      const depth = filePath.split('/').length - 2; // -2 for src/ and filename
      const importPath = '../'.repeat(depth) + 'config/api.config';
      
      // Find the last import statement
      const importRegex = /import .+ from .+['"]/g;
      const imports = content.match(importRegex);
      
      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        const insertPosition = lastImportIndex + lastImport.length;
        
        content = content.slice(0, insertPosition) + 
                  `\nimport apiConfig from '${importPath}'` +
                  content.slice(insertPosition);
      }
    }
    
    // Replace all localhost URLs
    content = content.replace(/http:\/\/localhost:5000\/api\//g, "' + apiConfig.API_BASE_URL + '/");
    content = content.replace(/`http:\/\/localhost:5000\/api\//g, "`${apiConfig.API_BASE_URL}/");
    content = content.replace(/'http:\/\/localhost:5000\/api\//g, "apiConfig.API_BASE_URL + '/");
    content = content.replace(/"http:\/\/localhost:5000\/api\//g, 'apiConfig.API_BASE_URL + "/');
    
    // Fix template literals
    content = content.replace(/\$\{apiConfig\.API_BASE_URL\}\/\$\{/g, '${apiConfig.API_BASE_URL}/');
    
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed ${filePath}`);
    } else {
      console.log(`⏭️  No changes needed in ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('\n✅ All files processed!');
