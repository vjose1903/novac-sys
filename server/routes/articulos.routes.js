const express = require('express');
const router = express.Router();

const ctrlArticulo = require('../controllers/articulos.controller');

router.post('/register', ctrlArticulo.register);//registro

router.get('/', ctrlArticulo.getClientes); //pide todos los articulos
router.get('/cant', ctrlArticulo.CountClientes); // Cuenta la cantidad de articulos
router.get('/:id', ctrlArticulo.getCliente); // pide un solo articulo

router.put('/edit/:id', ctrlArticulo.UpdateCliente); //editar datos
router.delete('/eliminar/:id', ctrlArticulo.DeleteCliente); //cambia estado articulo "eliminar"


module.exports = router;



