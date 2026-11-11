class TarjetaReceta {
    constructor(contenedor, props = {}) {
        this.contenedor = contenedor;
        this.receta = props.receta || null;
        this.incompleta = props.incompleta || false;
        this.alReintentar = props.alReintentar || null;
        this.elemento = null;
        this.botones = [];
        this.onDetalle = null;
        this.onComparar = null;
        this.onReintentar = null;
        this.renderizar();
    }

    crearElemento() {
        const tarjeta = document.createElement('article');
        tarjeta.className = 'tarjeta-receta';
        if (this.incompleta) tarjeta.classList.add('tarjeta-receta--incompleta');

        const imagen = document.createElement('img');
        imagen.className = 'tarjeta-receta__imagen';
        imagen.src = this.receta?.imagen || '';
        imagen.alt = this.receta?.nombre || 'Receta';
        imagen.loading = 'lazy';
        tarjeta.appendChild(imagen);

        const cuerpo = document.createElement('div');
        cuerpo.className = 'tarjeta-receta__cuerpo';

        const nombre = document.createElement('h3');
        nombre.className = 'tarjeta-receta__nombre';
        nombre.textContent = this.receta?.nombre || 'Receta sin nombre';
        cuerpo.appendChild(nombre);

        const meta = document.createElement('p');
        meta.className = 'tarjeta-receta__meta';
        meta.textContent = this.receta?.categoria
            ? `${this.receta.categoria} · ${this.receta.origen || 'Sin origen'}`
            : (this.receta?.origen || '');
        cuerpo.appendChild(meta);

        if (this.incompleta) {
            const aviso = document.createElement('p');
            aviso.className = 'tarjeta-receta__aviso';
            aviso.textContent = 'Datos incompletos';

            this.botonReintentar = document.createElement('button');
            this.botonReintentar.type = 'button';
            this.botonReintentar.className = 'btn-secundario';
            this.botonReintentar.textContent = 'Reintentar';
            aviso.appendChild(this.botonReintentar);
            cuerpo.appendChild(aviso);
        } else if (this.receta?.ingredientes) {
            const cantidad = document.createElement('p');
            cantidad.className = 'tarjeta-receta__ingredientes';
            cantidad.textContent = `${this.receta.ingredientes.length} ingrediente(s)`;
            cuerpo.appendChild(cantidad);
        }

        const acciones = document.createElement('div');
        acciones.className = 'tarjeta-receta__acciones';

        this.botonDetalle = document.createElement('button');
        this.botonDetalle.type = 'button';
        this.botonDetalle.className = 'btn-secundario';
        this.botonDetalle.textContent = 'Ver detalle';
        acciones.appendChild(this.botonDetalle);

        this.botonComparar = document.createElement('button');
        this.botonComparar.type = 'button';
        this.botonComparar.className = 'btn-secundario';
        this.botonComparar.textContent = 'Comparar';
        acciones.appendChild(this.botonComparar);

        cuerpo.appendChild(acciones);
        tarjeta.appendChild(cuerpo);

        this.botones = [this.botonDetalle, this.botonComparar, this.botonReintentar].filter(Boolean);

        return tarjeta;
    }
    configurarEventos() {
        this.onDetalle = () => this.notificar('abrirDetalle', { id: this.receta?.id });
        this.onComparar = () => this.notificar('agregarComparador', { id: this.receta?.id });
        this.onReintentar = () => {
            if (this.alReintentar) this.alReintentar();
        };

        if (this.botonDetalle) this.botonDetalle.addEventListener('click', this.onDetalle);
        if (this.botonComparar) this.botonComparar.addEventListener('click', this.onComparar);
        if (this.botonReintentar) this.botonReintentar.addEventListener('click', this.onReintentar);
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

    destruir() {
        if (this.botonDetalle && this.onDetalle) {
            this.botonDetalle.removeEventListener('click', this.onDetalle);
        }
        if (this.botonComparar && this.onComparar) {
            this.botonComparar.removeEventListener('click', this.onComparar);
        }
        if (this.botonReintentar && this.onReintentar) {
            this.botonReintentar.removeEventListener('click', this.onReintentar);
        }
        this.onDetalle = null;
        this.onComparar = null;
        this.onReintentar = null;

        if (this.elemento) {
            this.elemento.remove();
            this.elemento = null;
        }
    }
}

