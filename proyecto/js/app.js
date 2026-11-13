const estadoApp = {
    inicio: { ultimaRecetaId: null },
    explorar: {
        criterios: { nombre: '', categoria: '', origen: '', ingrediente: '' },
        pagina: 1,
        busqueda: null,
    },
    categorias: { pestana: 'categorias', seleccion: null, pagina: 1 },
    comparador: { A: null, B: null },
    detalle: { id: null, origen: 'inicio', pila: [] },
};

const VISTA_NAV = {
    inicio: 'inicio',
    explorar: 'explorar',
    detalle: 'explorar',
    categorias: 'categorias',
    comparador: 'comparador',
};

document.addEventListener('DOMContentLoaded', () => {
    const navElement = document.getElementById('barra-nav');
    const barraNav = new BarraNavegacion(navElement, { vistaActiva: 'inicio' });
    const contenedor = document.getElementById('app-main');
    const mensaje = document.getElementById('app-mensaje');
    const dialogo = document.getElementById('app-dialogo');

    let vistaActual = null;
    let vistaActualNombre = 'inicio';
    let temporizadorMensaje = null;

    function destruirVista() {
        if (vistaActual && typeof vistaActual.destruir === 'function') {
            vistaActual.destruir();
        }
        vistaActual = null;
    }

    function actualizarContador() {
        const cantidad = [estadoApp.comparador.A, estadoApp.comparador.B].filter(Boolean).length;
        barraNav.setCantidadComparador(cantidad);
    }

    function mostrarMensaje(texto) {
        if (!mensaje) return;
        mensaje.textContent = texto;
        mensaje.classList.add('app-mensaje--visible');
        clearTimeout(temporizadorMensaje);
        temporizadorMensaje = setTimeout(() => {
            mensaje.classList.remove('app-mensaje--visible');
        }, 4000);
    }

    function cambiarVista(nombre, datos = {}) {
        destruirVista();
        vistaActualNombre = nombre;
        contenedor.textContent = '';
        barraNav.setVistaActiva(VISTA_NAV[nombre] || nombre);

        if (nombre !== 'detalle') {
            estadoApp.detalle.pila = [];
        }

        switch (nombre) {
            case 'inicio':
                vistaActual = new VistaInicio(contenedor, { estado: estadoApp.inicio });
                break;
            case 'explorar':
                vistaActual = new VistaExplorar(contenedor, { estado: estadoApp.explorar });
                break;
            case 'detalle':
                vistaActual = new VistaDetalle(contenedor, {
                    id: datos.id,
                    origen: datos.origen || 'inicio',
                });
                break;
            case 'categorias':
                vistaActual = new VistaCategoriasOrigenes(contenedor, { estado: estadoApp.categorias });
                break;
            case 'comparador':
                vistaActual = new VistaComparador(contenedor, { estado: estadoApp.comparador });
                break;
            default:
                mostrarMensaje('Página no encontrada');
        }

        actualizarContador();
    }

    async function agregarAlComparador(id) {
        if (!id) return;

        const ocupadoA = estadoApp.comparador.A?.id === id;
        const ocupadoB = estadoApp.comparador.B?.id === id;
        if (ocupadoA || ocupadoB) {
            mostrarMensaje('Esa receta ya está cargada en el comparador.');
            return;
        }

        try {
            if (!estadoApp.comparador.A) {
                estadoApp.comparador.A = await cargarReceta(id);
            } else if (!estadoApp.comparador.B) {
                estadoApp.comparador.B = await cargarReceta(id);
            } else {
                preguntarPanel(id);
                return;
            }
        } catch (error) {
            mostrarMensaje('No se pudo cargar la receta. Intenta de nuevo.');
            return;
        }

        actualizarContador();
        if (vistaActualNombre === 'comparador') {
            vistaActual.pintarPaneles();
        }
    }

    async function cargarReceta(id) {
        const guardada = cache.obtenerReceta(id);
        if (guardada) return guardada;

        const data = await api.porId(id);
        const receta = normalizarReceta(data?.meals?.[0]);
        if (!receta) throw new Error('No se pudo cargar la receta');
        cache.guardarReceta(receta);
        return receta;
    }

    function preguntarPanel(id) {
        if (!dialogo) return;

        dialogo.textContent = '';

        const titulo = document.createElement('h3');
        titulo.textContent = 'Ambos paneles están ocupados. ¿Cuál se reemplaza?';
        dialogo.appendChild(titulo);

        const acciones = document.createElement('div');
        acciones.className = 'app-dialogo__acciones';

        ['A', 'B'].forEach((panel) => {
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = 'btn-principal';
            boton.textContent = `Reemplazar panel ${panel}`;
            boton.addEventListener('click', async () => {
                cerrarDialogo();
                try {
                    estadoApp.comparador[panel] = await cargarReceta(id);
                } catch (error) {
                    mostrarMensaje('No se pudo cargar la receta. Intenta de nuevo.');
                    return;
                }
                actualizarContador();
                if (vistaActualNombre === 'comparador') vistaActual.pintarPaneles();
            });
            acciones.appendChild(boton);
        });

        const cancelar = document.createElement('button');
        cancelar.type = 'button';
        cancelar.className = 'btn-secundario';
        cancelar.textContent = 'Cancelar';
        cancelar.addEventListener('click', cerrarDialogo);
        acciones.appendChild(cancelar);

        dialogo.appendChild(acciones);
        dialogo.hidden = false;
    }

    function cerrarDialogo() {
        if (!dialogo) return;
        dialogo.hidden = true;
        dialogo.textContent = '';
    }

    document.addEventListener('cambiarVista', (evento) => {
        const vista = evento.detail?.vista;
        if (vista) cambiarVista(vista);
    });

    document.addEventListener('abrirDetalle', (evento) => {
        const { id } = evento.detail || {};
        if (!id) return;

        let origen = vistaActualNombre;
        if (vistaActualNombre === 'detalle') {
            estadoApp.detalle.pila.push({ id: estadoApp.detalle.id, origen: estadoApp.detalle.origen });
            origen = estadoApp.detalle.origen;
        }

        estadoApp.detalle.id = id;
        estadoApp.detalle.origen = origen;
        cambiarVista('detalle', { id, origen });
    });

    document.addEventListener('abrirCategoria', (evento) => {
        const categoria = evento.detail?.categoria;
        if (!categoria) return;
        estadoApp.categorias.pestana = 'categorias';
        estadoApp.categorias.seleccion = { tipo: 'categoria', ...categoria };
        estadoApp.categorias.pagina = 1;
        cambiarVista('categorias');
    });

    document.addEventListener('agregarComparador', (evento) => {
        const { id } = evento.detail || {};
        if (id) agregarAlComparador(id);
    });

    document.addEventListener('comparadorCambiado', actualizarContador);

    document.addEventListener('volver', () => {
        const anterior = estadoApp.detalle.pila.pop();
        if (anterior) {
            estadoApp.detalle.id = anterior.id;
            estadoApp.detalle.origen = anterior.origen;
            cambiarVista('detalle', { id: anterior.id, origen: anterior.origen });
            return;
        }
        cambiarVista(estadoApp.detalle.origen || 'inicio');
    });

    cambiarVista('inicio');
});
