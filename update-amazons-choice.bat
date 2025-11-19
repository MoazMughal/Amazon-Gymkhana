@echo off
echo ========================================
echo  🏆 Update Amazon's Choice Products
echo ========================================
echo.

cd server

echo 🔌 Connecting to database...
echo 📝 Updating products...
echo.

node scripts/updateAmazonsChoice.js

echo.
echo ========================================
echo  ✅ Update Complete!
echo ========================================
echo.
echo Press any key to exit...
pause > nul
