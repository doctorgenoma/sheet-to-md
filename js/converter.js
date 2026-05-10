/* ─── sheet→md converter · converter.js ───────────────────── */

(function () {
  "use strict";

  /* ── DOM refs ────────────────────────────────────────────── */
  const uploadZone   = document.getElementById("uploadZone");
  const fileInput    = document.getElementById("fileInput");
  const optionsBar   = document.getElementById("optionsBar");
  const outputArea   = document.getElementById("outputArea");
  const errorMsg     = document.getElementById("errorMsg");
  const errorText    = document.getElementById("errorText");
  const fileName     = document.getElementById("fileName");
  const sheetSelect  = document.getElementById("sheetSelect");
  const headerRow    = document.getElementById("headerRow");
  const alignColumns = document.getElementById("alignColumns");
  const resetBtn     = document.getElementById("resetBtn");
  const previewTable = document.getElementById("previewTable");
  const rawOutput    = document.getElementById("rawOutput");
  const copyBtn      = document.getElementById("copyBtn");
  const downloadBtn  = document.getElementById("downloadBtn");
  const toast        = document.getElementById("toast");
  const tabBtns      = document.querySelectorAll(".tab-btn");

  /* ── State ───────────────────────────────────────────────── */
  let workbook = null;
  let currentFile = null;
  let markdownOutput = "";

  /* ── Drag & drop ─────────────────────────────────────────── */
  ["dragenter", "dragover"].forEach(e =>
    uploadZone.addEventListener(e, ev => {
      ev.preventDefault();
      uploadZone.classList.add("drag-over");
    })
  );

  ["dragleave", "drop"].forEach(e =>
    uploadZone.addEventListener(e, ev => {
      ev.preventDefault();
      uploadZone.classList.remove("drag-over");
    })
  );

  uploadZone.addEventListener("drop", ev => {
    const file = ev.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  /* ── Sheet / option changes ──────────────────────────────── */
  sheetSelect.addEventListener("change", () => workbook && renderSheet());
  headerRow.addEventListener("change", () => workbook && renderSheet());
  alignColumns.addEventListener("change", () => workbook && renderSheet());

  /* ── Reset ───────────────────────────────────────────────── */
  resetBtn.addEventListener("click", reset);

  /* ── Tabs ────────────────────────────────────────────────── */
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.tab;
      document.getElementById("tab-preview").classList.toggle("hidden", tab !== "preview");
      document.getElementById("tab-raw").classList.toggle("hidden", tab !== "raw");
    });
  });

  /* ── Copy ────────────────────────────────────────────────── */
  copyBtn.addEventListener("click", async () => {
    if (!markdownOutput) return;
    try {
      await navigator.clipboard.writeText(markdownOutput);
      showToast("✓ Copiado al portapapeles");
    } catch {
      showToast("⚠ Usa Ctrl+C sobre el código");
    }
  });

  /* ── Download ────────────────────────────────────────────── */
  downloadBtn.addEventListener("click", () => {
    if (!markdownOutput) return;
    const blob = new Blob([markdownOutput], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const base = currentFile ? currentFile.name.replace(/\.[^.]+$/, "") : "tabla";
    a.href = url;
    a.download = base + ".md";
    a.click();
    URL.revokeObjectURL(url);
    showToast("↓ Descarga iniciada");
  });

  /* ── File handler ────────────────────────────────────────── */
  function handleFile(file) {
    hideError();

    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      showError("Formato no soportado. Usa .xlsx, .xls o .csv");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showError("El archivo supera el límite de 10 MB");
      return;
    }

    currentFile = file;
    const reader = new FileReader();

    reader.onload = ev => {
      try {
        const data = ev.target.result;

        if (ext === "csv") {
          // Parse CSV directly
          workbook = XLSX.read(data, { type: "string" });
        } else {
          workbook = XLSX.read(new Uint8Array(data), { type: "array" });
        }

        populateSheets();
        renderSheet();

        fileName.textContent = file.name;
        optionsBar.style.display = "flex";
        uploadZone.style.display = "none";
      } catch (err) {
        showError("Error al leer el archivo: " + (err.message || "formato inválido"));
      }
    };

    reader.onerror = () => showError("No se pudo leer el archivo");

    if (ext === "csv") {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }

  /* ── Populate sheet selector ─────────────────────────────── */
  function populateSheets() {
    sheetSelect.innerHTML = "";
    workbook.SheetNames.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      sheetSelect.appendChild(opt);
    });
    // Show/hide sheet selector based on number of sheets
    const wrapper = sheetSelect.closest(".option-item");
    wrapper.style.display = workbook.SheetNames.length > 1 ? "flex" : "none";
  }

  /* ── Render current sheet ────────────────────────────────── */
  function renderSheet() {
    const sheetName = sheetSelect.value || workbook.SheetNames[0];
    const ws = workbook.Sheets[sheetName];
    const useHeader = headerRow.checked;
    const align = alignColumns.checked;

    const rows = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: "",
      raw: false,
    });

    if (!rows || rows.length === 0) {
      showError("La hoja seleccionada está vacía");
      return;
    }

    hideError();
    markdownOutput = rowsToMarkdown(rows, useHeader, align);

    // Preview
    previewTable.innerHTML = buildHTMLTable(rows, useHeader);

    // Raw
    rawOutput.textContent = markdownOutput;

    outputArea.style.display = "block";
  }

  /* ── Convert rows → Markdown ─────────────────────────────── */
  function rowsToMarkdown(rows, useHeader, align) {
    if (!rows.length) return "";

    // Normalize: find max column count
    const maxCols = rows.reduce((m, r) => Math.max(m, r.length), 0);
    const normalized = rows.map(r => {
      const padded = [...r];
      while (padded.length < maxCols) padded.push("");
      return padded.map(cell => sanitizeCell(String(cell)));
    });

    // Column widths for alignment
    const colWidths = Array.from({ length: maxCols }, (_, ci) =>
      align
        ? Math.max(...normalized.map(r => (r[ci] || "").length), 3)
        : 0
    );

    const padCell = (text, width) =>
      align ? text.padEnd(width, " ") : text;

    const buildRow = (cells) =>
      "| " + cells.map((c, i) => padCell(c, colWidths[i])).join(" | ") + " |";

    const buildSep = () =>
      "| " + colWidths.map(w => align ? "-".repeat(Math.max(w, 3)) : "---").join(" | ") + " |";

    const lines = [];

    if (useHeader && normalized.length >= 1) {
      lines.push(buildRow(normalized[0]));
      lines.push(buildSep());
      for (let i = 1; i < normalized.length; i++) {
        lines.push(buildRow(normalized[i]));
      }
    } else {
      // No header: generate generic headers col1, col2, …
      const genericHeader = Array.from({ length: maxCols }, (_, i) => `col${i + 1}`);
      const colW = align
        ? genericHeader.map((h, i) => Math.max(h.length, ...normalized.map(r => (r[i] || "").length), 3))
        : Array(maxCols).fill(0);

      const padC = (text, width) => align ? text.padEnd(width, " ") : text;
      const bRow = (cells, widths) => "| " + cells.map((c, i) => padC(c, widths[i])).join(" | ") + " |";
      const bSep = (widths) => "| " + widths.map(w => align ? "-".repeat(Math.max(w, 3)) : "---").join(" | ") + " |";

      lines.push(bRow(genericHeader, colW));
      lines.push(bSep(colW));
      normalized.forEach(row => lines.push(bRow(row, colW)));
    }

    return lines.join("\n");
  }

  /* ── Sanitize cell for Markdown ──────────────────────────── */
  function sanitizeCell(text) {
    return text
      .replace(/\r?\n/g, " ")   // newlines → space
      .replace(/\|/g, "\\|")    // escape pipes
      .trim();
  }

  /* ── Build HTML preview table ────────────────────────────── */
  function buildHTMLTable(rows, useHeader) {
    if (!rows.length) return "<p style='padding:1rem;opacity:0.5'>Sin datos</p>";

    const maxCols = rows.reduce((m, r) => Math.max(m, r.length), 0);
    let html = "<table>";

    rows.forEach((row, ri) => {
      html += "<tr>";
      for (let ci = 0; ci < maxCols; ci++) {
        const cell = row[ci] !== undefined ? String(row[ci]) : "";
        const escaped = cell
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        if (ri === 0 && useHeader) {
          html += `<th>${escaped}</th>`;
        } else {
          html += `<td>${escaped}</td>`;
        }
      }
      html += "</tr>";
    });

    html += "</table>";
    return html;
  }

  /* ── Reset state ─────────────────────────────────────────── */
  function reset() {
    workbook = null;
    currentFile = null;
    markdownOutput = "";
    fileInput.value = "";
    optionsBar.style.display = "none";
    outputArea.style.display = "none";
    uploadZone.style.display = "block";
    previewTable.innerHTML = "";
    rawOutput.textContent = "";
    sheetSelect.innerHTML = "";
    hideError();
  }

  /* ── Error helpers ───────────────────────────────────────── */
  function showError(msg) {
    errorText.textContent = msg;
    errorMsg.style.display = "flex";
  }

  function hideError() { errorMsg.style.display = "none"; }

  /* ── Toast ───────────────────────────────────────────────── */
  let toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

})();
