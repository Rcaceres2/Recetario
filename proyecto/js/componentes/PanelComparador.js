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
