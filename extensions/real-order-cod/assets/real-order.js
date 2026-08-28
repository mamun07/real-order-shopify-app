(function () {
  "use strict";

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
    return currency + " " + n.toFixed(2);
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

  // Publishes a CUSTOM Web Pixels event via Shopify's own pixel bus. This is
  // the only mechanism a storefront script can use to reach pixels — it
  // does nothing on its own. A merchant's Custom Pixel (Settings > Customer
  // events > Add custom pixel) must explicitly call
  // analytics.subscribe("InitiateCheckout"/"Purchase", ...)
  // to receive these. Off-the-shelf Facebook/TikTok/Google pixel apps that
  // only listen for Shopify's standard checkout_started/checkout_completed
  // events won't see these, because this app's COD flow never goes through
  // Shopify Checkout — those standard events can only be emitted by
  // Shopify's own instrumented checkout, not by app/theme scripts.
  function publishPixelEvent(name, payload) {
    try {
      if (
        window.Shopify &&
        window.Shopify.analytics &&
        typeof window.Shopify.analytics.publish === "function"
      ) {
        window.Shopify.analytics.publish(name, payload);
      }
    } catch (e) {
      // Never let analytics wiring break the actual checkout flow.
    }
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
      presentmentCountry: root.dataset.presentmentCountry || null,
    };
    this.quantity = 1;
    this.selectedShipping = null;
    this.liveSubtotal = null;
    this.shippingOptions = [];
    this.bdProvinces = null;
    this.allProvinces = null;
    this.zoneProvinces = {};
    this.districtHasCities = false;
    this.provinceIsSelect = false;
    this.customThana = false;
    this.settings = null;
    this.otpVerified = false;
    this.verifiedPhone = null;
    this.paymentResolved = false;
    this.paymentChoice = null;
    this.paymentMethod = null;
    this.pollTimer = null;
    this.trigger = root.querySelector(".real-order-cod__trigger");
    this.trigger.addEventListener("click", this.open.bind(this));
    this.fetchRates = debounce(this._fetchRates.bind(this), 500);
    this.loadConfig();
  }

  // Merchant-configured text / colours / size / OTP / partial-payment, from
  // the app's Settings page. Theme block settings act as the fallback until
  // this resolves (and if it fails).
  RealOrderCod.prototype.cfg = function (key, fallback) {
    var v = this.settings && this.settings[key];
    return v === undefined || v === null || v === "" ? fallback : v;
  };

  RealOrderCod.prototype.loadConfig = function () {
    var self = this;
    fetch(getProxyBase() + "/config")
      .then(function (r) {
        return r.json();
      })
      .then(function (json) {
        if (!json || !json.settings) return;
        self.settings = json.settings;
        self.applyTriggerSettings();
        if (self.overlay) self.applySettings();
      })
      .catch(function (e) {
        console.warn(
          "[real-order] Could not load app settings; using theme defaults",
          e,
        );
      });
  };

  RealOrderCod.prototype.applyTriggerSettings = function () {
    var s = this.settings;
    if (!s || !this.trigger) return;
    if (s.buttonColor) this.trigger.style.setProperty("--roc-accent", s.buttonColor);
    if (s.buttonTextColor) this.trigger.style.color = s.buttonTextColor;
    if (s.buttonText) {
      var replaced = false;
      for (var i = 0; i < this.trigger.childNodes.length; i++) {
        var n = this.trigger.childNodes[i];
        if (n.nodeType === 3 && n.textContent.trim()) {
          n.textContent = " " + s.buttonText;
          replaced = true;
        }
      }
      if (!replaced) {
        this.trigger.appendChild(document.createTextNode(" " + s.buttonText));
      }
    }
  };

  RealOrderCod.prototype.applySettings = function () {
    var s = this.settings;
    if (!s || !this.modal) return;
    if (s.backgroundColor) this.modal.style.setProperty("--roc-bg", s.backgroundColor);
    if (s.formWidth) this.modal.style.setProperty("--roc-width", s.formWidth + "px");
    if (s.formMaxHeight)
      this.modal.style.setProperty("--roc-max-height", s.formMaxHeight + "vh");
    if (s.buttonColor) this.modal.style.setProperty("--roc-accent", s.buttonColor);
    if (s.buttonTextColor)
      this.modal.style.setProperty("--roc-accent-text", s.buttonTextColor);

    var h = this.modal.querySelector(".roc-modal__header h2");
    if (h && s.headerTitle) h.textContent = s.headerTitle;

    var self = this;
    [
      ["fullName", s.fullNameLabel],
      ["phone", s.phoneLabel],
      ["email", s.emailLabel],
      ["address1", s.addressLabel],
    ].forEach(function (pair) {
      var el = self.overlay.querySelector('[name="' + pair[0] + '"]');
      if (el && pair[1]) el.setAttribute("placeholder", pair[1]);
    });

    this.updateSummary();
    this.renderPartial();
  };

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

    var d = this.data;
    publishPixelEvent("InitiateCheckout", {
      productId: d.productId,
      variantId: d.variantId,
      productTitle: d.productTitle,
      price: d.price,
      currency: d.currency,
      quantity: this.quantity,
    });
  };

  RealOrderCod.prototype.close = function () {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.payLayer) this.payLayer.classList.remove("is-open");
    if (this.submitBtn) this.submitBtn.style.display = "";
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
    this.otpEl = overlay.querySelector(".roc-otp");
    this.partialEl = overlay.querySelector(".roc-partial");

    // Payment choice is a focused second popup layered over the whole modal
    // (backdrop hides the form behind it).
    this.payLayer = document.createElement("div");
    this.payLayer.className = "roc-pay-layer";
    this.payLayer.innerHTML = '<div class="roc-pay"></div>';
    this.modal.appendChild(this.payLayer);
    this.payEl = this.payLayer.querySelector(".roc-pay");

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
    this.loadProvinces();

    this.formEl.addEventListener("submit", function (e) {
      e.preventDefault();
      self.submitOrder();
    });

    this.applySettings();
    this.updateSummary();
  };

  // "Does the currently chosen country have a configured District/Thana
  // list?" — if so the popup shows required dropdowns, otherwise plain text.
  RealOrderCod.prototype.effectiveIsBd = function () {
    if (this.data.addressDataset === "text") return false;
    if (this.data.addressDataset === "bd") return true;
    return !!(this.bdProvinces && Object.keys(this.bdProvinces).length);
  };

  // Point bdProvinces at the list for the current country and re-render.
  RealOrderCod.prototype.refreshProvincesForCountry = function () {
    var all = this.allProvinces || {};
    this.bdProvinces = all[this.data.countryCode] || null;
    if (this.overlay) this.renderAddressFields();
  };

  RealOrderCod.prototype.renderAddressFields = function () {
    var self = this;
    var container = this.overlay.querySelector(".roc-address-fields");

    // Path A: merchant's custom District → Thana list (Bangladesh).
    // Path B: Shopify's own province/state list for the chosen country.
    // Path C: no province data → plain text fields.
    var isCustom = this.effectiveIsBd();
    var nativeProvinces = isCustom
      ? []
      : this.zoneProvinces[this.data.countryCode] || [];
    var hasNative = nativeProvinces.length > 0;

    this.customThana = isCustom;
    this.provinceIsSelect = isCustom || hasNative;

    var provinceField, cityField;
    if (isCustom) {
      provinceField = this.comboField("province", "District", ICONS.map);
      cityField = this.comboField("city", "Thana", ICONS.building);
    } else if (hasNative) {
      provinceField = this.comboField("province", "Province / State", ICONS.map);
      cityField = this.textField("city", "City", ICONS.building);
    } else {
      provinceField = this.textField("province", "Province / State", ICONS.map);
      cityField = this.textField("city", "City", ICONS.building);
    }
    container.innerHTML = provinceField + cityField;

    ["province", "city"].forEach(function (name) {
      var el = container.querySelector('[name="' + name + '"]');
      if (!el) return;
      el.addEventListener("change", function () {
        self.updateSummary();
        self.fetchRates();
      });
      el.addEventListener("input", function () {
        self.fetchRates();
      });
    });

    if (isCustom) {
      this.setupCombo("province", this.provinceItems(), function (value) {
        self.populateCities(value);
        self.fetchRates();
      });
      this.setupCombo("city", [], function () {
        self.fetchRates();
      });
      this.populateCities("", true);
    } else if (hasNative) {
      this.districtHasCities = false;
      this.setupCombo("province", nativeProvinces, function () {
        self.fetchRates();
      });
    } else {
      this.districtHasCities = false;
    }
  };

  RealOrderCod.prototype.initCountrySelect = function () {
    var self = this;
    var input = this.overlay.querySelector('input[name="country"]');
    if (!input) return;

    var onPick = function (value) {
      self.data.countryCode = value;
      self.refreshProvincesForCountry();
      self.fetchRates();
    };

    // Start with just the current code so the field is usable before the
    // real market list loads.
    this.setupCombo(
      "country",
      [{ value: this.data.countryCode, label: this.data.countryCode }],
      onPick,
    );
    this.setComboOptions("country", [
      { value: this.data.countryCode, label: this.data.countryCode },
    ], { value: this.data.countryCode });

    fetch(getProxyBase() + "/countries")
      .then(function (r) {
        return r.json();
      })
      .then(function (json) {
        var countries = json.countries || [];
        if (!countries.length) return;
        // Shopify's own province/state list for each country the merchant
        // ships to (from the shipping zones).
        self.zoneProvinces = {};
        countries.forEach(function (c) {
          self.zoneProvinces[c.code] = (c.provinces || []).map(function (p) {
            return { value: p.code, label: p.name };
          });
        });
        var options = countries.map(function (c) {
          return { value: c.code, label: c.name };
        });
        var current = self.data.countryCode;
        if (!countries.some(function (c) { return c.code === current; })) {
          current = countries[0].code;
        }
        self.setComboOptions("country", options, { value: current });
        self.data.countryCode = current;
        self.refreshProvincesForCountry();
        self.fetchRates();
      })
      .catch(function (e) {
        console.warn("[real-order] Could not load shipping-zone countries (is the app proxy configured?)", e);
      });
  };

  RealOrderCod.prototype.loadProvinces = function () {
    var self = this;
    fetch(getProxyBase() + "/provinces")
      .then(function (r) {
        return r.json();
      })
      .then(function (json) {
        // Build { COUNTRY: { districtName: [thanas] } } from the proxy's
        // byCountry payload (falls back to the flat BD list for older
        // deployments).
        var all = {};
        var byCountry = json.byCountry;
        if (byCountry && typeof byCountry === "object") {
          Object.keys(byCountry).forEach(function (cc) {
            var map = {};
            (byCountry[cc] || []).forEach(function (p) {
              map[p.name] = p.cities || [];
            });
            all[cc] = map;
          });
        } else if (json.provinces && json.provinces.length) {
          var bd = {};
          json.provinces.forEach(function (p) {
            bd[p.name] = p.cities || [];
          });
          all.BD = bd;
        }
        self.allProvinces = all;
        self.refreshProvincesForCountry();
      })
      .catch(function (e) {
        console.warn("[real-order] Could not load District/Thana list (is the app proxy configured?)", e);
      });
  };

  RealOrderCod.prototype.countryField = function () {
    return this.comboField("country", "Country", ICONS.globe);
  };

  // A searchable / type-ahead dropdown: a text input the shopper can type
  // into, backed by a filtered option list. Used for Country, District and
  // Thana. The chosen label lives on the input's `value`; the machine value
  // (e.g. a country code) on `dataset.value`.
  RealOrderCod.prototype.comboField = function (name, placeholder, icon) {
    return (
      '<div class="roc-field roc-combo">' +
      '<span class="roc-field__icon">' + icon + "</span>" +
      '<input type="text" name="' + name + '" placeholder="' + placeholder +
      '" autocomplete="off" role="combobox" aria-expanded="false" aria-autocomplete="list">' +
      '<span class="roc-field__chevron">' + ICONS.chevron + "</span>" +
      '<div class="roc-combo__list" role="listbox" hidden></div>' +
      "</div>"
    );
  };

  RealOrderCod.prototype.setupCombo = function (name, options, onPick) {
    var self = this;
    var input = this.overlay.querySelector('input[name="' + name + '"]');
    if (!input) return;
    var field = input.closest(".roc-combo");
    var list = field.querySelector(".roc-combo__list");
    var state = { options: options || [], active: -1, open: false };
    field.__combo = state;
    field.__onPick = onPick;

    function labelFor(value) {
      for (var i = 0; i < state.options.length; i++) {
        if (state.options[i].value === value) return state.options[i].label;
      }
      return "";
    }

    function render() {
      var q = input.value.trim().toLowerCase();
      var exact = state.options.some(function (o) {
        return o.label.toLowerCase() === q;
      });
      var matches = state.options.filter(function (o) {
        return !q || exact || o.label.toLowerCase().indexOf(q) !== -1;
      });
      state.filtered = matches;
      if (!matches.length) {
        list.innerHTML = '<div class="roc-combo__empty">No matches</div>';
        return;
      }
      list.innerHTML = matches
        .map(function (o, i) {
          return (
            '<div class="roc-combo__item' +
            (i === state.active ? " is-active" : "") +
            '" role="option" data-value="' +
            escapeHtml(o.value) +
            '">' +
            escapeHtml(o.label) +
            "</div>"
          );
        })
        .join("");
    }

    function open() {
      state.open = true;
      state.active = -1;
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
      field.classList.add("is-open");
      render();
    }
    function close() {
      state.open = false;
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
      field.classList.remove("is-open");
    }
    function pick(opt) {
      input.value = opt.label;
      input.dataset.value = opt.value;
      close();
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      if (field.__onPick) field.__onPick(opt.value, opt.label);
    }

    input.addEventListener("focus", open);
    input.addEventListener("click", function () {
      if (!state.open) open();
    });
    input.addEventListener("input", function () {
      if (!state.open) open();
      else render();
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!state.open) return open();
        var n = (state.filtered || []).length;
        if (!n) return;
        state.active =
          e.key === "ArrowDown"
            ? (state.active + 1) % n
            : (state.active - 1 + n) % n;
        render();
        var el = list.children[state.active];
        if (el) el.scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter") {
        if (state.open && state.active >= 0 && state.filtered[state.active]) {
          e.preventDefault();
          pick(state.filtered[state.active]);
        }
      } else if (e.key === "Escape") {
        close();
      }
    });
    list.addEventListener("mousedown", function (e) {
      var item = e.target.closest(".roc-combo__item");
      if (!item) return;
      e.preventDefault();
      var v = item.getAttribute("data-value");
      var opt = state.options.filter(function (o) {
        return o.value === v;
      })[0];
      if (opt) pick(opt);
    });
    input.addEventListener("blur", function () {
      // Enforce "select one": typed text that isn't an exact option is
      // discarded, reverting to the last valid pick.
      setTimeout(function () {
        close();
        var typed = input.value.trim().toLowerCase();
        var match = state.options.filter(function (o) {
          return o.label.toLowerCase() === typed;
        })[0];
        if (match) {
          input.dataset.value = match.value;
        } else {
          input.value = input.dataset.value ? labelFor(input.dataset.value) : "";
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }, 120);
    });
  };

  RealOrderCod.prototype.setComboOptions = function (name, options, opts) {
    var input = this.overlay.querySelector('input[name="' + name + '"]');
    if (!input) return;
    var field = input.closest(".roc-combo");
    if (!field || !field.__combo) return;
    field.__combo.options = options || [];
    opts = opts || {};
    if (opts.value !== undefined) {
      var lbl = "";
      (options || []).forEach(function (o) {
        if (o.value === opts.value) lbl = o.label;
      });
      input.value = lbl;
      input.dataset.value = opts.value;
    }
    if (opts.clear) {
      input.value = "";
      input.dataset.value = "";
    }
  };

  RealOrderCod.prototype.template = function () {
    var d = this.data;

    return (
      '<div class="roc-modal" role="dialog" aria-modal="true">' +
      '<div class="roc-modal__header"><h2>' +
      escapeHtml(this.cfg("headerTitle", "Cash on Delivery")) +
      "</h2>" +
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
      this.textField("fullName", this.cfg("fullNameLabel", "Enter Your Full Name"), ICONS.person) +
      this.textField("phone", this.cfg("phoneLabel", "Phone Number"), ICONS.phone, "tel") +
      this.textField("email", this.cfg("emailLabel", "Email (optional)"), ICONS.mail, "email") +
      this.countryField() +
      '<div class="roc-row roc-address-fields"></div>' +
      this.textField("address1", this.cfg("addressLabel", "Full Address"), ICONS.pin) +
      '<div class="roc-error"></div>' +
      '<div class="roc-section-label">Shipping method</div>' +
      '<div class="roc-ship-options"><p style="font-size:13px;color:#888;margin:4px 0;">Enter your address to see shipping options</p></div>' +
      '<div class="roc-summary">' +
      '<div class="roc-summary__row"><span>Subtotal</span><span class="roc-summary__subtotal"></span></div>' +
      '<div class="roc-summary__row"><span>Shipping</span><span class="roc-summary__shipping">—</span></div>' +
      '<div class="roc-summary__row roc-summary__row--total"><span>Total</span><span class="roc-summary__total"></span></div>' +
      "</div>" +
      '<div class="roc-partial" hidden></div>' +
      '<div class="roc-otp" hidden></div>' +
      '<button type="submit" class="roc-submit">' +
      ICONS.cart +
      '<span class="roc-submit__label">' +
      escapeHtml(this.cfg("submitButtonText", "COMPLETE ORDER")) +
      "</span>" +
      "</button>" +
      '<div class="roc-status"></div>' +
      "</form>" +
      "</div>" +
      "</div>"
    );
  };

  RealOrderCod.prototype.provinceItems = function () {
    var provinces = this.bdProvinces || {};
    return Object.keys(provinces).map(function (name) {
      return { value: name, label: name };
    });
  };

  RealOrderCod.prototype.populateCities = function (province, keepEmpty) {
    var cityEl = this.overlay.querySelector('[name="city"]');
    if (!cityEl) return;
    var provinces = this.bdProvinces || {};
    var cities = provinces[province] || [];
    this.districtHasCities = cities.length > 0;

    this.setComboOptions(
      "city",
      cities.map(function (c) {
        return { value: c, label: c };
      }),
      { clear: keepEmpty || !this.districtHasCities },
    );

    // Only show (and require) the Thana selector when the chosen District
    // actually has Thanas configured for it.
    var field = cityEl.closest(".roc-field");
    if (field) field.style.display = this.districtHasCities ? "" : "none";
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
    var provinceEl = this.overlay.querySelector('[name="province"]');
    return {
      fullName: get("fullName"),
      phone: get("phone"),
      email: get("email"),
      province: get("province"),
      // Subdivision code for a picked province (ISO code for Shopify's own
      // lists, the name for the custom BD list); "" for free-text.
      provinceCode: provinceEl ? provinceEl.dataset.value || "" : "",
      city: get("city"),
      address1: get("address1"),
    };
  };

  RealOrderCod.prototype.subtotal = function () {
    if (this.liveSubtotal) return Number(this.liveSubtotal.amount);
    return this.data.price * this.quantity;
  };

  RealOrderCod.prototype.updateSummary = function () {
    var subtotal = this.subtotal();
    // Once the server returns a live subtotal, it and every shipping option
    // were fetched in the same @inContext(country: ...) currency, so use
    // that currency for the whole summary instead of the page's static
    // (possibly different) currency — keeps everything on screen consistent.
    var currency = this.liveSubtotal ? this.liveSubtotal.currencyCode : this.data.currency;
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
      var base = this.cfg("submitButtonText", "COMPLETE ORDER");
      label.textContent = base + " - " + formatMoney(subtotal + shippingAmount, currency);
    }
    this.renderPartial();
  };

  RealOrderCod.prototype.computePartial = function (total) {
    var s = this.settings;
    if (!s || !s.partialEnabled) return null;
    var raw =
      s.partialType === "fixed"
        ? Number(s.partialValue || 0)
        : (Number(total) * Number(s.partialValue || 0)) / 100;
    var advance = Math.min(Math.max(Math.round(raw * 100) / 100, 0), Number(total));
    var balance = Math.round((Number(total) - advance) * 100) / 100;
    return { advance: advance, balance: balance };
  };

  RealOrderCod.prototype.renderPartial = function () {
    if (!this.partialEl) return;
    var s = this.settings;
    // The concrete advance / balance split is shown in the payment step
    // (after the shopper picks how to pay); here we only hint that the
    // option exists, plus any merchant note.
    if (!s || !s.partialEnabled || this.paymentResolved) {
      this.partialEl.hidden = true;
      this.partialEl.innerHTML = "";
      return;
    }
    var currency = this.liveSubtotal
      ? this.liveSubtotal.currencyCode
      : this.data.currency;
    var total =
      this.subtotal() + (this.selectedShipping ? this.selectedShipping.amount : 0);
    var p = this.computePartial(total);
    var pctLabel = s.partialType === "percent" ? s.partialValue + "%" : "an advance";
    this.partialEl.hidden = false;
    this.partialEl.innerHTML =
      '<div class="roc-partial__hint">Pay ' +
      (p ? formatMoney(p.advance, currency) + " (" + pctLabel + ")" : pctLabel) +
      " now with the rest on delivery, or the full amount — you choose next.</div>" +
      (s.partialNote
        ? '<div class="roc-partial__note">' + escapeHtml(s.partialNote) + "</div>"
        : "");
  };

  RealOrderCod.prototype._fetchRates = function () {
    var self = this;
    var address = this.getAddress();
    var thanaOptional = this.customThana && !this.districtHasCities;
    if (!address.address1 || (!address.city && !thanaOptional)) return;
    if (this.provinceIsSelect && !address.province) return;

    this.shipListEl.innerHTML = '<p style="font-size:13px;color:#888;margin:4px 0;">Loading shipping options…</p>';
    this.liveSubtotal = null;

    fetch(getProxyBase() + "/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variantId: this.data.variantId,
        quantity: this.quantity,
        address1: address.address1,
        city: address.city,
        province: address.province,
        provinceCode: address.provinceCode,
        countryCode: this.data.countryCode,
        presentmentCountry: this.data.presentmentCountry,
      }),
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (json) {
        self.shippingOptions = json.options || [];
        self.liveSubtotal = json.subtotal || null;
        self.renderShippingOptions();
      })
      .catch(function () {
        self.liveSubtotal = null;
        self.shipListEl.innerHTML = '<p style="font-size:13px;color:#d82c0d;margin:4px 0;">Couldn’t load shipping options. Please try again.</p>';
      });
  };

  // If the merchant's shipping zone rates are named "Inside Dhaka" /
  // "Outside Dhaka" (a common Bangladesh COD pattern), lock the shopper to
  // just the matching rate for their chosen province — only that option is
  // shown/selectable, not just pre-selected — so a Dhaka shopper can't
  // accidentally pick the Outside-Dhaka rate or vice versa. Falls back to
  // showing every option when no province is chosen yet, or when the
  // merchant's rate names don't match this pattern.
  RealOrderCod.prototype.getFilteredShippingOptions = function () {
    if (!this.effectiveIsBd()) return this.shippingOptions;

    var provinceEl = this.overlay.querySelector('[name="province"]');
    var province = provinceEl ? provinceEl.value.trim().toLowerCase() : "";
    if (!province) return this.shippingOptions;

    var isDhaka = province === "dhaka";
    // Only filter OUT the wrong Dhaka variant (e.g. hide "Outside Dhaka"
    // when the province is Dhaka). Any rate that doesn't mention Dhaka at
    // all — Free Shipping, Express Delivery, etc. — is left alone: Shopify
    // only returned it because its own condition (e.g. minimum order
    // value) already matched, and this filter has no business hiding a
    // valid, unrelated rate.
    var filtered = this.shippingOptions.filter(function (o) {
      var title = o.title.toLowerCase();
      if (title.indexOf("dhaka") === -1) return true;
      var isInside = title.indexOf("inside") !== -1;
      var isOutside = title.indexOf("outside") !== -1;
      return isDhaka ? isInside : isOutside;
    });

    return filtered.length ? filtered : this.shippingOptions;
  };

  RealOrderCod.prototype.renderShippingOptions = function () {
    var self = this;
    var options = this.getFilteredShippingOptions();
    if (!options.length) {
      this.shipListEl.innerHTML = '<p style="font-size:13px;color:#888;margin:4px 0;">No shipping options for this address.</p>';
      return;
    }
    if (!this.selectedShipping || !options.some(function (o) { return o.handle === self.selectedShipping.handle; })) {
      // Prefer a free rate when one qualifies (Shopify only returned it
      // because its condition — e.g. minimum order value — already
      // matched), otherwise fall back to whichever option came first.
      var freeOption = options.filter(function (o) { return o.amount === 0; })[0];
      this.selectedShipping = freeOption || options[0];
    }
    var html = options
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
    if (this.provinceIsSelect && !a.province)
      return this.customThana
        ? "Please select your district."
        : "Please select your province / state.";
    if (this.customThana && this.districtHasCities && !a.city)
      return "Please select your thana.";
    if (!this.customThana && !a.city) return "Please enter your city.";
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

    // Phone-OTP gate. Until the number is verified we send a code and show
    // the verify step instead of creating the order.
    if (
      this.settings &&
      this.settings.otpEnabled &&
      !(this.otpVerified && this.verifiedPhone === address.phone)
    ) {
      this.startOtpFlow(address);
      return;
    }

    // Online-payment gate. When the merchant offers Partial / Full payment,
    // ask how to pay before anything is created.
    if (this.settings && this.settings.partialEnabled && !this.paymentResolved) {
      this.showPaymentStep(address);
      return;
    }

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
        provinceCode: address.provinceCode,
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
        if (res.json && res.json.needsOtp) {
          self.otpVerified = false;
          self.statusEl.textContent = "";
          self.submitBtn.disabled = false;
          self.startOtpFlow(address);
          return;
        }
        if (!res.ok || res.json.error) {
          if (res.json && res.json.debug) {
            console.error("[real-order] Order failed:", res.json.debug);
          }
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

  // ---- Phone OTP ----------------------------------------------------------

  RealOrderCod.prototype.startOtpFlow = function (address) {
    var self = this;
    address = address || this.getAddress();
    this.showError("");
    this.submitBtn.disabled = true;
    this.statusEl.textContent = "Sending verification code…";

    fetch(getProxyBase() + "/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent: "send", phone: address.phone }),
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (json) {
        self.statusEl.textContent = "";
        self.submitBtn.disabled = false;
        if (json.error) {
          self.showError(json.error);
          return;
        }
        self.renderOtpUi(json.demo ? json.demoCode : null);
      })
      .catch(function () {
        self.statusEl.textContent = "";
        self.submitBtn.disabled = false;
        self.showError("Couldn't send the verification code. Please try again.");
      });
  };

  RealOrderCod.prototype.renderOtpUi = function (demoCode) {
    var self = this;
    if (!this.otpEl) return;
    this.otpEl.hidden = false;
    this.otpEl.innerHTML =
      '<div class="roc-otp__title">Enter the 6-digit code sent to your phone' +
      (demoCode
        ? ' <span class="roc-otp__demo">Demo mode — code: ' +
          escapeHtml(demoCode) +
          "</span>"
        : "") +
      "</div>" +
      '<div class="roc-otp__row">' +
      '<input type="text" inputmode="numeric" maxlength="6" class="roc-otp__input" placeholder="------" autocomplete="one-time-code">' +
      '<button type="button" class="roc-otp__verify">Verify</button>' +
      "</div>" +
      '<button type="button" class="roc-otp__resend">Resend code</button>';

    var input = this.otpEl.querySelector(".roc-otp__input");
    if (input) input.focus();
    this.otpEl.querySelector(".roc-otp__verify").addEventListener("click", function () {
      self.verifyOtp(input ? input.value : "");
    });
    this.otpEl.querySelector(".roc-otp__resend").addEventListener("click", function () {
      self.startOtpFlow();
    });
  };

  RealOrderCod.prototype.verifyOtp = function (code) {
    var self = this;
    var address = this.getAddress();
    code = String(code || "").trim();
    if (code.length < 4) {
      this.showError("Enter the code you received.");
      return;
    }
    this.showError("");
    this.statusEl.textContent = "Verifying…";

    fetch(getProxyBase() + "/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent: "verify", phone: address.phone, code: code }),
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (json) {
        self.statusEl.textContent = "";
        if (json.error) {
          self.showError(json.error);
          return;
        }
        self.otpVerified = true;
        self.verifiedPhone = address.phone;
        if (self.otpEl) {
          self.otpEl.hidden = true;
          self.otpEl.innerHTML = "";
        }
        self.submitOrder();
      })
      .catch(function () {
        self.statusEl.textContent = "";
        self.showError("Couldn't verify the code. Please try again.");
      });
  };

  // ---- Online payment (Partial / Full) ---------------------------------

  RealOrderCod.prototype.currentTotal = function () {
    return (
      this.subtotal() + (this.selectedShipping ? this.selectedShipping.amount : 0)
    );
  };

  RealOrderCod.prototype.paymentPayload = function (address, extra) {
    var base = {
      variantId: this.data.variantId,
      quantity: this.quantity,
      fullName: address.fullName,
      phone: address.phone,
      email: address.email,
      province: address.province,
      provinceCode: address.provinceCode,
      city: address.city,
      address1: address.address1,
      countryCode: this.data.countryCode,
      shippingHandle: this.selectedShipping ? this.selectedShipping.handle : null,
      paymentMethod: this.paymentMethod,
      paymentChoice: this.paymentChoice,
    };
    for (var k in extra || {}) base[k] = extra[k];
    return base;
  };

  RealOrderCod.prototype.showPaymentStep = function (address) {
    var self = this;
    if (!this.payEl) return;
    var s = this.settings;
    var currency = this.liveSubtotal
      ? this.liveSubtotal.currencyCode
      : this.data.currency;
    var total = this.currentTotal();
    var p = this.computePartial(total) || { advance: total, balance: 0 };

    var methodRows =
      '<label class="roc-pay__opt"><input type="radio" name="payMethod" value="shopify" checked> Card / Shopify checkout</label>';
    if (s.bkashEnabled && s.bkashMerchantNumber) {
      methodRows +=
        '<label class="roc-pay__opt"><input type="radio" name="payMethod" value="bkash"> bKash</label>';
    }

    // Merchant has online payment enabled → every order pays online. Only
    // Partial (advance + COD balance) or Full. No pure Cash-on-Delivery.
    this.payEl.innerHTML =
      '<div class="roc-pay__head"><span class="roc-pay__title">Choose how to pay</span>' +
      '<button type="button" class="roc-pay__close" aria-label="Back">&times;</button></div>' +
      '<label class="roc-pay__card">' +
      '<input type="radio" name="payChoice" value="partial" checked>' +
      '<span class="roc-pay__card-body">' +
      '<span class="roc-pay__card-title">Partial COD</span>' +
      '<span class="roc-pay__card-sub">Pay ' +
      formatMoney(p.advance, currency) +
      " now, and the remaining " +
      formatMoney(p.balance, currency) +
      " later.</span>" +
      "</span>" +
      '<span class="roc-pay__card-amount">' +
      formatMoney(p.advance, currency) +
      "</span>" +
      "</label>" +
      '<label class="roc-pay__card">' +
      '<input type="radio" name="payChoice" value="full">' +
      '<span class="roc-pay__card-body">' +
      '<span class="roc-pay__card-title">Full Payment</span>' +
      '<span class="roc-pay__card-sub">Pay the entire amount now</span>' +
      "</span>" +
      '<span class="roc-pay__card-amount">' +
      formatMoney(total, currency) +
      "</span>" +
      "</label>" +
      '<div class="roc-pay__methods">' +
      '<div class="roc-pay__subtitle">Pay with</div>' +
      methodRows +
      "</div>" +
      (s.partialNote
        ? '<div class="roc-partial__note">' + escapeHtml(s.partialNote) + "</div>"
        : "") +
      '<button type="button" class="roc-pay__confirm">Continue</button>';

    var cards = this.payEl.querySelectorAll(".roc-pay__card");
    var syncCards = function () {
      cards.forEach(function (c) {
        c.classList.toggle("is-selected", c.querySelector("input").checked);
      });
    };
    cards.forEach(function (c) {
      c.addEventListener("click", function () {
        c.querySelector("input").checked = true;
        syncCards();
      });
    });
    syncCards();

    this.payEl
      .querySelector(".roc-pay__close")
      .addEventListener("click", function () {
        self.payLayer.classList.remove("is-open");
        self.submitBtn.style.display = "";
      });
    this.payEl
      .querySelector(".roc-pay__confirm")
      .addEventListener("click", function () {
        self.handlePaymentConfirm(address);
      });
    this.submitBtn.style.display = "none";

    // Flush styles so the open transition actually animates from the
    // closed state, then play it.
    void this.payLayer.offsetWidth;
    this.payLayer.classList.add("is-open");
  };

  RealOrderCod.prototype.handlePaymentConfirm = function (address) {
    var self = this;
    var choiceEl = this.payEl.querySelector('input[name="payChoice"]:checked');
    var choice = choiceEl ? choiceEl.value : "partial";
    var methodEl = this.payEl.querySelector('input[name="payMethod"]:checked');
    var method = methodEl ? methodEl.value : "shopify";

    this.paymentChoice = choice;
    this.paymentMethod = method;
    this.showError("");
    this.statusEl.textContent = "Starting payment…";

    fetch(getProxyBase() + "/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(self.paymentPayload(address, { intent: "create" })),
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (json) {
        self.statusEl.textContent = "";
        if (json && json.needsOtp) {
          self.otpVerified = false;
          self.startOtpFlow(address);
          return;
        }
        if (json.error) {
          if (json.debug) console.error("[real-order] Payment failed:", json.debug);
          self.showError(json.error);
          return;
        }
        if (json.method === "shopify") {
          self.beginShopifyPayment(json, address);
        } else if (json.method === "bkash") {
          self.beginBkashPayment(json, address);
        } else {
          self.showError("Couldn't start the payment. Please try again.");
        }
      })
      .catch(function () {
        self.statusEl.textContent = "";
        self.showError("Couldn't start the payment. Please try again.");
      });
  };

  RealOrderCod.prototype.beginShopifyPayment = function (json, address) {
    this.payEl.innerHTML =
      '<div class="roc-pay__title">Complete your payment</div>' +
      '<p class="roc-pay__hint">A secure Shopify payment page has opened in a new tab. ' +
      "Finish paying there — this page updates automatically.</p>" +
      '<a class="roc-pay__link" href="' +
      json.invoiceUrl +
      '" target="_blank" rel="noopener">Reopen payment page</a>' +
      '<div class="roc-pay__waiting">Waiting for payment confirmation…</div>';
    window.open(json.invoiceUrl, "_blank");
    this.pollPayment(json, address, 0);
  };

  RealOrderCod.prototype.pollPayment = function (meta, address, attempt) {
    var self = this;
    attempt = attempt || 0;
    if (attempt > 75) {
      var w = this.payEl.querySelector(".roc-pay__waiting");
      if (w) {
        w.textContent =
          "Still waiting. If you have completed the payment, contact the store with your details.";
      }
      return;
    }
    this.pollTimer = setTimeout(function () {
      fetch(getProxyBase() + "/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          self.paymentPayload(address, {
            intent: "status",
            draftOrderId: meta.draftOrderId,
            expectedAmount: meta.expectedAmount,
            orderTotal: meta.orderTotal,
            shippingTitle: self.selectedShipping ? self.selectedShipping.title : "",
          }),
        ),
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (json) {
          if (json && json.paid) {
            self.paymentResolved = true;
            self.payLayer.classList.remove("is-open");
            self.showSuccess(json, address);
            return;
          }
          self.pollPayment(meta, address, attempt + 1);
        })
        .catch(function () {
          self.pollPayment(meta, address, attempt + 1);
        });
    }, 4000);
  };

  RealOrderCod.prototype.beginBkashPayment = function (json, address) {
    var self = this;
    var amount = formatMoney(json.expectedAmount, json.currency);
    this.payEl.innerHTML =
      '<div class="roc-pay__title">Pay ' +
      amount +
      " with bKash</div>" +
      '<ol class="roc-pay__steps">' +
      "<li>Open bKash &rarr; <strong>Send Money</strong></li>" +
      "<li>Send <strong>" +
      amount +
      "</strong> to <strong>" +
      escapeHtml(json.bkashNumber || "") +
      "</strong></li>" +
      "<li>Enter the Transaction ID (TrxID) below</li>" +
      "</ol>" +
      '<div class="roc-otp__row">' +
      '<input type="text" class="roc-otp__input roc-bkash__trx" placeholder="TrxID" autocomplete="off">' +
      '<button type="button" class="roc-bkash__confirm">Confirm</button>' +
      "</div>" +
      (json.codBalance
        ? '<div class="roc-partial__note">' +
          formatMoney(json.codBalance, json.currency) +
          " will be collected on delivery.</div>"
        : "");

    var input = this.payEl.querySelector(".roc-bkash__trx");
    this.payEl
      .querySelector(".roc-bkash__confirm")
      .addEventListener("click", function () {
        var trx = input ? input.value.trim() : "";
        if (trx.length < 4) {
          self.showError("Enter the bKash Transaction ID.");
          return;
        }
        self.showError("");
        self.statusEl.textContent = "Confirming payment…";
        fetch(getProxyBase() + "/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            self.paymentPayload(address, {
              intent: "bkash-confirm",
              bkashTrxId: trx,
            }),
          ),
        })
          .then(function (r) {
            return r.json();
          })
          .then(function (json2) {
            self.statusEl.textContent = "";
            if (json2.error) {
              self.showError(json2.error);
              return;
            }
            self.paymentResolved = true;
            self.payLayer.classList.remove("is-open");
            self.showSuccess(json2, address);
          })
          .catch(function () {
            self.statusEl.textContent = "";
            self.showError("Couldn't confirm the payment. Please try again.");
          });
      });
  };

  RealOrderCod.prototype.showSuccess = function (result, address) {
    var self = this;
    var d = this.data;
    // Use the amounts the real Shopify order was created with (always the
    // shop's base currency) rather than recomputing from the popup's
    // possibly-localized display values, so every number on this screen is
    // guaranteed to match the currency label next to it.
    var currency = result.currency;
    var qty = this.quantity;
    var lineTotal = Number(result.subtotal);
    var unitPrice = lineTotal / qty;
    var shippingAmount = Number(result.shipping);
    var shippingLabel = this.selectedShipping ? this.selectedShipping.title : "";
    var addressParts = [address.address1, address.city, address.province]
      .filter(Boolean)
      .join(", ");

    var paidAmount = result.amountPaid != null ? Number(result.amountPaid) : null;
    var codBalance = result.codBalance != null ? Number(result.codBalance) : null;
    var payMethodLabel =
      result.paymentMethod === "bkash"
        ? "bKash"
        : result.paymentMethod === "shopify"
          ? "Card / Shopify"
          : "Cash on Delivery";
    var payStatusLabel =
      result.paymentStatus === "paid"
        ? "Paid"
        : result.paymentStatus === "partially_paid"
          ? "Partially paid"
          : result.paymentStatus === "pending_verification"
            ? "Payment pending verification"
            : "Cash on Delivery";
    var walletTitle = paidAmount != null ? payMethodLabel : "Cash on Delivery";
    var walletSub =
      paidAmount != null
        ? "Paid " +
          formatMoney(paidAmount, currency) +
          " · " +
          payStatusLabel +
          (codBalance
            ? "<br>Balance on delivery: " + formatMoney(codBalance, currency)
            : "")
        : "Total Amount: " + formatMoney(result.total, currency);

    publishPixelEvent("Purchase", {
      orderName: result.orderName,
      productId: d.productId,
      variantId: d.variantId,
      productTitle: d.productTitle,
      quantity: qty,
      subtotal: lineTotal,
      shipping: shippingAmount,
      total: Number(result.total),
      currency: currency,
    });

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
      '<p class="roc-success-card__title">' + escapeHtml(walletTitle) + "</p>" +
      '<p class="roc-success-card__sub">' + walletSub + "</p>" +
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
      '<p class="roc-success-product__price">' + formatMoney(unitPrice, currency) + "/ea</p>" +
      "</div>" +
      '<div class="roc-success-product__total">' +
      "<strong>" + formatMoney(lineTotal, currency) + "</strong>" +
      "</div>" +
      "</div>" +
      '<div class="roc-summary__row"><span>Subtotal · ' + qty + (qty === 1 ? " item" : " items") + '</span><span>' + formatMoney(lineTotal, currency) + "</span></div>" +
      '<div class="roc-summary__row"><span>Delivery' + (shippingLabel ? " (" + escapeHtml(shippingLabel) + ")" : "") + '</span><span>' + (shippingAmount === 0 ? "Free" : formatMoney(shippingAmount, currency)) + "</span></div>" +
      '<div class="roc-summary__row roc-summary__row--total"><span>Total</span><span>' + formatMoney(result.total, currency) + "</span></div>" +
      (paidAmount != null
        ? '<div class="roc-summary__row"><span>Paid online</span><span>' +
          formatMoney(paidAmount, currency) +
          "</span></div>" +
          '<div class="roc-summary__row"><span>Pay on delivery</span><span>' +
          formatMoney(codBalance || 0, currency) +
          "</span></div>" +
          (result.bkashTrxId
            ? '<div class="roc-summary__row"><span>bKash TrxID</span><span>' +
              escapeHtml(result.bkashTrxId) +
              "</span></div>"
            : "")
        : "") +
      "</div>" +
      (result.partialNote
        ? '<div class="roc-partial__note">' + escapeHtml(result.partialNote) + "</div>"
        : "") +

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
