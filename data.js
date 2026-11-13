// Данные товаров. Размеры пока временные (S, M, L), цены и названия из Instagram.
// soldOut: true означает, что товар распродан (кнопка «В корзину» отключается).
const PRODUCTS = [
  { id: "nfr-hoodie", name: "Худи NFR",      collection: "NFR",     price: 2900, sizes: ["S","M","L"], soldOut: true, images: ["hoodie-1.jpg","hoodie-2.jpg","hoodie-3.jpg"], description: "КОЛИЧЕСТВО ОГРАНИЧЕНО" },
  { id: "nfr-pants",  name: "Штаны NFR",     collection: "NFR",     price: 3300, sizes: ["S","M","L"], soldOut: true, images: ["pants-1.jpg","pants-2.jpg","pants-3.jpg"],    description: "КОЛИЧЕСТВО ОГРАНИЧЕНО" },
  { id: "hm-shorts",  name: "Шорты HATE ME", collection: "HATE ME", price: 2200, sizes: ["S","M","L"],                images: ["shorts-1.jpg","shorts-2.jpg"],               description: "КОЛИЧЕСТВО ОГРАНИЧЕНО" }
];
