@echo off
echo ========================================
echo  🔥 Mark Top 20 Products as Best Sellers
echo ========================================
echo.

cd server

echo 🔌 Connecting to database...
echo 📊 Finding top-rated products...
echo 🏆 Marking as Best Sellers...
echo.

node scripts/markBestSellers.js

echo.
echo ========================================
echo  ✅ Best Sellers Updated!
echo ========================================
echo.
echo Press any key to exit...
pause > nul
