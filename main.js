/****************************************************************************
 * main.js
 * openacousticdevices.info
 * June 2017
 *****************************************************************************/

'use strict';

/*jslint nomen: true*/

var electron = require('electron');
var app = electron.app;

var BrowserWindow = electron.BrowserWindow;

var Menu = electron.Menu;
var shell = electron.shell;

var path = require('path');

require('electron-debug')({
    showDevTools: "undocked"
});

function openAboutWindow() {

    var aboutWindow = new BrowserWindow({
        width: 400,
        height: 325,
        resizable: false,
        fullscreenable: false,
        icon: path.join(__dirname, "/build/icon.ico")
    });

    aboutWindow.setMenu(null);
    aboutWindow.loadURL("file://" + __dirname + "/about.html");

}

app.on('ready', function () {

    var menu, mainWindow, menuTemplate, windowHeight;

    if (process.platform === 'darwin') {
        windowHeight = 724;
    } else if (process.platform === 'linux') {
        windowHeight = 726;
    } else {
        windowHeight = 748;
    }

    mainWindow = new BrowserWindow({
        width: 565,
        height: windowHeight,
        resizable: false,
        fullscreenable: false,
        icon: path.join(__dirname, "/build/icon.ico")
    });

    menuTemplate = [{
        label: "File",
        submenu: [{
            label: "Open Configuration",
            accelerator: "CommandOrControl+O",
            click: function () {
                mainWindow.webContents.send("load");
            }
        }, {
            label: "Save Configuration",
            accelerator: "CommandOrControl+S",
            click: function () {
                mainWindow.webContents.send("save");
            }
        }, {
            type: 'separator'
        }, {
            id: "copyid",
            label: "Copy Device ID",
            accelerator: "CommandOrControl+I",
            click: function () {
                mainWindow.webContents.send("copyID");
            },
            enabled: false
        }, {
            type: 'separator'
        }, {
            type: "checkbox",
            id: "localTime",
            label: "Local Time",
            accelerator: "CommandOrControl+T",
            checked: false,
            click: function () {
                mainWindow.webContents.send("localTime");
            }
        }, {
            type: "checkbox",
            id: "nightmode",
            label: "Night Mode",
            accelerator: "CommandOrControl+N",
            checked: false,
            click: function () {
                mainWindow.webContents.send("nightmode");
            }
        }, {
            type: 'separator'
        }, {
            label: "Quit",
            accelerator: "CommandOrControl+Q",
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
        label: "Help",
        submenu: [{
            label: "About",
            click: function () {
                openAboutWindow();
            }
        }, {
            type: 'separator'
        }, {
            label: "Open Acoustic Devices Website",
            click: function () {
                shell.openExternal("https://openacousticdevices.info");
            }
        }]
    }];

    menu = Menu.buildFromTemplate(menuTemplate);

    Menu.setApplicationMenu(menu);

    mainWindow.loadURL("file://" + __dirname + "/index.html");

});

app.on('window-all-closed', function () {
    app.quit();
});