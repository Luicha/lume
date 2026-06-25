(function() {
    const catalogo = []; // Se llenará con lo que venga de Google Sheets
    let carrito = {}; // Mantiene el estado global de lo que elige el cliente
    
    // Variables de estado para los filtros
    let categoriaActiva = 'Todo';
    let textoBusqueda = '';

    const grid = document.getElementById('grid-productos');
    const barraCarrito = document.getElementById('barra-carrito');
    const lblCantidad = document.getElementById('carrito-cantidad');
    const lblTotal = document.getElementById('carrito-total');
    const btnComprar = document.getElementById('btn-comprar');
    
    const contenedorCategorias = document.getElementById('contenedor-categorias');
    const inputBusqueda = document.getElementById('input-busqueda');

    // 1. Generar botones de categoría dinámicamente
    function renderizarCategorias() {
        const categoriasUnicas = ['Todo', ...new Set(catalogo.map(p => p.categoria))];
        
        contenedorCategorias.innerHTML = '';
        categoriasUnicas.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = `btn-categoria ${cat === categoriaActiva ? 'activo' : ''}`;
            btn.innerText = cat;
            
            btn.onclick = () => {
                categoriaActiva = cat;
                document.querySelectorAll('.btn-categoria').forEach(b => b.classList.remove('activo'));
                btn.classList.add('activo');
                aplicarFiltros();
            };
            
            contenedorCategorias.appendChild(btn);
        });
    }

    // 2. Procesar la búsqueda, el filtro y el orden
    function aplicarFiltros() {
        const filtrados = catalogo.filter(prod => {
            const coincideCategoria = categoriaActiva === 'Todo' || prod.categoria === categoriaActiva;
            const coincideTexto = prod.nombre.toLowerCase().includes(textoBusqueda.toLowerCase());
            return coincideCategoria && coincideTexto;
        });
        
        // NUEVO: Ordenar para mandar los "Sin Stock" al fondo
        filtrados.sort((a, b) => {
            // Asignamos un 1 si tiene stock, y un 0 si está agotado
            const tieneStockA = a.stock > 0 ? 1 : 0;
            const tieneStockB = b.stock > 0 ? 1 : 0;
            
            // Comparamos: los que tienen 1 van arriba, los que tienen 0 van abajo
            return tieneStockB - tieneStockA;
        });

        renderizarCatalogo(filtrados);
    }

    // Escuchar cuando el usuario escribe en el buscador
    inputBusqueda.addEventListener('input', (e) => {
        textoBusqueda = e.target.value;
        aplicarFiltros();
    });

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
            
            // Verificamos si ya alcanzó el límite en el carrito
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
        const producto = catalogo.find(p => p.id === id);
        let nuevaCantidad = carrito[id] + cambio;
        
        if (nuevaCantidad < 0) nuevaCantidad = 0;
        if (nuevaCantidad > producto.stock) nuevaCantidad = producto.stock;
        
        carrito[id] = nuevaCantidad;
        document.getElementById(`cant-${id}`).innerText = nuevaCantidad;
        
        // Bloquear el botón "+" si llegamos al tope
        const btnSumar = document.getElementById(`btn-sumar-${id}`);
        if (btnSumar) {
            btnSumar.disabled = (nuevaCantidad >= producto.stock);
        }
        
        actualizarBarraInferior();
    };

    // 5. EL CARRITO: Sumar el total y mostrar la barra flotante
    function actualizarBarraInferior() {
        let totalItems = 0;
        let totalDinero = 0;

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

    // 6. EL CHECKOUT: Generar el mensaje de WhatsApp
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
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: var(--text-muted);">Cargando catálogo...</p>';
        
        const exito = await cargarCatalogo();
        
        if (exito) {
            catalogo.length = 0; 
            catalogo.push(...window.__CATALOGO__);
            
            renderizarCategorias();
            aplicarFiltros();
        } else {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: #FF3D8B;">Hubo un error cargando los productos. Revisa tu conexión.</p>';
        }
    }

    // --- MODO CLARO / OSCURO ---
    const btnTheme = document.getElementById('theme-toggle');
    const bodyElement = document.body;
    
    // 1. Revisar si el usuario ya tenía el modo claro guardado de antes
    if (localStorage.getItem('lume_theme') === 'light') {
        bodyElement.classList.add('light-theme');
        btnTheme.innerText = '🌙';
    }

    // 2. Al tocar el botón, alternar la clase y guardar la memoria
    btnTheme.addEventListener('click', () => {
        bodyElement.classList.toggle('light-theme');
        
        if (bodyElement.classList.contains('light-theme')) {
            localStorage.setItem('lume_theme', 'light');
            btnTheme.innerText = '🌙'; // Cambia el icono a la luna
        } else {
            localStorage.setItem('lume_theme', 'dark');
            btnTheme.innerText = '☀️'; // Cambia el icono al sol
        }
    });

    

    iniciarApp();
})();