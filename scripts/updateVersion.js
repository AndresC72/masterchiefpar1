const fs = require('fs');
const path = require('path');

// Ruta al archivo app.config.json
const configPath = path.join(__dirname, 'app.config.json');

// Leer el archivo app.config.json
fs.readFile(configPath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error al leer el archivo:', err);
        return;
    }

    // Parsear el contenido JSON
    const config = JSON.parse(data);

    // Incrementar el versionCode
    if (config.expo && config.expo.android) {
        config.expo.android.versionCode += 1; // Incrementar versionCode
    }

    // Incrementar la versión
    if (config.expo && config.expo.version) {
        const versionParts = config.expo.version.split('.').map(Number);
        versionParts[versionParts.length - 1] += 1; // Incrementar la última parte de la versión
        config.expo.version = versionParts.join('.'); // Actualizar la versión
    }

    // Escribir el nuevo contenido en el archivo
    fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Error al escribir el archivo:', err);
            return;
        }
        console.log('Version y versionCode actualizados correctamente.');
    });
});