(function() {
    const catalogo = window.__CATALOGO__;
    let carrito = {}; // Mantiene el estado global
    
    // Variables de estado para los filtros
    let categoriaActiva = 'Todas';
    let textoBusqueda = '';

    const grid = document.getElementById('grid-productos');
    const barraCarrito = document.getElementById('barra-carrito');
    const lblCantidad = document.getElementById('carrito-cantidad');
    const lblTotal = document.getElementById('carrito-total');
    const btnComprar = document.getElementById('btn-comprar');
    
    // Nuevos nodos
    const contenedorCategorias = document.getElementById('contenedor-categorias');
    const inputBusqueda = document.getElementById('input-busqueda');

    // 1. Generar botones de categoría dinámicamente
    function renderizarCategorias() {
        // Extraer categorías únicas del catálogo
        const categoriasUnicas = ['Todas', ...new Set(catalogo.map(p => p.categoria))];
        
        contenedorCategorias.innerHTML = '';
        categoriasUnicas.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = `btn-categoria ${cat === categoriaActiva ? 'activo' : ''}`;
            btn.innerText = cat;
            
            btn.onclick = () => {
                categoriaActiva = cat;
                // Refrescar clases visuales
                document.querySelectorAll('.btn-categoria').forEach(b => b.classList.remove('activo'));
                btn.classList.add('activo');
                aplicarFiltros();
            };
            
            contenedorCategorias.appendChild(btn);
        });
    }

    // 2. Procesar la búsqueda y el filtro
    function aplicarFiltros() {
        const filtrados = catalogo.filter(prod => {
            // Comprueba si coincide la categoría (o si es "Todas")
            const coincideCategoria = categoriaActiva === 'Todas' || prod.categoria === categoriaActiva;
            // Comprueba si el nombre incluye el texto tipeado
            const coincideTexto = prod.nombre.toLowerCase().includes(textoBusqueda.toLowerCase());
            
            return coincideCategoria && coincideTexto;
        });
        
        renderizarCatalogo(filtrados);
    }

    // Escuchar cuando el usuario escribe
    inputBusqueda.addEventListener('input', (e) => {
        textoBusqueda = e.target.value;
        aplicarFiltros();
    });

    // 3. Renderizar el grid (ahora recibe un array filtrado)
    // 3. Renderizar el grid con control de stock
    function renderizarCatalogo(productosRender) {
        grid.innerHTML = '';
        
        if (productosRender.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: var(--text-muted); padding: 40px 0;">No se encontraron productos con esa búsqueda.</p>';
            return;
        }

        productosRender.forEach(prod => {
            if (!carrito[prod.id]) carrito[prod.id] = 0;

            const estaAgotado = prod.stock === 0;
            const claseAgotado = estaAgotado ? 'sin-stock' : '';
            const textoStock = estaAgotado ? 'Agotado' : `Stock: ${prod.stock}`;
            const claseTextoStock = estaAgotado ? 'agotado' : '';
            
            // Verificamos si ya alcanzó el máximo en el carrito para deshabilitar el botón "+"
            const limiteAlcanzado = carrito[prod.id] >= prod.stock;

            const card = document.createElement('div');
            card.className = `producto-card ${claseAgotado}`;
            card.innerHTML = `
                <img src="${prod.imagen}" alt="${prod.nombre}" class="producto-img" loading="lazy">
                <div class="producto-info">
                    <div style="display: flex; justify-content: space-between;">
                        <span class="categoria">${prod.categoria}</span>
                        <span class="stock-label ${claseTextoStock}">${textoStock}</span>
                    </div>
                    <h3 class="nombre">${prod.nombre}</h3>
                    <span class="precio">$${prod.precio.toLocaleString('es-AR')}</span>
                    
                    <div class="controles">
                        <button class="btn-control" onclick="modificarCarrito('${prod.id}', -1)" ${estaAgotado ? 'disabled' : ''}>-</button>
                        <span class="cantidad" id="cant-${prod.id}">${carrito[prod.id]}</span>
                        <button class="btn-control" id="btn-sumar-${prod.id}" onclick="modificarCarrito('${prod.id}', 1)" ${(estaAgotado || limiteAlcanzado) ? 'disabled' : ''}>+</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // 4. Lógica del carrito con tope de stock
    window.modificarCarrito = function(id, cambio) {
        // Buscamos cuál es el límite de stock de este producto
        const producto = catalogo.find(p => p.id === id);
        
        let nuevaCantidad = carrito[id] + cambio;
        
        // No puede ser menor a 0
        if (nuevaCantidad < 0) nuevaCantidad = 0;
        
        // No puede ser mayor al stock disponible
        if (nuevaCantidad > producto.stock) {
            nuevaCantidad = producto.stock;
        }
        
        carrito[id] = nuevaCantidad;
        document.getElementById(`cant-${id}`).innerText = nuevaCantidad;
        
        // Bloquear o desbloquear el botón "+" dependiendo de si llegamos al tope
        const btnSumar = document.getElementById(`btn-sumar-${id}`);
        if (btnSumar) {
            btnSumar.disabled = (nuevaCantidad >= producto.stock);
        }
        
        actualizarBarraInferior();
    };

    function actualizarBarraInferior() {
        let totalItems = 0;
        let totalDinero = 0;

        // Se usa el array global 'catalogo' para cruzar la data, no los filtrados.
        catalogo.forEach(prod => {
            const cant = carrito[prod.id];
            if (cant > 0) {
                totalItems += cant;
                totalDinero += (cant * prod.precio);
            }
        });

        lblCantidad.innerText = `${totalItems} ítem${totalItems !== 1 ? 's' : ''}`;
        lblTotal.innerText = `$${totalDinero.toLocaleString('es-AR')}`;

        if (totalItems > 0) {
            barraCarrito.classList.remove('oculto');
        } else {
            barraCarrito.classList.add('oculto');
        }
    }

    // 5. Enviar a WhatsApp
    btnComprar.addEventListener('click', () => {
        let mensaje = `*¡Hola! Quiero hacer un pedido a ${CONFIG.nombreNegocio}:*\n\n`;
        let total = 0;

        catalogo.forEach(prod => {
            const cant = carrito[prod.id];
            if (cant > 0) {
                const subtotal = cant * prod.precio;
                mensaje += `▪ ${cant}x ${prod.nombre} ($${subtotal.toLocaleString('es-AR')})\n`;
                total += subtotal;
            }
        });

        mensaje += `\n*Total a pagar: $${total.toLocaleString('es-AR')}*\n\n`;
        mensaje += `¿Tienen stock para pasar a retirar?`;

        const url = `https://wa.me/${CONFIG.telefono}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
    });

// --- ARRANQUE ASÍNCRONO ---
    async function iniciarApp() {
        // Mostrar un mensaje de carga temporal (opcional)
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: var(--text-muted);">Cargando catálogo...</p>';
        
        // Esperamos a que se bajen los datos de Google Sheets
        const exito = await cargarCatalogo();
        
        if (exito) {
            // Re-asignamos la variable catalogo porque ahora ya tiene datos
            catalogo.length = 0; 
            catalogo.push(...window.__CATALOGO__);
            
            renderizarCategorias();
            aplicarFiltros();
        } else {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: #FF3D8B;">Hubo un error cargando los productos. Revisa tu conexión.</p>';
        }
    }

    iniciarApp();
})();