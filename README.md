# sheet→md · Conversor de hojas de cálculo a Markdown

Aplicación web estática que convierte archivos Excel (.xlsx, .xls) y CSV (.csv) en tablas Markdown. **Todo el procesamiento ocurre en el navegador** — tus datos nunca se suben a ningún servidor.

🔗 **Demo en vivo:** `https://TU-USUARIO.github.io/sheet-to-md`

---

## Características

- ✅ Soporta `.xlsx`, `.xls` y `.csv`
- ✅ Selector de hoja (para archivos con múltiples hojas)
- ✅ Opción para tratar la primera fila como cabecera
- ✅ Alineación automática de columnas
- ✅ Vista previa de tabla renderizada
- ✅ Visualización del código Markdown generado
- ✅ Copiar al portapapeles y descarga directa
- ✅ Drag & drop
- ✅ Procesamiento 100% local (sin servidor, sin tracking)
- ✅ Responsive para móviles

---

## Despliegue en GitHub Pages

### Opción A — Automático con GitHub Actions (recomendado)

1. **Haz un fork o crea un repositorio** con estos archivos.

2. Ve a **Settings → Pages** en tu repositorio de GitHub.

3. En *Source*, selecciona **"GitHub Actions"**.

4. Haz un push a `main`. El workflow `.github/workflows/deploy.yml` se encargará del despliegue automáticamente.

5. Tu app estará disponible en:
   ```
   https://TU-USUARIO.github.io/NOMBRE-DEL-REPO
   ```

### Opción B — Despliegue manual desde rama

1. Ve a **Settings → Pages**.
2. En *Source*, selecciona **"Deploy from a branch"**.
3. Elige la rama `main` y la carpeta `/ (root)`.
4. Guarda. GitHub tardará 1-2 minutos en publicar.

---

## Uso local

No requiere instalación ni servidor. Abre directamente en el navegador:

```bash
git clone https://github.com/TU-USUARIO/sheet-to-md.git
cd sheet-to-md
# Abre index.html en tu navegador
open index.html
```

> **Nota:** Para que la carga de archivos funcione correctamente en local, algunos navegadores requieren servir desde un servidor HTTP simple:
> ```bash
> python3 -m http.server 8080
> # Luego abre http://localhost:8080
> ```

---

## Estructura del proyecto

```
sheet-to-md/
├── index.html              # Aplicación principal
├── css/
│   └── style.css           # Estilos
├── js/
│   └── converter.js        # Lógica de conversión
├── .github/
│   └── workflows/
│       └── deploy.yml      # CI/CD para GitHub Pages
└── README.md
```

## Dependencias

- [SheetJS (xlsx)](https://sheetjs.com/) — cargada desde CDN para leer archivos Excel y CSV.
- [Space Mono](https://fonts.google.com/specimen/Space+Mono) + [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif) — tipografía desde Google Fonts.

No se usan frameworks ni herramientas de build. HTML, CSS y JS puro.

---

## Licencia

MIT — úsalo, modifícalo, distribúyelo libremente.
