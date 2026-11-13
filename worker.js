// Показывает сайт и принимает заказы по адресу /api/order, отправляя их в Telegram.
// Секреты BOT_TOKEN и CHAT_ID хранятся в настройках Cloudflare, не в коде.
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

const clean = env => ({
  token: String(env.BOT_TOKEN || "").trim(),
  chat: String(env.CHAT_ID || "").trim().replace(/^id:\s*/i, "")
});

async function tg(token, method, payload) {
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload || {})
  });
  let j = {};
  try { j = await r.json(); } catch {}
  return { ok: r.ok && j.ok === true, description: j.description || ("HTTP " + r.status) };
}

async function handleOrder(request, env) {
  const { token, chat } = clean(env);
  if (!token || !chat) return json({ ok: false, error: "not_configured" }, 500);
  let d;
  try { d = await request.json(); } catch { return json({ ok: false, error: "bad_json" }, 400); }
  if (d.website) return json({ ok: true });

  const s = (v, n) => String(v ?? "").trim().slice(0, n);
  const name = s(d.name, 100), phone = s(d.phone, 30), delivery = s(d.delivery, 30);
  const city = s(d.city, 100), branch = s(d.branch, 100), payment = s(d.payment, 40), comment = s(d.comment, 500);
  const items = (Array.isArray(d.items) ? d.items.slice(0, 20) : []).map(i => ({
    name: s(i.name, 80), size: s(i.size, 10),
    qty: Math.min(10, Math.max(1, parseInt(i.qty) || 1)), price: Math.max(0, Number(i.price) || 0)
  }));
  if (!name || !phone || !city || !branch || !items.length) return json({ ok: false, error: "bad_data" }, 400);

  const fmt = n => n.toLocaleString("ru-RU").replace(/\u00a0/g, " ") + " ₴";
  const total = items.reduce((t, i) => t + i.price * i.qty, 0);
  const text = [
    "НОВЫЙ ЗАКАЗ", "",
    ...items.map(i => `${i.name}, размер ${i.size} × ${i.qty} = ${fmt(i.price * i.qty)}`),
    `Итого: ${fmt(total)}`, "",
    `Получатель: ${name}`, `Телефон: ${phone}`,
    `Доставка: ${delivery}, ${city}, ${branch}`,
    `Оплата: ${payment}`, `Комментарий: ${comment || "—"}`
  ].join("\n");

  const res = await tg(token, "sendMessage", { chat_id: chat, text });
  if (!res.ok) return json({ ok: false, error: "telegram_failed", detail: res.description }, 502);
  return json({ ok: true });
}

// Проверка настроек: открой /api/check в браузере. Секреты не показывает.
async function handleCheck(env) {
  const { token, chat } = clean(env);
  if (!token || !chat) return json({ hasToken: !!token, hasChatId: !!chat });
  const me = await tg(token, "getMe");
  const c = await tg(token, "getChat", { chat_id: chat });
  return json({ botOk: me.ok, botInfo: me.ok ? "ok" : me.description, chatOk: c.ok, chatInfo: c.ok ? "ok" : c.description });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/check") return handleCheck(env);
    if (url.pathname === "/api/order") {
      if (request.method !== "POST") return json({ ok: false }, 405);
      return handleOrder(request, env);
    }
    return env.ASSETS.fetch(request);
  }
};
