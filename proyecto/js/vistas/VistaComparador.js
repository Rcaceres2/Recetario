class VistaComparador {
    constructor(contenedor, props = {}) {
        this.contenedor = contenedor;
        this.estado = props.estado || { A: null, B: null };
        this.elemento = null;
        this.destruido = false;
        this.peticionActual = 0;
        this.paneles = {};
        this.tabla = null;
        this.btnIntercambiar = null;
        this.onAgregar = null;
        this.onQuitar = null;
        this.onIntercambiar = null;
        this.renderizar();
    }

    crearElemento() {
        const vista = document.createElement('div');
        vista.className = 'vista vista-comparador';

        const titulo = document.createElement('h2');
        titulo.textContent = 'Comparador de recetas';
        vista.appendChild(titulo);

        const cuadricula = document.createElement('div');
        cuadricula.className = 'comparador__paneles';
        vista.appendChild(cuadricula);

        this.contenedorA = document.createElement('div');
        this.contenedorA.className = 'comparador__panel';
        cuadricula.appendChild(this.contenedorA);

        this.contenedorB = document.createElement('div');
        this.contenedorB.className = 'comparador__panel';
        cuadricula.appendChild(this.contenedorB);

        const zonaIntercambiar = document.createElement('div');
        zonaIntercambiar.className = 'comparador__intercambiar';

        const btnIntercambiar = document.createElement('button');
        btnIntercambiar.type = 'button';
        btnIntercambiar.className = 'btn-principal';
        btnIntercambiar.textContent = '⇄ Intercambiar recetas';
        zonaIntercambiar.appendChild(btnIntercambiar);
        this.btnIntercambiar = btnIntercambiar;
        vista.appendChild(zonaIntercambiar);

        this.contenedorComparacion = document.createElement('section');
        this.contenedorComparacion.className = 'comparador__comparacion';
        vista.appendChild(this.contenedorComparacion);

        return vista;
    }

    renderizar() {
        this.contenedor.textContent = '';
        this.elemento = this.crearElemento();
        this.contenedor.appendChild(this.elemento);
        this.configurarEventos();
        this.pintarPaneles();
    }

    configurarEventos() {
        this.onAgregar = (evento) => this.agregar(evento.detail);
        this.onQuitar = (evento) => this.quitar(evento.detail);
        this.contenedor.addEventListener('agregarAlComparador', this.onAgregar);
        this.contenedor.addEventListener('quitarDelComparador', this.onQuitar);

        this.onIntercambiar = () => this.intercambiar();
        if (this.btnIntercambiar) {
            this.btnIntercambiar.addEventListener('click', this.onIntercambiar);
        }
    }

    idsOcupados() {
        return [this.estado.A, this.estado.B]
            .filter(Boolean)
            .map((receta) => receta.id);
    }

    pintarPaneles() {
        this.paneles.A?.destruir();
        this.paneles.B?.destruir();

        this.paneles.A = new PanelComparador(this.contenedorA, {
            panel: 'A',
            receta: this.estado.A,
            idsOcupados: this.idsOcupados(),
        });

        this.paneles.B = new PanelComparador(this.contenedorB, {
            panel: 'B',
            receta: this.estado.B,
            idsOcupados: this.idsOcupados(),
        });

        this.pintarComparacion();
    }

    pintarComparacion() {
        this.contenedorComparacion.textContent = '';
        this.tabla?.destruir();
        this.tabla = null;

        if (!this.estado.A || !this.estado.B) {
            new EstadoCarga(this.contenedorComparacion, {
                tipo: 'linea',
                estado: 'vacio',
                mensaje: 'Carga una receta en cada panel para ver la comparación.',
            });
            return;
        }

        const titulo = document.createElement('h3');
        titulo.textContent = 'Comparación';
        this.contenedorComparacion.appendChild(titulo);

        this.tabla = new TablaComparacion(this.contenedorComparacion, {
            recetaA: this.estado.A,
            recetaB: this.estado.B,
        });
    }

    async agregar(detalle) {
        if (!detalle?.id) return;

        const token = ++this.peticionActual;

        if (this.estado.A?.id === detalle.id || this.estado.B?.id === detalle.id) {
            this.mostrarMensaje('Esa receta ya está cargada en el comparador.');
            return;
        }

        try {
            const receta = await this.obtenerReceta(detalle.id);
            if (this.destruido || token !== this.peticionActual) return;
            this.estado[detalle.panel] = receta;
            this.pintarPaneles();
            this.notificar('comparadorCambiado', { panel: detalle.panel });
        } catch (error) {
            if (this.destruido || token !== this.peticionActual) return;
            this.mostrarMensaje(this.mensajeError(error));
        }
    }

    async obtenerReceta(id) {
        const guardada = cache.obtenerReceta(id);
        if (guardada) return guardada;

        const data = await api.porId(id);
        const receta = normalizarReceta(data?.meals?.[0]);
        if (!receta) throw new Error('No se pudo cargar la receta');
        cache.guardarReceta(receta);
        return receta;
    }

    quitar(detalle) {
        if (!detalle?.panel) return;
        this.estado[detalle.panel] = null;
        this.pintarPaneles();
        this.notificar('comparadorCambiado', { panel: detalle.panel });
    }

    intercambiar() {
        const a = this.estado.A;
        this.estado.A = this.estado.B;
        this.estado.B = a;
        this.pintarPaneles();
        this.notificar('comparadorCambiado', {});
    }

    notificar(nombre, detalle) {
        this.contenedor.dispatchEvent(
            new CustomEvent(nombre, { bubbles: true, detail: detalle })
        );
    }

    mostrarMensaje(mensaje) {
        const contenedor = document.getElementById('app-mensaje');
        if (!contenedor) return;
        contenedor.textContent = mensaje;
        contenedor.classList.add('app-mensaje--visible');
        setTimeout(() => {
            contenedor.classList.remove('app-mensaje--visible');
        }, 4000);
    }

    mensajeError(error) {
        return mensajeErrorApi(error, 'No se pudo cargar la receta. Intenta de nuevo.');
    }

    destruir() {
        this.destruido = true;
        this.peticionActual++;
        if (this.onAgregar) this.contenedor.removeEventListener('agregarAlComparador', this.onAgregar);
        if (this.onQuitar) this.contenedor.removeEventListener('quitarDelComparador', this.onQuitar);
        if (this.btnIntercambiar && this.onIntercambiar) {
            this.btnIntercambiar.removeEventListener('click', this.onIntercambiar);
        }
        this.onAgregar = null;
        this.onQuitar = null;
        this.onIntercambiar = null;
        this.paneles.A?.destruir();
        this.paneles.B?.destruir();
        this.tabla?.destruir();
        if (this.elemento) {
            this.elemento.remove();
            this.elemento = null;
        }
    }
}
