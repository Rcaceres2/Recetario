const IMAGEN_ALTERNATIVA = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">' +
    '<rect width="80" height="80" rx="12" fill="#f3e2d5"/>' +
    '<circle cx="40" cy="36" r="18" fill="#e0c3a6"/>' +
    '<path d="M40 18c-6 6-9 12-9 18 0 6 4 10 9 10s9-4 9-10c0-6-3-12-9-18z" fill="#c9a077"/>' +
    '<rect x="26" y="58" width="28" height="6" rx="3" fill="#c9a077"/>' +
    '</svg>'
);

class ListaIngredientes {
    constructor(contenedor, props = {}) {
        this.contenedor = contenedor;
        this.ingredientes = props.ingredientes || [];
        this.imagenAlternativa = props.imagenAlternativa || IMAGEN_ALTERNATIVA;
        this.elemento = null;
        this.imagenes = [];
        this.onError = null;
        this.renderizar();
    }

    crearElemento() {
        const lista = document.createElement('ul');
        lista.className = 'lista-ingredientes';

        this.imagenes = [];

        this.ingredientes.forEach((ingrediente) => {
            const item = document.createElement('li');
            item.className = 'lista-ingredientes__item';

            const imagen = document.createElement('img');
            imagen.className = 'lista-ingredientes__imagen';
            imagen.src = urlImagenIngrediente(ingrediente.nombre);
            imagen.alt = ingrediente.nombre;
            imagen.loading = 'lazy';
            this.imagenes.push(imagen);
            item.appendChild(imagen);

            const texto = document.createElement('div');
            texto.className = 'lista-ingredientes__texto';

            const nombre = document.createElement('span');
            nombre.className = 'lista-ingredientes__nombre';
            nombre.textContent = ingrediente.nombre;
            texto.appendChild(nombre);

            if (ingrediente.medida) {
                const medida = document.createElement('span');
                medida.className = 'lista-ingredientes__medida';
                medida.textContent = ingrediente.medida;
                texto.appendChild(medida);
            }

            item.appendChild(texto);
            lista.appendChild(item);
        });

        return lista;
    }

    configurarEventos() {
        this.onError = (evento) => {
            const imagen = evento.target;
            imagen.src = this.imagenAlternativa;
            imagen.classList.add('lista-ingredientes__imagen--alternativa');
        };
        this.imagenes.forEach((imagen) => imagen.addEventListener('error', this.onError));
    }

    renderizar() {
        this.contenedor.textContent = '';
        this.elemento = this.crearElemento();
        this.contenedor.appendChild(this.elemento);
        this.configurarEventos();
    }

    destruir() {
        if (this.onError) {
            this.imagenes.forEach((imagen) => imagen.removeEventListener('error', this.onError));
            this.onError = null;
        }
        this.imagenes = [];
        if (this.elemento) {
            this.elemento.remove();
            this.elemento = null;
        }
    }
}
