/* ================================
   Analytics Interview Ecommerce SPA
   Author: AI
   ================================ */

// --- Global State --------------------------------------------------
const state = {
  products: [
    {
      id: "p1",
      name: "GTM Pro Hoodie",
      basePrice: 59.99,
      category: "Apparel",
      description:
        "Premium hoodie for analytics pros. Soft, warm, and tracks events ;)",
      stock: 8,
      rating: 4.7,
    },
    {
      id: "p2",
      name: "GA4 Mug",
      basePrice: 14.99,
      category: "Merch",
      description: "Enjoy coffee while debugging events. Heat-sensitive print!",
      stock: 20,
      rating: 4.4,
    },
    {
      id: "p3",
      name: "DataLayer Socks",
      basePrice: 9.99,
      category: "Apparel",
      description: "Stay warm & push metrics. One size fits all.",
      stock: 32,
      rating: 4.8,
    },
  ],
  cart: [],
};

// --- dataLayer Wrapper & Debug Panel ------------------------------
window.dataLayer = window.dataLayer || [];

function initDataLayerDebug() {
  const originalPush = window.dataLayer.push.bind(window.dataLayer);
  const list = document.getElementById("dl-events");
  
  window.dataLayer.push = function (event) {
    // Log to debug panel
    if (list) {
      const li = document.createElement("li");
      li.innerHTML = `<pre style="font-size: 10px; margin: 4px 0; white-space: pre-wrap;">${JSON.stringify(event, null, 2)}</pre>`;
      list.prepend(li);
    }
    // Also send to original push
    return originalPush(event);
  };
}

function dlPush(obj) {
  window.dataLayer.push({
    event_time: Date.now(),
    ...obj,
  });
}

// --- Router --------------------------------------------------------
const app = document.getElementById("app");

function router() {
  const hash = location.hash.replace("#", "") || "/";
  const segments = hash.split("/").filter(Boolean);

  // Determine route
  if (segments.length === 0) {
    renderHome();
  } else if (segments[0] === "catalog") {
    renderCatalog();
  } else if (segments[0] === "product" && segments[1]) {
    renderProduct(segments[1]);
  } else if (segments[0] === "cart") {
    renderCart();
  } else if (segments[0] === "checkout") {
    renderCheckout();
  } else if (segments[0] === "confirmation") {
    renderConfirmation();
  } else if (segments[0] === "contact") {
    renderContact();
  } else if (segments[0] === "dashboard") {
    renderDashboard();
  } else {
    renderNotFound();
  }

  // Highlight nav active link
  document.querySelectorAll(".nav__link").forEach((a) => {
    a.classList.remove("active");
    const hrefHash = a.getAttribute("href").replace("#", "");
    if (hrefHash === hash) {
      a.classList.add("active");
    }
  });
}

// --- Virtual Pageview ---------------------------------------------
function pushVirtualPageview() {
  const page_location = location.href;
  const page_path = location.hash.slice(1) || "/";
  const page_title = "Analytico Shop - " + (page_path === "/" ? "Home" : page_path.slice(1));
  
  dlPush({
    event: "virtual_pageview",
    page_location,
    page_path,
    page_title,
  });
}

// --- Helper Utilities ---------------------------------------------
function money(value) {
  return "$" + value.toFixed(2);
}

function findProduct(id) {
  return state.products.find((p) => p.id === id);
}

function cartQuantity() {
  return state.cart.reduce((sum, item) => sum + item.qty, 0);
}

function updateCartCount() {
  const cartCountEl = document.getElementById("cart-count");
  if (cartCountEl) {
    cartCountEl.textContent = cartQuantity();
  }
}

// --- Render Functions ---------------------------------------------
function renderHome() {
  app.innerHTML = `
    <section class="hero">
      <h2 class="hero__title">Welcome to Analytico Shop</h2>
      <p class="mb-8">The playground for GA4 & GTM interview exercises.</p>
      <a href="#/catalog" class="btn btn--primary">Browse Products</a>
    </section>
    <div class="promo-banner">Use code <span class="code">GTM25</span> for 25% off Ã¢Â€Â“ dynamic offer updates every 8s!</div>
  `;
  
  // Dynamic promo code update
  const codeEl = app.querySelector(".promo-banner .code");
  if (codeEl) {
    const interval = setInterval(() => {
      if (!app.querySelector(".promo-banner .code")) {
        clearInterval(interval);
        return;
      }
      const code = "GTM" + Math.floor(10 + Math.random() * 90);
      codeEl.textContent = code;
    }, 8000);
  }
}

function renderCatalog() {
  const grid = state.products
    .map(
      (p) => `
      <div class="product-card" data-id="${p.id}">
        <h3 class="product-card__title">${p.name}</h3>
        <p class="product-card__price product-price current" data-base="${p.basePrice}">${money(p.basePrice)}</p>
        <div class="rating-stars" data-rating="${p.rating}">Ã¢Â­ÂÃ¯Â¸Â ${p.rating}</div>
        <button class="btn btn--secondary btn-add-cart" data-id="${p.id}">Add to Cart</button>
        <a href="#/product/${p.id}" class="btn btn--outline btn--sm">View</a>
      </div>`
    )
    .join("");

  app.innerHTML = `
    <h2 class="my-8">Catalog</h2>
    <div class="product-grid">${grid}</div>
  `;

  // Bind add to cart buttons
  app.querySelectorAll(".btn-add-cart").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = btn.dataset.id;
      addToCart(id);
    });
  });

  // Dynamic price fluctuation for DOM scraping
  app.querySelectorAll(".product-card").forEach((card) => {
    const priceEl = card.querySelector(".product-price");
    const base = Number(priceEl.dataset.base);
    const interval = setInterval(() => {
      if (!app.querySelector(`.product-card[data-id="${card.dataset.id}"]`)) {
        clearInterval(interval);
        return;
      }
      const delta = (Math.random() * 1 - 0.5) * 2; // Ã‚Â±1
      const newPrice = Math.max(0.99, base + delta);
      priceEl.textContent = money(newPrice);
    }, 5000);
  });

  dlPush({
    event: "view_item_list",
    item_list_name: "Catalog",
    items: state.products.map((p, idx) => ({
      item_id: p.id,
      item_name: p.name,
      index: idx + 1,
      price: p.basePrice,
    })),
  });
}

function renderProduct(id) {
  const p = findProduct(id);
  if (!p) return renderNotFound();

  app.innerHTML = `
    <h2 class="my-8">${p.name}</h2>
    <div class="flex gap-16 flex-col">
      <p class="product-card__price product-price current" id="product-price" data-base="${p.basePrice}">${money(p.basePrice)}</p>
      <div class="rating-stars" id="product-rating" data-rating="${p.rating}">Ã¢Â­ÂÃ¯Â¸Â ${p.rating}</div>
      <span class="stock-indicator">${p.stock > 0 ? "In Stock" : "Out of stock"}</span>
      <p>${p.description}</p>
      <button class="btn btn--secondary" id="btn-add" data-id="${p.id}">Add to Cart</button>

      <hr />
      <h3>Product Inquiry</h3>
      <form id="inquiry-form" class="form-section">
        <div class="form-group">
          <label class="form-label" for="inq-name">Name</label>
          <input class="form-control" id="inq-name" name="name" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="inq-email">Email</label>
          <input type="email" class="form-control" id="inq-email" name="email" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="inq-msg">Message</label>
          <textarea class="form-control" id="inq-msg" name="message" rows="3" required></textarea>
        </div>
        <button class="btn btn--primary" type="submit">Send Inquiry</button>
      </form>
    </div>
  `;

  // Dynamic price fluctuations
  const priceEl = document.getElementById("product-price");
  const base = Number(priceEl.dataset.base);
  const interval = setInterval(() => {
    if (!document.getElementById("product-price")) {
      clearInterval(interval);
      return;
    }
    const delta = (Math.random() * 1 - 0.5) * 2;
    const newPrice = Math.max(0.99, base + delta);
    priceEl.textContent = money(newPrice);
  }, 4000);

  // Add to cart button
  document.getElementById("btn-add").addEventListener("click", (e) => {
    e.preventDefault();
    addToCart(p.id);
  });

  // Inquiry form tracking
  const inquiryForm = document.getElementById("inquiry-form");
  trackForm(inquiryForm, {
    form_name: "product_inquiry",
    event_category: "product_inquiry",
    lead_type: "product_question",
  });

  dlPush({
    event: "view_item",
    items: [
      {
        item_id: p.id,
        item_name: p.name,
        price: p.basePrice,
        item_category: p.category,
      },
    ],
  });
}

function renderCart() {
  if (state.cart.length === 0) {
    app.innerHTML = `
      <h2 class="my-8">Your cart is empty</h2>
      <a href="#/catalog" class="btn btn--secondary">Continue Shopping</a>
    `;
    return;
  }

  const rows = state.cart
    .map((item) => {
      const p = findProduct(item.id);
      return `<tr><td>${p.name}</td><td>${item.qty}</td><td>${money(p.basePrice)}</td><td>${money(p.basePrice * item.qty)}</td></tr>`;
    })
    .join("");

  const total = state.cart.reduce((sum, item) => {
    const p = findProduct(item.id);
    return sum + p.basePrice * item.qty;
  }, 0);

  app.innerHTML = `
    <h2 class="my-8">Cart</h2>
    <table class="cart-table">
      <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="cart-summary"><strong>Total: ${money(total)}</strong></div>
    <a href="#/checkout" class="btn btn--primary">Proceed to Checkout</a>
  `;

  dlPush({
    event: "view_cart",
    items: state.cart.map((item) => {
      const p = findProduct(item.id);
      return {
        item_id: p.id,
        item_name: p.name,
        price: p.basePrice,
        quantity: item.qty,
      };
    }),
  });
}

function renderCheckout() {
  const total = state.cart.reduce((sum, item) => {
    const p = findProduct(item.id);
    return sum + p.basePrice * item.qty;
  }, 0);

  if (total === 0) {
    location.hash = "#/cart";
    return;
  }

  app.innerHTML = `
    <h2 class="my-8">Checkout</h2>
    <form id="checkout-form" class="form-section">
      <div class="form-group">
        <label class="form-label" for="co-name">Name on Card</label>
        <input id="co-name" name="name" class="form-control" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="co-card">Card Number</label>
        <input id="co-card" name="card" class="form-control" required placeholder="1234567890123456">
      </div>
      <div class="form-group">
        <label class="form-label" for="co-exp">Expiry</label>
        <input id="co-exp" name="expiry" class="form-control" required placeholder="MM/YY">
      </div>
      <div class="form-group">
        <label class="form-label" for="co-cvc">CVC</label>
        <input id="co-cvc" name="cvc" class="form-control" required placeholder="123">
      </div>
      <button class="btn btn--primary" type="submit">Pay ${money(total)}</button>
    </form>
  `;

  const form = document.getElementById("checkout-form");
  trackForm(form, {
    form_name: "checkout_payment",
    event_category: "checkout",
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) return;
    
    // Simulate purchase ID
    const orderId = "ORD" + Math.floor(Math.random() * 100000);
    dlPush({
      event: "purchase",
      transaction_id: orderId,
      value: total,
      currency: "USD",
      items: state.cart.map((item) => {
        const p = findProduct(item.id);
        return {
          item_id: p.id,
          item_name: p.name,
          price: p.basePrice,
          quantity: item.qty,
        };
      }),
    });

    // Clear cart
    state.cart = [];
    updateCartCount();

    location.hash = "#/confirmation";
  });

  dlPush({ event: "begin_checkout", value: total });
}

function renderConfirmation() {
  app.innerHTML = `
    <h2 class="my-8">Thank you for your purchase!</h2>
    <p>Your order has been placed successfully. A confirmation email is on its way.</p>
    <a href="#/catalog" class="btn btn--secondary">Continue Shopping</a>
  `;
}

function renderContact() {
  app.innerHTML = `
    <h2 class="my-8">Contact Us</h2>
    <form id="contact-form" class="form-section">
      <div class="form-group">
        <label class="form-label" for="c-name">Name</label>
        <input id="c-name" name="name" class="form-control" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="c-email">Email</label>
        <input type="email" id="c-email" name="email" class="form-control" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="c-phone">Phone</label>
        <input id="c-phone" name="phone" class="form-control">
      </div>
      <div class="form-group">
        <label class="form-label" for="c-msg">Message</label>
        <textarea id="c-msg" name="message" class="form-control" rows="4" required></textarea>
      </div>
      <button class="btn btn--primary" type="submit">Send Message</button>
    </form>
  `;

  const form = document.getElementById("contact-form");
  trackForm(form, {
    form_name: "contact_form",
    event_category: "contact",
    lead_type: "contact_form",
  });
}

function renderDashboard() {
  app.innerHTML = `
    <h2 class="my-8">Analytics Testing Dashboard</h2>
    <p>Use this dashboard to trigger custom events for interview demonstrations.</p>
    <div class="flex gap-16 mb-8">
      <button class="btn btn--outline" id="btn-test-event">Trigger Custom Event</button>
      <button class="btn btn--outline" id="btn-consent">Toggle Consent Mode</button>
    </div>
    
    <h3 class="mt-8">GTM Fundamentals Interview Questions</h3>
    <ul class="my-8">
      <li>Explain the difference between built-in and custom variables</li>
      <li>When would you use a Custom JavaScript variable vs DOM Element variable?</li>
      <li>How do triggers work and what are the different trigger types?</li>
      <li>What is the data layer and why is it important?</li>
    </ul>
    
    <h3 class="mt-8">GA4 Implementation Questions</h3>
    <ul class="my-8">
      <li>How do you configure enhanced measurement in GA4?</li>
      <li>What are the key differences between GA4 and Universal Analytics?</li>
      <li>How do you set up custom dimensions and metrics in GA4?</li>
      <li>Explain GA4's event-based data model</li>
    </ul>
  `;

  document.getElementById("btn-test-event").addEventListener("click", () => {
    dlPush({ 
      event: "custom_demo_event", 
      description: "Triggered from dashboard",
      test_parameter: "interview_demo"
    });
  });

  let consentGranted = true;
  document.getElementById("btn-consent").addEventListener("click", () => {
    consentGranted = !consentGranted;
    dlPush({ 
      event: "consent_update", 
      ad_storage: consentGranted ? "granted" : "denied",
      analytics_storage: consentGranted ? "granted" : "denied"
    });
  });
}

function renderNotFound() {
  app.innerHTML = `<h2 class="my-8">Page Not Found</h2><a href="#/" class="btn btn--secondary">Go Home</a>`;
}

// --- Cart Helpers --------------------------------------------------
function addToCart(productId) {
  const existing = state.cart.find((i) => i.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({ id: productId, qty: 1 });
  }
  updateCartCount();

  const p = findProduct(productId);
  dlPush({
    event: "add_to_cart",
    currency: "USD",
    value: p.basePrice,
    items: [
      {
        item_id: p.id,
        item_name: p.name,
        price: p.basePrice,
        quantity: 1,
      },
    ],
  });
}

// --- Form Tracking -------------------------------------------------
function trackForm(formEl, meta) {
  let started = false;
  function onFocus() {
    if (!started) {
      started = true;
      dlPush({ event: "form_start", ...meta });
    }
  }
  formEl.addEventListener("focusin", onFocus);

  formEl.addEventListener("submit", (e) => {
    if (!formEl.checkValidity()) return;
    dlPush({ event: "form_submit", ...meta });
    if (meta.lead_type) {
      dlPush({ event: "generate_lead", lead_type: meta.lead_type, ...meta });
    }
  });
}

// --- Initialization ------------------------------------------------
function attachGlobalListeners() {
  // Newsletter form
  const newsletterForm = document.getElementById("newsletter-form");
  if (newsletterForm) {
    trackForm(newsletterForm, {
      form_name: "newsletter",
      event_category: "newsletter",
      lead_type: "newsletter_signup",
    });

    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!newsletterForm.checkValidity()) return;
      newsletterForm.reset();
      alert("Thank you for subscribing!");
    });
  }

  // Debug panel toggle
  const debugToggle = document.createElement("div");
  debugToggle.className = "debug-toggle";
  debugToggle.textContent = "Ã°ÂŸÂ›Â ";
  document.body.appendChild(debugToggle);

  const debugPanel = document.getElementById("debug-panel");
  debugToggle.addEventListener("click", () => {
    debugPanel.classList.toggle("open");
  });
}

// --- Event Listeners -----------------------------------------------
window.addEventListener("hashchange", () => {
  router();
  pushVirtualPageview();
});

document.addEventListener("DOMContentLoaded", () => {
  initDataLayerDebug();
  router();
  pushVirtualPageview();
  attachGlobalListeners();
  updateCartCount();
});
