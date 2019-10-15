# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

user = User.create(
	{
		"nombre": "administrador",
		"usuario": "ADM",
		"cedula": "047-0123350-6",
		"apellido": "Santos",
		"sexo": "m",
		"fotoPerfil": "userH.png",
		"telefono": "(829)292-8772",
		"email": "admin@hotmail.com",
		"fechaN": "1968-17-10",
		"role": "A",
		"password": "1234567",
		"password_confirmation": "1234567"
	})

	
	tipo_articulo = TipoArticulo.create(
		[
			{
				"descripcion": "Veterinaria"
			},
			{
				"descripcion": "Materia prima"
			},
			{
				"descripcion": "Producto terminado"
			}
		]
	)
	articulo = Articulo.create(
		{
		"tipo_articulo_id": 2,
		"nombre": "maiz",
		"costo_principal": 900,
		"precio_principal": 999.99,
		"existencia": 0,
		"secuencia": 1,
		"codigo": "00001",
		"fecha_ingreso": "2019-10-13",
		"medida": "quintal",
		"is_detallable": false
	})

	contenido_articulo = ContenidoArticulo.create(
		{
			"articulo_id": 1,
			"referencia": 0,
			"costo": 9,
			"precio": 9.99,
			"cantidad": 100,
			"medida": "libra"
	})

