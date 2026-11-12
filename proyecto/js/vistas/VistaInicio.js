class VistaInicio {
    constructor(contenedor, props = {}) {
        this.contenedor = contenedor;
        this.estado = props.estado || { ultimaRecetaId: null };
        this.elemento = null;
        this.destruido = false;
        this.peticionActual = 0;
        this.recetaActual = null;
        this.btnDetalle = null;
        this.btnComparar = null;
        this.btnOtra = null;
        this.onDetalle = null;
        this.onComparar = null;
        this.onOtra = null;
        this.estadoCargaReceta?.destruir();
        this.estadoCargaCategorias?.destruir();
        this.renderizar();
    }

    crearElemento() {
        const vista = document.createElement('div');
        vista.className = 'vista vista-inicio';

        this.seccionReceta = document.createElement('section');
        this.seccionReceta.className = 'seccion seccion--destacada';
        vista.appendChild(this.seccionReceta);

        this.seccionCategorias = document.createElement('section');
        this.seccionCategorias.className = 'seccion seccion--categorias';
        vista.appendChild(this.seccionCategorias);

        return vista;
    }

    renderizar() {
        this.contenedor.textContent = '';
        this.elemento = this.crearElemento();
        this.contenedor.appendChild(this.elemento);
        this.cargar();
    }

    configurarEventos() {
        if (this.btnDetalle) {
            this.onDetalle = () => {
                this.notificar('abrirDetalle', { id: this.recetaActual?.id, origen: 'inicio' });
            };
            this.btnDetalle.addEventListener('click', this.onDetalle);
        }

        if (this.btnComparar) {
            this.onComparar = () => {
                this.notificar('agregarComparador', { id: this.recetaActual?.id });
            };
            this.btnComparar.addEventListener('click', this.onComparar);
        }

        if (this.btnOtra) {
            this.onOtra = () => this.cargarReceta();
            this.btnOtra.addEventListener('click', this.onOtra);
        }
    }

    async cargar() {
        const token = ++this.peticionActual;

        this.pintarRecetaCargando();
        this.pintarCategoriasCargando();

        const resultados = await Promise.allSettled([
            this.obtenerRecetaAleatoria(),
            this.obtenerCategorias(),
        ]);

        if (this.destruido || token !== this.peticionActual) return;

        const [receta, categorias] = resultados;

        if (receta.status === 'fulfilled') {
            this.pintarReceta(receta.value);
        } else {
            this.pintarErrorReceta(receta.reason);
        }

        if (categorias.status === 'fulfilled') {
            this.pintarCategorias(categorias.value);
        } else {
            this.pintarErrorCategorias(categorias.reason);
        }
    }

    async obtenerRecetaAleatoria(intentos = 0) {
        const data = await api.aleatorio();
        const meal = data?.meals?.[0];
        if (!meal) throw new Error('La API no devolvió ninguna receta');

        const receta = normalizarReceta(meal);
        if (receta.id === this.estado.ultimaRecetaId && intentos < 4) {
            return this.obtenerRecetaAleatoria(intentos + 1);
        }

        this.estado.ultimaRecetaId = receta.id;
        cache.guardarReceta(receta);
        return receta;
    }

    async obtenerCategorias() {
        if (cache.getCategorias()) return cache.getCategorias();

        const data = await api.categorias();
        const categorias = (data?.categories || [])
            .map((c) => normalizarCategoria(c))
            .filter(Boolean);

        cache.setCategorias(categorias);
        return categorias;
    }

    pintarRecetaCargando() {
        this.seccionReceta.textContent = '';
        this.estadoCargaReceta?.destruir();
        this.estadoCargaReceta = new EstadoCarga(this.seccionReceta, {
            tipo: 'detalle',
            mensaje: 'Buscando una delicia...',
        });
    }

    pintarReceta(receta) {
        this.recetaActual = receta;
        this.seccionReceta.textContent = '';

        const titulo = document.createElement('h2');
        titulo.textContent = 'Receta destacada del día';
        this.seccionReceta.appendChild(titulo);

        const contenido = document.createElement('div');
        contenido.className = 'receta-card-info';

        const imagen = document.createElement('img');
        imagen.className = 'img-receta-azar';
        imagen.src = receta.imagen;
        imagen.alt = receta.nombre;
        imagen.loading = 'lazy';
        contenido.appendChild(imagen);

        const info = document.createElement('div');
        info.className = 'info-texto';

        const nombre = document.createElement('h3');
        nombre.className = 'receta-card-info__nombre';
        nombre.textContent = receta.nombre;
        info.appendChild(nombre);

        const meta = document.createElement('p');
        meta.className = 'receta-card-info__meta';
        meta.textContent = `Categoría: ${receta.categoria || 'Sin categoría'} | Origen: ${receta.origen || 'Desconocido'}`;
        info.appendChild(meta);

        const acciones = document.createElement('div');
        acciones.className = 'info-texto__acciones';

        this.btnDetalle = document.createElement('button');
        this.btnDetalle.type = 'button';
        this.btnDetalle.className = 'btn-principal';
        this.btnDetalle.textContent = 'Ver detalle';
        acciones.appendChild(this.btnDetalle);

        this.btnComparar = document.createElement('button');
        this.btnComparar.type = 'button';
        this.btnComparar.className = 'btn-secundario';
        this.btnComparar.textContent = 'Comparar';
        acciones.appendChild(this.btnComparar);

        this.btnOtra = document.createElement('button');
        this.btnOtra.type = 'button';
        this.btnOtra.className = 'btn-secundario';
        this.btnOtra.textContent = 'Otra receta';
        acciones.appendChild(this.btnOtra);

        info.appendChild(acciones);
        contenido.appendChild(info);

        this.seccionReceta.appendChild(contenido);
        this.configurarEventos();
    }

    async cargarReceta() {
        const token = ++this.peticionActual;

        this.pintarRecetaCargando();
        try {
            const receta = await this.obtenerRecetaAleatoria();
            if (this.destruido || token !== this.peticionActual) return;
            this.pintarReceta(receta);
        } catch (error) {
            if (this.destruido || token !== this.peticionActual) return;
            this.pintarErrorReceta(error);
        }
    }

    pintarErrorReceta(error) {
        this.seccionReceta.textContent = '';
        const titulo = document.createElement('h2');
        titulo.textContent = 'Receta destacada del día';
        this.seccionReceta.appendChild(titulo);

        new EstadoCarga(this.seccionReceta, {
            tipo: 'detalle',
            estado: 'error',
            mensaje: this.mensajeError(error),
            alReintentar: () => this.cargarReceta(),
        });
    }

    pintarCategoriasCargando() {
        this.seccionCategorias.textContent = '';
        this.estadoCargaCategorias?.destruir();
        const titulo = document.createElement('h2');
        titulo.textContent = 'Categorías';
        this.seccionCategorias.appendChild(titulo);

        new EstadoCarga(this.seccionCategorias, {
            tipo: 'tarjetas',
            mensaje: 'Cargando categorías...',
            cantidadEsqueletos: 6,
        });
    }

    pintarCategorias(categorias) {
        this.seccionCategorias.textContent = '';

        const titulo = document.createElement('h2');
        titulo.textContent = 'Categorías';
        this.seccionCategorias.appendChild(titulo);

        const cuadricula = document.createElement('div');
        cuadricula.className = 'cuadricula cuadricula--categorias';

        categorias.forEach((categoria) => {
            const tarjeta = document.createElement('button');
            tarjeta.type = 'button';
            tarjeta.className = 'tarjeta-categoria';

            const imagen = document.createElement('img');
            imagen.className = 'tarjeta-categoria__imagen';
            imagen.src = categoria.imagen;
            imagen.alt = categoria.nombre;
            imagen.loading = 'lazy';
            tarjeta.appendChild(imagen);

            const nombre = document.createElement('h3');
            nombre.className = 'tarjeta-categoria__nombre';
            nombre.textContent = categoria.nombre;
            tarjeta.appendChild(nombre);

            const descripcion = document.createElement('p');
            descripcion.className = 'tarjeta-categoria__descripcion';
            descripcion.textContent = this.resumir(categoria.descripcion, 120);
            tarjeta.appendChild(descripcion);

            tarjeta.addEventListener('click', () => {
                this.notificar('abrirCategoria', { categoria });
            });

            cuadricula.appendChild(tarjeta);
        });

        this.seccionCategorias.appendChild(cuadricula);
    }

    pintarErrorCategorias(error) {
        this.seccionCategorias.textContent = '';
        const titulo = document.createElement('h2');
        titulo.textContent = 'Categorías';
        this.seccionCategorias.appendChild(titulo);

        new EstadoCarga(this.seccionCategorias, {
            tipo: 'tarjetas',
            estado: 'error',
            mensaje: this.mensajeError(error),
            alReintentar: () => this.cargar(),
        });
    }

    resumir(texto, limite) {
        const limpio = (texto || '').trim();
        if (limpio.length <= limite) return limpio;
        return limpio.slice(0, limite).trimEnd() + '...';
    }

    mensajeError(error) {
        return mensajeErrorApi(error, 'No se pudo cargar la información. Intenta de nuevo.');
    }

    notificar(nombre, detalle) {
        this.contenedor.dispatchEvent(
            new CustomEvent(nombre, { bubbles: true, detail: detalle })
        );
    }

    destruir() {
        this.destruido = true;
        this.peticionActual++;
        if (this.btnDetalle && this.onDetalle) {
            this.btnDetalle.removeEventListener('click', this.onDetalle);
        }
        if (this.btnComparar && this.onComparar) {
            this.btnComparar.removeEventListener('click', this.onComparar);
        }
        if (this.btnOtra && this.onOtra) {
            this.btnOtra.removeEventListener('click', this.onOtra);
        }
        this.onDetalle = null;
        this.onComparar = null;
        this.onOtra = null;

        if (this.elemento) {
            this.elemento.remove();
            this.elemento = null;
        }
    }
}
