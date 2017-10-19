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

    var menu, mainWindow, menuTemplate, windowHeight = 880;

    if (process.platform === 'darwin' || process.platform === 'linux') {
        windowHeight = 828;
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
            label: "Quit",
            accelerator: "CommandOrControl+Q",
            click: function () {
                app.quit();
            }
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