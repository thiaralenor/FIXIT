@echo off
echo Starting FIXIT Platform...
start http://localhost:3000
cd /d "%~dp0\backend"
start node server.js
cd /d "%~dp0\frontend"
npx vite --port 3000 --host
