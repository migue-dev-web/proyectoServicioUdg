import { API } from "./config.js";

// Re-exporto API para que las páginas importen todo desde un solo lugar.
export { API };

// --- DOM ---
export const $ = (id) => document.getElementById(id);
export const val = (id) => $(id).value.trim();
export const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

// --- Sesión ---
export const token = () => localStorage.getItem("token");

// Llama esto al inicio de cada página protegida.
export function requireAuth() {
  if (!token()) location.href = "index.html";
}

// --- Fetch con token + manejo de errores en un solo lugar ---
export async function api(path, method = "GET", body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      ...(token() && { Authorization: `Bearer ${token()}` }),
      ...(body && { "Content-Type": "application/json" }),
    },
    body: body && JSON.stringify(body),
  });
  // Mejora añadida: si el token venció, de vuelta al login.
  if (res.status === 401) {
    localStorage.clear();
    location.href = "index.html";
    return;
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Error");
  return data;
}

// Asigna onclick y atrapa errores en un solo lugar.
export const on = (id, fn) =>
  ($(id).onclick = async () => {
    try {
      await fn();
    } catch (e) {
      alert("Error: " + e.message);
    }
  });
