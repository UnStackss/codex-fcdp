$batchCode = @'
@echo off
:: Verifica se Node.js è installato
node -v >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Node.js non trovato. Procedo con il download e l'installazione...
    :: Scarica l'installer di Node.js
    powershell -Command "Invoke-WebRequest -Uri https://nodejs.org/dist/v16.13.1/node-v16.13.1-x64.msi -OutFile nodejs-installer.msi"
    echo [>>] Installando Node.js...
    :: Esegui l'installer
    start /wait msiexec /i nodejs-installer.msi /quiet /norestart
    :: Rimuovi l'installer dopo l'installazione
    del nodejs-installer.msi
    echo [OK] Node.js è stato installato con successo.
) else (
    echo [OK] Node.js è già installato.
)

:: Verifica se esiste il file package.json e node_modules
if exist "package.json" (
    if exist "node_modules" (
        echo [V] Il progetto è configurato correttamente. Eseguo npm install e npm start...
        call npm install
        call npm start
    ) else (
        echo [*] La cartella node_modules non è presente. Eseguiamo npm install...
        call npm install
        call npm start
    )
) else (
    echo [X] Il file package.json non è presente. Assicurati che il progetto sia configurato correttamente.
    exit /b 1
)

pause
'@

# Salva il contenuto in un file batch con codifica UTF-8 con BOM
$batchFilePath = "C:\Users\thoma\Downloads\calcolatore-fcdp\start.bat"
[System.IO.File]::WriteAllText($batchFilePath, $batchCode, [System.Text.Encoding]::UTF8)

Write-Host "File batch creato con successo in: $batchFilePath"
