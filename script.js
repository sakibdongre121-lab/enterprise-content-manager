const productGrid = document.querySelector("#product-grid");
const searchInput = document.querySelector("#search-input");
const categoryFilters = document.querySelector("#category-filters");
const resultCount = document.querySelector("#result-count");
const noResults = document.querySelector("#no-results");
const cartDrawer = document.querySelector("#cart-drawer");
const drawerBackdrop = document.querySelector("#drawer-backdrop");
const cartItemsElement = document.querySelector("#cart-items");
const cartCount = document.querySelector("#cart-count");
const toast = document.querySelector("#toast");
const cart = new Map();
const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});
let selectedCategory = "all";
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2500);
}

function visibleProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const products = [...productGrid.querySelectorAll(".product-card")];
  let visible = 0;
  products.forEach((product) => {
    const categoryMatches = selectedCategory === "all" || product.dataset.category === selectedCategory;
    const searchMatches = !query || `${product.dataset.name} ${product.dataset.category} ${product.textContent}`.toLowerCase().includes(query);
    product.hidden = !(categoryMatches && searchMatches);
    if (!product.hidden) visible++;
  });
  const noun = visible === 1 ? "good thing" : "good things";
  resultCount.textContent = `Showing ${visible} ${noun}`;
  noResults.hidden = visible > 0;
}

function sortProducts() {
  const sort = document.querySelector("#sort-products").value;
  const products = [...productGrid.querySelectorAll(".product-card")];
  products.sort((a, b) => {
    if (sort === "price-low") return Number(a.dataset.price) - Number(b.dataset.price);
    if (sort === "price-high") return Number(b.dataset.price) - Number(a.dataset.price);
    if (sort === "name") return a.dataset.name.localeCompare(b.dataset.name);
    return Number(a.dataset.originalOrder) - Number(b.dataset.originalOrder);
  });
  products.forEach((product) => productGrid.append(product));
  visibleProducts();
}

[...productGrid.querySelectorAll(".product-card")].forEach((product, index) => {
  product.dataset.originalOrder = index;
});

categoryFilters.addEventListener("click", (event) => {
  const button = event.target.closest(".filter-chip");
  if (!button) return;
  categoryFilters.querySelector(".active").classList.remove("active");
  button.classList.add("active");
  selectedCategory = button.dataset.category;
  visibleProducts();
});

searchInput.addEventListener("input", visibleProducts);
document.querySelector("#sort-products").addEventListener("change", sortProducts);
const mobileSearchButton = document.querySelector("#mobile-search-button");
const headerSearch = mobileSearchButton.closest(".header-search");
mobileSearchButton.addEventListener("click", () => {
  headerSearch.classList.add("search-open");
  searchInput.focus();
});
searchInput.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !headerSearch.classList.contains("search-open")) return;
  headerSearch.classList.remove("search-open");
  searchInput.value = "";
  visibleProducts();
  mobileSearchButton.focus();
});
document.querySelector("#clear-filters").addEventListener("click", () => {
  searchInput.value = "";
  selectedCategory = "all";
  categoryFilters.querySelector(".active").classList.remove("active");
  categoryFilters.querySelector('[data-category="all"]').classList.add("active");
  document.querySelector("#sort-products").value = "featured";
  sortProducts();
});

function openCart() {
  document.body.classList.add("cart-open", "no-scroll");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.querySelector("#close-cart").focus();
}

function closeCart() {
  document.body.classList.remove("cart-open", "no-scroll");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.querySelector("#open-cart").focus();
}

document.querySelector("#open-cart").addEventListener("click", openCart);
document.querySelector("#close-cart").addEventListener("click", closeCart);
drawerBackdrop.addEventListener("click", closeCart);
document.querySelector("#continue-shopping").addEventListener("click", closeCart);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.body.classList.contains("cart-open")) closeCart();
});

function getCartQuantity() {
  return [...cart.values()].reduce((sum, item) => sum + item.quantity, 0);
}

function updateCart() {
  const quantity = getCartQuantity();
  const subtotal = [...cart.values()].reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartCount.textContent = quantity;
  document.querySelector("#drawer-count").textContent = `(${quantity})`;
  document.querySelector("#cart-empty").hidden = quantity > 0;
  document.querySelector("#drawer-footer").hidden = quantity === 0;

  cartItemsElement.replaceChildren();
  cart.forEach((item, id) => {
    const row = document.createElement("article");
    row.className = "cart-line";
    const image = document.createElement("img");
    image.src = item.image;
    image.alt = item.name;
    const info = document.createElement("div");
    info.className = "cart-line-info";
    const category = document.createElement("span");
    category.textContent = item.category.toUpperCase();
    const name = document.createElement("h3");
    name.textContent = item.name;
    const price = document.createElement("strong");
    price.textContent = inrFormatter.format(item.price);
    const quantityControl = document.createElement("div");
    quantityControl.className = "quantity-control";
    const decrease = document.createElement("button");
    decrease.type = "button";
    decrease.dataset.cartAction = "decrease";
    decrease.dataset.productId = id;
    decrease.setAttribute("aria-label", `Remove one ${item.name}`);
    decrease.textContent = "−";
    const quantityLabel = document.createElement("span");
    quantityLabel.textContent = item.quantity;
    const increase = document.createElement("button");
    increase.type = "button";
    increase.dataset.cartAction = "increase";
    increase.dataset.productId = id;
    increase.setAttribute("aria-label", `Add one ${item.name}`);
    increase.textContent = "+";
    quantityControl.append(decrease, quantityLabel, increase);
    info.append(category, name, price, quantityControl);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-item";
    remove.dataset.cartAction = "remove";
    remove.dataset.productId = id;
    remove.textContent = "Remove";
    row.append(image, info, remove);
    cartItemsElement.append(row);
  });

  document.querySelector("#cart-subtotal").textContent = inrFormatter.format(subtotal);
  const shippingGoal = 4758;
  const remaining = Math.max(0, shippingGoal - subtotal);
  document.querySelector("#shipping-note").textContent = remaining > 0
    ? `You're ${inrFormatter.format(remaining)} away from free shipping.`
    : "You've unlocked free shipping. Nice one!";
  document.querySelector("#shipping-progress").style.width = `${Math.min(100, (subtotal / shippingGoal) * 100)}%`;
}

productGrid.addEventListener("click", (event) => {
  const addButton = event.target.closest(".quick-add");
  if (addButton) {
    const product = addButton.closest(".product-card");
    const id = product.dataset.productId;
    const item = cart.get(id);
    if (item) item.quantity++;
    else {
      cart.set(id, {
        name: product.dataset.name,
        price: Number(product.dataset.price),
        category: product.dataset.category,
        image: product.querySelector("img").src,
        quantity: 1
      });
    }
    updateCart();
    showToast(`${product.dataset.name} added to your basket.`);
    return;
  }

  const favorite = event.target.closest(".favorite-button");
  if (favorite) {
    const isFavorite = favorite.classList.toggle("is-favorite");
    favorite.textContent = isFavorite ? "♥" : "♡";
    favorite.setAttribute("aria-pressed", String(isFavorite));
    showToast(isFavorite ? "Saved to your favorites." : "Removed from your favorites.");
  }
});

cartItemsElement.addEventListener("click", (event) => {
  const button = event.target.closest("[data-cart-action]");
  if (!button) return;
  const { cartAction, productId } = button.dataset;
  const item = cart.get(productId);
  if (!item) return;
  if (cartAction === "remove" || (cartAction === "decrease" && item.quantity === 1)) {
    cart.delete(productId);
  } else if (cartAction === "decrease") {
    item.quantity--;
  } else if (cartAction === "increase") {
    item.quantity++;
  }
  updateCart();
});

document.querySelector("#checkout-button").addEventListener("click", () => {
  if (cart.size === 0) {
    showToast("Add something lovely to your bag first.");
    return;
  }
  showToast("Thanks for shopping Sakib's Market — checkout is a demo.");
});

const menuButton = document.querySelector("#mobile-menu-button");
const mobileNav = document.querySelector("#mobile-nav");
menuButton.addEventListener("click", () => {
  const isOpen = mobileNav.classList.toggle("is-open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});
mobileNav.addEventListener("click", (event) => {
  if (!event.target.closest("a")) return;
  mobileNav.classList.remove("is-open");
  menuButton.setAttribute("aria-expanded", "false");
});

document.querySelector("#newsletter-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.querySelector("#email-input");
  if (!email.checkValidity()) {
    email.reportValidity();
    return;
  }
  showToast("You're on the list. Look out for a little note!");
  event.currentTarget.reset();
});