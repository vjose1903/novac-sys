"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
function getFuncionalPath(modules, addToPath) {
    if (modules === void 0) { modules = false; }
    if (addToPath === void 0) { addToPath = ''; }
    var path_temp;
    var path_resolved;
    var args_ = process.argv.slice(1);
    var serve_ = args_.some(function (val) { return val === '--serve'; });
    if (serve_) {
        console.log('');
        console.error('-=-=-=-=-=-=-=-= DESARROLLO -=-=-=-=-=-=-=-=-=-');
        path_temp = electron_1.app.getPath('exe').substr(0, electron_1.app.getPath('exe').toLowerCase().indexOf(electron_1.app.name.toLowerCase())) + electron_1.app.name;
    }
    else {
        console.error('-=-=-=-=-=-=-=-= PRODUCCION -=-=-=-=-=-=-=-=-=-');
        path_temp = electron_1.app.getPath('exe').substr(0, electron_1.app.getPath('exe').toLowerCase().indexOf(electron_1.app.name.toLowerCase())) + electron_1.app.name + '/resources/app.asar.unpacked';
    }
    console.log('path_temp ', path_temp);
    if (modules) {
        path_temp = path_temp + '/node_modules' + addToPath;
    }
    else {
        path_temp = path_temp + '/mypdf' + addToPath;
    }
    path_resolved = process.platform === 'darwin' ? path_temp : path_temp.split("/").join("\\");
    console.log('path_resolved ', path_resolved);
    console.error('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--=-=-=');
    return path_resolved;
}
exports.getFuncionalPath = getFuncionalPath;
