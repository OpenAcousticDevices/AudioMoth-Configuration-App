/****************************************************************************
 * builder.js
 * openacousticdevices.info
 * January 2020
 *****************************************************************************/

'use strict';

const builder = require('electron-builder');
const Platform = builder.Platform;

var config, target;
var argTarget = process.argv[2];

switch (argTarget) {

case 'win':
case 'win64':
    console.log('Using build configuration to Windows (64-bit).');
    target = Platform.WINDOWS.createTarget();
    config = {
        win: {
            target: [
                {
                    target: 'nsis',
                    arch: 'x64'
                }
            ]
        }
    };
    break;
case 'win32':
    console.log('Using build configuration to Windows (32-bit).');
    target = Platform.WINDOWS.createTarget();
    config = {
        win: {
            target: [
                {
                    target: 'nsis',
                    arch: 'ia32'
                }
            ]
        }
    };
    break;
case 'mac':
    console.log('Using build configuration to macOS.');
    target = Platform.MAC.createTarget();
    break;
case 'linux':
    console.log('Using build configuration to Linux (64-bit).');
    target = Platform.LINUX.createTarget();
    break;
default:
    console.error('ERROR - Build target not recognised. Accepted targets: win, win32, mac, linux.');
    break;

}

builder.build({
    targets: target,
    config: config
}).then(function (m) {

    console.log('Generated files:');
    console.log(m);

}).catch(function (e) {

    console.error(e);

});
