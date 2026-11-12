class TablaComparacion {
    constructor(contenedor, props = {}) {
        this.contenedor = contenedor;
        this.recetaA = props.recetaA || null;
        this.recetaB = props.recetaB || null;
        this.elemento = null;
        this.renderizar();
    }

    crearElemento() {
        const comparacion = compararRecetas(this.recetaA, this.recetaB);
        const tabla = document.createElement('table');
        tabla.className = 'tabla-comparacion';

        const cabecera = document.createElement('thead');
        const filaCabecera = document.createElement('tr');

        const vacio = document.createElement('th');
        vacio.scope = 'col';
        vacio.textContent = 'Métrica';
        filaCabecera.appendChild(vacio);

        const colA = document.createElement('th');
        colA.scope = 'col';
        colA.textContent = this.recetaA?.nombre || 'Receta A';
        filaCabecera.appendChild(colA);

        const colB = document.createElement('th');
        colB.scope = 'col';
        colB.textContent = this.recetaB?.nombre || 'Receta B';
        filaCabecera.appendChild(colB);

        cabecera.appendChild(filaCabecera);
        tabla.appendChild(cabecera);

        const cuerpo = document.createElement('tbody');

        this.agregarFilaNumerica(cuerpo, 'Cantidad de ingredientes', comparacion.ingredientes);
        this.agregarFilaNumerica(cuerpo, 'Cantidad de pasos', comparacion.pasos);
        this.agregarFilaNumerica(cuerpo, 'Extensión de las instrucciones', comparacion.palabras);

        this.agregarFilaTexto(cuerpo, 'Categoría',
            comparacion.categoria.A, comparacion.categoria.B, comparacion.categoria.coinciden);
        this.agregarFilaTexto(cuerpo, 'Origen',
            comparacion.origen.A, comparacion.origen.B, comparacion.origen.coinciden);
        this.agregarFilaTexto(cuerpo, 'Video',
            comparacion.video.A ? 'Sí' : 'No', comparacion.video.B ? 'Sí' : 'No', null);

        this.agregarFilaLista(cuerpo, 'Etiquetas en común', comparacion.etiquetasComunes);
        this.agregarFilaLista(cuerpo, 'Ingredientes en común', comparacion.ingredientesComunes);
        this.agregarFilaLista(cuerpo, 'Solo en A', comparacion.exclusivos.soloA);
        this.agregarFilaLista(cuerpo, 'Solo en B', comparacion.exclusivos.soloB);

        this.agregarFilaNumerica(cuerpo, 'Similitud', { A: comparacion.similitud, B: comparacion.similitud });

        const filaSencilla = document.createElement('tr');
        filaSencilla.className = 'tabla-comparacion__fila tabla-comparacion__fila--destacada';

        const etiquetaSencilla = document.createElement('th');
        etiquetaSencilla.scope = 'row';
        etiquetaSencilla.textContent = 'Receta más sencilla';
        filaSencilla.appendChild(etiquetaSencilla);

        const valorSencilla = document.createElement('td');
        valorSencilla.colSpan = 2;
        valorSencilla.textContent = this.descripcionSencilla(comparacion.masSencilla);
        filaSencilla.appendChild(valorSencilla);

        cuerpo.appendChild(filaSencilla);

        tabla.appendChild(cuerpo);
        return tabla;
    }

    // En las metricas numericas se resalta el menor valor.
    agregarFilaNumerica(cuerpo, etiqueta, valores) {
        const fila = document.createElement('tr');
        fila.className = 'tabla-comparacion__fila';

        const th = document.createElement('th');
        th.scope = 'row';
        th.textContent = etiqueta;
        fila.appendChild(th);

        const menor = Math.min(valores.A, valores.B);
        const iguales = valores.A === valores.B;

        [valores.A, valores.B].forEach((valor) => {
            const celda = document.createElement('td');
            celda.textContent = String(valor);
            if (!iguales && valor === menor) {
                celda.classList.add('tabla-comparacion__mejor');
            }
            fila.appendChild(celda);
        });

        cuerpo.appendChild(fila);
    }

    agregarFilaTexto(cuerpo, etiqueta, valorA, valorB, coinciden) {
        const fila = document.createElement('tr');
        fila.className = 'tabla-comparacion__fila';

        const th = document.createElement('th');
        th.scope = 'row';
        th.textContent = etiqueta;
        fila.appendChild(th);

        [valorA, valorB].forEach((valor) => {
            const celda = document.createElement('td');
            celda.textContent = valor || '—';
            fila.appendChild(celda);
        });

        if (coinciden !== null) {
            const celda = document.createElement('td');
            celda.colSpan = 2;
            celda.className = 'tabla-comparacion__nota';
            celda.textContent = coinciden ? 'Coinciden' : 'No coinciden';
            fila.appendChild(celda);
        }

        cuerpo.appendChild(fila);
    }

    agregarFilaLista(cuerpo, etiqueta, valores) {
        const fila = document.createElement('tr');
        fila.className = 'tabla-comparacion__fila';

        const th = document.createElement('th');
        th.scope = 'row';
        th.textContent = etiqueta;
        fila.appendChild(th);

        const celda = document.createElement('td');
        celda.colSpan = 2;
        if (!valores || !valores.length) {
            celda.textContent = 'Ninguno';
            celda.classList.add('tabla-comparacion__nota');
        } else {
            celda.textContent = valores.join(', ');
        }
        fila.appendChild(celda);

        cuerpo.appendChild(fila);
    }

    descripcionSencilla(masSencilla) {
        if (masSencilla === 'empate') return 'Empate: ambas requieren el mismo esfuerzo';
        const nombre = masSencilla === 'A' ? this.recetaA?.nombre : this.recetaB?.nombre;
        return `${nombre} (panel ${masSencilla})`;
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
