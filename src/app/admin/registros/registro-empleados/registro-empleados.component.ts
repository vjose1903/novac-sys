import { Component, OnInit } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { parseDate, BsDatepickerConfig } from "ngx-bootstrap";
import { PhotosService } from "../../../core/services/photos.service";
import { ActivatedRoute } from "@angular/router";
import { UsuariosI } from "../../../core/models/usuario.model";
@Component({
  selector: "app-registro-empleados",
  templateUrl: "./registro-empleados.component.html",
  styleUrls: ["./registro-empleados.component.scss"]
})
export class RegistroEmpleadosComponent implements OnInit {
  form: FormGroup;
  titulo = "";
  boton = "";
  phoneMask = [
    "(",
    /[1-9]/,
    /\d/,
    /\d/,
    ")",
    /\d/,
    /\d/,
    /\d/,
    "-",
    /\d/,
    /\d/,
    /\d/,
    /\d/
  ];
  public dpConfig: Partial<BsDatepickerConfig> = new BsDatepickerConfig();

  constructor(private fb: FormBuilder, private route: ActivatedRoute) {
    this.form = this.fb.group({
      nombre: [null, Validators.required],
      apellido: [null, Validators.required],
      usuario: [null, Validators.compose([Validators.required])],
      sexo: ["", Validators.required],
      telefono: [null, Validators.required],
      email: [
        null,
        Validators.compose([
          Validators.pattern(
            /^[a-zA-Z0-9_\.\-]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-\.]+$/
          )
        ])
      ],
      fechaN: [null, Validators.required],
      password: [null, Validators.required],
      estado: [true],
      role: [null, Validators.required]
    });

    this.dpConfig = Object.assign(
      {},
      {
        // locale:'es',
        showWeekNumbers: false,
        maxDate: new Date()
      }
    );
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      if (params.get("accion") == "INS") {
        this.titulo = "Registro de empleados";
        this.boton = "Registrar";
      } else {
        this.titulo = "Actualizar empleado";
        this.boton = "Actualizar";

        this.form = this.fb.group({
          nombre: [null, Validators.required],
          apellido: [null, Validators.required],
          usuario: [null, Validators.compose([Validators.required])],
          sexo: ["", Validators.required],
          telefono: [null, Validators.required],
          email: [
            null,
            Validators.compose([
              Validators.pattern(
                /^[a-zA-Z0-9_\.\-]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-\.]+$/
              )
            ])
          ],
          fechaN: [null, Validators.required],
          password: [null, Validators.required],
          estado: [true],
          role: [null, Validators.required]
        });
      }
    });
  }

  atras() {
    window.history.back();
  }

  submit(form) {
    var formData = new UsuariosI();
    var fotoPerfil = "";

    this.route.paramMap.subscribe(params => {
      if (params.get("accion") == "INS") {
        if (form.controls.sexo.value == "M") {
          fotoPerfil = "userH.png";
        } else {
          fotoPerfil = "userM.png";
        }

        formData = {
          _id: null,
          nombre: form.controls.nombre.value,
          apellido: form.controls.apellido.value,
          sexo: form.controls.sexo.value,
          fotoPerfil: fotoPerfil,
          usuario: form.controls.usuario.value,
          telefono: form.controls.telefono.value,
          email: form.controls.email.value,
          fechaN: form.controls.fechaN.value,
          password: form.controls.password.value,
          estado: true,
          role: form.controls.role.value
        };

        console.log(formData);
      } else {
      }
    });
  }
}
