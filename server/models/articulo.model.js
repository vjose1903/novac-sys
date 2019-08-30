const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

var articuloSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    costo: { type: Number, required: true, trim: true },
    precio: { type: Number, required: true, trim: true },
    tipo: { type: String, required:true, trim:true },
    medida: {type: String, required:true, trim: true},
    Isdetallable: {type: Boolean, required:true, trim: true},
    detallableArray: {type: Array, required:false, trim: true}
    // para el precio promedio de venta se utilizara el costo / 0.9

    // unidad de peso

}, { timestamps: true });


mongoose.model('usuarios', articuloSchema);