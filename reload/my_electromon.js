#!/usr/bin/env node
var electron = require('electron');
var proc = require('child_process');
var watch = require('watch');
var fs = require('fs');
var exec = require('child_process').exec;

var child;
child = proc.spawn(electron, process.argv.slice(2, process.argc));
const readline = require('readline');

var settings = fs.existsSync('../.electromonrc') ? fs.readFileSync('../.electromonrc', 'utf-8') : '';
watch.watchTree('.', { ignoreDotFiles: true }, function (f, curr, prev) {
  if (typeof f == 'object' && prev === null && curr === null) {
    // Finished walking the tree
  } else {
    if (settings != '') {
      if (RegExp(settings.replace(/\n/g, '')).test(f) == false) {
        debounce(restart(), 500);
      }
    } else {
      debounce(restart(), 500);
    }
  }
});

child.stdout.pipe(process.stdout);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('::::::::::::  Iniciando Electron App @' + process.cwd() + ' ::::::::::::  ');

rl.on('line', (cmd) => {
  if (cmd == 'rs') {
    restart();
  }
});

rl.on('SIGINT', (cmd) => {
  cerrarApp('VUELVA PRONTO.');
});

function restart() {
  my_cmd('echo ::::: CONVIRTIENDO A JAVASCRIPT :::::: && tsc -p tsconfig-serve.json', function (res) {
    setTimeout(function () {
      if (res.status) {
        console.log('Restarting');
        child.stdin.pause();
        child.kill();
        child = proc.spawn(electron, process.argv.slice(2, process.argc));
        settings = fs.existsSync('../.electromonrc') ? fs.readFileSync('../.electromonrc', 'utf-8') : '';
        child.stdout.pipe(process.stdout);
      } else {
        console.log(res);
        cerrarApp('POR ERROR AL MOMENTO DE CONVERTIR A JAVASCRIPT.');
      }
    }, 2000);
  });
}

function cerrarApp(params) {
  console.log('Cerrando Electron App ' + params);
  child.stdin.pause();
  child.kill();
  process.exit();
}

function debounce(func, wait, immediate) {
  var timeout;
  return function () {
    var context = this,
      args = arguments;
    var later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

function my_cmd(command, callback) {
  if (callback === void 0) {
    callback = function (arg) {};
  }
  exec(command, function (error, stdout, stderr) {
    var obj;
    if (error) {
      obj = {
        status: false,
        STDOUT: stdout,
        STDERR: stderr,
        msg: error,
      };
      callback(obj);
    } else {
      obj = {
        status: true,
        msg: 'Comando realizado correctamente',
        STDOUT: stdout,
        STDERR: stderr,
      };
      callback(obj);
    }
  });
}
// One-liner for current directory, ignores .dotfiles
