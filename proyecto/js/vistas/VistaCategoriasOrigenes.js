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
