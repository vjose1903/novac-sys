"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var zlib = require("zlib");
var fs = require("fs");
var main_1 = require("./main");
var Functions = /** @class */ (function () {
    function Functions() {
    }
    Functions.encriptar = function (arg) {
        var arr = Buffer.from(arg);
        var deflated = zlib.deflateSync(arr).toString('base64');
        return deflated;
    };
    Functions.desEncriptar = function (arg) {
        var arr = Buffer.from(arg, 'base64');
        var deflated = zlib.inflateSync(arr).toString('utf8');
        return deflated;
    };
    Functions.getConfigFile = function () {
        var pathConfig = (0, main_1.pathAdd)("/app_config.config");
        console.log(' dirconfig ::::: ', pathConfig);
        if (fs.existsSync(pathConfig)) {
            var res = fs.readFileSync(pathConfig, 'utf-8');
            var decript = this.desEncriptar(res);
            return decript;
        }
        else {
            return '{}';
        }
    };
    Functions.setConfigFile = function (data) {
        try {
            var pathConfig = (0, main_1.pathAdd)("/app_config.config");
            console.log(' dirconfig ::::: ', pathConfig);
            var encripted = this.encriptar(data);
            fs.writeFileSync(pathConfig, encripted, { encoding: 'utf-8' });
            return true;
        }
        catch (error) {
            console.log(error);
            return false;
        }
    };
    return Functions;
}());
exports.default = Functions;
//# sourceMappingURL=functions.js.map