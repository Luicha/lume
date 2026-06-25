// Configuración general
const CONFIG = {
    telefono: "5492625637936", // Número de WhatsApp con código de país
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
            
            // 1. Obtenemos el link de la imagen si existe
            let linkImagen = fila.c[4] ? fila.c[4].v : "";
            
            // 2. Si es un link de Drive, lo convertimos a link directo
            if (linkImagen.includes("drive.google.com")) {
                const match = linkImagen.match(/id=([a-zA-Z0-9_-]+)/);
                if (match && match[1]) {
                    linkImagen = `https://drive.google.com/uc?export=view&id=${match[1]}`;
                }
            }

            // 3. El link de la imagen divertida de reemplazo
            const fotoSimpson = "nodisponible.png";
            
            return {
                id: fila.c[0].v.toString(),
                nombre: fila.c[1] ? fila.c[1].v : "Sin nombre",
                categoria: fila.c[2] ? fila.c[2].v : "Otros",
                precio: fila.c[3] ? Number(fila.c[3].v) : 0,
                // Operador ternario: si hay imagen, la usa. Si no, usa el placeholder
                imagen: linkImagen ? linkImagen : fotoSimpson,
                stock: fila.c[5] ? Number(fila.c[5].v) : 0
            };

        }).filter(producto => producto !== null);

        return true;
    } catch (error) {
        console.error("Error cargando el catálogo:", error);
        return false;
    }
}