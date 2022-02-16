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
        var _this = this;
        return new Promise(function (resolve, reject) {
            var pathConfig = (0, main_1.pathAdd)("/app_config.config");
            if (fs.existsSync(pathConfig)) {
                var res = fs.readFileSync(pathConfig, 'utf-8');
                var decript = _this.desEncriptar(res);
                resolve(decript);
            }
            else {
                resolve('{}');
            }
        });
    };
    Functions.setConfigFile = function (data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                var pathConfig = (0, main_1.pathAdd)("/app_config.config");
                var encripted = _this.encriptar(data);
                fs.writeFileSync(pathConfig, encripted, { encoding: 'utf-8' });
                resolve(true);
            }
            catch (error) {
                console.error(error);
                reject(false);
            }
        });
    };
    return Functions;
}());
exports.default = Functions;
