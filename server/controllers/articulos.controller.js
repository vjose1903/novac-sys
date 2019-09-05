const mongoose = require('mongoose');
const _ = require('lodash');

const ARTICULO = require('../models/articulo.model');

// const ARTICULO = mongoose.model('articulos');

const ControladorArticulo = {}

ControladorArticulo.register = (req, res, next) => {
    var articulo = new ARTICULO();
    articulo.nombre= req.body.nombre,
    articulo.costo= req.body.costo,
    articulo.precio= req.body.precio,
    articulo.tipo= req.body.tipo,
    articulo.medida= req.body.medida,
    articulo.Isdetallable= req.body.Isdetallable,
    articulo.detallableArray= req.body.detallableArray,

    articulo.save((err, doc) => {
        if (!err)
            res.json({titulo:'Operacion exitosa.',contenido:'Articulo registrado.'});
        else {
            if (err.code == 11000)
                res.status(422).json({titulo:'Operacion nula.',contenido:'Articulo introducido ya existe.'})
            else
                res.json({titulo:'Operacion nula.',contenido:'Error del servidor.'})
        }
    });
}



ControladorArticulo.getClientes = async (req, res) => {
    const clientes = await ARTICULO.find({"estado":true});
    res.json(clientes); 
}

ControladorArticulo.getCliente = async (req, res, err) => {

    const cliente = await ARTICULO.findById((req.params.id) ,(err, user)=> { 
        if (err) return res.status(500).send('Error del Servidor!');
        if(!user){
            res.status(409).json({mensaje: 'cliente no existe'});//cliente no existe
        }
     })
    res.json(cliente);
}

ControladorArticulo.CountClientes =async (req, res) => {
    const cliente = await ARTICULO.find({"estado":true}).count();
    res.json(cliente);
}



ControladorArticulo.UpdateCliente = async (req, res) => {
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
    await ARTICULO.findByIdAndUpdate(req.params.id, {$set:cliente},{new: true}, function(err, model) {
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

ControladorArticulo.DeleteCliente = async (req, res) => {
    const cliente={
        estado: false,
    };
    await ARTICULO.findByIdAndUpdate(req.params.id, {$set:cliente},{new: true}, function(err, model) {
        if (!err)
            res.json({titulo:'Operacion exitosa.',contenido:'Cliente eliminado.'});
        else {
            res.json({titulo:'Operacion nula.',contenido:'Error del servidor intente luego.'})
            }
        });
    }


module.exports = ControladorArticulo; 