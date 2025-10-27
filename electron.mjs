import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { format } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


function createWindow() {
  console.log('filename:', __filename);
  console.log('dirname:', __dirname);
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile(path.join(__dirname, 'dist/chess-timekeeper/browser/index.html'));

  // ✅ Use `format` to safely resolve local file URLs
  const indexPath = format({
    pathname: path.join(__dirname, 'dist', 'chess-timekeeper', 'browser', 'index.html'),
    protocol: 'file:',
    slashes: true
  });

  win.loadURL(indexPath);

  // Optional: open DevTools for debugging
  // win.webContents.openDevTools();
}





app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});