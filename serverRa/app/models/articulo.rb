class Articulo < ApplicationRecord
  belongs_to :tipo_articulo
  has_many :contenido_articulos

  def self.get_articulos_formateado
    return ActiveRecord::Base.connection.exec_query('SELECT a.id, a.nombre, ta.descripcion as tipo_articulo, a.costo_principal, a.precio_principal, a.existencia, a.secuencia, a.codigo, a.fecha_ingreso, a.medida, a.is_detallable, ca.*, a.created_at, a.updated_at from articulos a INNER JOIN tipo_articulos ta on a.tipo_articulo_id = ta.id INNER JOIN contenido_articulos ca on ca.articulo_id = a.id')
  end
end
