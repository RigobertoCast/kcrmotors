(function () {
  "use strict";

  var FIREBASE_CONFIG = window.FIREBASE_CONFIG || {};
  var CONFIGURADO = !!(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);

  var DOMINIO_LOGIN = "@kcrmotors.cl";
  var ADMIN_EMAILS = ["18363195-0@kcrmotors.cl"];

  var IMAGEN_PLACEHOLDER = "img/auto-placeholder.svg";

  var VEHICULOS_INICIALES = [
    {
      marca: "Toyota", modelo: "Corolla XEI 1.8", anio: 2021, precio: 13990000, km: 42000,
      combustible: "Bencina", transmision: "Automática", color: "Blanco", tipo: "Sedán",
      destacado: true,
      descripcion: "Único dueño, mantenciones al día en la marca. Aire acondicionado, pantalla táctil, cámara de retroceso y control crucero."
    },
    {
      marca: "Chevrolet", modelo: "Silverado 2.8 4x4", anio: 2020, precio: 21990000, km: 68000,
      combustible: "Diesel", transmision: "Automática", color: "Gris", tipo: "Camioneta",
      destacado: true,
      descripcion: "Camioneta 4x4 diésel, mantenimiento completo, neumáticos nuevos. Ideal para trabajo y aventura."
    },
    {
      marca: "Hyundai", modelo: "Tucson 2.0", anio: 2022, precio: 17490000, km: 31000,
      combustible: "Bencina", transmision: "Automática", color: "Azul", tipo: "SUV",
      destacado: false,
      descripcion: "SUV familiar full equipo, sensores de retroceso, climatizador bi-zona y mantenciones en concesionario."
    },
    {
      marca: "Kia", modelo: "Rio 1.4", anio: 2019, precio: 9290000, km: 54000,
      combustible: "Bencina", transmision: "Manual", color: "Rojo", tipo: "Hatchback",
      destacado: false,
      descripcion: "Auto económico y rendidor, perfecto para la ciudad. Papeles al día y transferencia inmediata."
    },
    {
      marca: "Mazda", modelo: "CX-5 2.0", anio: 2021, precio: 18490000, km: 47000,
      combustible: "Bencina", transmision: "Automática", color: "Negro", tipo: "SUV",
      destacado: true,
      descripcion: "SUV con excelente rendimiento, tapiz de cuero, sunroof y sistema de sonido premium."
    },
    {
      marca: "Nissan", modelo: "Versa 1.6", anio: 2020, precio: 10490000, km: 61000,
      combustible: "Bencina", transmision: "Manual", color: "Plata", tipo: "Sedán",
      destacado: false,
      descripcion: "Sedán confiable y económico. Revisión técnica vigente, único dueño."
    }
  ];

  var CONFIG_INICIAL = {
    heroEtiqueta: "Automotora en Chile",
    heroTitulo: "KCR Motors",
    heroTexto: "Autos usados y seminuevos seleccionados, con revisión técnica y financiamiento a tu medida. Encuentra tu próximo vehículo con la confianza que buscas.",
    nosotros: "En KCR Motors nos dedicamos a la compra y venta de vehículos usados y seminuevos en Chile. Nuestro compromiso es ofrecer autos en buen estado, con historial claro y precios justos, para que comprar un auto sea una experiencia simple y segura.\nCada vehículo de nuestro stock pasa por una revisión previa antes de publicarse. Además, te acompañamos en todo el proceso: asesoría, financiamiento y transferencia, para que solo te preocupes de elegir tu próximo auto.",
    contacto: "¿Quieres más información sobre un vehículo, financiamiento o agendar una visita? Envíanos un mensaje.",
    telefono: "+56977289537",
    email: "r.nexus.19@gmail.com",
    direccion: "Santiago, Chile"
  };

  var db = null;
  var auth = null;

  var vehiculos = [];
  var config = {};
  var sesion = null;
  var imagenesCargadas = [];
  var vehiculoEnEdicion = null;

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
      if (orden === "reciente") return (b.creado || 0) - (a.creado || 0);
      return (a.orden || 0) - (b.orden || 0);
    });

    return lista;
  }

  function imagenesDe(v) {
    if (v && v.imagenes && v.imagenes.length) return v.imagenes;
    if (v && v.imagen && v.imagen !== IMAGEN_PLACEHOLDER) return [v.imagen];
    return [];
  }

  function portada(v) {
    var ims = imagenesDe(v);
    return ims.length ? ims[0] : IMAGEN_PLACEHOLDER;
  }

  function tarjetaVehiculo(v) {
    var insignia = v.destacado ? '<span class="insignia">Destacado</span>' : "";
    return '' +
      '<article class="tarjeta-vehiculo" data-id="' + escapar(v.id) + '">' +
        '<div class="vehiculo-imagen">' + insignia +
          '<img src="' + escapar(portada(v)) + '" alt="' + escapar(v.marca + " " + v.modelo) + '">' +
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
    var ims = imagenesDe(v);
    if (!ims.length) ims = [IMAGEN_PLACEHOLDER];
    var galeria = ims.length > 1
      ? '<div class="detalle-galeria">' + ims.map(function (src, idx) {
          return '<button type="button" class="detalle-mini' + (idx === 0 ? " activa" : "") + '" data-indice="' + idx + '"><img src="' + escapar(src) + '" alt=""></button>';
        }).join("") + '</div>'
      : "";
    detalle.innerHTML = '' +
      '<img class="detalle-imagen-principal" src="' + escapar(ims[0]) + '" alt="' + escapar(v.marca + " " + v.modelo) + '">' +
      galeria +
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

    var principal = detalle.querySelector(".detalle-imagen-principal");
    var miniaturas = detalle.querySelectorAll(".detalle-mini");
    for (var k = 0; k < miniaturas.length; k++) {
      miniaturas[k].addEventListener("click", function () {
        principal.src = ims[Number(this.getAttribute("data-indice"))];
        for (var m = 0; m < miniaturas.length; m++) miniaturas[m].classList.remove("activa");
        this.classList.add("activa");
      });
    }

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
    if (!sesion) return;
    document.getElementById("panel-bienvenida").innerHTML =
      "Sesión activa: <strong>" + escapar(sesion.nombre) + "</strong> (" + escapar(sesion.rol) + ")";

    document.getElementById("panel-config").hidden = false;
    var catalogoAdmin = document.getElementById("panel-catalogo-admin");
    if (catalogoAdmin) catalogoAdmin.hidden = sesion.rol !== "administrador";

    var tabla = document.getElementById("tabla-vehiculos");
    document.getElementById("contador-panel").textContent = "(" + vehiculos.length + ")";

    if (!vehiculos.length) {
      tabla.innerHTML = '<p class="panel-vacio">Aún no hay vehículos publicados.</p>';
      return;
    }

    tabla.innerHTML = vehiculos.map(function (v, idx) {
      var primero = idx === 0;
      var ultimo = idx === vehiculos.length - 1;
      return '' +
        '<div class="fila-vehiculo">' +
          '<div class="fila-vehiculo-orden">' +
            '<button type="button" class="boton-mover" data-subir="' + escapar(v.id) + '" title="Subir"' + (primero ? " disabled" : "") + '>&#9650;</button>' +
            '<button type="button" class="boton-mover" data-bajar="' + escapar(v.id) + '" title="Bajar"' + (ultimo ? " disabled" : "") + '>&#9660;</button>' +
          '</div>' +
          '<img src="' + escapar(portada(v)) + '" alt="' + escapar(v.marca + " " + v.modelo) + '">' +
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

    var botonesSubir = tabla.querySelectorAll("[data-subir]");
    for (var s = 0; s < botonesSubir.length; s++) {
      botonesSubir[s].addEventListener("click", function () {
        moverVehiculo(this.getAttribute("data-subir"), -1);
      });
    }

    var botonesBajar = tabla.querySelectorAll("[data-bajar]");
    for (var b = 0; b < botonesBajar.length; b++) {
      botonesBajar[b].addEventListener("click", function () {
        moverVehiculo(this.getAttribute("data-bajar"), 1);
      });
    }

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

  function moverVehiculo(id, direccion) {
    var i = indexDeVehiculo(id);
    var j = i + direccion;
    if (i < 0 || j < 0 || j >= vehiculos.length) return;
    var temp = vehiculos[i];
    vehiculos[i] = vehiculos[j];
    vehiculos[j] = temp;
    persistirOrden().then(function () {
      renderVehiculos();
      renderPanel();
    }).catch(function (e) {
      alert(mensajeError(e));
      cargarVehiculos().then(function () { renderVehiculos(); renderPanel(); });
    });
  }

  function indexDeVehiculo(id) {
    for (var i = 0; i < vehiculos.length; i++) {
      if (vehiculos[i].id === id) return i;
    }
    return -1;
  }

  function persistirOrden() {
    var lote = db.batch();
    vehiculos.forEach(function (v, i) {
      v.orden = i;
      lote.update(db.collection("vehiculos").doc(v.id), { orden: i });
    });
    return lote.commit();
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
    imagenesCargadas = imagenesDe(v).slice(0, 10);
    document.getElementById("v-imagen-url").value = "";
    renderGaleriaForm();
    document.getElementById("btn-cancelar-edicion").hidden = false;
    document.getElementById("mensaje-vehiculo").textContent = "";
    document.getElementById("formulario-vehiculo").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function limpiarFormularioVehiculo() {
    vehiculoEnEdicion = null;
    imagenesCargadas = [];
    document.getElementById("titulo-form-vehiculo").textContent = "Publicar vehículo";
    document.getElementById("formulario-vehiculo").reset();
    document.getElementById("vehiculo-id").value = "";
    document.getElementById("btn-cancelar-edicion").hidden = true;
    document.getElementById("mensaje-vehiculo").textContent = "";
    renderGaleriaForm();
  }

  function guardarVehiculo(evento) {
    evento.preventDefault();
    var mensaje = document.getElementById("mensaje-vehiculo");
    if (!db) {
      mensaje.className = "mensaje-formulario error";
      mensaje.textContent = "Falta configurar Firebase (js/firebase-config.js).";
      return;
    }

    agregarImagenesDeTexto(document.getElementById("v-imagen-url").value);
    document.getElementById("v-imagen-url").value = "";

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
      destacado: document.getElementById("v-destacado").checked
    };

    if (!datos.marca || !datos.modelo || !datos.anio || isNaN(datos.precio) || isNaN(datos.km)) {
      mensaje.className = "mensaje-formulario error";
      mensaje.textContent = "Completa marca, modelo, año, precio y kilometraje.";
      return;
    }

    var boton = document.getElementById("btn-guardar-vehiculo");
    var fueEdicion = !!vehiculoEnEdicion;
    boton.disabled = true;
    mensaje.className = "mensaje-formulario";
    mensaje.textContent = "Guardando...";

    subirImagenes(imagenesCargadas.slice(0, 10)).then(function (urls) {
      var ims = urls.length ? urls : [IMAGEN_PLACEHOLDER];
      datos.imagenes = ims;
      datos.imagen = ims[0];
      if (vehiculoEnEdicion) {
        return db.collection("vehiculos").doc(vehiculoEnEdicion).set(datos, { merge: true });
      }
      datos.creado = Date.now();
      datos.orden = vehiculos.length;
      return db.collection("vehiculos").add(datos);
    }).then(function () {
      return cargarVehiculos();
    }).then(function () {
      renderFiltroMarcas();
      renderVehiculos();
      renderPanel();
      limpiarFormularioVehiculo();
      mensaje.className = "mensaje-formulario exito";
      mensaje.textContent = fueEdicion ? "Vehículo actualizado." : "Vehículo publicado.";
    }).catch(function (e) {
      mensaje.className = "mensaje-formulario error";
      mensaje.textContent = mensajeError(e);
    }).finally(function () {
      boton.disabled = false;
    });
  }

  function eliminarVehiculo(id) {
    var v = vehiculos.filter(function (x) { return x.id === id; })[0];
    if (!v || !db) return;
    if (!confirm("¿Eliminar la publicación de " + v.marca + " " + v.modelo + "?")) return;
    db.collection("vehiculos").doc(id).delete().then(function () {
      return cargarVehiculos();
    }).then(function () {
      renderFiltroMarcas();
      renderVehiculos();
      renderPanel();
    }).catch(function (e) {
      alert(mensajeError(e));
    });
  }

  function subirImagenes(lista) {
    return Promise.resolve(lista.slice(0, 10));
  }

  function cargarVehiculos() {
    return db.collection("vehiculos").get().then(function (snap) {
      vehiculos = [];
      snap.forEach(function (doc) {
        var d = doc.data();
        d.id = doc.id;
        vehiculos.push(d);
      });
      vehiculos.sort(function (a, b) {
        var oa = typeof a.orden === "number" ? a.orden : null;
        var ob = typeof b.orden === "number" ? b.orden : null;
        if (oa !== null && ob !== null) return oa - ob;
        if (oa !== null) return -1;
        if (ob !== null) return 1;
        return (b.creado || 0) - (a.creado || 0);
      });
      vehiculos.forEach(function (v, i) { v.orden = i; });
    });
  }

  function cargarConfig() {
    return db.collection("config").doc("sitio").get().then(function (doc) {
      config = Object.assign({}, CONFIG_INICIAL, doc.exists ? doc.data() : {});
      if (!config.telefono || config.telefono === "+56 9 1234 5678" || config.telefono === "+56983555364") {
        config.telefono = CONFIG_INICIAL.telefono;
      }
    });
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
    var mensaje = document.getElementById("mensaje-config");
    if (!db) return;
    config.heroEtiqueta = document.getElementById("c-hero-etiqueta").value.trim();
    config.heroTitulo = document.getElementById("c-hero-titulo").value.trim();
    config.heroTexto = document.getElementById("c-hero-texto").value.trim();
    config.nosotros = document.getElementById("c-nosotros").value.trim();
    config.contacto = document.getElementById("c-contacto").value.trim();
    config.telefono = document.getElementById("c-telefono").value.trim();
    config.email = document.getElementById("c-email").value.trim();
    config.direccion = document.getElementById("c-direccion").value.trim();
    db.collection("config").doc("sitio").set(config).then(function () {
      aplicarConfig();
      mensaje.className = "mensaje-formulario exito";
      mensaje.textContent = "Configuración guardada y aplicada.";
    }).catch(function (e) {
      mensaje.className = "mensaje-formulario error";
      mensaje.textContent = mensajeError(e);
    });
  }

  function cargarCatalogoEjemplo() {
    var mensaje = document.getElementById("mensaje-catalogo");
    if (!db) return;
    if (!confirm("Se agregarán 6 vehículos de ejemplo a la base de datos. ¿Continuar?")) return;
    var lote = db.batch();
    VEHICULOS_INICIALES.forEach(function (v, i) {
      var ref = db.collection("vehiculos").doc();
      var copia = Object.assign({}, v, { creado: Date.now() - i * 1000, orden: i, imagenes: [IMAGEN_PLACEHOLDER], imagen: IMAGEN_PLACEHOLDER });
      lote.set(ref, copia);
    });
    lote.commit().then(function () {
      return cargarVehiculos();
    }).then(function () {
      renderFiltroMarcas();
      renderVehiculos();
      renderPanel();
      mensaje.className = "mensaje-formulario exito";
      mensaje.textContent = "Catálogo de ejemplo cargado.";
    }).catch(function (e) {
      mensaje.className = "mensaje-formulario error";
      mensaje.textContent = mensajeError(e);
    });
  }

  function agregarImagenesDeTexto(texto) {
    if (!texto) return;
    texto.split(/[\n,]+/).forEach(function (linea) {
      var url = linea.trim();
      if (url) agregarImagen(url);
    });
  }

  function agregarImagen(src) {
    if (!src) return;
    if (imagenesCargadas.length >= 10) return;
    if (imagenesCargadas.indexOf(src) !== -1) return;
    imagenesCargadas.push(src);
    renderGaleriaForm();
  }

  function renderGaleriaForm() {
    var cont = document.getElementById("galeria-form");
    if (!cont) return;
    cont.innerHTML = imagenesCargadas.map(function (src, idx) {
      return '<div class="galeria-item"><img src="' + escapar(src) + '" alt="">' +
        '<button type="button" class="galeria-quitar" data-quitar="' + idx + '" aria-label="Quitar">&times;</button></div>';
    }).join("");
    var botones = cont.querySelectorAll("[data-quitar]");
    for (var i = 0; i < botones.length; i++) {
      botones[i].addEventListener("click", function () {
        imagenesCargadas.splice(Number(this.getAttribute("data-quitar")), 1);
        renderGaleriaForm();
      });
    }
  }

  function construirSesion(u) {
    if (!u) return null;
    var esAdmin = ADMIN_EMAILS.indexOf(u.email) !== -1;
    return {
      email: u.email,
      rol: esAdmin ? "administrador" : "usuario",
      nombre: esAdmin ? "Administrador KCR Motors" : "Dueño KCR Motors"
    };
  }

  function iniciarSesion(evento) {
    evento.preventDefault();
    var mensaje = document.getElementById("mensaje-login");
    if (!auth) {
      mensaje.className = "mensaje-formulario error";
      mensaje.textContent = "Falta configurar Firebase (js/firebase-config.js).";
      return;
    }
    var usuario = document.getElementById("login-usuario").value.trim().toLowerCase();
    var clave = document.getElementById("login-clave").value;
    var email = usuario.indexOf("@") !== -1 ? usuario : usuario + DOMINIO_LOGIN;

    mensaje.className = "mensaje-formulario";
    mensaje.textContent = "Ingresando...";
    var boton = document.querySelector("#formulario-login button[type='submit']");
    boton.disabled = true;

    auth.signInWithEmailAndPassword(email, clave).then(function (cred) {
      sesion = construirSesion(cred.user);
      actualizarSesionUI();
      cerrarModal("modal-login");
      document.getElementById("formulario-login").reset();
      mensaje.textContent = "";
      abrirPanel();
    }).catch(function (e) {
      mensaje.className = "mensaje-formulario error";
      mensaje.textContent = mensajeError(e);
    }).finally(function () {
      boton.disabled = false;
    });
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
    if (auth) auth.signOut();
    sesion = null;
    actualizarSesionUI();
    cerrarPanel();
  }

  function abrirPanel() {
    if (!sesion) return;
    renderPanel();
    cargarConfigEnFormulario();
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

  function mensajeError(e) {
    var codigo = (e && e.code) || "";
    if (codigo.indexOf("auth/") === 0) {
      if (codigo === "auth/too-many-requests") return "Demasiados intentos. Espera un momento e intenta de nuevo.";
      return "Usuario o contraseña incorrectos.";
    }
    if (codigo === "permission-denied") return "No tienes permisos para esta acción.";
    if (codigo.indexOf("storage/") === 0) return "No se pudo subir la imagen (revisa los permisos de Storage).";
    if (codigo === "unavailable") return "Sin conexión con la base de datos. Revisa tu internet.";
    return "Ocurrió un error. Intenta de nuevo.";
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

    fetch("https://formsubmit.co/ajax/r.nexus.19@gmail.com", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        nombre: nombre,
        email: email,
        mensaje: texto,
        _subject: "Contacto web KCR Motors - " + nombre,
        _cc: "kcrmotors7@gmail.com"
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
        window.location.href = "mailto:r.nexus.19@gmail.com,kcrmotors7@gmail.com?subject=" + asunto + "&body=" + cuerpo;
        mensaje.className = "mensaje-formulario exito";
        mensaje.textContent = "¡Gracias " + nombre + "! Abrimos tu correo para enviar el mensaje.";
      })
      .finally(function () {
        boton.disabled = false;
      });
  }

  function inicializar() {
    document.getElementById("anio").textContent = new Date().getFullYear();

    // Eventos de interfaz
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

    var btnCatalogo = document.getElementById("btn-catalogo-ejemplo");
    if (btnCatalogo) btnCatalogo.addEventListener("click", cargarCatalogoEjemplo);

    document.getElementById("btn-agregar-imagenes").addEventListener("click", function () {
      var campo = document.getElementById("v-imagen-url");
      agregarImagenesDeTexto(campo.value);
      campo.value = "";
    });

    document.getElementById("v-imagen-url").addEventListener("keydown", function (evento) {
      if (evento.key === "Enter" && (evento.ctrlKey || evento.metaKey)) {
        evento.preventDefault();
        agregarImagenesDeTexto(this.value);
        this.value = "";
      }
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

    // Firebase
    if (!CONFIGURADO) {
      vehiculos = VEHICULOS_INICIALES.map(function (v, i) {
        return Object.assign({ id: "demo" + i, imagenes: [IMAGEN_PLACEHOLDER], imagen: IMAGEN_PLACEHOLDER }, v);
      });
      config = Object.assign({}, CONFIG_INICIAL);
      aplicarConfig();
      renderFiltroMarcas();
      renderVehiculos();
      actualizarSesionUI();
      return;
    }

    firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();
    auth = firebase.auth();

    auth.onAuthStateChanged(function (u) {
      sesion = construirSesion(u);
      actualizarSesionUI();
      if (sesion) renderPanel();
    });

    Promise.all([cargarVehiculos(), cargarConfig()]).then(function () {
      aplicarConfig();
      renderFiltroMarcas();
      renderVehiculos();
      actualizarSesionUI();
      if (sesion) renderPanel();
    }).catch(function (e) {
      console.error(e);
      aplicarConfig();
      renderFiltroMarcas();
      renderVehiculos();
      actualizarSesionUI();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializar);
  } else {
    inicializar();
  }
})();
