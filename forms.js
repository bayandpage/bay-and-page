/* Bay & Page — site forms.
   Schools & Businesses and Special Orders / Wanted List are sent to
   orders@bayandpage.com through Web3Forms (https://web3forms.com).
   The wholesale application (with its resale certificate upload) is a
   regular multipart POST to FormSubmit (https://formsubmit.co); this file
   only validates it and shows "Sending…". */

// ---- Web3Forms access key (the only place it is needed) ----
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

  var FILE_TYPES = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };

  // Returns an error message for a file input, or "" if it is OK.
  function fileProblem(el) {
    var maxMb = parseFloat(el.getAttribute("data-max-mb")) || 10;
    var f = el.files && el.files[0];
    if (!f) return el.required ? "Please upload your resale certificate (PDF, JPG, or PNG, up to " + maxMb + " MB)." : "";
    var ext = (f.name.split(".").pop() || "").toLowerCase();
    if (!FILE_TYPES[ext] || (f.type && Object.keys(FILE_TYPES).map(function (k) { return FILE_TYPES[k]; }).indexOf(f.type) === -1)) {
      return "The resale certificate must be a PDF, JPG, or PNG file.";
    }
    if (f.size > maxMb * 1024 * 1024) return "The resale certificate file is larger than " + maxMb + " MB. Please upload a smaller file.";
    return "";
  }

  // Basic required-field, email, and file validation. Returns true if valid.
  function validate(form) {
    var firstBad = null, fileMsg = "";
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.type === "hidden" || el.name === "botcheck" || el.name === "_honey") return;
      var bad = false;
      if (el.type === "file") {
        var msg = fileProblem(el);
        if (msg) { bad = true; if (!fileMsg) fileMsg = msg; }
      } else {
        if (el.required && !el.value.trim()) bad = true;
        if (!bad && el.type === "email" && el.value.trim() &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim())) bad = true;
      }
      el.classList.toggle("invalid", bad);
      el.setAttribute("aria-invalid", bad ? "true" : "false");
      if (bad && !firstBad) firstBad = el;
    });
    if (firstBad) {
      var others = form.querySelectorAll(".invalid:not([type=file])").length > 0;
      setStatus(form, "error",
        others ? "Please fill in the highlighted fields (and check the email address)." + (fileMsg ? " " + fileMsg : "")
               : fileMsg);
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
    if (!form) return; // this form is not on the current page
    var button = form.querySelector('button[type="submit"]');
    var done = form.parentNode.querySelector(".form-success");
    if (!button || !done || !form.elements.botcheck) return;
    var buttonText = button.textContent;

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

  // ---- Wholesale account application (FormSubmit, normal multipart POST) ----
  (function () {
    var form = document.getElementById("apply-form");
    if (!form) return; // not on this page
    var button = form.querySelector('button[type="submit"]');
    if (!button) return;
    var buttonText = button.textContent;

    function resetButton() {
      button.disabled = false;
      button.textContent = buttonText;
    }

    // Re-check the file as soon as one is picked, so problems show right away.
    var fileInput = form.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.addEventListener("change", function () {
        var msg = fileProblem(fileInput);
        fileInput.classList.toggle("invalid", !!msg);
        fileInput.setAttribute("aria-invalid", msg ? "true" : "false");
        setStatus(form, msg ? "error" : "", msg);
      });
    }

    form.addEventListener("submit", function (e) {
      if (button.disabled || !validate(form)) {
        e.preventDefault();
        return;
      }
      form.elements._subject.value = "Wholesale account application – " + form.elements["Business name"].value.trim();
      if (form.elements._replyto) form.elements._replyto.value = form.elements.email.value.trim();
      button.disabled = true;
      button.textContent = MSG_SENDING;
      setStatus(form, "sending", MSG_SENDING);
      // No preventDefault: the browser posts the form (with the file) to FormSubmit.
    });

    // If the visitor comes back with the Back button, make the form usable again.
    window.addEventListener("pageshow", function () {
      resetButton();
      setStatus(form, "", "");
    });
  })();

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
