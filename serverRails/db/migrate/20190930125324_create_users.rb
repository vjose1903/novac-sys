class CreateUsers < ActiveRecord::Migration[6.0]
  def change
    create_table :empleados do |t|
      t.string :usuario, null: false, unique: true
      t.string :nombre, null: false 
      t.string :apellido, null: false 
      t.string :cedula, null: false, unique: true
      t.string :sexo, null: false 
      t.string :telefono, null: false 
      t.string :email, null: false 
      t.string :fechaN, null: false 
      t.string :password, null: false 
      t.string :role, null: false 
      t.string :fotoPerfil, null: false 
      t.string :estado, null: false 
      t.timestamps
    end
  end
end
