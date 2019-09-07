const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

var userSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    usuario: { type: String, required: false, trim: true },
    cedula: { type: String, trim: true, required: false },
    apellido: { type: String, required: true, trim: true },
    sexo: { type: String, required: true, trim: true },
    telefono: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    fechaN: { type: Date, required: true, trim: true },
    password: { type: String, required: true, trim: true },
    estado: { type: Boolean, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    fotoPerfil: { type: String, trim: true },
    saltSecret: String,
  },
  { timestamps: true },
);

// Events
userSchema.pre('save', function(next) {
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(this.password, salt, (err, hash) => {
      this.password = hash;
      this.saltSecret = salt;
      next();
    });
  });
});

userSchema.pre('findByIdAndUpdate', function(next) {
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(this.password, salt, (err, hash) => {
      this.password = hash;
      this.saltSecret = salt;
      next();
    });
  });
});

// Methods
userSchema.methods.verifyPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

userSchema.methods.generateJwt = function() {
  return jwt.sign({ _id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXP,
  });
};

mongoose.model('usuarios', userSchema);
