(function () {
  "use strict";

  var CLAVE_VEHICULOS = "kcr_vehiculos_v1";
  var CLAVE_CONFIG = "kcr_config_v1";
  var CLAVE_SESION = "kcr_sesion_v1";

  var USUARIOS = [
    { usuario: "17609994-1", clave: "kcr_2026", rol: "usuario", nombre: "Dueño KCR Motors" },
    { usuario: "18363195-0", clave: "C183r#1c", rol: "administrador", nombre: "Administrador KCR Motors" }
  ];

  var CORREO_FORMULARIO = "r.nexus.19@gmail.com";
  var CORREO_COPIA = "kcrmotors7@gmail.com";

  var IMAGEN_PLACEHOLDER = "img/auto-placeholder.svg";

  var VEHICULOS_INICIALES = [
    {
      id: "v1", marca: "Toyota", modelo: "Corolla XEI 1.8", anio: 2021, precio: 13990000, km: 42000,
      combustible: "Bencina", transmision: "Automática", color: "Blanco", tipo: "Sedán",
      destacado: true, imagen: IMAGEN_PLACEHOLDER,
      descripcion: "Único dueño, mantenciones al día en la marca. Aire acondicionado, pantalla táctil, cámara de retroceso y control crucero."
    },
    {
      id: "v2", marca: "Chevrolet", modelo: "Silverado 2.8 4x4", anio: 2020, precio: 21990000, km: 68000,
      combustible: "Diesel", transmision: "Automática", color: "Gris", tipo: "Camioneta",
      destacado: true, imagen: IMAGEN_PLACEHOLDER,
      descripcion: "Camioneta 4x4 diésel, mantenimiento completo, neumáticos nuevos. Ideal para trabajo y aventura."
    },
    {
      id: "v3", marca: "Hyundai", modelo: "Tucson 2.0", anio: 2022, precio: 17490000, km: 31000,
      combustible: "Bencina", transmision: "Automática", color: "Azul", tipo: "SUV",
      destacado: false, imagen: IMAGEN_PLACEHOLDER,
      descripcion: "SUV familiar full equipo, sensores de retroceso, climatizador bi-zona y mantenciones en concesionario."
    },
    {
      id: "v4", marca: "Kia", modelo: "Rio 1.4", anio: 2019, precio: 9290000, km: 54000,
      combustible: "Bencina", transmision: "Manual", color: "Rojo", tipo: "Hatchback",
      destacado: false, imagen: IMAGEN_PLACEHOLDER,
      descripcion: "Auto económico y rendidor, perfecto para la ciudad. Papeles al día y transferencia inmediata."
    },
    {
      id: "v5", marca: "Mazda", modelo: "CX-5 2.0", anio: 2021, precio: 18490000, km: 47000,
      combustible: "Bencina", transmision: "Automática", color: "Negro", tipo: "SUV",
      destacado: true, imagen: IMAGEN_PLACEHOLDER,
      descripcion: "SUV con excelente rendimiento, tapiz de cuero, sunroof y sistema de sonido premium."
    },
    {
      id: "v6", marca: "Nissan", modelo: "Versa 1.6", anio: 2020, precio: 10490000, km: 61000,
      combustible: "Bencina", transmision: "Manual", color: "Plata", tipo: "Sedán",
      destacado: false, imagen: IMAGEN_PLACEHOLDER,
      descripcion: "Sedán confiable y económico. Revisión técnica vigente, único dueño."
    }
  ];

  var CONFIG_INICIAL = {
    heroEtiqueta: "Automotora en Chile",
    heroTitulo: "KCR Motors",
    heroTexto: "Autos usados y seminuevos seleccionados, con revisión técnica y financiamiento a tu medida. Encuentra tu próximo vehículo con la confianza que buscas.",
    nosotros: "En KCR Motors nos dedicamos a la compra y venta de vehículos usados y seminuevos en Chile. Nuestro compromiso es ofrecer autos en buen estado, con historial claro y precios justos, para que comprar un auto sea una experiencia simple y segura.\nCada vehículo de nuestro stock pasa por una revisión previa antes de publicarse. Además, te acompañamos en todo el proceso: asesoría, financiamiento y transferencia, para que solo te preocupes de elegir tu próximo auto.",
    contacto: "¿Quieres más información sobre un vehículo, financiamiento o agendar una visita? Envíanos un mensaje.",
    telefono: "+56 9 1234 5678",
    email: "r.nexus.19@gmail.com",
    direccion: "Santiago, Chile"
  };

  var vehiculos = [];
  var config = {};
  var sesion = null;
  var imagenCargada = null;
  var vehiculoEnEdicion = null;

  function leer(clave, respaldo) {
    try {
      var dato = localStorage.getItem(clave);
      return dato ? JSON.parse(dato) : respaldo;
    } catch (e) {
      return respaldo;
    }
  }

  function guardar(clave, valor) {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
    } catch (e) {
      alert("No se pudo guardar: el almacenamiento está lleno. Intenta con imágenes más livianas.");
    }
  }

  function escapar(texto) {
    var div = document.createElement("div");
    div.textContent = texto == null ? "" : String(texto);
    return div.innerHTML;
  }

  function formatoPrecio(valor) {
    if (valor === "" || valor == null || isNaN(valor)) return "$ 0";
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0
    }).format(Number(valor));
  }

  function formatoNumero(valor) {
    if (valor === "" || valor == null || isNaN(valor)) return "0";
    return new Intl.NumberFormat("es-CL").format(Number(valor));
  }

  function listarVehiculos(filtros) {
    filtros = filtros || {};
    var texto = (filtros.texto || "").toLowerCase().trim();
    var marca = filtros.marca || "";
    var orden = filtros.orden || "reciente";

    var lista = vehiculos.filter(function (v) {
      var coincideTexto = !texto || (v.marca + " " + v.modelo + " " + v.tipo).toLowerCase().indexOf(texto) !== -1;
      var coincideMarca = !marca || v.marca === marca;
      return coincideTexto && coincideMarca;
    });

    lista.sort(function (a, b) {
      if (orden === "precio-asc") return a.precio - b.precio;
      if (orden === "precio-desc") return b.precio - a.precio;
      if (orden === "anio-desc") return b.anio - a.anio;
      return 0;
    });

    return lista;
  }

  function tarjetaVehiculo(v) {
    var insignia = v.destacado ? '<span class="insignia">Destacado</span>' : "";
    return '' +
      '<article class="tarjeta-vehiculo" data-id="' + escapar(v.id) + '">' +
        '<div class="vehiculo-imagen">' + insignia +
          '<img src="' + escapar(v.imagen || IMAGEN_PLACEHOLDER) + '" alt="' + escapar(v.marca + " " + v.modelo) + '">' +
        '</div>' +
        '<div class="vehiculo-cuerpo">' +
          '<span class="vehiculo-marca">' + escapar(v.marca) + '</span>' +
          '<h3 class="vehiculo-titulo">' + escapar(v.modelo) + '</h3>' +
          '<span class="vehiculo-precio">' + formatoPrecio(v.precio) + '</span>' +
          '<div class="vehiculo-datos">' +
            '<span>' + formatoNumero(v.km) + ' km</span>' +
            '<span>' + escapar(v.anio) + '</span>' +
            '<span>' + escapar(v.transmision) + '</span>' +
            '<span>' + escapar(v.combustible) + '</span>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function renderVehiculos() {
    var grid = document.getElementById("grid-vehiculos");
    var aviso = document.getElementById("sin-resultados");
    var lista = listarVehiculos({
      texto: document.getElementById("filtro-texto").value,
      marca: document.getElementById("filtro-marca").value,
      orden: document.getElementById("filtro-orden").value
    });

    grid.innerHTML = lista.map(tarjetaVehiculo).join("");
    aviso.hidden = lista.length !== 0;

    var tarjetas = grid.querySelectorAll(".tarjeta-vehiculo");
    for (var i = 0; i < tarjetas.length; i++) {
      tarjetas[i].addEventListener("click", function () {
        abrirDetalle(this.getAttribute("data-id"));
      });
    }

    document.getElementById("stat-stock").textContent = vehiculos.length;
  }

  function renderFiltroMarcas() {
    var select = document.getElementById("filtro-marca");
    var valorActual = select.value;
    var marcas = [];
    vehiculos.forEach(function (v) {
      if (marcas.indexOf(v.marca) === -1) marcas.push(v.marca);
    });
    marcas.sort();
    select.innerHTML = '<option value="">Todas las marcas</option>' +
      marcas.map(function (m) { return '<option value="' + escapar(m) + '">' + escapar(m) + '</option>'; }).join("");
    if (marcas.indexOf(valorActual) !== -1) select.value = valorActual;
  }

  function abrirDetalle(id) {
    var v = vehiculos.filter(function (x) { return x.id === id; })[0];
    if (!v) return;
    var tel = (config.telefono || "").replace(/[^0-9+]/g, "");
    var mensaje = encodeURIComponent("Hola KCR Motors, me interesa el " + v.marca + " " + v.modelo + " " + v.anio + ".");
    var detalle = document.getElementById("detalle-vehiculo");
    detalle.innerHTML = '' +
      '<img src="' + escapar(v.imagen || IMAGEN_PLACEHOLDER) + '" alt="' + escapar(v.marca + " " + v.modelo) + '">' +
      '<span class="vehiculo-marca">' + escapar(v.marca) + '</span>' +
      '<h2>' + escapar(v.modelo) + '</h2>' +
      '<div class="detalle-precio">' + formatoPrecio(v.precio) + '</div>' +
      '<div class="detalle-datos">' +
        campoDetalle("Año", v.anio) +
        campoDetalle("Kilometraje", formatoNumero(v.km) + " km") +
        campoDetalle("Combustible", v.combustible) +
        campoDetalle("Transmisión", v.transmision) +
        campoDetalle("Color", v.color || "-") +
        campoDetalle("Tipo", v.tipo || "-") +
      '</div>' +
      (v.descripcion ? '<p class="detalle-descripcion">' + escapar(v.descripcion) + '</p>' : '') +
      '<div class="detalle-acciones">' +
        '<a class="boton boton-claro" href="https://wa.me/' + escapar(tel.replace(/\D/g, "")) + '?text=' + mensaje + '" target="_blank" rel="noopener">Consultar por WhatsApp</a>' +
        '<a class="boton boton-vacio-oscuro" href="#contacto" data-cerrar-modal="modal-vehiculo">Dejar mensaje</a>' +
      '</div>';

    var enlace = detalle.querySelector("[data-cerrar-modal]");
    if (enlace) {
      enlace.addEventListener("click", function () {
        cerrarModal("modal-vehiculo");
      });
    }

    abrirModal("modal-vehiculo");
  }

  function campoDetalle(etiqueta, valor) {
    return '<div class="detalle-dato"><span>' + escapar(etiqueta) + '</span><strong>' + escapar(valor) + '</strong></div>';
  }

  function renderPanel() {
    document.getElementById("panel-bienvenida").innerHTML =
      "Sesión activa: <strong>" + escapar(sesion.nombre) + "</strong> (" + escapar(sesion.rol) + ")";

    document.getElementById("panel-config").hidden = sesion.rol !== "administrador";

    var tabla = document.getElementById("tabla-vehiculos");
    document.getElementById("contador-panel").textContent = "(" + vehiculos.length + ")";

    if (!vehiculos.length) {
      tabla.innerHTML = '<p class="panel-vacio">Aún no hay vehículos publicados.</p>';
      return;
    }

    tabla.innerHTML = vehiculos.map(function (v) {
      return '' +
        '<div class="fila-vehiculo">' +
          '<img src="' + escapar(v.imagen || IMAGEN_PLACEHOLDER) + '" alt="' + escapar(v.marca + " " + v.modelo) + '">' +
          '<div class="fila-vehiculo-info">' +
            '<strong>' + escapar(v.marca + " " + v.modelo) + '</strong>' +
            '<span>' + escapar(v.anio) + ' · ' + formatoNumero(v.km) + ' km · ' + formatoPrecio(v.precio) + '</span>' +
          '</div>' +
          '<div class="fila-vehiculo-acciones">' +
            '<button type="button" class="boton boton-editar" data-editar="' + escapar(v.id) + '">Editar</button>' +
            '<button type="button" class="boton boton-eliminar" data-eliminar="' + escapar(v.id) + '">Eliminar</button>' +
          '</div>' +
        '</div>';
    }).join("");

    var botonesEliminar = tabla.querySelectorAll("[data-eliminar]");
    for (var i = 0; i < botonesEliminar.length; i++) {
      botonesEliminar[i].addEventListener("click", function () {
        eliminarVehiculo(this.getAttribute("data-eliminar"));
      });
    }

    var botonesEditar = tabla.querySelectorAll("[data-editar]");
    for (var j = 0; j < botonesEditar.length; j++) {
      botonesEditar[j].addEventListener("click", function () {
        cargarEnFormulario(this.getAttribute("data-editar"));
      });
    }
  }

  function cargarEnFormulario(id) {
    var v = vehiculos.filter(function (x) { return x.id === id; })[0];
    if (!v) return;
    vehiculoEnEdicion = id;
    document.getElementById("titulo-form-vehiculo").textContent = "Editar vehículo";
    document.getElementById("vehiculo-id").value = id;
    document.getElementById("v-marca").value = v.marca;
    document.getElementById("v-modelo").value = v.modelo;
    document.getElementById("v-anio").value = v.anio;
    document.getElementById("v-precio").value = v.precio;
    document.getElementById("v-km").value = v.km;
    document.getElementById("v-combustible").value = v.combustible;
    document.getElementById("v-transmision").value = v.transmision;
    document.getElementById("v-color").value = v.color || "";
    document.getElementById("v-tipo").value = v.tipo || "Sedán";
    document.getElementById("v-descripcion").value = v.descripcion || "";
    document.getElementById("v-destacado").checked = !!v.destacado;
    imagenCargada = v.imagen || null;
    document.getElementById("v-imagen").value = "";
    document.getElementById("v-imagen-url").value = "";
    document.getElementById("btn-cancelar-edicion").hidden = false;
    document.getElementById("mensaje-vehiculo").textContent = "";
    document.getElementById("formulario-vehiculo").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function limpiarFormularioVehiculo() {
    vehiculoEnEdicion = null;
    imagenCargada = null;
    document.getElementById("titulo-form-vehiculo").textContent = "Publicar vehículo";
    document.getElementById("formulario-vehiculo").reset();
    document.getElementById("vehiculo-id").value = "";
    document.getElementById("btn-cancelar-edicion").hidden = true;
    document.getElementById("mensaje-vehiculo").textContent = "";
  }

  function guardarVehiculo(evento) {
    evento.preventDefault();
    var mensaje = document.getElementById("mensaje-vehiculo");
    var urlImagen = document.getElementById("v-imagen-url").value.trim();

    var datos = {
      marca: document.getElementById("v-marca").value.trim(),
      modelo: document.getElementById("v-modelo").value.trim(),
      anio: Number(document.getElementById("v-anio").value),
      precio: Number(document.getElementById("v-precio").value),
      km: Number(document.getElementById("v-km").value),
      combustible: document.getElementById("v-combustible").value,
      transmision: document.getElementById("v-transmision").value,
      color: document.getElementById("v-color").value.trim(),
      tipo: document.getElementById("v-tipo").value,
      descripcion: document.getElementById("v-descripcion").value.trim(),
      destacado: document.getElementById("v-destacado").checked,
      imagen: urlImagen || imagenCargada || IMAGEN_PLACEHOLDER
    };

    if (!datos.marca || !datos.modelo || !datos.anio || isNaN(datos.precio) || isNaN(datos.km)) {
      mensaje.className = "mensaje-formulario error";
      mensaje.textContent = "Completa marca, modelo, año, precio y kilometraje.";
      return;
    }

    if (vehiculoEnEdicion) {
      vehiculos = vehiculos.map(function (v) {
        return v.id === vehiculoEnEdicion ? Object.assign({}, v, datos) : v;
      });
      mensaje.className = "mensaje-formulario exito";
      mensaje.textContent = "Vehículo actualizado.";
    } else {
      datos.id = "v" + Date.now();
      vehiculos.unshift(datos);
      mensaje.className = "mensaje-formulario exito";
      mensaje.textContent = "Vehículo publicado.";
    }

    guardarVehiculos();
    renderFiltroMarcas();
    renderVehiculos();
    renderPanel();
    limpiarFormularioVehiculo();
  }

  function eliminarVehiculo(id) {
    var v = vehiculos.filter(function (x) { return x.id === id; })[0];
    if (!v) return;
    if (!confirm("¿Eliminar la publicación de " + v.marca + " " + v.modelo + "?")) return;
    vehiculos = vehiculos.filter(function (x) { return x.id !== id; });
    guardarVehiculos();
    renderFiltroMarcas();
    renderVehiculos();
    renderPanel();
  }

  function guardarVehiculos() {
    guardar(CLAVE_VEHICULOS, vehiculos);
  }

  function guardarConfig() {
    guardar(CLAVE_CONFIG, config);
  }

  function aplicarConfig() {
    document.getElementById("hero-etiqueta").textContent = config.heroEtiqueta;
    document.getElementById("hero-titulo").textContent = config.heroTitulo;
    document.getElementById("hero-texto").textContent = config.heroTexto;
    document.getElementById("texto-contacto").textContent = config.contacto;

    var parrafos = (config.nosotros || "").split("\n").filter(function (p) { return p.trim(); });
    document.getElementById("texto-nosotros").innerHTML = parrafos.map(function (p) {
      return "<p>" + escapar(p) + "</p>";
    }).join("");

    document.title = config.heroTitulo + " | Autos usados y seminuevos";
  }

  function cargarConfigEnFormulario() {
    document.getElementById("c-hero-etiqueta").value = config.heroEtiqueta;
    document.getElementById("c-hero-titulo").value = config.heroTitulo;
    document.getElementById("c-hero-texto").value = config.heroTexto;
    document.getElementById("c-nosotros").value = config.nosotros;
    document.getElementById("c-contacto").value = config.contacto;
    document.getElementById("c-telefono").value = config.telefono || "";
    document.getElementById("c-email").value = config.email || "";
    document.getElementById("c-direccion").value = config.direccion || "";
  }

  function guardarConfigFormulario(evento) {
    evento.preventDefault();
    config.heroEtiqueta = document.getElementById("c-hero-etiqueta").value.trim();
    config.heroTitulo = document.getElementById("c-hero-titulo").value.trim();
    config.heroTexto = document.getElementById("c-hero-texto").value.trim();
    config.nosotros = document.getElementById("c-nosotros").value.trim();
    config.contacto = document.getElementById("c-contacto").value.trim();
    config.telefono = document.getElementById("c-telefono").value.trim();
    config.email = document.getElementById("c-email").value.trim();
    config.direccion = document.getElementById("c-direccion").value.trim();
    guardarConfig();
    aplicarConfig();
    var mensaje = document.getElementById("mensaje-config");
    mensaje.className = "mensaje-formulario exito";
    mensaje.textContent = "Configuración guardada y aplicada.";
  }

  function redimensionarImagen(archivo, callback) {
    var lector = new FileReader();
    lector.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var maxAncho = 1000;
        var escala = Math.min(1, maxAncho / img.width);
        var canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        callback(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = function () { callback(null); };
      img.src = e.target.result;
    };
    lector.onerror = function () { callback(null); };
    lector.readAsDataURL(archivo);
  }

  function iniciarSesion(evento) {
    evento.preventDefault();
    var usuario = document.getElementById("login-usuario").value.trim().toLowerCase();
    var clave = document.getElementById("login-clave").value;
    var mensaje = document.getElementById("mensaje-login");

    var encontrado = USUARIOS.filter(function (u) {
      return u.usuario === usuario && u.clave === clave;
    })[0];

    if (!encontrado) {
      mensaje.className = "mensaje-formulario error";
      mensaje.textContent = "Usuario o contraseña incorrectos.";
      return;
    }

    sesion = { usuario: encontrado.usuario, nombre: encontrado.nombre, rol: encontrado.rol };
    guardar(CLAVE_SESION, sesion);
    actualizarSesionUI();
    cerrarModal("modal-login");
    document.getElementById("formulario-login").reset();
    mensaje.textContent = "";
    abrirPanel();
  }

  function actualizarSesionUI() {
    var activo = document.getElementById("usuario-activo");
    var botonLogin = document.getElementById("btn-abrir-login");
    var botonAgregar = document.getElementById("btn-agregar-vehiculo");

    if (sesion) {
      activo.hidden = false;
      botonLogin.hidden = true;
      botonAgregar.hidden = false;
      document.getElementById("usuario-nombre").textContent = sesion.nombre;
      document.getElementById("usuario-rol").textContent = sesion.rol === "administrador" ? "Administrador" : "Usuario";
    } else {
      activo.hidden = true;
      botonLogin.hidden = false;
      botonAgregar.hidden = true;
    }
  }

  function cerrarSesion() {
    sesion = null;
    try { localStorage.removeItem(CLAVE_SESION); } catch (e) {}
    actualizarSesionUI();
    cerrarPanel();
  }

  function abrirPanel() {
    if (!sesion) return;
    renderPanel();
    if (sesion.rol === "administrador") cargarConfigEnFormulario();
    document.getElementById("panel-admin").hidden = false;
    document.body.style.overflow = "hidden";
  }

  function cerrarPanel() {
    document.getElementById("panel-admin").hidden = true;
    document.body.style.overflow = "";
    limpiarFormularioVehiculo();
  }

  function abrirModal(id) {
    document.getElementById(id).hidden = false;
    document.body.style.overflow = "hidden";
  }

  function cerrarModal(id) {
    document.getElementById(id).hidden = true;
    document.body.style.overflow = "";
  }

  function enviarContacto(evento) {
    evento.preventDefault();
    var mensaje = document.getElementById("mensaje-formulario");
    var boton = document.querySelector("#formulario-contacto button[type='submit']");
    var nombre = document.getElementById("nombre").value.trim();
    var email = document.getElementById("email").value.trim();
    var texto = document.getElementById("mensaje").value.trim();

    if (!nombre || !email || !texto) {
      mensaje.className = "mensaje-formulario error";
      mensaje.textContent = "Completa nombre, correo y mensaje.";
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      mensaje.className = "mensaje-formulario error";
      mensaje.textContent = "Ingresa un correo válido.";
      return;
    }

    mensaje.className = "mensaje-formulario";
    mensaje.textContent = "Enviando mensaje...";
    boton.disabled = true;

    fetch("https://formsubmit.co/ajax/" + CORREO_FORMULARIO, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        nombre: nombre,
        email: email,
        mensaje: texto,
        _subject: "Contacto web KCR Motors - " + nombre,
        _cc: CORREO_COPIA
      })
    })
      .then(function (respuesta) {
        if (!respuesta.ok) throw new Error("error");
        return respuesta.json();
      })
      .then(function () {
        mensaje.className = "mensaje-formulario exito";
        mensaje.textContent = "¡Gracias " + nombre + "! Tu mensaje fue enviado.";
        document.getElementById("formulario-contacto").reset();
      })
      .catch(function () {
        var asunto = encodeURIComponent("Contacto web KCR Motors - " + nombre);
        var cuerpo = encodeURIComponent(texto + "\n\nNombre: " + nombre + "\nCorreo: " + email);
        window.location.href = "mailto:" + CORREO_FORMULARIO + "," + CORREO_COPIA + "?subject=" + asunto + "&body=" + cuerpo;
        mensaje.className = "mensaje-formulario exito";
        mensaje.textContent = "¡Gracias " + nombre + "! Abrimos tu correo para enviar el mensaje.";
      })
      .finally(function () {
        boton.disabled = false;
      });
  }

  function inicializar() {
    vehiculos = leer(CLAVE_VEHICULOS, null);
    if (!Array.isArray(vehiculos)) {
      vehiculos = VEHICULOS_INICIALES.slice();
      guardarVehiculos();
    }

    config = leer(CLAVE_CONFIG, null);
    if (!config) {
      config = Object.assign({}, CONFIG_INICIAL);
      guardarConfig();
    }

    sesion = leer(CLAVE_SESION, null);

    document.getElementById("anio").textContent = new Date().getFullYear();

    aplicarConfig();
    renderFiltroMarcas();
    renderVehiculos();
    actualizarSesionUI();

    document.getElementById("btn-abrir-login").addEventListener("click", function () {
      document.getElementById("mensaje-login").textContent = "";
      abrirModal("modal-login");
      document.getElementById("login-usuario").focus();
    });

    document.getElementById("btn-abrir-panel").addEventListener("click", abrirPanel);
    document.getElementById("btn-cerrar-panel").addEventListener("click", cerrarPanel);
    document.getElementById("btn-cerrar-sesion").addEventListener("click", cerrarSesion);

    document.getElementById("formulario-login").addEventListener("submit", iniciarSesion);
    document.getElementById("formulario-vehiculo").addEventListener("submit", guardarVehiculo);
    document.getElementById("formulario-config").addEventListener("submit", guardarConfigFormulario);
    document.getElementById("formulario-contacto").addEventListener("submit", enviarContacto);

    document.getElementById("v-imagen").addEventListener("change", function () {
      var archivo = this.files && this.files[0];
      if (!archivo) return;
      var aviso = document.getElementById("mensaje-vehiculo");
      aviso.className = "mensaje-formulario";
      aviso.textContent = "Procesando imagen...";
      redimensionarImagen(archivo, function (dataUrl) {
        if (dataUrl) {
          imagenCargada = dataUrl;
          document.getElementById("v-imagen-url").value = "";
          aviso.className = "mensaje-formulario exito";
          aviso.textContent = "Imagen cargada.";
        } else {
          aviso.className = "mensaje-formulario error";
          aviso.textContent = "No se pudo procesar la imagen.";
        }
      });
    });

    document.getElementById("btn-agregar-vehiculo").addEventListener("click", function () {
      limpiarFormularioVehiculo();
      document.getElementById("formulario-vehiculo").scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("v-marca").focus();
    });

    document.getElementById("btn-cancelar-edicion").addEventListener("click", limpiarFormularioVehiculo);

    document.getElementById("filtro-texto").addEventListener("input", renderVehiculos);
    document.getElementById("filtro-marca").addEventListener("change", renderVehiculos);
    document.getElementById("filtro-orden").addEventListener("change", renderVehiculos);

    document.getElementById("btn-buscar-hero").addEventListener("click", function () {
      document.getElementById("filtro-texto").value = document.getElementById("buscador-hero").value;
      renderVehiculos();
      document.getElementById("vehiculos").scrollIntoView({ behavior: "smooth" });
    });

    document.getElementById("buscador-hero").addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        document.getElementById("btn-buscar-hero").click();
      }
    });

    var cierres = document.querySelectorAll("[data-cerrar]");
    for (var i = 0; i < cierres.length; i++) {
      cierres[i].addEventListener("click", function () {
        cerrarModal(this.getAttribute("data-cerrar"));
      });
    }

    document.querySelectorAll(".modal").forEach(function (modal) {
      modal.addEventListener("click", function (e) {
        if (e.target === modal) cerrarModal(modal.id);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        document.querySelectorAll(".modal").forEach(function (modal) {
          if (!modal.hidden) cerrarModal(modal.id);
        });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializar);
  } else {
    inicializar();
  }
})();
