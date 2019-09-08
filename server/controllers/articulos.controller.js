const mongoose = require('mongoose');

const MODEL_SCHEMA = require('../models/articulo.model');

// const MODEL_SCHEMA = mongoose.model('articulos');

const Controlador = {};

Controlador.register = (req, res, next) => {
  var item = new MODEL_SCHEMA();
  (item.nombre = req.body.nombre),
    (item.costo = req.body.costo),
    (item.precio = req.body.precio),
    (item.tipo = req.body.tipo),
    (item.medida = req.body.medida),
    (item.Isdetallable = req.body.Isdetallable),
    (item.detallableArray = req.body.detallableArray),
    item.save((err, doc) => {
      if (!err) res.json({ titulo: 'Operacion exitosa.', contenido: 'Articulo registrado.' });
      else {
        if (err.code == 11000) res.status(422).json({ titulo: 'Operacion nula.', contenido: 'Articulo introducido ya existe.' });
        else res.json({ titulo: 'Operacion nula.', contenido: 'Error del servidor.' });
      }
    });
};

Controlador.getAllItems = async (req, res) => {
  // const item = await MODEL_SCHEMA.find({"estado":true});
  const item = await MODEL_SCHEMA.find();
  res.json(item);
};

Controlador.getItemById = async (req, res, err) => {
  const cliente = await MODEL_SCHEMA.findById(req.params.id, (err, user) => {
    if (err) return res.status(500).send('Error del Servidor!');
    if (!user) {
      res.status(409).json({ mensaje: 'cliente no existe' }); //cliente no existe
    }
  });
  res.json(cliente);
};

Controlador.CountItems = async (req, res) => {
  const item = await MODEL_SCHEMA.find().count();
  res.json(item);
};

Controlador.UpdateCliente = async (req, res) => {
  const cliente = {
    nombre: req.body.nombre,
    apellido: req.body.apellido,
    sexo: req.body.sexo,
    fotoPerfil: req.body.fotoPerfil,
    telefono: req.body.telefono,
    email: req.body.email,
    fechaN: req.body.fechaN,
    cedula: req.body.cedula,
    direccion: req.body.direccion,
  };
  await MODEL_SCHEMA.findByIdAndUpdate(req.params.id, { $set: cliente }, { new: true }, function(err, model) {
    if (!err) res.json({ titulo: 'Operacion exitosa.', contenido: 'Cliente actualizado.' });
    else {
      if (err.code == 11000) res.status(422).json({ titulo: 'Operacion nula.', contenido: 'Cliente introducido ya existe.' });
      else res.json({ titulo: 'Operacion nula.', contenido: 'Error del servidor intente luego.' });
    }
  });
};

Controlador.DeleteCliente = async (req, res) => {
  const cliente = {
    estado: false,
  };
  await MODEL_SCHEMA.findByIdAndUpdate(req.params.id, { $set: cliente }, { new: true }, function(err, model) {
    if (!err) res.json({ titulo: 'Operacion exitosa.', contenido: 'Cliente eliminado.' });
    else {
      res.json({ titulo: 'Operacion nula.', contenido: 'Error del servidor intente luego.' });
    }
  });
};

module.exports = Controlador;
