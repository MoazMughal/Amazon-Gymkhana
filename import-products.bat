@echo off
echo ========================================
echo  📦 Amazon Gymkhana - Import Products
echo ========================================
echo.

cd server

echo 🔌 Connecting to database...
echo 📥 Importing products...
echo.

node scripts/importProducts.js

echo.
echo ========================================
echo  ✅ Import Complete!
echo ========================================
echo.
echo Press any key to exit...
pause > nul
