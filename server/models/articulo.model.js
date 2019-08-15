const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

var articuloSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    costo: { type: Number, required: true, trim: true },
    precio: { type: Number, required: true, trim: true },
    
    // para el precio promedio de venta se utilizara el costo / 0.9

    // unidad de peso

    email: { type: String, required: true, trim: true },
    fechaN: { type: Date, required: true, trim: true },
    password: { type: String, required: true, trim: true },
    estado: { type: Boolean, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    fotoPerfil: { type: String, trim: true },
    saltSecret: String

}, { timestamps: true });


mongoose.model('usuarios', articuloSchema);