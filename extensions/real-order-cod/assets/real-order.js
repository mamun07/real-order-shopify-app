(function () {
  "use strict";

  var BD_DIVISIONS = {
    Dhaka: ["Dhaka", "Gazipur", "Narayanganj", "Tangail", "Manikganj", "Munshiganj"],
    Chattogram: ["Chattogram", "Cox's Bazar", "Comilla", "Feni", "Noakhali", "Rangamati"],
    Khulna: ["Khulna", "Jessore", "Satkhira", "Bagerhat", "Kushtia", "Chuadanga"],
    Rajshahi: ["Rajshahi", "Bogura", "Pabna", "Sirajganj", "Natore", "Naogaon"],
    Barishal: ["Barishal", "Bhola", "Patuakhali", "Pirojpur", "Barguna", "Jhalokati"],
    Sylhet: ["Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"],
    Rangpur: ["Rangpur", "Dinajpur", "Kurigram", "Gaibandha", "Nilphamari", "Thakurgaon"],
    Mymensingh: ["Mymensingh", "Jamalpur", "Netrokona", "Sherpur"],
  };

  var ICONS = {
    person:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    phone:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 3h3l2 5-2.5 1.5a11 11 0 0 0 5 5L15 12l5 2v3a2 2 0 0 1-2 2C10.5 19 5 13.5 5 6a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    mail:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="2"/><path d="M4 7l8 6 8-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    map:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 3v16M15 5v16" stroke="currentColor" stroke-width="2"/></svg>',
    globe:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" stroke="currentColor" stroke-width="2"/></svg>',
    building:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="1" stroke="currentColor" stroke-width="2"/><path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    pin:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 22s7-7.3 7-12.5A7 7 0 0 0 5 9.5C5 14.7 12 22 12 22z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.3" stroke="currentColor" stroke-width="2"/></svg>',
    hash:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    chevron:
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    cart:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="21" r="1.5" fill="currentColor"/><circle cx="18" cy="21" r="1.5" fill="currentColor"/><path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check:
      '<svg width="56" height="56" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.6"/><path d="M8 12.4l2.6 2.6L16 9.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    wallet:
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2" stroke="#fff" stroke-width="2"/><path d="M3 10h18" stroke="#fff" stroke-width="2"/><circle cx="16.5" cy="14.5" r="1.2" fill="#fff"/></svg>',
    pinFilled:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 22s7-7.3 7-12.5A7 7 0 0 0 5 9.5C5 14.7 12 22 12 22z" fill="#fff"/></svg>',
    copy:
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M4 15V5a1 1 0 0 1 1-1h10" stroke="currentColor" stroke-width="1.8"/></svg>',
  };

  function formatMoney(amount, currency) {
    var n = Number(amount || 0);
    return n.toFixed(2) + " " + currency;
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(null, args);
      }, wait);
    };
  }

  function getProxyBase() {
    return "/apps/cod";
  }

  function RealOrderCod(root) {
    this.root = root;
    this.data = {
      productId: root.dataset.productId,
      productHandle: root.dataset.productHandle,
      variantId: root.dataset.variantId,
      productTitle: root.dataset.productTitle,
      variantTitle: root.dataset.variantTitle,
      image: root.dataset.image,
      price: parseFloat(root.dataset.price || "0"),
      compareAtPrice: root.dataset.compareAtPrice
        ? parseFloat(root.dataset.compareAtPrice)
        : null,
      currency: root.dataset.currency,
      addressDataset: root.dataset.addressDataset || "auto",
      countryCode: root.dataset.countryCode || "BD",
    };
    this.quantity = 1;
    this.selectedShipping = null;
    this.shippingOptions = [];
    this.trigger = root.querySelector(".real-order-cod__trigger");
    this.trigger.addEventListener("click", this.open.bind(this));
    this.fetchRates = debounce(this._fetchRates.bind(this), 500);
  }

  RealOrderCod.prototype.getSelectedVariantId = function () {
    var form = this.root.closest("form") || document.querySelector('form[action*="/cart/add"]');
    if (form) {
      var input = form.querySelector('[name="id"]');
      if (input && input.value) return input.value;
    }
    return this.data.variantId;
  };

  RealOrderCod.prototype.open = function () {
    if (!this.overlay) {
      this.buildModal();
    }
    this.data.variantId = this.getSelectedVariantId();
    this.overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };

  RealOrderCod.prototype.close = function () {
    this.overlay.classList.remove("is-open");
    document.body.style.overflow = "";
    if (this.modal.classList.contains("roc-modal--success")) {
      this.overlay.remove();
      this.overlay = null;
    }
  };

  RealOrderCod.prototype.buildModal = function () {
    var self = this;
    var overlay = document.createElement("div");
    overlay.className = "roc-overlay";
    overlay.innerHTML = this.template();
    document.body.appendChild(overlay);
    this.overlay = overlay;
    this.modal = overlay.querySelector(".roc-modal");

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) self.close();
    });
    overlay.querySelector(".roc-modal__close").addEventListener("click", function () {
      self.close();
    });

    this.qtyValueEl = overlay.querySelector(".roc-qty__value");
    this.decEl = overlay.querySelector(".roc-qty__dec");
    this.incEl = overlay.querySelector(".roc-qty__inc");
    this.decEl.addEventListener("click", function () {
      self.setQuantity(self.quantity - 1);
    });
    this.incEl.addEventListener("click", function () {
      self.setQuantity(self.quantity + 1);
    });

    this.formEl = overlay.querySelector(".roc-form");
    this.shipListEl = overlay.querySelector(".roc-ship-options");
    this.summarySubtotalEl = overlay.querySelector(".roc-summary__subtotal");
    this.summaryShippingEl = overlay.querySelector(".roc-summary__shipping");
    this.summaryTotalEl = overlay.querySelector(".roc-summary__total");
    this.submitBtn = overlay.querySelector(".roc-submit");
    this.statusEl = overlay.querySelector(".roc-status");
    this.errorEl = overlay.querySelector(".roc-error");
    this.bodyEl = overlay.querySelector(".roc-modal__body");

    ["address1"].forEach(function (name) {
      var el = overlay.querySelector('[name="' + name + '"]');
      if (el) {
        el.addEventListener("input", function () {
          self.updateSummary();
          self.fetchRates();
        });
        el.addEventListener("change", function () {
          self.updateSummary();
          self.fetchRates();
        });
      }
    });

    this.renderAddressFields();
    this.initCountrySelect();

    this.formEl.addEventListener("submit", function (e) {
      e.preventDefault();
      self.submitOrder();
    });

    this.updateSummary();
  };

  RealOrderCod.prototype.effectiveIsBd = function () {
    if (this.data.addressDataset === "bd") return true;
    if (this.data.addressDataset === "text") return false;
    return this.data.countryCode === "BD";
  };

  RealOrderCod.prototype.renderAddressFields = function () {
    var self = this;
    var container = this.overlay.querySelector(".roc-address-fields");
    var isBd = this.effectiveIsBd();
    var provinceField = isBd
      ? this.selectField("province", "Province", ICONS.map, this.provinceOptions())
      : this.textField("province", "Province", ICONS.map);
    var cityField = isBd
      ? this.selectField("city", "City", ICONS.building, ['<option value="">City</option>'])
      : this.textField("city", "City", ICONS.building);
    container.innerHTML = provinceField + cityField;

    ["province", "city"].forEach(function (name) {
      var el = container.querySelector('[name="' + name + '"]');
      if (!el) return;
      el.addEventListener("input", function () {
        self.updateSummary();
        self.fetchRates();
      });
      el.addEventListener("change", function () {
        self.updateSummary();
        self.fetchRates();
      });
    });

    var provinceEl = container.querySelector('[name="province"]');
    if (provinceEl && isBd) {
      provinceEl.addEventListener("change", function () {
        self.populateCities(provinceEl.value);
        self.fetchRates();
      });
      this.populateCities(provinceEl.value, true);
    }
  };

  RealOrderCod.prototype.initCountrySelect = function () {
    var self = this;
    var select = this.overlay.querySelector('[name="country"]');
    if (!select) return;

    select.addEventListener("change", function () {
      self.data.countryCode = select.value;
      self.renderAddressFields();
      self.fetchRates();
    });

    fetch(getProxyBase() + "/countries")
      .then(function (r) {
        return r.json();
      })
      .then(function (json) {
        var countries = json.countries || [];
        if (!countries.length) return;
        var current = select.value;
        select.innerHTML = countries
          .map(function (c) {
            return (
              '<option value="' + c.code + '"' +
              (c.code === current ? " selected" : "") + ">" +
              escapeHtml(c.name) + "</option>"
            );
          })
          .join("");
        if (!countries.some(function (c) { return c.code === select.value; })) {
          select.value = countries[0].code;
        }
        self.data.countryCode = select.value;
        self.renderAddressFields();
        self.fetchRates();
      })
      .catch(function () {});
  };

  RealOrderCod.prototype.countryField = function () {
    var code = this.data.countryCode;
    return this.selectField("country", "Country", ICONS.globe, [
      '<option value="' + code + '">' + escapeHtml(code) + "</option>",
    ]);
  };

  RealOrderCod.prototype.template = function () {
    var d = this.data;

    return (
      '<div class="roc-modal" role="dialog" aria-modal="true">' +
      '<div class="roc-modal__header"><h2>Cash on Delivery</h2>' +
      '<button type="button" class="roc-modal__close" aria-label="Close">×</button></div>' +
      '<div class="roc-modal__body">' +
      '<div class="roc-product">' +
      '<div class="roc-product__image">' +
      (d.image ? '<img src="' + d.image + '" alt="">' : "") +
      '<span class="roc-product__badge roc-qty__value">1</span>' +
      "</div>" +
      '<div class="roc-product__info">' +
      '<p class="roc-product__title">' + escapeHtml(d.productTitle) + "</p>" +
      '<p class="roc-product__price">' + formatMoney(d.price, d.currency) + "</p>" +
      "</div>" +
      '<div class="roc-qty">' +
      '<button type="button" class="roc-qty__dec" aria-label="Decrease quantity">−</button>' +
      '<span class="roc-qty__value">1</span>' +
      '<button type="button" class="roc-qty__inc" aria-label="Increase quantity">+</button>' +
      "</div>" +
      "</div>" +
      '<form class="roc-form" novalidate>' +
      this.textField("fullName", "Enter Your Full Name", ICONS.person) +
      this.textField("phone", "Phone Number", ICONS.phone, "tel") +
      this.textField("email", "Email (optional)", ICONS.mail, "email") +
      this.countryField() +
      '<div class="roc-row roc-address-fields"></div>' +
      this.textField("address1", "Full Address", ICONS.pin) +
      '<div class="roc-error"></div>' +
      '<div class="roc-section-label">Shipping method</div>' +
      '<div class="roc-ship-options"><p style="font-size:13px;color:#888;margin:4px 0;">Enter your address to see shipping options</p></div>' +
      '<div class="roc-summary">' +
      '<div class="roc-summary__row"><span>Subtotal</span><span class="roc-summary__subtotal"></span></div>' +
      '<div class="roc-summary__row"><span>Shipping</span><span class="roc-summary__shipping">—</span></div>' +
      '<div class="roc-summary__row roc-summary__row--total"><span>Total</span><span class="roc-summary__total"></span></div>' +
      "</div>" +
      '<button type="submit" class="roc-submit">' +
      ICONS.cart +
      '<span class="roc-submit__label">COMPLETE ORDER</span>' +
      "</button>" +
      '<div class="roc-status"></div>' +
      "</form>" +
      "</div>" +
      "</div>"
    );
  };

  RealOrderCod.prototype.provinceOptions = function () {
    var html = ['<option value="">Province</option>'];
    Object.keys(BD_DIVISIONS).forEach(function (name) {
      html.push('<option value="' + name + '">' + name + "</option>");
    });
    return html;
  };

  RealOrderCod.prototype.populateCities = function (province, keepEmpty) {
    var cityEl = this.overlay.querySelector('[name="city"]');
    if (!cityEl) return;
    var cities = BD_DIVISIONS[province] || [];
    var html = ['<option value="">City</option>'];
    cities.forEach(function (c) {
      html.push('<option value="' + c + '">' + c + "</option>");
    });
    cityEl.innerHTML = html.join("");
    if (keepEmpty) cityEl.value = "";
  };

  RealOrderCod.prototype.textField = function (name, placeholder, icon, type) {
    return (
      '<div class="roc-field">' +
      '<span class="roc-field__icon">' + icon + "</span>" +
      '<input type="' + (type || "text") + '" name="' + name + '" placeholder="' + placeholder + '" autocomplete="off">' +
      "</div>"
    );
  };

  RealOrderCod.prototype.selectField = function (name, placeholder, icon, optionsHtml) {
    return (
      '<div class="roc-field">' +
      '<span class="roc-field__icon">' + icon + "</span>" +
      '<select name="' + name + '">' + optionsHtml.join("") + "</select>" +
      '<span class="roc-field__chevron">' + ICONS.chevron + "</span>" +
      "</div>"
    );
  };

  RealOrderCod.prototype.setQuantity = function (q) {
    this.quantity = Math.max(1, q);
    var els = this.overlay.querySelectorAll(".roc-qty__value");
    for (var i = 0; i < els.length; i++) els[i].textContent = String(this.quantity);
    this.updateSummary();
    this.fetchRates();
  };

  RealOrderCod.prototype.getAddress = function () {
    var get = function (name) {
      var el = this.overlay.querySelector('[name="' + name + '"]');
      return el ? el.value.trim() : "";
    }.bind(this);
    return {
      fullName: get("fullName"),
      phone: get("phone"),
      email: get("email"),
      province: get("province"),
      city: get("city"),
      address1: get("address1"),
    };
  };

  RealOrderCod.prototype.subtotal = function () {
    return this.data.price * this.quantity;
  };

  RealOrderCod.prototype.updateSummary = function () {
    var subtotal = this.subtotal();
    var currency = this.data.currency;
    this.summarySubtotalEl.textContent = formatMoney(subtotal, currency);
    var shippingAmount = this.selectedShipping ? this.selectedShipping.amount : 0;
    this.summaryShippingEl.textContent = this.selectedShipping
      ? shippingAmount === 0
        ? "Free"
        : formatMoney(shippingAmount, currency)
      : "—";
    this.summaryTotalEl.textContent = formatMoney(subtotal + shippingAmount, currency);
    if (this.submitBtn) {
      var label = this.submitBtn.querySelector(".roc-submit__label");
      label.textContent = "COMPLETE ORDER - " + formatMoney(subtotal + shippingAmount, currency);
    }
  };

  RealOrderCod.prototype._fetchRates = function () {
    var self = this;
    var address = this.getAddress();
    if (!address.address1 || !address.city) return;

    this.shipListEl.innerHTML = '<p style="font-size:13px;color:#888;margin:4px 0;">Loading shipping options…</p>';

    fetch(getProxyBase() + "/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variantId: this.data.variantId,
        quantity: this.quantity,
        address1: address.address1,
        city: address.city,
        province: address.province,
        countryCode: this.data.countryCode,
      }),
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (json) {
        self.shippingOptions = json.options || [];
        self.renderShippingOptions();
      })
      .catch(function () {
        self.shipListEl.innerHTML = '<p style="font-size:13px;color:#d82c0d;margin:4px 0;">Couldn’t load shipping options. Please try again.</p>';
      });
  };

  RealOrderCod.prototype.renderShippingOptions = function () {
    var self = this;
    if (!this.shippingOptions.length) {
      this.shipListEl.innerHTML = '<p style="font-size:13px;color:#888;margin:4px 0;">No shipping options for this address.</p>';
      return;
    }
    if (!this.selectedShipping || !this.shippingOptions.some(function (o) { return o.handle === self.selectedShipping.handle; })) {
      this.selectedShipping = this.shippingOptions[0];
    }
    var html = this.shippingOptions
      .map(function (o) {
        var selected = self.selectedShipping && self.selectedShipping.handle === o.handle;
        return (
          '<label class="roc-ship-option' + (selected ? " is-selected" : "") + '" data-handle="' + o.handle + '">' +
          '<span class="roc-ship-option__left"><input type="radio" name="shippingMethod" value="' + o.handle + '"' + (selected ? " checked" : "") + '>' + escapeHtml(o.title) + "</span>" +
          '<span class="roc-ship-option__price">' + (o.amount === 0 ? "Free" : formatMoney(o.amount, o.currencyCode || self.data.currency)) + "</span>" +
          "</label>"
        );
      })
      .join("");
    this.shipListEl.innerHTML = html;

    var labels = this.shipListEl.querySelectorAll(".roc-ship-option");
    labels.forEach(function (label) {
      label.addEventListener("click", function () {
        var handle = label.getAttribute("data-handle");
        self.selectedShipping = self.shippingOptions.filter(function (o) {
          return o.handle === handle;
        })[0];
        labels.forEach(function (l) {
          l.classList.toggle("is-selected", l === label);
        });
        self.updateSummary();
      });
    });

    this.updateSummary();
  };

  RealOrderCod.prototype.showError = function (message) {
    this.errorEl.textContent = message;
    this.errorEl.classList.toggle("is-visible", !!message);
  };

  RealOrderCod.prototype.validate = function () {
    var a = this.getAddress();
    if (!a.fullName) return "Please enter your full name.";
    if (!a.phone || a.phone.replace(/\D/g, "").length < 6) return "Please enter a valid phone number.";
    if (a.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email)) return "Please enter a valid email address.";
    if (this.effectiveIsBd() && !a.province) return "Please select your province.";
    if (this.effectiveIsBd() && !a.city) return "Please select your city.";
    if (!a.address1) return "Please enter your full address.";
    if (!this.selectedShipping) return "Please choose a shipping method.";
    return null;
  };

  RealOrderCod.prototype.submitOrder = function () {
    var self = this;
    var error = this.validate();
    if (error) {
      this.showError(error);
      return;
    }
    this.showError("");

    var address = this.getAddress();
    this.submitBtn.disabled = true;
    this.statusEl.textContent = "Placing your order…";

    fetch(getProxyBase() + "/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variantId: this.data.variantId,
        quantity: this.quantity,
        fullName: address.fullName,
        phone: address.phone,
        email: address.email,
        province: address.province,
        city: address.city,
        address1: address.address1,
        countryCode: this.data.countryCode,
        shippingHandle: this.selectedShipping.handle,
      }),
    })
      .then(function (r) {
        return r.json().then(function (json) {
          return { ok: r.ok, json: json };
        });
      })
      .then(function (res) {
        if (!res.ok || res.json.error) {
          throw new Error(res.json.error || "Something went wrong");
        }
        self.showSuccess(res.json, address);
      })
      .catch(function (err) {
        self.statusEl.textContent = "";
        self.submitBtn.disabled = false;
        self.showError(err.message || "We couldn't place your order. Please try again.");
      });
  };

  RealOrderCod.prototype.showSuccess = function (result, address) {
    var self = this;
    var d = this.data;
    var currency = result.currency || d.currency;
    var qty = this.quantity;
    var lineTotal = d.price * qty;
    var shippingAmount = this.selectedShipping ? this.selectedShipping.amount : 0;
    var shippingLabel = this.selectedShipping ? this.selectedShipping.title : "";
    var addressParts = [address.address1, address.city, address.province]
      .filter(Boolean)
      .join(", ");

    this.modal.classList.add("roc-modal--success");
    this.bodyEl.innerHTML =
      '<div class="roc-success">' +
      '<div class="roc-success__check">' + ICONS.check + "</div>" +
      "<h3>Order confirmed</h3>" +
      '<div class="roc-success__order">' +
      "<span>Order #" + escapeHtml(String(result.orderName).replace(/^#/, "")) + "</span>" +
      '<button type="button" class="roc-success__copy" aria-label="Copy order number">' + ICONS.copy + "</button>" +
      "</div>" +

      '<div class="roc-success-card">' +
      '<div class="roc-success-card__icon">' + ICONS.wallet + "</div>" +
      '<div class="roc-success-card__body">' +
      "<p class=\"roc-success-card__title\">Cash on Delivery</p>" +
      "<p class=\"roc-success-card__sub\">Total Amount: " + formatMoney(result.total, currency) + "</p>" +
      "</div>" +
      "</div>" +

      '<div class="roc-success-card roc-success-card--product">' +
      '<div class="roc-success-product">' +
      '<div class="roc-success-product__image">' +
      (d.image ? '<img src="' + d.image + '" alt="">' : "") +
      '<span class="roc-success-product__badge">' + qty + "</span>" +
      "</div>" +
      '<div class="roc-success-product__info">' +
      "<p class=\"roc-success-product__title\">" + escapeHtml(d.productTitle) + "</p>" +
      '<p class="roc-success-product__price">' +
      (d.compareAtPrice
        ? '<s>' + formatMoney(d.compareAtPrice, currency) + "</s>/ea "
        : "") +
      formatMoney(d.price, currency) + "/ea" +
      "</p>" +
      "</div>" +
      '<div class="roc-success-product__total">' +
      (d.compareAtPrice
        ? '<s>' + formatMoney(d.compareAtPrice * qty, currency) + "</s>"
        : "") +
      "<strong>" + formatMoney(lineTotal, currency) + "</strong>" +
      "</div>" +
      "</div>" +
      '<div class="roc-summary__row"><span>Subtotal · ' + qty + (qty === 1 ? " item" : " items") + '</span><span>' + formatMoney(lineTotal, currency) + "</span></div>" +
      '<div class="roc-summary__row"><span>Delivery' + (shippingLabel ? " (" + escapeHtml(shippingLabel) + ")" : "") + '</span><span>' + (shippingAmount === 0 ? "Free" : formatMoney(shippingAmount, currency)) + "</span></div>" +
      '<div class="roc-summary__row roc-summary__row--total"><span>Total</span><span>' + formatMoney(result.total, currency) + "</span></div>" +
      "</div>" +

      '<div class="roc-success-card">' +
      '<div class="roc-success-card__icon">' + ICONS.pinFilled + "</div>" +
      '<div class="roc-success-card__body">' +
      "<p class=\"roc-success-card__title\">" + escapeHtml(address.fullName) + "</p>" +
      "<p class=\"roc-success-card__sub\">" + escapeHtml(addressParts) + "<br>" + escapeHtml(address.phone) + "</p>" +
      "</div>" +
      "</div>" +

      '<button type="button" class="roc-success__continue">Continue Shopping</button>' +
      "</div>";

    var copyBtn = this.bodyEl.querySelector(".roc-success__copy");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var text = "#" + String(result.orderName).replace(/^#/, "");
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).catch(function () {});
        }
      });
    }
    this.bodyEl.querySelector(".roc-success__continue").addEventListener("click", function () {
      self.close();
    });
  };

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function init() {
    var roots = document.querySelectorAll("[data-real-order-cod]");
    roots.forEach(function (root) {
      if (root.__realOrderCodInit) return;
      root.__realOrderCodInit = true;
      new RealOrderCod(root);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  document.addEventListener("shopify:section:load", init);
})();
