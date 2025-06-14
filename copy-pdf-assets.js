// copy-pdf-assets.js
const fs = require('fs-extra');
const path = require('path');

const DEST_DIR = 'public/pdf-assets';
const SOURCE_DIR = 'node_modules/pdfjs-dist/build';

async function copyPdfJsAssets() {
  try {
    console.log(`[Script de copia] Iniciando copia de assets de pdfjs-dist a ${DEST_DIR}...`);
    await fs.emptyDir(DEST_DIR);
    console.log(`[Script de copia] Carpeta '${DEST_DIR}' limpia/creada.`);

    const workerSourcePath = path.join(SOURCE_DIR, 'pdf.worker.min.mjs');
    const workerDestPath = path.join(DEST_DIR, 'pdf.worker.min.mjs');
    await fs.copy(workerSourcePath, workerDestPath);
    console.log(`[Script de copia] 'pdf.worker.min.mjs' copiado.`);

    // --- REVISIÓN DEL FILTRADO DE WASM (podría ser la causa si no está el WASM) ---
    // Asegurémonos de que esto sea más robusto al listar los archivos
    const buildContents = await fs.readdir(SOURCE_DIR, { withFileTypes: true }); // Leer con tipos de archivo
    const wasmFiles = buildContents.filter(dirent => dirent.isFile() && dirent.name.endsWith('.wasm'));

    for (const wasmFile of wasmFiles) {
      const wasmSourcePath = path.join(SOURCE_DIR, wasmFile.name);
      const wasmDestPath = path.join(DEST_DIR, wasmFile.name);
      await fs.copy(wasmSourcePath, wasmDestPath);
      console.log(`[Script de copia] '${wasmFile.name}' copiado.`);
    }

    const fontsSourcePath = path.join(SOURCE_DIR, 'standard_fonts');
    const fontsDestPath = path.join(DEST_DIR, 'standard_fonts');
    if (await fs.pathExists(fontsSourcePath)) {
        await fs.copy(fontsSourcePath, fontsDestPath);
        console.log(`[Script de copia] Carpeta 'standard_fonts' copiada.`);
    } else {
        console.warn(`[Script de copia] Advertencia: La carpeta 'standard_fonts' no se encontró en ${fontsSourcePath}.`);
    }

    console.log('[Script de copia] Todos los assets de pdfjs-dist copiados exitosamente.');

  } catch (err) {
    console.error('[Script de copia] ERROR al copiar assets de pdfjs-dist:', err);
    process.exit(1);
  }
}

copyPdfJsAssets();