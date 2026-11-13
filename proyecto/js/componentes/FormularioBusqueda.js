class FormularioBusqueda {
    constructor(contenedor, props = {}) {
        this.contenedor = contenedor;
        this.categorias = props.categorias || [];
        this.origenes = props.origenes || [];
        this.ingredientes = props.ingredientes || [];
        this.valores = props.valores || { nombre: '', categoria: '', origen: '', ingrediente: '' };
        this.alBuscar = props.alBuscar || null;
        this.alLimpiar = props.alLimpiar || null;
        this.elemento = null;
        this.formulario = null;
        this.btnLimpiar = null;
        this.onSubmit = null;
        this.onLimpiar = null;
        this.renderizar();
    }

    crearElemento() {
        this.formulario = document.createElement('form');
        this.formulario.className = 'form-busqueda';
        this.formulario.noValidate = true;

        const grilla = document.createElement('div');
        grilla.className = 'form-busqueda__grilla';

        grilla.appendChild(this.crearCampoTexto(
            'nombre', 'Nombre de la receta', 'text',
            this.valores.nombre,
            'Por ejemplo: pasta'
        ));

        grilla.appendChild(this.crearSelector('categoria', 'Categoría', this.categorias, this.valores.categoria));
        grilla.appendChild(this.crearSelector('origen', 'Origen', this.origenes, this.valores.origen));
        grilla.appendChild(this.crearCampoIngrediente());

        this.formulario.appendChild(grilla);

        const error = document.createElement('p');
        error.className = 'form-busqueda__error';
        error.id = 'error-busqueda';
        error.setAttribute('role', 'alert');
        this.formulario.appendChild(error);

        const acciones = document.createElement('div');
        acciones.className = 'form-busqueda__acciones';

        const btnBuscar = document.createElement('button');
        btnBuscar.type = 'submit';
        btnBuscar.className = 'btn-principal';
        btnBuscar.textContent = 'Buscar';
        acciones.appendChild(btnBuscar);

        this.btnLimpiar = document.createElement('button');
        this.btnLimpiar.type = 'button';
        this.btnLimpiar.className = 'btn-secundario';
        this.btnLimpiar.textContent = 'Limpiar';
        acciones.appendChild(this.btnLimpiar);

        this.formulario.appendChild(acciones);

        return this.formulario;
    }

    crearEtiqueta(texto, htmlFor) {
        const etiqueta = document.createElement('label');
        etiqueta.className = 'campo__etiqueta';
        etiqueta.htmlFor = htmlFor;
        etiqueta.textContent = texto;
        return etiqueta;
    }

    crearCampoTexto(nombre, etiqueta, tipo, valor, ayuda) {
        const campo = document.createElement('div');
        campo.className = 'campo';

        const id = `campo-${nombre}`;
        campo.appendChild(this.crearEtiqueta(etiqueta, id));

        const input = document.createElement('input');
        input.type = tipo;
        input.id = id;
        input.name = nombre;
        input.className = 'campo__control';
        input.value = valor || '';
        input.placeholder = ayuda || '';
        campo.appendChild(input);

        const error = document.createElement('p');
        error.className = 'campo__error';
        error.id = `error-${nombre}`;
        campo.appendChild(error);

        return campo;
    }

    crearCampoIngrediente() {
        const campo = document.createElement('div');
        campo.className = 'campo';

        const id = 'campo-ingrediente';
        campo.appendChild(this.crearEtiqueta('Ingrediente', id));

        const input = document.createElement('input');
        input.type = 'text';
        input.id = id;
        input.name = 'ingrediente';
        input.className = 'campo__control';
        input.value = this.valores.ingrediente || '';
        input.placeholder = 'Escribe para ver sugerencias';
        input.setAttribute('autocomplete', 'off');
        campo.appendChild(input);

        const lista = document.createElement('datalist');
        lista.id = 'sugerencias-ingredientes';
        this.ingredientes.forEach((ingrediente) => {
            const opcion = document.createElement('option');
            opcion.value = ingrediente.nombre;
            lista.appendChild(opcion);
        });
        campo.appendChild(lista);
        input.setAttribute('list', 'sugerencias-ingredientes');

        const error = document.createElement('p');
        error.className = 'campo__error';
        error.id = 'error-ingrediente';
        campo.appendChild(error);

        return campo;
    }

    crearSelector(nombre, etiqueta, opciones, valor) {
        const campo = document.createElement('div');
        campo.className = 'campo';

        const id = `campo-${nombre}`;
        campo.appendChild(this.crearEtiqueta(etiqueta, id));

        const select = document.createElement('select');
        select.id = id;
        select.name = nombre;
        select.className = 'campo__control';

        const vacio = document.createElement('option');
        vacio.value = '';
        vacio.textContent = 'Todos';
        select.appendChild(vacio);

        opciones.forEach((opcion) => {
            const elemento = document.createElement('option');
            elemento.value = opcion.nombre;
            elemento.textContent = opcion.nombre;
            if (opcion.nombre === valor) elemento.selected = true;
            select.appendChild(elemento);
        });

        campo.appendChild(select);

        const error = document.createElement('p');
        error.className = 'campo__error';
        error.id = `error-${nombre}`;
        campo.appendChild(error);

        return campo;
    }

    configurarEventos() {
        this.onSubmit = (evento) => {
            evento.preventDefault();
            this.buscar();
        };
        this.onLimpiar = () => {
            this.mostrarError('');
            if (this.alLimpiar) this.alLimpiar();
        };

        this.formulario.addEventListener('submit', this.onSubmit);
        this.btnLimpiar.addEventListener('click', this.onLimpiar);
    }

    leerValores() {
        this.valores = {
            nombre: this.contenedor.querySelector('#campo-nombre').value.trim(),
            categoria: this.contenedor.querySelector('#campo-categoria').value,
            origen: this.contenedor.querySelector('#campo-origen').value,
            ingrediente: this.contenedor.querySelector('#campo-ingrediente').value.trim(),
        };
        return this.valores;
    }

    validar() {
        const valores = this.leerValores();

        if (valores.nombre && valores.nombre.length < 2) {
            return { valido: false, campo: 'nombre', mensaje: 'El nombre debe tener al menos 2 caracteres.' };
        }

        if (valores.ingrediente && valores.ingrediente.length < 2) {
            return { valido: false, campo: 'ingrediente', mensaje: 'El ingrediente debe tener al menos 2 caracteres.' };
        }

        const hayCriterio = valores.nombre || valores.categoria || valores.origen || valores.ingrediente;
        if (!hayCriterio) {
            return { valido: false, campo: 'nombre', mensaje: 'Aplica al menos un criterio de búsqueda.' };
        }

        return { valido: true };
    }

    mostrarError(mensaje, campo = null) {
        const general = this.contenedor.querySelector('#error-busqueda');
        if (general) general.textContent = mensaje || '';

        ['nombre', 'categoria', 'origen', 'ingrediente'].forEach((nombre) => {
            const destino = this.contenedor.querySelector(`#error-${nombre}`);
            if (destino) destino.textContent = '';
        });

        if (campo) {
            const destino = this.contenedor.querySelector(`#error-${campo}`);
            if (destino) destino.textContent = mensaje;
        }
    }

    buscar() {
        const validacion = this.validar();
        if (!validacion.valido) {
            this.mostrarError(validacion.mensaje, validacion.campo);
            return;
        }

        this.mostrarError('');
        if (this.alBuscar) this.alBuscar(this.leerValores());
    }

    renderizar() {
        this.contenedor.textContent = '';
        this.elemento = this.crearElemento();
        this.contenedor.appendChild(this.elemento);
        this.configurarEventos();
    }

    setValores(valores) {
        this.valores = { ...this.valores, ...valores };
        this.renderizar();
    }

    destruir() {
        if (this.formulario && this.onSubmit) {
            this.formulario.removeEventListener('submit', this.onSubmit);
        }
        if (this.btnLimpiar && this.onLimpiar) {
            this.btnLimpiar.removeEventListener('click', this.onLimpiar);
        }
        this.onSubmit = null;
        this.onLimpiar = null;

        if (this.elemento) {
            this.elemento.remove();
            this.elemento = null;
        }
    }
}
