// Configuración general
const CONFIG = {
    telefono: "5492625581975", // Número de WhatsApp con código de país (54 para Argentina, 9 para celular)
    nombreNegocio: "Lumé",
    sheetID: "10asfMxPIX9BsoOzPaq0n8wX8lue_c2Z-xlpX1YgFnlo"
};

window.__CATALOGO__ = []; // Empezará vacío, lo llenaremos desde Google

// Función para descargar los datos
async function cargarCatalogo() {
    // Esta URL oculta de Google devuelve los datos de la hoja en formato JSON
    const url = `https://docs.google.com/spreadsheets/d/${CONFIG.sheetID}/gviz/tq?tqx=out:json`;

    try {
        const respuesta = await fetch(url);
        const texto = await respuesta.text();
        
        // Google devuelve el JSON envuelto en una función de texto, la limpiamos:
        const jsonLimpio = JSON.parse(texto.substring(47).slice(0, -2));
        
        // Mapeamos las filas de la hoja a nuestro formato de carrito
        window.__CATALOGO__ = jsonLimpio.table.rows.map(fila => {
            // Ignoramos filas vacías
            if (!fila.c[0] || !fila.c[0].v) return null; 
            
            return {
                id: fila.c[0].v.toString(),
                nombre: fila.c[1] ? fila.c[1].v : "Sin nombre",
                categoria: fila.c[2] ? fila.c[2].v : "Otros",
                precio: fila.c[3] ? Number(fila.c[3].v) : 0,
                imagen: fila.c[4] ? fila.c[4].v : "",
                stock: fila.c[5] ? Number(fila.c[5].v) : 0
            };
        }).filter(producto => producto !== null);

        return true;
    } catch (error) {
        console.error("Error cargando el catálogo:", error);
        return false;
    }
}