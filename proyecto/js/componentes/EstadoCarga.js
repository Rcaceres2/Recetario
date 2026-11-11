class EstadoCarga {
    constructor(contenedor, props = {}) {
        this.contenedor = contenedor;
        this.tipo = props.tipo || 'linea';
        this.mensaje = props.mensaje || 'Cargando...';
        this.estado = props.estado || 'cargando';
        this.alReintentar = props.alReintentar || null;
        this.cantidadEsqueletos = props.cantidadEsqueletos || 3;
        this.elemento = null;
        this.botonReintentar = null;
        this.onReintentar = null;
        this.renderizar();
    }

    crearElemento() {
        const contenedor = document.createElement('div');
        contenedor.className = `estado estado--${this.estado} estado--${this.tipo}`;

        if (this.estado === 'cargando') {
            this.crearEsqueletos(contenedor);
        }

        if (this.estado !== 'cargando') {
            const mensaje = document.createElement('p');
            mensaje.className = 'estado__mensaje';
            mensaje.textContent = this.mensaje;
            contenedor.appendChild(mensaje);
        }

        if (this.estado === 'error' && this.alReintentar) {
            this.botonReintentar = document.createElement('button');
            this.botonReintentar.type = 'button';
            this.botonReintentar.className = 'btn-secundario';
            this.botonReintentar.textContent = 'Reintentar';
            contenedor.appendChild(this.botonReintentar);
        }

        return contenedor;
    }

    crearEsqueletos(contenedor) {
        for (let i = 0; i < this.cantidadEsqueletos; i++) {
            const esqueleto = document.createElement('div');
            esqueleto.className = 'esqueleto esqueleto--' + this.tipo;
            esqueleto.setAttribute('aria-hidden', 'true');
            contenedor.appendChild(esqueleto);
        }

        const texto = document.createElement('p');
        texto.className = 'estado__mensaje';
        texto.textContent = this.mensaje;
        contenedor.appendChild(texto);
    }

    renderizar() {
        this.contenedor.textContent = '';
        this.botonReintentar = null;
        this.elemento = this.crearElemento();
        this.contenedor.appendChild(this.elemento);
        this.configurarEventos();
    }

    configurarEventos() {
        if (!this.botonReintentar) return;

        this.onReintentar = () => this.alReintentar();
        this.botonReintentar.addEventListener('click', this.onReintentar);
    }

    setEstado(estado, mensaje = null, alReintentar = null) {
        this.estado = estado;
        if (mensaje !== null) this.mensaje = mensaje;
        this.alReintentar = alReintentar;
        this.renderizar();
    }

    destruir() {
        if (this.botonReintentar && this.onReintentar) {
            this.botonReintentar.removeEventListener('click', this.onReintentar);
            this.onReintentar = null;
        }
        this.botonReintentar = null;
        if (this.elemento) {
            this.elemento.remove();
            this.elemento = null;
        }
    }
}
