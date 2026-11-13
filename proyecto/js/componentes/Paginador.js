const RESULTADOS_POR_PAGINA = 12;
class Paginador {
    constructor(contenedor, props = {}) {
        this.contenedor = contenedor;
        this.paginaActual = props.paginaActual || 1;
        this.totalPaginas = props.totalPaginas || 0;
        this.totalResultados = props.totalResultados || 0;
        this.alCambiarPagina = props.alCambiarPagina || null;
        this.elemento = null;
        this.botones = [];
        this.onClic = null;
        this.renderizar();
    }

    crearElemento() {
        const contenedor = document.createElement('nav');
        contenedor.className = 'paginador';
        contenedor.setAttribute('aria-label', 'Paginación de resultados');

        if (this.totalPaginas <= 1) return contenedor;

        const info = document.createElement('p');
        info.className = 'paginador__info';
        info.textContent = `Página ${this.paginaActual} de ${this.totalPaginas} · ${this.totalResultados} resultado(s)`;
        contenedor.appendChild(info);

        const lista = document.createElement('ul');
        lista.className = 'paginador__lista';

        this.botones = [];

        this.crearBoton(lista, 'Anterior', this.paginaActual - 1, this.paginaActual <= 1);
        for (let i = 1; i <= this.totalPaginas; i++) {
            this.crearBoton(lista, String(i), i, false, i === this.paginaActual);
        }
        this.crearBoton(lista, 'Siguiente', this.paginaActual + 1, this.paginaActual >= this.totalPaginas);

        contenedor.appendChild(lista);
        return contenedor;
    }

    crearBoton(lista, texto, pagina, deshabilitado, activo = false) {
        const item = document.createElement('li');
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'paginador__boton';
        boton.textContent = texto;
        boton.disabled = deshabilitado;
        boton.dataset.pagina = String(pagina);
        if (activo) {
            boton.classList.add('paginador__boton--activo');
            boton.setAttribute('aria-current', 'page');
        }

        this.botones.push(boton);

        item.appendChild(boton);
        lista.appendChild(item);
        return item;
    }

    configurarEventos() {
        this.onClic = (evento) => {
            const pagina = Number(evento.target.dataset.pagina);
            if (!pagina) return;
            if (this.alCambiarPagina) this.alCambiarPagina(pagina);
        };
        this.botones.forEach((boton) => boton.addEventListener('click', this.onClic));
    }

    renderizar() {
        this.contenedor.textContent = '';
        this.botones = [];
        this.elemento = this.crearElemento();
        this.contenedor.appendChild(this.elemento);
        this.configurarEventos();
    }

    setPagina(pagina) {
        this.paginaActual = pagina;
        this.renderizar();
    }

    destruir() {
        if (this.onClic) {
            this.botones.forEach((boton) => boton.removeEventListener('click', this.onClic));
            this.onClic = null;
        }
        this.botones = [];
        if (this.elemento) {
            this.elemento.remove();
            this.elemento = null;
        }
    }
}
