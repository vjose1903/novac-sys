const _ = require('lodash');
const mongoose = require('mongoose');

const MODEL_SCHEMA = require('../models/articulo.model');

// const MODEL_SCHEMA = mongoose.model('articulos');

const Controlador = {};

Controlador.register = async (req, res, next) => {
  var item = new MODEL_SCHEMA();
  // let cod = await MODEL_SCHEMA.countDocuments();
  // let cod = await MODEL_SCHEMA.find()
  //   .sort({ $natural: -1 })
  //   .limit(1);
  let cod = await MODEL_SCHEMA.find({})
    .sort({ _id: -1 })
    .limit(1);

  var secu = _.parseInt(cod[0].secuencia) + 1;

  if (secu <= 9) {
    var codigo = '0000' + secu;
  } else if (secu >= 10 && secu <= 99) {
    var codigo = '000' + secu;
  } else if (secu >= 100 && secu <= 999) {
    var codigo = '00' + secu;
  } else if (secu >= 1000 && secu <= 9999) {
    var codigo = '0' + secu;
  } else if (secu >= 10000 && secu <= 99998) {
    var codigo = secu;
  }

  (item.nombre = req.body.nombre),
    (item.codigo = codigo),
    (item.secuencia = secu),
    (item.costo = req.body.costo),
    (item.precio = req.body.precio),
    (item.tipo = req.body.tipo),
    (item.medida = req.body.medida),
    (item.Isdetallable = req.body.Isdetallable),
    (item.detallableArray = req.body.detallableArray),
    await item.save((err, doc) => {
      if (!err) res.json({ titulo: 'Operacion exitosa.', contenido: 'Articulo registrado.', body: doc });
      else {
        if (err.code == 11000) res.status(422).json({ titulo: 'Operacion nula.', contenido: 'Articulo introducido ya existe.' });
        else res.status(500).json({ titulo: 'Operacion nula.', contenido: 'Error del servidor.' });
      }
    });
};

Controlador.getAllItems = async (req, res) => {
  // const item = await MODEL_SCHEMA.find({"estado":true});
  const item = await MODEL_SCHEMA.find();
  res.json(item);
};
Controlador.getItemByCodigo = async (req, res) => {
  const item = await MODEL_SCHEMA.find({ codigo: req.params.codigo });
  if (item.length == 0) {
    res.status(409).json({ mensaje: 'Codigo no existe' });
  }

  res.json(item[0]);
};

Controlador.getItemById = async (req, res, err) => {
  const item = await MODEL_SCHEMA.findById(req.params.id, (err, user) => {
    if (err) return res.status(500).send('Error del Servidor!');
    if (!user) {
      res.status(409).json({ mensaje: 'Articulo no existe' });
    }
  });
  res.json(item);
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
