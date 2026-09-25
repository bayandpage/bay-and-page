/* Bay & Page — wholesale forms.
   Submissions are sent to orders@bayandpage.com through Web3Forms
   (https://web3forms.com). No email app is opened. */

// ---- Paste the Web3Forms access key here (the only place it is needed) ----
const WEB3FORMS_ACCESS_KEY = '1150134e-cc2d-46fe-9e99-6ea8c503a185';

(function () {
  "use strict";

  var ENDPOINT = "https://api.web3forms.com/submit";
  var FROM_NAME = "Bay & Page website";
  var CONTACT = "orders@bayandpage.com";
  var MSG_SENDING = "Sending…";
  var MSG_ERROR = "Sorry, something went wrong. Please email us at " + CONTACT + ".";

  if (WEB3FORMS_ACCESS_KEY === "PASTE_ACCESS_KEY_HERE") {
    console.warn("Bay & Page forms: Web3Forms access key has not been set in forms.js.");
  }

  function val(form, name) {
    var el = form.elements[name];
    return el ? el.value.trim() : "";
  }

  // Basic required-field + email validation. Returns true if valid.
  function validate(form) {
    var firstBad = null;
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.name === "botcheck") return;
      var bad = false;
      if (el.required && !el.value.trim()) bad = true;
      if (!bad && el.type === "email" && el.value.trim() &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim())) bad = true;
      el.classList.toggle("invalid", bad);
      el.setAttribute("aria-invalid", bad ? "true" : "false");
      if (bad && !firstBad) firstBad = el;
    });
    if (firstBad) {
      setStatus(form, "error", "Please fill in the highlighted fields (and check the email address).");
      firstBad.focus();
      return false;
    }
    return true;
  }

  function setStatus(form, kind, text) {
    var box = form.querySelector(".form-status");
    box.className = "form-status " + kind;
    box.textContent = text;
  }

  function showSuccess(form) {
    var done = form.parentNode.querySelector(".form-success");
    form.reset();
    setStatus(form, "", "");
    form.hidden = true;
    done.hidden = false;
    done.setAttribute("tabindex", "-1");
    done.focus();
  }

  // Wire up one form: fields() returns the readable named fields to send.
  function setup(formId, subjectFor, fields) {
    var form = document.getElementById(formId);
    if (!form) return;
    var button = form.querySelector('button[type="submit"]');
    var buttonText = button.textContent;
    var done = form.parentNode.querySelector(".form-success");

    done.querySelector(".send-another").addEventListener("click", function () {
      done.hidden = true;
      form.hidden = false;
      form.querySelector("input, select, textarea").focus();
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (button.disabled) return;
      if (!validate(form)) return;

      var email = val(form, "email");
      var payload = {
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: subjectFor(form),
        from_name: FROM_NAME,
        email: email,
        replyto: email,
        botcheck: form.elements.botcheck.checked
      };
      fields(form).forEach(function (pair) { payload[pair[0]] = pair[1] || "—"; });

      button.disabled = true;
      button.textContent = MSG_SENDING;
      setStatus(form, "sending", MSG_SENDING);

      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            if (!res.ok || !data || data.success !== true) throw new Error("Submission failed");
          });
        })
        .then(function () { showSuccess(form); })
        .catch(function () { setStatus(form, "error", MSG_ERROR); })
        .then(function () {
          button.disabled = false;
          button.textContent = buttonText;
        });
    });
  }

  // ---- Wholesale account application ----
  setup("apply-form",
    function (f) { return "Wholesale account application – " + val(f, "business"); },
    function (f) {
      return [
        ["Business name", val(f, "business")],
        ["Contact name", val(f, "contact")],
        ["Business type", val(f, "type")],
        ["City/State", val(f, "location")],
        ["Resale certificate / sales tax ID", val(f, "taxid")],
        ["What you're looking for", val(f, "looking")]
      ];
    });

  // ---- Schools & Businesses Account ----
  setup("schools-form",
    function (f) { return "Schools & Businesses Account – " + val(f, "organization"); },
    function (f) {
      return [
        ["Organization name", val(f, "organization")],
        ["Contact name", val(f, "contact")],
        ["Address", val(f, "address")],
        ["Type", val(f, "type")],
        ["Tax-exempt certificate number", val(f, "exempt")],
        ["What do you need?", val(f, "needs")]
      ];
    });

  // ---- Special Orders / Wanted List ----
  setup("list-form",
    function (f) { return "Special Orders / Wanted List – " + val(f, "business"); },
    function (f) {
      return [
        ["Business/school name", val(f, "business")],
        ["Contact name", val(f, "contact")],
        ["Needed by", val(f, "needed")],
        ["Titles and quantities (title or ISBN, quantity)", val(f, "list")],
        ["Notes", val(f, "notes")]
      ];
    });
})();
