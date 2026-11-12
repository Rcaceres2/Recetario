class VistaCategoriasOrigenes {
    constructor(contenedor, props = {}) {
        this.contenedor = contenedor;
        this.estado = props.estado || { pestana: 'categorias', seleccion: null, pagina: 1 };
        this.elemento = null;
        this.destruido = false;
        this.peticionActual = 0;
        this.tarjetas = [];
        this.paginador = null;
        this.estadoCargaRecetas = null;
        this.onClick = null;
        this.renderizar();
    }

    crearElemento() {
        const vista = document.createElement('div');
        vista.className = 'vista vista-categorias';

        const titulo = document.createElement('h2');
        titulo.textContent = 'Categorías y orígenes';
        vista.appendChild(titulo);

        this.pestanas = document.createElement('div');
        this.pestanas.className = 'pestanas';
        this.pestanas.setAttribute('role', 'tablist');
        vista.appendChild(this.pestanas);

        this.contenedorContenido = document.createElement('section');
        this.contenedorContenido.className = 'categorias__contenido';
        vista.appendChild(this.contenedorContenido);

        return vista;
    }

    renderizar() {
        this.contenedor.textContent = '';
        this.elemento = this.crearElemento();
        this.contenedor.appendChild(this.elemento);
        this.configurarEventos();
        this.iniciar();
    }
    configurarEventos() {
        this.onClick = (evento) => {
            const destino = evento.target instanceof Element
                ? evento.target.closest('[data-accion]')
                : null;
            if (!destino) return;

            const accion = destino.dataset.accion;

            if (accion === 'pestana') {
                this.estado.pestana = destino.dataset.pestana;
                this.estado.seleccion = null;
                this.estado.pagina = 1;
                this.crearPestanas();
                this.pintarPestana();
                return;
            }

            if (accion === 'categoria') {
                const categoria = this.categorias.find((c) => c.id === destino.dataset.id);
                if (!categoria) return;
                this.estado.seleccion = { tipo: 'categoria', ...categoria };
                this.estado.pagina = 1;
                this.pintarPestana();
                return;
            }

            if (accion === 'origen') {
                this.estado.seleccion = {
                    tipo: 'origen',
                    id: destino.dataset.id,
                    nombre: destino.dataset.nombre,
                };
                this.estado.pagina = 1;
                this.pintarPestana();
                return;
            }

            if (accion === 'volver') {
                this.estado.seleccion = null;
                this.estado.pagina = 1;
                this.pintarPestana();
            }
        };

        this.contenedor.addEventListener('click', this.onClick);
    }
    async iniciar() {
        this.crearPestanas();
        await this.cargarListas();
        if (this.destruido) return;
        this.pintarPestana();
    }

    crearPestanas() {
        this.pestanas.textContent = '';

        [
            { id: 'categorias', texto: 'Categorías' },
            { id: 'origenes', texto: 'Orígenes' },
        ].forEach((pestana) => {
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = 'pestanas__boton';
            boton.textContent = pestana.texto;
            boton.dataset.accion = 'pestana';
            boton.dataset.pestana = pestana.id;
            boton.setAttribute('role', 'tab');
            boton.setAttribute('aria-selected', String(this.estado.pestana === pestana.id));
            if (this.estado.pestana === pestana.id) boton.classList.add('pestanas__boton--activo');

            this.pestanas.appendChild(boton);
        });
    }

    async cargarListas() {
        const token = ++this.peticionActual;

        const [categorias, origenes] = await Promise.allSettled([
            this.obtenerCategorias(),
            this.obtenerOrigenes(),
        ]);
        if (this.destruido || token !== this.peticionActual) return;

        this.categorias = categorias.status === 'fulfilled' ? categorias.value : [];
        this.origenes = origenes.status === 'fulfilled' ? origenes.value : [];
        this.errorCategorias = categorias.status === 'rejected' ? categorias.reason : null;
        this.errorOrigenes = origenes.status === 'rejected' ? origenes.reason : null;
    }

    async obtenerCategorias() {
        if (cache.getCategorias()) return cache.getCategorias();
        const data = await api.categorias();
        const lista = (data?.categories || []).map((c) => normalizarCategoria(c)).filter(Boolean);
        cache.setCategorias(lista);
        return lista;
    }

    async obtenerOrigenes() {
        if (cache.getOrigenes()) return cache.getOrigenes();
        const data = await api.origenes();
        const lista = (data?.meals || []).map((m) => normalizarOrigen(m)).filter(Boolean);
        cache.setOrigenes(lista);
        return lista;
    }

    pintarPestana() {
        this.contenedorContenido.textContent = '';

        if (this.estado.seleccion) {
            this.pintarDetalle();
            return;
        }

        if (this.estado.pestana === 'categorias') {
            this.pintarListaCategorias();
        } else {
            this.pintarListaOrigenes();
        }
    }

    pintarListaCategorias() {
        if (this.errorCategorias) {
            new EstadoCarga(this.contenedorContenido, {
                tipo: 'tarjetas',
                estado: 'error',
                mensaje: this.mensajeError(this.errorCategorias),
                alReintentar: () => this.iniciar(),
            });
            return;
        }

        if (!this.categorias.length) {
            new EstadoCarga(this.contenedorContenido, {
                tipo: 'lista',
                estado: 'vacio',
                mensaje: 'No hay categorías disponibles.',
            });
            return;
        }

        const cuadricula = document.createElement('div');
        cuadricula.className = 'cuadricula cuadricula--categorias';

        this.categorias.forEach((categoria) => {
            const tarjeta = document.createElement('button');
            tarjeta.type = 'button';
            tarjeta.className = 'tarjeta-categoria';
            tarjeta.dataset.accion = 'categoria';
            tarjeta.dataset.id = categoria.id;

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

            cuadricula.appendChild(tarjeta);
        });

        this.contenedorContenido.appendChild(cuadricula);
    }

    pintarListaOrigenes() {
        if (this.errorOrigenes) {
            new EstadoCarga(this.contenedorContenido, {
                tipo: 'tarjetas',
                estado: 'error',
                mensaje: this.mensajeError(this.errorOrigenes),
                alReintentar: () => this.iniciar(),
            });
            return;
        }

        if (!this.origenes.length) {
            new EstadoCarga(this.contenedorContenido, {
                tipo: 'lista',
                estado: 'vacio',
                mensaje: 'No hay orígenes disponibles.',
            });
            return;
        }

        const lista = document.createElement('ul');
        lista.className = 'lista-origenes';

        this.origenes.forEach((origen) => {
            const item = document.createElement('li');
            item.className = 'lista-origenes__item';

            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = 'lista-origenes__boton';
            boton.textContent = origen.nombre;
            boton.dataset.accion = 'origen';
            boton.dataset.id = origen.id;
            boton.dataset.nombre = origen.nombre;
            item.appendChild(boton);

            lista.appendChild(item);
        });

        this.contenedorContenido.appendChild(lista);
    }
    pintarDetalle() {
        const seleccion = this.estado.seleccion;

        const btnVolver = document.createElement('button');
        btnVolver.type = 'button';
        btnVolver.className = 'btn-secundario';
        btnVolver.textContent = '← Volver a la lista';
        btnVolver.dataset.accion = 'volver';
        this.contenedorContenido.appendChild(btnVolver);

        if (seleccion.tipo === 'categoria') {
            const imagen = document.createElement('img');
            imagen.className = 'detalle-categoria__imagen';
            imagen.src = seleccion.imagen;
            imagen.alt = seleccion.nombre;
            this.contenedorContenido.appendChild(imagen);

            const nombre = document.createElement('h3');
            nombre.textContent = seleccion.nombre;
            this.contenedorContenido.appendChild(nombre);

            const descripcion = document.createElement('p');
            descripcion.className = 'detalle-categoria__descripcion';
            descripcion.textContent = seleccion.descripcion || '';
            this.contenedorContenido.appendChild(descripcion);
        } else {
            const nombre = document.createElement('h3');
            nombre.textContent = seleccion.nombre;
            this.contenedorContenido.appendChild(nombre);
        }

        this.contenedorRecetas = document.createElement('div');
        this.contenedorRecetas.className = 'categorias__recetas';
        this.contenedorContenido.appendChild(this.contenedorRecetas);

        this.cargarRecetas(seleccion);
    }

    async cargarRecetas(seleccion) {
        const token = ++this.peticionActual;

        this.contenedorRecetas.textContent = '';

        this.estadoCargaRecetas?.destruir();
        this.estadoCargaRecetas = new EstadoCarga(this.contenedorRecetas, {
            tipo: 'tarjetas',
            mensaje: 'Cargando recetas...',
            cantidadEsqueletos: 6,
        });

        let meals;
        try {
            const data = seleccion.tipo === 'categoria'
                ? await api.filtrarPorCategoria(seleccion.nombre)
                : await api.filtrarPorOrigen(seleccion.nombre);
            meals = data?.meals || [];
        } catch (error) {
            if (this.destruido || token !== this.peticionActual) return;
            this.contenedorRecetas.textContent = '';
            this.estadoCargaRecetas?.destruir();
            this.estadoCargaRecetas = new EstadoCarga(this.contenedorRecetas, {
                tipo: 'tarjetas',
                estado: 'error',
                mensaje: this.mensajeError(error),
                alReintentar: () => this.cargarRecetas(seleccion),
            });
            return;
        }

        if (this.destruido || token !== this.peticionActual) return;
        this.contenedorRecetas.textContent = '';

        const total = meals.length;
        const conteo = document.createElement('p');
        conteo.className = 'explorar__conteo';
        conteo.textContent = `${total} receta(s)`;
        this.contenedorRecetas.appendChild(conteo);

        if (!total) {
            new EstadoCarga(this.contenedorRecetas, {
                tipo: 'lista',
                estado: 'vacio',
                mensaje: 'No hay recetas en esta selección.',
            });
            return;
        }

        const resumenes = meals.map((meal) => normalizarResumen(meal));
        const totalPaginas = Math.ceil(resumenes.length / RESULTADOS_POR_PAGINA);
        if (this.estado.pagina > totalPaginas) this.estado.pagina = totalPaginas;
        if (this.estado.pagina < 1) this.estado.pagina = 1;

        const inicio = (this.estado.pagina - 1) * RESULTADOS_POR_PAGINA;
        const idsPagina = resumenes.slice(inicio, inicio + RESULTADOS_POR_PAGINA);

        const cuadricula = document.createElement('div');
        cuadricula.className = 'cuadricula cuadricula--recetas';
        this.contenedorRecetas.appendChild(cuadricula);

        // Detalle de la pagina visible en paralelo.
        const completas = await cargarRecetasCompletas(idsPagina.map((r) => r.id));
        if (this.destruido || token !== this.peticionActual) return;

        this.tarjetas.forEach((tarjeta) => tarjeta.destruir());
        this.tarjetas = [];

        idsPagina.forEach((resumen) => {
            const receta = completas.get(resumen.id);
            const celda = document.createElement('div');
            cuadricula.appendChild(celda);

            const tarjeta = new TarjetaReceta(celda, {
                receta: receta || resumen,
                incompleta: !receta,
                alReintentar: () => this.cargarRecetas(seleccion),
            });
            this.tarjetas.push(tarjeta);
        });

        const contenedorPaginador = document.createElement('div');
        this.contenedorRecetas.appendChild(contenedorPaginador);

        this.paginador = new Paginador(contenedorPaginador, {
            paginaActual: this.estado.pagina,
            totalPaginas: totalPaginas,
            totalResultados: total,
            alCambiarPagina: (pagina) => {
                this.estado.pagina = pagina;
                this.cargarRecetas(seleccion);
            },
        });
    }

    mensajeError(error) {
        return mensajeErrorApi(error, 'No se pudo cargar la información. Intenta de nuevo.');
    }

    destruir() {
        this.destruido = true;
        this.peticionActual++;
        if (this.onClick) {
            this.contenedor.removeEventListener('click', this.onClick);
            this.onClick = null;
        }
        if (this.paginador) this.paginador.destruir();
        this.estadoCargaRecetas?.destruir();
        this.tarjetas.forEach((tarjeta) => tarjeta.destruir());
        this.tarjetas = [];
        if (this.elemento) {
            this.elemento.remove();
            this.elemento = null;
        }
    }
}

