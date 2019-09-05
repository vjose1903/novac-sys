const mongoose = require('mongoose');

var articuloSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    costo: { type: Number, required: true, trim: true },
    precio: { type: Number, required: true, trim: true },
    tipo: { type: String, required: true, trim: true },
    medida: { type: String, required: true, trim: true },
    Isdetallable: { type: Boolean, required: true, trim: true },
    detallableArray: { type: Array, required: false, trim: true },
  },
  { timestamps: true },
);

const ModeloArticulos = mongoose.model('articulos', articuloSchema);

module.exports = ModeloArticulos;
