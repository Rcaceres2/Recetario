class VistaExplorar {
    constructor(contenedor, props = {}) {
        this.contenedor = contenedor;
        this.estado = props.estado || {
            criterios: { nombre: '', categoria: '', origen: '', ingrediente: '' },
            pagina: 1,
            busqueda: null,
        };
        this.elemento = null;
        this.destruido = false;
        this.peticionActual = 0;
        this.tarjetas = [];
        this.paginador = null;
        this.formulario = null;
        this.renderizar();
    }

    crearElemento() {
        const vista = document.createElement('div');
        vista.className = 'vista vista-explorar';

        const titulo = document.createElement('h2');
        titulo.textContent = 'Explorar recetas';
        vista.appendChild(titulo);

        this.contenedorFormulario = document.createElement('div');
        this.contenedorFormulario.className = 'explorar__formulario';
        vista.appendChild(this.contenedorFormulario);

        this.contenedorResultados = document.createElement('section');
        this.contenedorResultados.className = 'explorar__resultados';
        vista.appendChild(this.contenedorResultados);

        this.contenedorPaginador = document.createElement('div');
        this.contenedorPaginador.className = 'explorar__paginador';
        vista.appendChild(this.contenedorPaginador);

        return vista;
    }

    renderizar() {
        this.contenedor.textContent = '';
        this.elemento = this.crearElemento();
        this.contenedor.appendChild(this.elemento);
        this.iniciar();
    }

    async iniciar() {
        await this.cargarListas();

        if (this.destruido) return;

        this.crearFormulario();

        if (this.estado.busqueda) {
            this.pintarResultados(this.estado.busqueda);
        } else {
            this.pintarSinCriterios();
        }
    }

    async cargarListas() {
        const [categorias, origenes, ingredientes] = await Promise.allSettled([
            this.obtenerCategorias(),
            this.obtenerOrigenes(),
            this.obtenerIngredientes(),
        ]);

        if (this.destruido) return;

        this.categorias = categorias.status === 'fulfilled' ? categorias.value : [];
        this.origenes = origenes.status === 'fulfilled' ? origenes.value : [];
        this.ingredientes = ingredientes.status === 'fulfilled' ? ingredientes.value : [];
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

    async obtenerIngredientes() {
        if (cache.getIngredientes()) return cache.getIngredientes();
        const data = await api.ingredientes();
        const lista = (data?.meals || []).map((m) => normalizarIngrediente(m)).filter(Boolean);
        cache.setIngredientes(lista);
        return lista;
    }

    crearFormulario() {
        this.formulario = new FormularioBusqueda(this.contenedorFormulario, {
            categorias: this.categorias,
            origenes: this.origenes,
            ingredientes: this.ingredientes,
            valores: this.estado.criterios,
            alBuscar: (criterios) => this.buscar(criterios),
            alLimpiar: () => this.limpiar(),
        });
    }

    async buscar(criterios) {
        const token = ++this.peticionActual;

        this.estado.criterios = criterios;
        this.estado.pagina = 1;
        this.pintarCargando();

        const peticiones = [];
        if (criterios.nombre) {
            peticiones.push({ tipo: 'nombre', promesa: api.buscarPorNombre(criterios.nombre) });
        }
        if (criterios.categoria) {
            peticiones.push({ tipo: 'categoria', promesa: api.filtrarPorCategoria(criterios.categoria) });
        }
        if (criterios.origen) {
            peticiones.push({ tipo: 'origen', promesa: api.filtrarPorOrigen(criterios.origen) });
        }
        if (criterios.ingrediente) {
            peticiones.push({ tipo: 'ingrediente', promesa: api.filtrarPorIngrediente(criterios.ingrediente) });
        }

        let respuestas;
        try {
            respuestas = await Promise.all(peticiones.map((p) => p.promesa));
        } catch (error) {
            if (this.destruido || token !== this.peticionActual) return;
            this.estado.busqueda = null;
            this.pintarErrorBusqueda(error);
            return;
        }

        const porId = new Map();
        const recetasCompletas = new Map();
        let idsComunes = null;

        if (this.destruido || token !== this.peticionActual) return;

        respuestas.forEach((respuesta, indice) => {
            const meals = respuesta?.meals || [];
            const ids = new Set();

            meals.forEach((meal) => {
                const id = meal.idMeal;
                ids.add(id);
                if (!porId.has(id)) {
                    porId.set(id, normalizarResumen(meal));
                }
        
                if (peticiones[indice].tipo === 'nombre') {
                    const receta = normalizarReceta(meal);
                    recetasCompletas.set(id, receta);
                    cache.guardarReceta(receta);
                }
            });

            idsComunes = idsComunes === null
                ? ids
                : new Set([...idsComunes].filter((id) => ids.has(id)));
        });

        const busqueda = {
            ids: [...idsComunes],
            porId: Object.fromEntries(porId),
            recetasCompletas: Object.fromEntries(recetasCompletas),
        };

        this.estado.busqueda = busqueda;
        this.pintarResultados(busqueda);
    }

    limpiar() {
        this.estado.criterios = { nombre: '', categoria: '', origen: '', ingrediente: '' };
        this.estado.pagina = 1;
        this.estado.busqueda = null;
        if (this.formulario) this.formulario.setValores(this.estado.criterios);
        this.pintarSinCriterios();
    }

    pintarSinCriterios() {
        this.contenedorResultados.textContent = '';
        this.contenedorPaginador.textContent = '';

        this.estadoCarga?.destruir();
        this.estadoCarga = new EstadoCarga(this.contenedorResultados, {
            tipo: 'lista',
            estado: 'vacio',
            mensaje: 'Aplica al menos un criterio para buscar recetas.',
        });
    }

    pintarCargando() {
        this.contenedorResultados.textContent = '';
        this.contenedorPaginador.textContent = '';
        this.estadoCarga?.destruir();
        this.estadoCarga = new EstadoCarga(this.contenedorResultados, {
            tipo: 'tarjetas',
            mensaje: 'Buscando recetas...',
            cantidadEsqueletos: RESULTADOS_POR_PAGINA,
        });
    }

    pintarErrorBusqueda(error) {
        this.contenedorResultados.textContent = '';
        this.estadoCarga?.destruir();
        this.estadoCarga = new EstadoCarga(this.contenedorResultados, {
            tipo: 'lista',
            estado: 'error',
            mensaje: this.mensajeError(error),
            alReintentar: () => this.buscar(this.estado.criterios),
        });
    }

    async pintarResultados(busqueda) {
        const token = ++this.peticionActual;

        const ids = busqueda.ids || [];
        const total = ids.length;

        if (!total) {
            this.contenedorResultados.textContent = '';
            this.contenedorPaginador.textContent = '';
            this.estadoCarga = new EstadoCarga(this.contenedorResultados, {
                tipo: 'lista',
                estado: 'vacio',
                mensaje: 'No se encontraron recetas con esos criterios.',
            });
            return;
        }

        const ordenados = [...ids].sort((a, b) => {
            const nombreA = busqueda.porId[a]?.nombre || '';
            const nombreB = busqueda.porId[b]?.nombre || '';
            return nombreA.localeCompare(nombreB, 'es');
        });

        const totalPaginas = Math.ceil(ordenados.length / RESULTADOS_POR_PAGINA);
        if (this.estado.pagina > totalPaginas) this.estado.pagina = totalPaginas;
        if (this.estado.pagina < 1) this.estado.pagina = 1;

        const inicio = (this.estado.pagina - 1) * RESULTADOS_POR_PAGINA;
        const idsPagina = ordenados.slice(inicio, inicio + RESULTADOS_POR_PAGINA);

        const completas = new Map();
        idsPagina.forEach((id) => {
            const receta = busqueda.recetasCompletas?.[id] || cache.obtenerReceta(id);
            if (receta) completas.set(id, receta);
        });

        const pendientes = idsPagina.filter((id) => !completas.has(id));
        if (pendientes.length) {
            this.contenedorResultados.textContent = '';
            this.contenedorPaginador.textContent = '';
            this.estadoCarga = new EstadoCarga(this.contenedorResultados, {
                tipo: 'tarjetas',
                mensaje: 'Cargando detalle de las recetas...',
                cantidadEsqueletos: 3,
            });

            const resueltas = await cargarRecetasCompletas(pendientes);
            if (this.destruido || token !== this.peticionActual) return;
            resueltas.forEach((receta, id) => completas.set(id, receta));
            this.estadoCarga?.destruir();
            this.estadoCarga = null;
        }

        this.contenedorResultados.textContent = '';
        this.contenedorPaginador.textContent = '';

        const resumen = document.createElement('p');
        resumen.className = 'explorar__conteo';
        resumen.textContent = `${total} resultado(s) · página ${this.estado.pagina} de ${totalPaginas}`;
        this.contenedorResultados.appendChild(resumen);

        const cuadricula = document.createElement('div');
        cuadricula.className = 'cuadricula cuadricula--recetas';
        this.contenedorResultados.appendChild(cuadricula);

        this.tarjetas.forEach((tarjeta) => tarjeta.destruir());
        this.tarjetas = [];

        idsPagina.forEach((id) => {
            const receta = completas.get(id);
            const contenedor = document.createElement('div');
            contenedor.className = 'tarjeta-receta__contenedor';
            cuadricula.appendChild(contenedor);

            const tarjeta = new TarjetaReceta(contenedor, {
                receta: receta || busqueda.porId[id],
                incompleta: !receta,
                alReintentar: () => this.reintentarReceta(id),
            });
            this.tarjetas.push(tarjeta);
        });

        this.paginador = new Paginador(this.contenedorPaginador, {
            paginaActual: this.estado.pagina,
            totalPaginas: totalPaginas,
            totalResultados: total,
            alCambiarPagina: (pagina) => {
                this.estado.pagina = pagina;
                this.pintarResultados(this.estado.busqueda);
            },
        });
    }

    async reintentarReceta(id) {
        const token = ++this.peticionActual;

        try {
            const data = await api.porId(id);
            const receta = normalizarReceta(data?.meals?.[0]);
            if (!receta) throw new Error('Receta vacía');
            if (this.destruido || token !== this.peticionActual) return;

            cache.guardarReceta(receta);
            if (this.estado.busqueda) {
                this.estado.busqueda.recetasCompletas[id] = receta;
            }
            this.pintarResultados(this.estado.busqueda);
        } catch (error) {
            if (this.destruido || token !== this.peticionActual) return;
            this.pintarErrorBusqueda(error);
        }
    }

    mensajeError(error) {
        return mensajeErrorApi(error, 'No se pudo completar la búsqueda. Intenta de nuevo.');
    }

    destruir() {
        this.destruido = true;
        this.peticionActual++;
        if (this.estadoCarga) this.estadoCarga.destruir();
        if (this.formulario) this.formulario.destruir();
        if (this.paginador) this.paginador.destruir();
        this.tarjetas.forEach((tarjeta) => tarjeta.destruir());
        this.tarjetas = [];
        if (this.elemento) {
            this.elemento.remove();
            this.elemento = null;
        }
    }
}
