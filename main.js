import { app, Tray, Menu, nativeImage, Notification, BrowserWindow } from 'electron';
import path from 'path';
import { exec } from 'child_process';
import open from 'open';
import axios from 'axios';
import fs from 'fs';
import os from 'os';

let serverProcess = null;
let tray = null;
const __dirname = path.dirname(new URL(import.meta.url).pathname);

async function downloadTrayIcon(url) {
  const tempPath = path.join(os.tmpdir(), 'tray-icon.png');
  const writer = fs.createWriteStream(tempPath);

  const response = await axios({ url, responseType: 'stream' });
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(tempPath));
    writer.on('error', reject);
  });
}

function killProcessesOnPort(port) {
  return new Promise((resolve, reject) => {
    exec(`netstat -ano | findstr :${port}`, (err, stdout, stderr) => {
      if (err || stderr) {
        reject(`Error finding process on port ${port}: ${stderr}`);
        return;
      }
      const pid = stdout.split(/\s+/)[4];
      if (pid && pid !== "TIME_WAIT" && pid !== "CLOSE_WAIT") {
        exec(`taskkill /PID ${pid} /F`, (killErr, killStdout, killStderr) => {
          if (killErr) {
            reject(`Failed to kill process ${pid}: ${killStderr}`);
            return;
          }
          resolve();
        });
      } else {
        reject(`No valid process found using port ${port}`);
      }
    });
  });
}

function startServer() {
  return new Promise((resolve, reject) => {
    serverProcess = exec('node app.js', (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      if (stderr) {
        reject(stderr);
        return;
      }
      resolve();
    });

    serverProcess.stdout.on('data', (data) => {
      if (data.includes('Server running at http://localhost:1050')) {
        resolve();
      }
    });

    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
    });
  });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }

  if (tray) {
    tray.destroy();
    tray = null;
  }
}

async function createTray() {
  const trayIconUrl = 'https://i.imgur.com/qyDaZbj.png';
  const iconPath = await downloadTrayIcon(trayIconUrl);
  
  const trayIcon = nativeImage.createFromPath(iconPath);
  
  const resizedIcon = trayIcon.resize({ width: 32, height: 32 });
  
  tray = new Tray(resizedIcon);

  const trayMenu = Menu.buildFromTemplate([
    {
      label: 'Open Codex FCDP',
      click: () => {
        open('http://localhost:1050');
      },
    }
  ]);

  tray.setContextMenu(trayMenu);
  tray.setToolTip('Codex FCDP - Web Server');
}

function sendNotification() {
  new Notification({
    title: 'Codex FCDP Web Server',
    body: 'The Codex FCDP web server is now running at http://localhost:1050',
  }).show();
}

app.whenReady().then(() => {
  startServer()
    .then(() => {
      sendNotification();
      createTray();
      open('http://localhost:1050');
    })
    .catch((err) => {
      console.error("Error starting server:", err);
      app.quit();
    });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      app.quit();
    }
  });
});
