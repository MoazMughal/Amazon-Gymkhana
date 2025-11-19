@echo off
echo ========================================
echo  📦 Import ALL Products (480 products)
echo ========================================
echo.

cd server

echo 🔌 Connecting to database...
echo 📥 Importing/Updating all products...
echo.

node scripts/importAllProducts.js

echo.
echo ========================================
echo  ✅ Import Complete!
echo ========================================
echo.
echo Press any key to exit...
pause > nul
