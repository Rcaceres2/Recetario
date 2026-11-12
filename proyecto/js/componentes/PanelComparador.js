class PanelComparador {
    constructor(contenedor, props = {}) {
        this.contenedor = contenedor;
        this.panel = props.panel || 'A';
        this.receta = props.receta || null;
        this.idsOcupados = props.idsOcupados || [];
        this.elemento = null;
        this.resultados = [];
        this.temporizador = null;
        this.controladorAbort = null;
        this.btnVaciar = null;
        this.inputBuscador = null;
        this.botonesElegir = [];
        this.onVaciar = null;
        this.onEntrada = null;
        this.onElegir = null;
        this.renderizar();
    }

    crearElemento() {
        const panel = document.createElement('section');
        panel.className = 'panel-comparador';
        panel.dataset.panel = this.panel;

        const cabecera = document.createElement('header');
        cabecera.className = 'panel-comparador__cabecera';

        const titulo = document.createElement('h3');
        titulo.className = 'panel-comparador__titulo';
        titulo.textContent = `Panel ${this.panel}`;
        cabecera.appendChild(titulo);

        if (this.receta) {
            this.btnVaciar = document.createElement('button');
            this.btnVaciar.type = 'button';
            this.btnVaciar.className = 'btn-secundario';
            this.btnVaciar.textContent = 'Vaciar';
            cabecera.appendChild(this.btnVaciar);
        }

        panel.appendChild(cabecera);

        panel.appendChild(this.crearSeleccion());

        panel.appendChild(this.crearBuscador());

        this.contenedorResultados = document.createElement('div');
        this.contenedorResultados.className = 'panel-comparador__resultados';
        panel.appendChild(this.contenedorResultados);

        this.contenedorError = document.createElement('p');
        this.contenedorError.className = 'panel-comparador__error';
        this.contenedorError.setAttribute('role', 'alert');
        panel.appendChild(this.contenedorError);

        return panel;
    }

    crearSeleccion() {
        const zona = document.createElement('div');
        zona.className = 'panel-comparador__seleccion';

        if (!this.receta) {
            const vacio = document.createElement('p');
            vacio.className = 'panel-comparador__vacio';
            vacio.textContent = 'Panel vacío. Busca una receta para cargarla.';
            zona.appendChild(vacio);
            return zona;
        }

        const imagen = document.createElement('img');
        imagen.className = 'panel-comparador__imagen';
        imagen.src = this.receta.imagen;
        imagen.alt = this.receta.nombre;
        imagen.loading = 'lazy';
        zona.appendChild(imagen);

        const datos = document.createElement('div');
        datos.className = 'panel-comparador__datos';

        const nombre = document.createElement('h4');
        nombre.className = 'panel-comparador__nombre';
        nombre.textContent = this.receta.nombre;
        datos.appendChild(nombre);

        const meta = document.createElement('p');
        meta.className = 'panel-comparador__meta';
        meta.textContent = `${this.receta.categoria || 'Sin categoría'} · ${this.receta.origen || 'Sin origen'}`;
        datos.appendChild(meta);

        zona.appendChild(datos);
        return zona;
    }

    crearBuscador() {
        const zona = document.createElement('div');
        zona.className = 'panel-comparador__buscador';

        const etiqueta = document.createElement('label');
        etiqueta.className = 'campo__etiqueta';
        etiqueta.htmlFor = `buscador-panel-${this.panel}`;
        etiqueta.textContent = `Buscar receta para el panel ${this.panel}`;
        zona.appendChild(etiqueta);

        this.inputBuscador = document.createElement('input');
        this.inputBuscador.type = 'text';
        this.inputBuscador.id = `buscador-panel-${this.panel}`;
        this.inputBuscador.className = 'campo__control';
        this.inputBuscador.placeholder = 'Escribe el nombre de la receta';
        this.inputBuscador.setAttribute('autocomplete', 'off');
        zona.appendChild(this.inputBuscador);

        return zona;
    }

    configurarEventos() {
        if (this.btnVaciar) {
            this.onVaciar = () => {
                this.notificar('quitarDelComparador', { panel: this.panel });
            };
            this.btnVaciar.addEventListener('click', this.onVaciar);
        }

        this.onEntrada = () => {
            this.programarBusqueda(this.inputBuscador.value.trim());
        };
        this.inputBuscador.addEventListener('input', this.onEntrada);
    }

    programarBusqueda(texto) {
        if (this.temporizador) clearTimeout(this.temporizador);

        if (texto.length < 2) {
            this.cancelarBusqueda();
            this.mostrarResultados([]);
            return;
        }

        this.temporizador = setTimeout(() => {
            this.buscar(texto);
        }, 400);
    }

    cancelarBusqueda() {
        if (this.temporizador) {
            clearTimeout(this.temporizador);
            this.temporizador = null;
        }
        if (this.controladorAbort) {
            this.controladorAbort.abort();
            this.controladorAbort = null;
        }
    }

    async buscar(texto) {
        this.cancelarPeticionAnterior();
        this.controladorAbort = new AbortController();

        try {
            const data = await api.buscarPorNombre(texto, { signal: this.controladorAbort.signal });
            const encontradas = (data?.meals || []).map((meal) => normalizarResumen(meal));
            this.mostrarResultados(encontradas);
        } catch (error) {
            // Una peticion cancelada no se informa como error.
            if (error?.tipo === TIPOS_ERROR.ABORT || error?.name === 'AbortError') return;
            this.mostrarError('No se pudo consultar la api. Intenta de nuevo.');
        }
    }

    cancelarPeticionAnterior() {
        if (this.controladorAbort) {
            this.controladorAbort.abort();
            this.controladorAbort = null;
        }
    }

    mostrarResultados(recetas) {
        this.resultados = recetas;
        this.contenedorResultados.textContent = '';
        this.botonesElegir = [];

        if (!recetas.length) return;

        recetas.slice(0, 8).forEach((receta) => {
            const item = document.createElement('div');
            item.className = 'panel-comparador__resultado';

            const nombre = document.createElement('span');
            nombre.className = 'panel-comparador__resultado-nombre';
            nombre.textContent = receta.nombre;
            item.appendChild(nombre);

            const btnElegir = document.createElement('button');
            btnElegir.type = 'button';
            btnElegir.className = 'btn-secundario';
            btnElegir.textContent = 'Elegir';
            btnElegir.dataset.id = receta.id;
            this.botonesElegir.push(btnElegir);
            item.appendChild(btnElegir);

            this.contenedorResultados.appendChild(item);
        });

        this.configurarEventosResultado();
    }

    // Un solo listener para todos los botones "Elegir" de los resultados.
    configurarEventosResultado() {
        this.onElegir = (evento) => {
            const id = evento.target.dataset.id;
            const receta = this.resultados.find((r) => r.id === id);
            if (receta) this.elegir(receta);
        };
        this.botonesElegir.forEach((boton) => boton.addEventListener('click', this.onElegir));
    }

    elegir(resumen) {
        const yaEsta = this.idsOcupados.includes(resumen.id);
        if (yaEsta) {
            this.mostrarError('Esa receta ya está cargada en el comparador.');
            return;
        }

        this.mostrarError('');
        this.notificar('agregarAlComparador', { panel: this.panel, id: resumen.id });
    }

    mostrarError(mensaje) {
        if (this.contenedorError) this.contenedorError.textContent = mensaje || '';
    }

    notificar(nombre, detalle) {
        this.contenedor.dispatchEvent(
            new CustomEvent(nombre, { bubbles: true, detail: detalle })
        );
    }

    renderizar() {
        this.contenedor.textContent = '';
        this.elemento = this.crearElemento();
        this.contenedor.appendChild(this.elemento);
        this.configurarEventos();
    }

    setReceta(receta) {
        this.receta = receta;
        this.renderizar();
    }

    destruir() {
        this.cancelarBusqueda();
        if (this.btnVaciar && this.onVaciar) {
            this.btnVaciar.removeEventListener('click', this.onVaciar);
            this.onVaciar = null;
        }
        if (this.inputBuscador && this.onEntrada) {
            this.inputBuscador.removeEventListener('input', this.onEntrada);
            this.onEntrada = null;
        }
        if (this.onElegir) {
            this.botonesElegir.forEach((boton) => boton.removeEventListener('click', this.onElegir));
            this.onElegir = null;
        }
        this.botonesElegir = [];
        if (this.elemento) {
            this.elemento.remove();
            this.elemento = null;
        }
    }
}

