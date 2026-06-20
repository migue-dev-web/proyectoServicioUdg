import { api, $, val, on, esc, notify, confirmDialog, clear, safeUrl } from "../core.js";

const sheetId = (s) => {
  const m = String(s).match(/\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : s.trim();
};

export async function loadFormSelects() {
  const fs = await api("/formularios/mis-formularios");
  const placeholder = `<option value="">— selecciona formulario —</option>`;
  const opts = fs
    .map(
      (f) =>
        `<option value="${f.id}">#${f.id} · ${esc(f.nombre)} — ${esc(f.nombre_departamento)}</option>`,
    )
    .join("");
  $("eSelect").innerHTML = placeholder + opts;
  $("xSelect").innerHTML = placeholder + opts;
}

export function initFormularios() {
  loadFormSelects();

  on("fCrear", async () => {
    if (!val("fNombre") || !val("fLink") || !val("fSheet") || !val("fDepto"))
      return notify("Nombre, link, Google Sheets y departamento son obligatorios.", "error");
    if (safeUrl(val("fLink")) === "#")
      return notify("El link del formulario debe ser una URL válida (http o https).", "error");
    const sheet = val("fSheet");
    const esEnlaceSheets = /docs\.google\.com\/spreadsheets/i.test(sheet);
    const esIdSuelto = /^[a-zA-Z0-9_-]{20,}$/.test(sheet);
    if (!esEnlaceSheets && !esIdSuelto)
      return notify("Pega el enlace de Google Sheets completo o su ID.", "error");
    const f = await api("/formularios", "POST", {
      nombre: val("fNombre"),
      link: val("fLink"),
      sheet_id: sheetId(val("fSheet")),
      id_departamento: +val("fDepto"),
    });
    clear("fNombre", "fLink", "fSheet");
    await loadFormSelects();
    notify(`Formulario #${f.id} "${f.nombre}" añadido (${f.nombre_departamento}).`);
  });

  on("fConsultar", async () => {
    const fs = await api("/formularios/mis-formularios");
    $("modalTitle").textContent = "Formularios existentes";
    $("modalBody").innerHTML = fs.length
      ? fs
          .map(
            (f) =>
              `<div class="modal-item">ID: ${esc(f.id)}<br>Nombre: ${esc(f.nombre)}<br>Link: <a href="${esc(safeUrl(f.link))}" target="_blank" rel="noopener">${esc(f.link)}</a><br>Sheet ID: ${esc(f.sheet_id || "—")}<br>Depto: ${esc(f.nombre_departamento)}</div>`,
          )
          .join("")
      : "No hay formularios.";
    $("modal").showModal();
  });

  on("eGuardar", async () => {
    const id = $("eSelect").value;
    if (!id) return notify("Selecciona un formulario.", "error");
    const c = {};
    if (val("eNombre")) c.nombre = val("eNombre");
    if (val("eLink")) c.link = val("eLink");
    if (val("eSheet")) c.sheet_id = sheetId(val("eSheet"));
    if ($("eDepto").value) c.id_departamento = +$("eDepto").value;
    const f = await api(`/formularios/${id}`, "PUT", c);
    clear("eSelect", "eNombre", "eLink", "eSheet", "eDepto");
    await loadFormSelects();
    notify(`Editado: #${f.id} "${f.nombre}" → ${f.link} (${f.nombre_departamento}).`);
  });

  on("xBorrar", async () => {
    const id = $("xSelect").value;
    if (!id) return notify("Selecciona un formulario.", "error");
    const nombre = $("xSelect").options[$("xSelect").selectedIndex].text;
    if (!(await confirmDialog(`¿Eliminar el formulario "${nombre}"?`, "Eliminar"))) return;
    await api(`/formularios/${id}`, "DELETE");
    await loadFormSelects();
    notify(`Formulario "${nombre}" eliminado.`);
  });
}
