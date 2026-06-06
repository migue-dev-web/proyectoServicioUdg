import { api, $, esc, on, requireAuth } from "./core.js";

requireAuth();

on("logOut", () => {
  localStorage.clear();
  location.href = "index.html";
});

// Saludo con el email de quien inició sesión
api("/perfil")
  .then((me) => ($("userName").textContent = me.usuario))
  .catch(() => {});

// Carga solo los formularios que este usuario puede ver (filtrados por su departamento en el backend)
(async () => {
  try {
    const forms = await api("/formularios/mis-formularios");
    if (!forms) return; // token vencido: api() ya redirige al login
    $("forms").innerHTML = forms.length
      ? forms
          .map(
            (f) =>
              `<a class="form-card" href="${esc(f.link)}" target="_blank" rel="noopener">
                 ${esc(f.nombre)}
                 <span class="dept">${esc(f.nombre_departamento)}</span>
               </a>`,
          )
          .join("")
      : `<div class="empty">No tienes formularios asignados por el momento.</div>`;
  } catch (e) {
    $("forms").innerHTML =
      `<div class="empty">Error al cargar: ${esc(e.message)}</div>`;
  }
})();
