const fmt = n => n.toLocaleString("ru-RU").replace(/\u00a0/g, " ") + " ₴";

function renderGrid(el, filter) {
  const items = PRODUCTS.filter(p => !filter || p.collection === filter);
  el.innerHTML = items.map(p => `
    <a class="card" href="product.html?id=${p.id}">
      <div class="ph"><img src="${p.images[0]}" alt="${p.name}" loading="lazy"></div>
      <div class="card-name">${p.name}</div>
      <div class="card-price">${fmt(p.price)}</div>
    </a>`).join("");
}

function renderProduct(el) {
  const id = new URLSearchParams(location.search).get("id");
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) { el.innerHTML = "<p>Товар не найден. <a href='catalog.html'>В каталог</a></p>"; return; }
  document.title = p.name + " — ceocleef";
  el.innerHTML = `
    <div class="gallery"><div class="ph tall"><img id="main-img" src="${p.images[0]}" alt="${p.name}"></div>
      <div class="thumbs">${p.images.map((s, i) => `<button class="thumb" aria-label="Фото ${i + 1}" data-src="${s}"><img src="${s}" alt=""></button>`).join("")}</div></div>
    <div>
      <div class="eyebrow">${p.collection}</div>
      <h1 class="h1">${p.name}</h1>
      <div class="price">${fmt(p.price)}</div>
      <div class="eyebrow">Размер</div>
      <div class="sizes">${p.sizes.map((s, i) => `<button class="size" aria-pressed="${i === 0}">${s}</button>`).join("")}</div>
      <button class="btn" id="add">В корзину</button>
      <p class="desc" id="added" hidden>Добавлено. <a href="cart.html" style="text-decoration:underline">Перейти в корзину</a></p>
      <p class="desc">${p.description}</p>
    </div>`;
  el.querySelectorAll(".thumb").forEach(t => t.addEventListener("click", () => { document.getElementById("main-img").src = t.dataset.src; }));
  document.getElementById("add").addEventListener("click", () => {
    const size = el.querySelector('.size[aria-pressed="true"]').textContent;
    addToCart(p.id, size);
    document.getElementById("added").hidden = false;
  });
  el.querySelectorAll(".size").forEach(b => b.addEventListener("click", () => {
    el.querySelectorAll(".size").forEach(x => x.setAttribute("aria-pressed", "false"));
    b.setAttribute("aria-pressed", "true");
  }));
}

/* ---------- Корзина (хранится в браузере покупателя) ---------- */
const CART_KEY = "ceocleef_cart";
function getCart() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; } }
function saveCart(c) { try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) {} updateCartCount(); }
function addToCart(id, size) {
  const c = getCart();
  const line = c.find(l => l.id === id && l.size === size);
  if (line) line.qty = Math.min(10, line.qty + 1); else c.push({ id, size, qty: 1 });
  saveCart(c);
}
function updateCartCount() {
  const n = getCart().reduce((s, l) => s + l.qty, 0);
  const el = document.getElementById("cart-count");
  if (el) el.textContent = n;
}
function cartLines() {
  return getCart().map(l => ({ ...l, p: PRODUCTS.find(x => x.id === l.id) })).filter(l => l.p);
}
function cartTotal() { return cartLines().reduce((s, l) => s + l.p.price * l.qty, 0); }

function renderCart() {
  const root = document.getElementById("cart");
  const lines = cartLines();
  document.getElementById("checkout").hidden = lines.length === 0;
  if (!lines.length) { root.innerHTML = '<p>Корзина пуста. <a href="catalog.html" style="text-decoration:underline">В каталог</a></p>'; return; }
  root.innerHTML = lines.map((l, i) => `
    <div class="cart-row">
      <div class="cart-img"><img src="${l.p.images[0]}" alt="${l.p.name}"></div>
      <div>
        <div class="card-name">${l.p.name}</div>
        <div class="card-price">Размер ${l.size} · ${fmt(l.p.price)}</div>
        <div class="qty">
          <button data-act="minus" data-i="${i}" aria-label="Меньше">−</button>
          <span>${l.qty}</span>
          <button data-act="plus" data-i="${i}" aria-label="Больше">+</button>
          <button data-act="del" data-i="${i}" class="del">Удалить</button>
        </div>
      </div>
    </div>`).join("") + `<div class="total">Итого: ${fmt(cartTotal())}</div>`;
}

function initCart() {
  renderCart();
  document.getElementById("cart").addEventListener("click", e => {
    const b = e.target.closest("button[data-act]"); if (!b) return;
    const c = getCart(), l = cartLines()[+b.dataset.i];
    const line = c.find(x => x.id === l.id && x.size === l.size);
    if (b.dataset.act === "plus") line.qty = Math.min(10, line.qty + 1);
    if (b.dataset.act === "minus") line.qty = Math.max(1, line.qty - 1);
    if (b.dataset.act === "del") c.splice(c.indexOf(line), 1);
    saveCart(c); renderCart();
  });
  document.getElementById("order-form").addEventListener("submit", async e => {
    e.preventDefault();
    const f = new FormData(e.target), btn = e.target.querySelector("button[type=submit]");
    const payload = {
      name: f.get("name"), phone: f.get("phone"), delivery: f.get("delivery"), city: f.get("city"),
      branch: f.get("branch"), payment: f.get("payment"), comment: f.get("comment") || "", website: f.get("website") || "",
      items: cartLines().map(l => ({ name: l.p.name, size: l.size, qty: l.qty, price: l.p.price }))
    };
    btn.disabled = true; btn.textContent = "Отправляем...";
    let ok = false;
    try {
      const r = await fetch("/api/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = await r.json(); ok = r.ok && j.ok === true;
    } catch (err) { ok = false; }
    btn.disabled = false; btn.textContent = "Оформить заказ";
    const box = document.getElementById("result");
    box.hidden = false; box.classList.toggle("ok", ok);
    document.getElementById("result-title").textContent = ok ? "Заказ отправлен" : "Не удалось отправить заказ";
    document.getElementById("result-text").textContent = ok
      ? "Спасибо! Мы свяжемся с вами для подтверждения."
      : "Проверьте интернет и попробуйте ещё раз. Если не получается, напишите нам в Instagram.";
    if (ok) { e.target.reset(); saveCart([]); renderCart(); }
    box.scrollIntoView();
  });
}
updateCartCount();
