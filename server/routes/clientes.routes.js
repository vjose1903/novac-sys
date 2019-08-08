const express = require('express');
const router = express.Router();

const ctrlClient = require('../controllers/clientes.controller');

router.post('/register', ctrlClient.register);//registro

router.get('/', ctrlClient.getClientes); //pide todos los clientes
router.get('/cant', ctrlClient.CountClientes); // Cuenta la cantidad de clientes
router.get('/:id', ctrlClient.getCliente); // pide un solo cliente

router.put('/edit/:id', ctrlClient.UpdateCliente); //editar datos
router.put('/eliminar/:id', ctrlClient.DeleteCliente); //cambia estado cliente "eliminar"


module.exports = router;



