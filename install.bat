@echo off
echo ========================================
echo Amazon Gymkhana - Full Stack Setup
echo ========================================
echo.

echo Installing Frontend Dependencies...
call npm install
echo.

echo Installing Backend Dependencies...
cd server
call npm install
cd ..
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Install MongoDB from https://www.mongodb.com/try/download/community
echo 2. Create server/.env file (copy from server/.env.example)
echo 3. Run: cd server ^&^& npm run create-admin
echo 4. Run: cd server ^&^& npm run dev (Terminal 1)
echo 5. Run: npm run dev (Terminal 2)
echo 6. Open: http://localhost:5173/admin/login
echo.
pause
