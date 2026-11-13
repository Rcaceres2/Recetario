class VistaDetalle {
    constructor(contenedor, props = {}) {
        this.contenedor = contenedor;
        this.id = props.id;
        this.origen = props.origen || 'inicio';
        this.receta = null;
        this.elemento = null;
        this.destruido = false;
        this.peticionActual = 0;
        this.tarjetas = [];
        this.btnVolver = null;
        this.btnComparar = null;
        this.onVolver = null;
        this.onComparar = null;
        this.renderizar();
    }

    crearElemento() {
        const vista = document.createElement('div');
        vista.className = 'vista vista-detalle';

        const cabecera = document.createElement('div');
        cabecera.className = 'detalle__cabecera';

        const btnVolver = document.createElement('button');
        btnVolver.type = 'button';
        btnVolver.className = 'btn-secundario';
        btnVolver.textContent = '← Volver';
        cabecera.appendChild(btnVolver);
        this.btnVolver = btnVolver;

        vista.appendChild(cabecera);

        this.contenedorDetalle = document.createElement('section');
        this.contenedorDetalle.className = 'detalle';
        vista.appendChild(this.contenedorDetalle);

        this.contenedorRelacionadas = document.createElement('section');
        this.contenedorRelacionadas.className = 'detalle__relacionadas';
        vista.appendChild(this.contenedorRelacionadas);

        return vista;
    }

    renderizar() {
        this.contenedor.textContent = '';
        this.elemento = this.crearElemento();
        this.contenedor.appendChild(this.elemento);
        this.cargar();
    }

    configurarEventos() {
        if (this.btnVolver) {
            this.onVolver = () => this.notificar('volver', { origen: this.origen });
            this.btnVolver.addEventListener('click', this.onVolver);
        }

        if (this.btnComparar) {
            this.onComparar = () => {
                this.notificar('agregarComparador', { id: this.receta?.id });
            };
            this.btnComparar.addEventListener('click', this.onComparar);
        }
    }

    async cargar() {
        const token = ++this.peticionActual;

        this.pintarCargando();

        try {
            this.receta = await this.obtenerReceta();
            if (this.destruido || token !== this.peticionActual) return;
            this.pintarDetalle();
            this.cargarRelacionadas();
        } catch (error) {
            if (this.destruido || token !== this.peticionActual) return;
            this.pintarError(error);
        }
    }

    async obtenerReceta() {
        const guardada = cache.obtenerReceta(this.id);
        if (guardada) return guardada;

        const data = await api.porId(this.id);
        const receta = normalizarReceta(data?.meals?.[0]);
        if (!receta) throw new Error('La receta no existe');
        cache.guardarReceta(receta);
        return receta;
    }

    pintarCargando() {
        this.contenedorDetalle.textContent = '';
        new EstadoCarga(this.contenedorDetalle, {
            tipo: 'detalle',
            mensaje: 'Cargando receta...',
        });
    }

    pintarError(error) {
        this.contenedorDetalle.textContent = '';
        new EstadoCarga(this.contenedorDetalle, {
            tipo: 'detalle',
            estado: 'error',
            mensaje: this.mensajeError(error),
            alReintentar: () => this.cargar(),
        });
    }

    pintarDetalle() {
        const receta = this.receta;
        this.contenedorDetalle.textContent = '';

        const imagen = document.createElement('img');
        imagen.className = 'detalle__imagen';
        imagen.src = receta.imagen;
        imagen.alt = receta.nombre;
        this.contenedorDetalle.appendChild(imagen);

        const cuerpo = document.createElement('div');
        cuerpo.className = 'detalle__cuerpo';

        const nombre = document.createElement('h2');
        nombre.className = 'detalle__nombre';
        nombre.textContent = receta.nombre;
        cuerpo.appendChild(nombre);

        const meta = document.createElement('p');
        meta.className = 'detalle__meta';
        meta.textContent = `Categoría: ${receta.categoria || 'Sin categoría'} | Origen: ${receta.origen || 'Desconocido'}`;
        cuerpo.appendChild(meta);

        if (receta.etiquetas.length) {
            const lista = document.createElement('ul');
            lista.className = 'detalle__etiquetas';
            receta.etiquetas.forEach((etiqueta) => {
                const item = document.createElement('li');
                item.className = 'etiqueta';
                item.textContent = etiqueta;
                lista.appendChild(item);
            });
            cuerpo.appendChild(lista);
        }

        if (receta.video) {
            const enlace = document.createElement('a');
            enlace.className = 'btn-principal detalle__video';
            enlace.href = receta.video;
            enlace.target = '_blank';
            enlace.rel = 'noopener noreferrer';
            enlace.textContent = 'Ver video de la preparación';
            cuerpo.appendChild(enlace);
        }

        const btnComparar = document.createElement('button');
        btnComparar.type = 'button';
        btnComparar.className = 'btn-secundario';
        btnComparar.textContent = 'Agregar al comparador';
        cuerpo.appendChild(btnComparar);
        this.btnComparar = btnComparar;

        const tituloIngredientes = document.createElement('h3');
        tituloIngredientes.textContent = 'Ingredientes';
        cuerpo.appendChild(tituloIngredientes);

        const contenedorIngredientes = document.createElement('div');
        cuerpo.appendChild(contenedorIngredientes);
        this.listaIngredientes = new ListaIngredientes(contenedorIngredientes, {
            ingredientes: receta.ingredientes,
        });

        const tituloPasos = document.createElement('h3');
        tituloPasos.textContent = 'Preparación';
        cuerpo.appendChild(tituloPasos);

        const contenedorPasos = document.createElement('div');
        cuerpo.appendChild(contenedorPasos);
        this.pasosPreparacion = new PasosPreparacion(contenedorPasos, {
            pasos: receta.pasos,
        });

        this.contenedorDetalle.appendChild(cuerpo);
        this.configurarEventos();
    }
