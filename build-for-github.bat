@echo off
echo Building React app for GitHub Pages...
cd /d "d:\GitHubDesktop\repository\MangaReader-jp"
call npm run build
echo.
echo Build complete! The 'build' folder contains your production app.
echo.
echo Next steps:
echo 1. Copy contents of 'build' folder to a new branch 'gh-pages'
echo 2. Or use GitHub Actions to deploy automatically
echo.
pause
