const mongoose = require('mongoose');
const passport = require('passport');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

const Client = mongoose.model('usuarios');

const ControladorCliente = {}

ControladorCliente.register = (req, res, next) => {
    var cliente = new Client();
    cliente.nombre= req.body.nombre,
    cliente.apellido= req.body.apellido,
    cliente.sexo= req.body.sexo,
    cliente.fotoPerfil= req.body.fotoPerfil,
    cliente.telefono= req.body.telefono,
    cliente.email= req.body.email,
    cliente.fechaN= req.body.fechaN,
    cliente.cedula=req.body.cedula,
    cliente.direccion=req.body.direccion,
    cliente.estado=true,

    cliente.save((err, doc) => {
        if (!err)
            res.json({titulo:'Operacion exitosa.',contenido:'Cliente registrado.'});
        else {
            if (err.code == 11000)
                res.status(422).json({titulo:'Operacion nula.',contenido:'Cliente introducido ya existe.'})
            else
                res.json({titulo:'Operacion nula.',contenido:'Error del servidor.'})
        }

    });
}



ControladorCliente.getClientes = async (req, res) => {
    const clientes = await Client.find({"estado":true});
    res.json(clientes); 
}

ControladorCliente.getCliente = async (req, res, err) => {

    const cliente = await Client.findById((req.params.id) ,(err, user)=> { 
        if (err) return res.status(500).send('Error del Servidor!');
        if(!user){
            res.status(409).json({mensaje: 'cliente no existe'});//cliente no existe
        }
     })
    res.json(cliente);
}

ControladorCliente.CountClientes =async (req, res) => {
    const cliente = await Client.find({"estado":true}).count();
    res.json(cliente);
}



ControladorCliente.UpdateCliente = async (req, res) => {
    const cliente={
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        sexo: req.body.sexo,
        fotoPerfil: req.body.fotoPerfil,
        telefono: req.body.telefono,
        email: req.body.email,
        fechaN: req.body.fechaN,
        cedula:req.body.cedula,
        direccion:req.body.direccion,
    };
    await Client.findByIdAndUpdate(req.params.id, {$set:cliente},{new: true}, function(err, model) {
        if (!err)
            res.json({titulo:'Operacion exitosa.',contenido:'Cliente actualizado.'});
        else {
            if(err.code == 11000)
                res.status(422).json({titulo:'Operacion nula.',contenido:'Cliente introducido ya existe.'})
            else
                res.json({titulo:'Operacion nula.',contenido:'Error del servidor intente luego.'})
        }
    });
    
}

ControladorCliente.DeleteCliente = async (req, res) => {
    const cliente={
        estado: false,
    };
    await Client.findByIdAndUpdate(req.params.id, {$set:cliente},{new: true}, function(err, model) {
        if (!err)
            res.json({titulo:'Operacion exitosa.',contenido:'Cliente eliminado.'});
        else {
            res.json({titulo:'Operacion nula.',contenido:'Error del servidor intente luego.'})
            }
        });
    }


module.exports = ControladorCliente; 