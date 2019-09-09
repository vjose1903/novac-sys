const mongoose = require('mongoose');
const passport = require('passport');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

const User = mongoose.model('usuarios');

const Controlador = {};

Controlador.register = (req, res, next) => {
  var user = new User();

  (user.nombre = req.body.nombre),
    (user.apellido = req.body.apellido),
    (user.usuario = req.body.usuario),
    (user.cedula = req.body.cedula),
    (user.sexo = req.body.sexo),
    (user.telefono = req.body.telefono),
    (user.email = req.body.email),
    (user.fechaN = req.body.fechaN),
    (user.password = req.body.password),
    (user.estado = true),
    (user.role = 'U')

    if (user.sexo === 'M') {
      user.fotoPerfil = 'userH.png';
    } else {
      user.fotoPerfil = 'userM.png';
    }
    user.save((err, doc) => {
      if (!err) res.json({ titulo: 'Operacion exitosa.', contenido: 'Usuario registrado.' });
      else {
        if (err.code == 11000) res.status(422).json({ titulo: 'Operacion nula.', contenido: err.keyValue });
        else res.json({ titulo: 'Operacion nula.', contenido: 'Error del servidor.' });
      }
    });
};

Controlador.authenticate = (req, res, next) => {
  // call for passport authentication
  passport.authenticate('local', (err, user, info) => {
    // error from passport middleware
    if (err) return res.status(400).json(err);
    // registered user
    else if (user) return res.status(200).json({ token: user.generateJwt(), resource: user });
    // unknown user or wrong password
    else return res.status(404).json(info);
  })(req, res);
};

Controlador.userProfile = (req, res, next) => {
  User.findOne({ _id: req._id }, (err, user) => {
    if (!user) return res.status(404).json({ status: false, message: 'Usuario no existe' });
    else return res.status(200).json({ status: true, user: _.pick(user, ['role', '_id']) });
  });
};

Controlador.getUsers = async (req, res) => {
  const usuarios = await User.find({ estado: true });
  res.json(usuarios);
};

Controlador.getUser = async (req, res, err) => {
  const usuario = await User.findById(req.params.id, (err, user) => {
    if (err) return res.status(500).send('Error del Servidor!');
    if (!user) {
      res.status(409).json({ mensaje: 'usuario no existe' }); //usuario no existe
    }
  });
  res.json(usuario);
};

Controlador.CountUsers = async (req, res) => {
  const usuarios = await User.find({ estado: true }).count();
  res.json(usuarios);
};

Controlador.UpdatePass = async (req, res) => {
  const usuario = {
    password: req.body.password,
    saltSecret: String,
  };
  bcrypt.genSalt(10, async (err, salt) => {
    bcrypt.hash(usuario.password, salt, async (err, hash) => {
      usuario.password = hash;
      usuario.saltSecret = salt;

      await User.findByIdAndUpdate(req.params.id, { $set: usuario }, { new: true }, function(err, model) {
        if (!err) res.json({ titulo: 'Operacion exitosa.', contenido: 'Contraseña actualizada.' });
        else {
          res.json({ titulo: 'Operacion nula.', contenido: 'Error del servidor intente luego.' });
        }
      });
    });
  });
};

Controlador.UpdateUser = async (req, res) => {
  const usuario = {
    nombre: req.body.nombre,
    cedula: req.body.cedula,
    apellido: req.body.apellido,
    sexo: req.body.sexo,
    fotoPerfil: req.body.fotoPerfil,
    telefono: req.body.telefono,
    email: req.body.email,
    fechaN: req.body.fechaN,
    role: req.body.role,
  };
  await User.findByIdAndUpdate(req.params.id, { $set: usuario }, { new: true }, function(err, model) {
    if (!err) res.json({ titulo: 'Operacion exitosa.', contenido: 'Usuario actualizado.' });
    else {
      if (err.code == 11000) res.status(422).json({ titulo: 'Operacion nula.', contenido: 'Usuario introducido ya existe.' });
      else res.json({ titulo: 'Operacion nula.', contenido: 'Error del servidor intente luego.' });
    }
  });
};

Controlador.DeleteUser = async (req, res) => {
  const usuario = {
    estado: false,
  };
  await User.findByIdAndUpdate(req.params.id, { $set: usuario }, { new: true }, function(err, model) {
    if (!err) res.json({ titulo: 'Operacion exitosa.', contenido: 'Usuario eliminado.' });
    else {
      res.json({ titulo: 'Operacion nula.', contenido: 'Error del servidor intente luego.' });
    }
  });
};

module.exports = Controlador;
