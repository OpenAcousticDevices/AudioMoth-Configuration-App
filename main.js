/****************************************************************************
 * main.js
 * openacousticdevices.info
 * August 2019
 *****************************************************************************/

'use strict';

const electron = require('electron');

const app = electron.app;

const Menu = electron.Menu;

const shell = electron.shell;

const ipcMain = electron.ipcMain;

const path = require('path');

const BrowserWindow = electron.BrowserWindow;

const ProgressBar = require('electron-progressbar');

require('electron-debug')({
    showDevTools: true,
    devToolsMode: 'undocked'
});

var mainWindow, aboutWindow, expansionWindow;

var expandProgressBar;

function shrinkWindowHeight (windowHeight) {

    if (process.platform === 'darwin') {

        windowHeight -= 20;

    } else if (process.platform === 'linux') {

        windowHeight -= 20;

    }

    return windowHeight;

}

function openExpansionWindow () {

    var iconLocation;

    if (expansionWindow) {

        return;

    }

    iconLocation = '/build/icon.ico';

    if (process.platform === 'linux') {

        iconLocation = '/build/icon.png';

    }

    expansionWindow = new BrowserWindow({
        width: 565,
        height: shrinkWindowHeight(263),
        title: 'Expand AudioMoth Recordings',
        useContentSize: true,
        resizable: false,
        fullscreenable: false,
        icon: path.join(__dirname, iconLocation),
        parent: mainWindow,
        webPreferences: {
            nodeIntegration: true
        }
    });

    expansionWindow.setMenu(null);
    expansionWindow.loadURL(path.join('file://', __dirname, 'expansion/expansion.html'));

    expansionWindow.webContents.on('dom-ready', function () {

        mainWindow.webContents.send('poll-night-mode');

    });

    ipcMain.on('night-mode-poll-reply', (e, nightMode) => {

        if (expansionWindow) {

            expansionWindow.webContents.send('night-mode', nightMode);

        }

    });

    expansionWindow.on('close', function (e) {

        if (expandProgressBar) {

            e.preventDefault();

        }

        expansionWindow = null;

    });

}

function openAboutWindow () {

    var iconLocation = '/build/icon.ico';

    if (aboutWindow) {

        return;

    }

    if (process.platform === 'linux') {

        iconLocation = '/build/icon.png';

    }

    aboutWindow = new BrowserWindow({
        width: 400,
        height: shrinkWindowHeight(340),
        title: 'About',
        resizable: false,
        fullscreenable: false,
        icon: path.join(__dirname, iconLocation),
        parent: mainWindow,
        webPreferences: {
            nodeIntegration: true
        }
    });

    aboutWindow.setMenu(null);
    aboutWindow.loadURL(path.join('file://', __dirname, '/about.html'));

    aboutWindow.on('close', function () {

        aboutWindow = null;

    });

}

function toggleNightMode () {

    mainWindow.webContents.send('night-mode');

    if (expansionWindow) {

        expansionWindow.webContents.send('night-mode');

    }

}

app.on('ready', function () {

    var menu, menuTemplate, iconLocation, windowHeight;

    iconLocation = '/build/icon.ico';
    windowHeight = shrinkWindowHeight(641);

    if (process.platform === 'linux') {

        iconLocation = '/build/icon.png';

    }

    mainWindow = new BrowserWindow({
        title: 'AudioMoth Configuration App',
        width: 565,
        height: windowHeight,
        useContentSize: true,
        resizable: false,
        fullscreenable: false,
        icon: path.join(__dirname, iconLocation),
        webPreferences: {
            nodeIntegration: true
        }
    });

    mainWindow.on('restore', function () {

        /* When minimised and restored, Windows platforms alter the BrowserWindow such that the height no longer includes the menu bar */
        /* This resize cannot be blocked so this fix resizes it, taking into account the menu change */
        if (process.platform === 'win32') {

            mainWindow.setSize(565, windowHeight + 20);

        }

    });

    menuTemplate = [{
        label: 'File',
        submenu: [{
            label: 'Open Configuration',
            accelerator: 'CommandOrControl+O',
            click: function () {

                mainWindow.webContents.send('load');

            }
        }, {
            label: 'Save Configuration',
            accelerator: 'CommandOrControl+S',
            click: function () {

                mainWindow.webContents.send('save');

            }
        }, {
            type: 'separator'
        }, {
            id: 'copyid',
            label: 'Copy Device ID',
            accelerator: 'CommandOrControl+I',
            click: function () {

                mainWindow.webContents.send('copy-id');

            },
            enabled: false
        }, {
            type: 'separator'
        }, {
            type: 'checkbox',
            id: 'localTime',
            label: 'Local Time',
            accelerator: 'CommandOrControl+T',
            checked: false,
            click: function () {

                mainWindow.webContents.send('local-time');
                mainWindow.webContents.send('local-time-schedule');

            }
        }, {
            type: 'checkbox',
            id: 'nightmode',
            label: 'Night Mode',
            accelerator: 'CommandOrControl+N',
            checked: false,
            click: toggleNightMode
        }, {
            type: 'separator'
        }, {
            label: 'Expand AudioMoth Recordings',
            accelerator: 'CommandOrControl+E',
            click: function () {

                openExpansionWindow();

            }
        }, {
            type: 'separator'
        }, {
            label: 'Quit',
            accelerator: 'CommandOrControl+Q',
            click: function () {

                app.quit();

            }
        }]
    }, {
        label: 'Edit',
        submenu: [{
            label: 'Cut',
            accelerator: 'CommandOrControl+X',
            selector: 'cut:'
        }, {
            label: 'Copy',
            accelerator: 'CommandOrControl+C',
            selector: 'copy:'
        }, {
            label: 'Paste',
            accelerator: 'CommandOrControl+V',
            selector: 'paste:'
        }, {
            label: 'Select All',
            accelerator: 'CommandOrControl+A',
            selector: 'selectAll:'
        }]
    }, {
        label: 'Help',
        submenu: [{
            label: 'About',
            click: function () {

                openAboutWindow();

            }
        }, {
            type: 'separator'
        }, {
            label: 'Open Acoustic Devices Website',
            click: function () {

                shell.openExternal('https://openacousticdevices.info');

            }
        }]
    }];

    menu = Menu.buildFromTemplate(menuTemplate);

    Menu.setApplicationMenu(menu);

    mainWindow.loadURL(path.join('file://', __dirname, '/index.html'));

});

app.on('window-all-closed', function () {

    app.quit();

});

app.disableHardwareAcceleration();

ipcMain.on('start-bar', (event, fileCount) => {

    if (expandProgressBar) {

        return;

    }

    var detail = 'Starting to expand file';
    detail += (fileCount > 1) ? 's' : '';
    detail += '.';

    expandProgressBar = new ProgressBar({
        title: 'AudioMoth Configuration App',
        text: 'Expanding files...',
        detail: detail,
        closeOnComplete: false,
        indeterminate: false,
        browserWindow: {
            parent: expansionWindow,
            webPreferences: {
                nodeIntegration: true
            },
            closable: true,
            modal: false
        },
        maxValue: fileCount * 100
    });

    expandProgressBar.on('aborted', () => {

        if (expandProgressBar) {

            expandProgressBar.close();
            expandProgressBar = null;

        }

    });

});

ipcMain.on('set-bar-progress', (event, fileNum, progress, name) => {

    var index, fileCount;

    index = fileNum + 1;
    fileCount = expandProgressBar.getOptions().maxValue / 100;

    if (expandProgressBar) {

        expandProgressBar.value = (fileNum * 100) + progress;
        expandProgressBar.detail = 'Expanding ' + name + ' (' + index + ' of ' + fileCount + ').';

    }

});

ipcMain.on('set-bar-error', (event, name) => {

    if (expandProgressBar) {

        expandProgressBar.detail = 'Error when expanding ' + name + '.';

    }

});

ipcMain.on('set-bar-completed', (event, successCount, errorCount) => {

    var messageText;

    if (expandProgressBar) {

        expandProgressBar.setCompleted();

        if (errorCount > 0) {

            messageText = 'Errors occurred in ' + errorCount + ' file';
            messageText += (errorCount === 1 ? '' : 's');
            messageText += '.<br>See ERRORS.TXT for details.';

        } else {

            messageText = 'Successfully expanded ' + successCount + ' file';
            messageText += (successCount === 1 ? '' : 's');
            messageText += '.';

        }

        expandProgressBar.detail = messageText;

        setTimeout(function () {

            expandProgressBar.close();
            expandProgressBar = null;

            if (expansionWindow) {

                expansionWindow.send('summary-closed');

            }

        }, 5000);

    }

});

ipcMain.on('poll-cancelled', (event) => {

    if (expandProgressBar) {

        event.returnValue = false;

    } else {

        event.returnValue = true;

    }

});
