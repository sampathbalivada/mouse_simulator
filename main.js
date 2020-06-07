const {
    app,
    BrowserWindow
} = require('electron');

function createWindow() {
    let win = new BrowserWindow({
        // width: 1366,
        // height: 768,
        webPreferences: {
            nodeIntegration: true
        }
    })

    // win.maximize();
    win.webContents.openDevTools();
    win.loadFile('index.html');
}

app.whenReady().then(createWindow);