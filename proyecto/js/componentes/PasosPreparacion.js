class PasosPreparacion {
    constructor(contenedor, props = {}) {
        this.contenedor = contenedor;
        this.pasos = props.pasos || [];
        this.elemento = null;
        this.renderizar();
    }

    crearElemento() {
        const lista = document.createElement('ol'); // Cambiado a 'ol' para una lista ordenada
        lista.className = 'pasos-preparacion'; // Cambiado a 'ol' para una lista ordenada

        this.pasos.forEach((paso) => {
            const item = document.createElement('li'); 
            item.className = 'pasos-preparacion__paso';
            item.textContent = paso;
            lista.appendChild(item);
        });

        return lista;
    }

    renderizar() {
        this.contenedor.textContent = '';
        this.elemento = this.crearElemento();
        this.contenedor.appendChild(this.elemento);
    }

    destruir() {
        if (this.elemento) {
            this.elemento.remove();
            this.elemento = null;
        }
    }
}
