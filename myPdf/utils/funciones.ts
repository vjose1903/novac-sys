import { app } from 'electron';


export function getFuncionalPath(modules = false, addToPath = '') {
    let path_temp
    let path_resolved

    let args_ = process.argv.slice(1);
    let serve_ = args_.some((val) => val === '--serve');

    if (serve_) {
        console.log('');
        console.error('-=-=-=-=-=-=-=-= DESARROLLO -=-=-=-=-=-=-=-=-=-');

        path_temp = app.getPath('exe').substr(0, app.getPath('exe').toLowerCase().indexOf(app.name.toLowerCase())) + app.name;

    } else {
        console.error('-=-=-=-=-=-=-=-= PRODUCCION -=-=-=-=-=-=-=-=-=-');
        path_temp = app.getPath('exe').substr(0, app.getPath('exe').toLowerCase().indexOf(app.name.toLowerCase())) + app.name + '/resources/app.asar.unpacked';
    }
    console.log('path_temp ', path_temp);

    if (modules) {
        path_temp = path_temp + '/node_modules' + addToPath
    } else {
        path_temp = path_temp + '/mypdf' + addToPath
    }


    path_resolved = process.platform === 'darwin' ? path_temp : path_temp.split("/").join("\\");

    console.log('path_resolved ', path_resolved);

    console.error('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--=-=-=');
    return path_resolved
}