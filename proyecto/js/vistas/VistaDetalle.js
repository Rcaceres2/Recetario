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
    async cargarRelacionadas() {
        const token = ++this.peticionActual;

        this.contenedorRelacionadas.textContent = '';
        const titulo = document.createElement('h2');
        titulo.textContent = 'Recetas relacionadas';
        this.contenedorRelacionadas.appendChild(titulo);

        const [porCategoria, porOrigen] = await Promise.allSettled([
            this.receta.categoria ? api.filtrarPorCategoria(this.receta.categoria) : Promise.resolve(null),
            this.receta.origen ? api.filtrarPorOrigen(this.receta.origen) : Promise.resolve(null),
        ]);
        if (this.destruido || token !== this.peticionActual) return;

        const seccionCategoria = document.createElement('div');
        seccionCategoria.className = 'relacionadas__grupo';
        this.contenedorRelacionadas.appendChild(seccionCategoria);

        const seccionOrigen = document.createElement('div');
        seccionOrigen.className = 'relacionadas__grupo';
        this.contenedorRelacionadas.appendChild(seccionOrigen);

        if (porCategoria.status === 'fulfilled' && porCategoria.value) {
            const ids = this.seleccionar(porCategoria.value?.meals || []);
            await this.pintarGrupo(seccionCategoria, `De la categoría ${this.receta.categoria}`, ids, token);
        } else {
            this.pintarErrorGrupo(seccionCategoria, 'No se pudieron cargar las recetas de la categoría.');
        }

        if (porOrigen.status === 'fulfilled' && porOrigen.value) {
            const ids = this.seleccionar(porOrigen.value?.meals || []);
            await this.pintarGrupo(seccionOrigen, `Del origen ${this.receta.origen}`, ids, token);
        } else {
            this.pintarErrorGrupo(seccionOrigen, 'No se pudieron cargar las recetas del origen.');
        }
    }

    seleccionar(meals) {
        return meals
            .filter((meal) => meal.idMeal !== this.id)
            .slice(0, 6)
            .map((meal) => normalizarResumen(meal));
    }

    async pintarGrupo(contenedor, titulo, resumenes, token) {
        contenedor.textContent = '';

        const encabezado = document.createElement('h3');
        encabezado.className = 'relacionadas__titulo';
        encabezado.textContent = titulo;
        contenedor.appendChild(encabezado);

        if (!resumenes.length) {
            const vacio = document.createElement('p');
            vacio.className = 'relacionadas__vacio';
            vacio.textContent = 'No hay recetas relacionadas.';
            contenedor.appendChild(vacio);
            return;
        }

        const cuadricula = document.createElement('div');
        cuadricula.className = 'cuadricula cuadricula--recetas';
        contenedor.appendChild(cuadricula);

        const completas = await cargarRecetasCompletas(resumenes.map((r) => r.id));
        if (this.destruido || token !== this.peticionActual) return;

        resumenes.forEach((resumen) => {
            const receta = completas.get(resumen.id);
            const celda = document.createElement('div');
            cuadricula.appendChild(celda);

            const tarjeta = new TarjetaReceta(celda, {
                receta: receta || resumen,
                incompleta: !receta,
                alReintentar: () => this.cargarRelacionadas(),
            });
            this.tarjetas.push(tarjeta);
        });
    }

    pintarErrorGrupo(contenedor, mensaje) {
        contenedor.textContent = '';
        new EstadoCarga(contenedor, {
            tipo: 'tarjetas',
            estado: 'error',
            mensaje: mensaje,
            alReintentar: () => this.cargarRelacionadas(),
        });
    }

    mensajeError(error) {
        return mensajeErrorApi(error, 'No se pudo cargar la receta. Intenta de nuevo.');
    }

    notificar(nombre, detalle) {
        this.contenedor.dispatchEvent(
            new CustomEvent(nombre, { bubbles: true, detail: detalle })
        );
    }

    destruir() {
        this.destruido = true;
        this.peticionActual++;
        if (this.btnVolver && this.onVolver) {
            this.btnVolver.removeEventListener('click', this.onVolver);
        }
        if (this.btnComparar && this.onComparar) {
            this.btnComparar.removeEventListener('click', this.onComparar);
        }
        this.onVolver = null;
        this.onComparar = null;
        if (this.listaIngredientes) this.listaIngredientes.destruir();
        if (this.pasosPreparacion) this.pasosPreparacion.destruir();
        this.tarjetas.forEach((tarjeta) => tarjeta.destruir());
        this.tarjetas = [];
        if (this.elemento) {
            this.elemento.remove();
            this.elemento = null;
        }
    }
}
