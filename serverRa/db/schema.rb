# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2019_10_13_140441) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "articulos", force: :cascade do |t|
    t.bigint "tipo_articulo_id"
    t.string "nombre"
    t.float "costo_principal"
    t.float "precio_principal"
    t.integer "existencia"
    t.integer "secuencia"
    t.string "codigo"
    t.date "fecha_ingreso"
    t.string "medida"
    t.boolean "is_detallable"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["tipo_articulo_id"], name: "index_articulos_on_tipo_articulo_id"
  end

  create_table "contenido_articulos", force: :cascade do |t|
    t.bigint "articulo_id"
    t.integer "referencia"
    t.float "costo"
    t.float "precio"
    t.integer "cantidad"
    t.string "medida"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["articulo_id"], name: "index_contenido_articulos_on_articulo_id"
  end

  create_table "tipo_articulos", force: :cascade do |t|
    t.text "descripcion"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "users", force: :cascade do |t|
    t.string "provider", default: "email", null: false
    t.string "uid", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.boolean "allow_password_change", default: false
    t.datetime "remember_created_at"
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "confirmation_sent_at"
    t.string "unconfirmed_email"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.string "nombre"
    t.string "usuario"
    t.string "cedula"
    t.string "apellido"
    t.string "sexo"
    t.string "fotoPerfil"
    t.string "telefono"
    t.string "email"
    t.date "fechaN"
    t.string "role"
    t.json "tokens"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["uid", "provider"], name: "index_users_on_uid_and_provider", unique: true
  end

  add_foreign_key "articulos", "tipo_articulos"
  add_foreign_key "contenido_articulos", "articulos"
end
