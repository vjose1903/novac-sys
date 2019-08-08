const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

var clientesSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    apellido: { type: String, required: true, trim: true },
    sexo:{ type: String, trim: true },
    telefono: { type: String, required: true, trim: true },
    cedula:{ type: String, trim: true },
    direccion:{ type: String, trim: true },
    email: { type: String, required: true, trim: true },
    fechaN: { type: Date, required: true, trim: true },
    fotoPerfil: { type: String, trim: true },
    saltSecret: String,
    estado: { type: Boolean, required: true, trim: true },

}, { timestamps: true });

mongoose.model('clientes', clientesSchema);