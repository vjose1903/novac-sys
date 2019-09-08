const express = require('express');
const router = express.Router();

const ctrlEmpleados = require('../controllers/empleados.controller');

const jwtHelper = require('../config/jwtHelper');

router.post('/register', ctrlEmpleados.register); //registro
router.post('/authenticate', ctrlEmpleados.authenticate); //login
router.get('/userProfile', jwtHelper.verifyJwtToken, ctrlEmpleados.userProfile); //perfil

router.get('/', ctrlEmpleados.getUsers); //pide todos los usuarios
router.get('/cant', ctrlEmpleados.CountUsers); // Cuenta la cantidad de usuarios
router.get('/:id', ctrlEmpleados.getUser); // pide un solo usuario

router.put('/edit/:id', ctrlEmpleados.UpdateUser); //editar datos
router.put('/editP/:id', ctrlEmpleados.UpdatePass); //editar contrasena
router.put('/eliminar/:id', ctrlEmpleados.DeleteUser); //cambia estado usuario "eliminar"

module.exports = router;
