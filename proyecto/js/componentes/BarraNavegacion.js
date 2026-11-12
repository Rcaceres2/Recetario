class BarraNavegacion {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.estado = {
      vistaActiva: props.vistaActiva || 'inicio',
      cantidadComparador: props.cantidadComparador || 0,
    };

    this.enlaces = this.contenedor.querySelectorAll('a[data-vista]');
    this.badge = this.contenedor.querySelector('[data-rol="badge"]');

    this.render();
    this.configurarEventos();
  }

  render() {
    this.enlaces.forEach((enlace) => {
      const activo = enlace.dataset.vista === this.estado.vistaActiva;
      enlace.classList.toggle('barra-nav__enlace--activo', activo);
      if (activo) {
        enlace.setAttribute('aria-current', 'page');
      } else {
        enlace.removeAttribute('aria-current');
      }
    });

    if (this.badge) {
      this.badge.textContent = String(this.estado.cantidadComparador);
    }
  }

  configurarEventos() {
    this.onClick = (evento) => {
      const destino = evento.target;
      const enlace = destino instanceof Element ? destino.closest('a[data-vista]') : null;
      if (!enlace) return;
      evento.preventDefault();

      this.contenedor.dispatchEvent(
        new CustomEvent('cambiarVista', {
          bubbles: true,
          detail: { vista: enlace.dataset.vista },
        })
      );
    };
    this.contenedor.addEventListener('click', this.onClick);
  }

  setVistaActiva(vista) {
    this.estado.vistaActiva = vista;
    this.render();
  }

  setCantidadComparador(n) {
    this.estado.cantidadComparador = n;
    this.render();
  }

  destruir() {
    if (this.onClick) {
      this.contenedor.removeEventListener('click', this.onClick);
      this.onClick = null;
    }
  }
}
