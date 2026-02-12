/* Broker Portal (Standalone) — Phase 1
   Covers: Customer account & doc mgmt, Portal config, Question set mgmt,
   Analytics & tracking, Help & support (AI assist), Release notes,
   Implementation & onboarding (internal).
*/

(() => {
  // ---------- Utilities ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const fmtDate = (iso) => {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const fmtDT = (iso) => {
    const d = new Date(iso);
    return `${fmtDate(iso)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const initials = (name) => name.split(" ").map(p => p[0]).slice(0,2).join("").toUpperCase();

  const toast = (title, msg, meta = "") => {
    const wrap = $("#toastWrap");
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `
      <div class="toast__title">${escapeHtml(title)}</div>
      <div class="toast__msg">${escapeHtml(msg)}</div>
      ${meta ? `<div class="toast__meta">${escapeHtml(meta)}</div>` : ""}
    `;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  };

  const escapeHtml = (s) => String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  // ---------- State ----------
  const state = {
    route: "dashboard",
    env: "preview", // preview | live
    role: "broker_admin", // broker_admin | broker_support | implementation_specialist | ogi_internal
    orgName: "Acme Brokers",
    // Versioned config by environment
    portalConfig: {
      preview: {
        branding: {
          logoText: "Acme Brokers",
          primaryColour: "#111827",
          officeHours: "Mon–Fri 9:00–17:30",
          phone: "01234 567890",
          email: "support@acmebrokers.co.uk"
        },
        footer: {
          privacyPolicyUrl: "https://example.com/privacy",
          termsUrl: "https://example.com/terms"
        },
        links: [
          { label: "Make a claim", url: "https://example.com/claims" },
          { label: "Contact us", url: "https://example.com/contact" }
        ],
        faqs: [
          { q: "I didn’t receive my verification email. What should I do?", a: "Ask the customer to check junk/spam. Confirm the registered email address. If still missing, trigger a resend." },
          { q: "A customer can’t see their policy after registering.", a: "Confirm the policy is linked to the registered email. Check audit log for linking events." }
        ],
        recommended: {
          enabled: true,
          title: "Recommended",
          items: [
            { title: "How to help with registration", url: "#help-support" },
            { title: "Troubleshooting document access", url: "#help-support" }
          ]
        }
      },
      live: null // set on publish
    },

    // Question sets by environment
    questionSets: {
      preview: [
        {
          id: "qs_mta_v1",
          name: "MTA — Core Questions",
          journey: "MTA",
          updatedAt: "2026-02-08T10:20:00Z",
          status: "Draft",
          questions: [
            { id: "q1", type: "text", title: "What change do you need to make?", helper: "E.g. address change, vehicle change", required: true, logic: "" },
            { id: "q2", type: "choice", title: "When should the change take effect?", helper: "Select one", required: true, logic: "If 'Backdated' then show date reason" , choices: ["Today", "Future date", "Backdated"] },
            { id: "q3", type: "date", title: "Effective date", helper: "Choose a date", required: false, logic: "Show if q2 = Future date or Backdated" }
          ]
        },
        {
          id: "qs_reg_v1",
          name: "Registration — Verification Prompts",
          journey: "Registration",
          updatedAt: "2026-02-06T15:05:00Z",
          status: "Published (Preview)",
          questions: [
            { id: "r1", type: "email", title: "Confirm your email address", helper: "", required: true, logic: "" },
            { id: "r2", type: "code", title: "Enter your verification code", helper: "We’ll send a 6-digit code", required: true, logic: "" }
          ]
        }
      ],
      live: []
    },

    // Customers, accounts, policies, documents, and audit activity
    customers: [
      {
        id: "c_1001",
        name: "Katerina Novak",
        email: "katerina.novak@email.com",
        accountStatus: "Registered",
        registeredAt: "2026-01-12T11:22:00Z",
        lastLoginAt: "2026-02-11T19:10:00Z",
        policies: [
          { policyNumber: "ACM-MTR-001928", line: "Motor", status: "In force" },
          { policyNumber: "ACM-HOM-000442", line: "Home", status: "Renewal due" }
        ],
        documents: [
          { id: "d_1", name: "Policy Schedule.pdf", type: "Schedule", uploadedBy: "System", createdAt: "2026-01-12T11:30:00Z", accessed: true, accessedAt: "2026-02-10T08:10:00Z" },
          { id: "d_2", name: "Proof of NCD.jpg", type: "Customer upload", uploadedBy: "Customer", createdAt: "2026-02-09T12:41:00Z", accessed: false, accessedAt: null }
        ],
        audit: [
          { at: "2026-02-11T19:10:00Z", event: "Login successful", detail: "Customer logged in" },
          { at: "2026-02-10T08:10:00Z", event: "Document viewed", detail: "Policy Schedule.pdf" },
          { at: "2026-02-09T12:41:00Z", event: "Document uploaded", detail: "Proof of NCD.jpg" }
        ]
      },
      {
        id: "c_1002",
        name: "Shane Mitchell",
        email: "shane.mitchell@email.com",
        accountStatus: "Locked",
        registeredAt: "2026-01-02T09:00:00Z",
        lastLoginAt: "2026-02-11T08:20:00Z",
        policies: [
          { policyNumber: "ACM-MTR-001112", line: "Motor", status: "In force" }
        ],
        documents: [
          { id: "d_3", name: "Renewal Invite.pdf", type: "Invite", uploadedBy: "System", createdAt: "2026-02-01T09:00:00Z", accessed: true, accessedAt: "2026-02-01T09:04:00Z" }
        ],
        audit: [
          { at: "2026-02-11T08:20:00Z", event: "Account locked", detail: "Too many failed password attempts" },
          { at: "2026-02-11T08:19:00Z", event: "Login failed", detail: "Incorrect password attempt" },
          { at: "2026-02-11T08:18:00Z", event: "Login failed", detail: "Incorrect password attempt" }
        ]
      },
      {
        id: "c_1003",
        name: "Michelle Robichaud",
        email: "michelle.robichaud@email.com",
        accountStatus: "Not registered",
        registeredAt: null,
        lastLoginAt: null,
        policies: [
          { policyNumber: "ACM-HOM-000008", line: "Home", status: "In force" }
        ],
        documents: [],
        audit: [
          { at: "2026-02-03T10:02:00Z", event: "Portal invite sent", detail: "Invite email queued" }
        ]
      }
    ],

    // Analytics (mock)
    analytics: {
      overview: {
        avgRegistrationMins: 7.4,
        inviteToRegPct: 62,
        regToDocAccessPct: 71,
        docRequestToUploadPct: 54,
        mtaStartPct: 38,
        mtaQuoteIssuedPct: 29,
        quoteToPaymentPct: 19
      },
      segments: [
        { label: "Last 7 days", inviteToRegPct: 60, regToDocAccessPct: 68, quoteToPaymentPct: 17 },
        { label: "Last 30 days", inviteToRegPct: 62, regToDocAccessPct: 71, quoteToPaymentPct: 19 },
        { label: "Last 90 days", inviteToRegPct: 58, regToDocAccessPct: 69, quoteToPaymentPct: 16 }
      ]
    },

    // Help & Support content (broker-specific)
    help: {
      guides: [
        { id: "g_reg", title: "Help a customer complete registration", tags: ["Registration", "Verification"], steps: [
          "Confirm the customer’s registered email address in Customers.",
          "Check account status (Not registered / Registered / Locked).",
          "If verification email not received, ask them to check junk/spam and confirm email spelling.",
          "Trigger a resend (if enabled) or raise a support escalation with required details."
        ]},
        { id: "g_lock", title: "Customer can’t log in (account locked)", tags: ["Login", "Access"], steps: [
          "Open the customer record and confirm account status is Locked.",
          "Review audit log for failed attempt timestamps.",
          "Advise the customer to wait for lockout duration or reset password.",
          "Escalate if lock persists beyond expected duration."
        ]},
        { id: "g_docs", title: "Troubleshoot missing documents", tags: ["Documents"], steps: [
          "Check which documents exist for the customer.",
          "Confirm whether the customer has viewed/downloaded them (timestamps).",
          "If a wrong document has been uploaded, delete it immediately (GDPR).",
          "If customer claims non-receipt, capture details and escalate with evidence."
        ]}
      ],
      escalation: [
        { when: "Customer cannot receive verification email after 2 resends", do: "Escalate to Support", include: ["Customer email", "Timestamp", "Any error codes", "Audit log excerpt"] },
        { when: "Possible GDPR breach (wrong document uploaded)", do: "Escalate immediately", include: ["Document name", "Uploader", "Customer ID", "Deletion timestamp", "Actions taken"] },
        { when: "Payments/quote journey blocked", do: "Escalate with journey context", include: ["Journey type", "Step where failed", "Screenshots", "Customer ID"] }
      ]
    },

    // Release notes
    releases: [
      { id: "r_2026_02_10", date: "2026-02-10T09:00:00Z", title: "Improved verification flow resilience", type: "Enhancement", impact: "Reduces failed verification attempts and lockouts.", live: true },
      { id: "r_2026_02_04", date: "2026-02-04T09:00:00Z", title: "Document access tracking", type: "New", impact: "Brokers can see view/download timestamps to support customer queries.", live: true },
      { id: "r_2026_01_20", date: "2026-01-20T09:00:00Z", title: "Upcoming: configurable recommended section", type: "Coming soon", impact: "Brokers can add helpful links on the portal homepage.", live: false }
    ],

    // Internal onboarding (OGI)
    onboarding: {
      brokers: [
        { broker: "Acme Brokers", stage: "In build", owner: "Implementation", readiness: 64, blockers: "Awaiting sign-off on FAQs" },
        { broker: "NorthStar Insurance", stage: "UAT", owner: "Implementation", readiness: 82, blockers: "None" },
        { broker: "Harbour & Co", stage: "Live", owner: "Implementation", readiness: 100, blockers: "—" }
      ],
      checklist: [
        { item: "Branding + contact details confirmed", done: true },
        { item: "FAQs loaded + reviewed", done: false },
        { item: "Question sets validated (Quotes / MTAs)", done: false },
        { item: "Analytics tags verified", done: true },
        { item: "Broker admin access provisioned", done: true }
      ]
    }
  };

  // live config defaults to preview on first load
  if (!state.portalConfig.live) state.portalConfig.live = JSON.parse(JSON.stringify(state.portalConfig.preview));

  // ---------- Permissions ----------
  const roles = [
    { id: "broker_admin", label: "Broker Admin" },
    { id: "broker_support", label: "Broker Support" },
    { id: "implementation_specialist", label: "Implementation Specialist" },
    { id: "ogi_internal", label: "OGI Internal" }
  ];

  const can = {
    viewInternal: () => state.role === "ogi_internal",
    editPortalConfig: () => state.role === "broker_admin" || state.role === "implementation_specialist" || state.role === "ogi_internal",
    publishPortalConfig: () => state.role === "broker_admin" || state.role === "ogi_internal",
    editQuestionSets: () => state.role === "broker_admin" || state.role === "implementation_specialist" || state.role === "ogi_internal",
    publishQuestionSets: () => state.role === "broker_admin" || state.role === "ogi_internal",
    deleteDocuments: () => state.role === "broker_admin" || state.role === "broker_support" || state.role === "ogi_internal",
    viewAnalytics: () => true
  };

  // ---------- UI chrome wiring ----------
  const pageEl = $("#page");

  const setCrumbs = (label) => { $("#crumbs").textContent = label; };

  const setActiveNav = (route) => {
    $$(".nav__item").forEach(btn => btn.classList.toggle("is-active", btn.dataset.route === route));
  };

  const setPrimaryAction = (label, onClick) => {
    const btn = $("#primaryActionBtn");
    btn.textContent = label;
    btn.onclick = onClick || (() => {});
  };

  const setInternalVisibility = () => {
    $("#internalSection").hidden = !can.viewInternal();
  };

  const setRoleChip = () => {
    const label = roles.find(r => r.id === state.role)?.label || "Role";
    $("#roleChip").textContent = `${label} ▾`;
  };

  const setEnvButtons = () => {
    $("#envPreviewBtn").classList.toggle("is-active", state.env === "preview");
    $("#envLiveBtn").classList.toggle("is-active", state.env === "live");
  };

  // Role switch dropdown
  const openRoleMenu = (anchor) => {
    closeAnyMenu();
    const menu = document.createElement("div");
    menu.className = "menu";
    roles.forEach(r => {
      const b = document.createElement("button");
      b.innerHTML = `<span>${escapeHtml(r.label)}</span>${r.id === state.role ? "✓" : ""}`;
      b.onclick = () => {
        state.role = r.id;
        setInternalVisibility();
        setRoleChip();
        toast("Role switched", `You are now ${r.label}.`);
        render();
        closeAnyMenu();
      };
      menu.appendChild(b);
    });

    positionMenu(menu, anchor);
    document.body.appendChild(menu);
    window.__activeMenu = menu;
  };

  const positionMenu = (menu, anchor) => {
    const r = anchor.getBoundingClientRect();
    menu.style.top = `${r.bottom + 8 + window.scrollY}px`;
    menu.style.left = `${Math.min(r.left, window.innerWidth - 210) + window.scrollX}px`;
  };

  const closeAnyMenu = () => {
    if (window.__activeMenu) {
      window.__activeMenu.remove();
      window.__activeMenu = null;
    }
  };

  document.addEventListener("click", (e) => {
    if (window.__activeMenu && !window.__activeMenu.contains(e.target) && e.target !== $("#roleChip")) {
      closeAnyMenu();
    }
  });

  $("#roleChip").addEventListener("click", (e) => {
    e.stopPropagation();
    openRoleMenu($("#roleChip"));
  });

  $("#envPreviewBtn").addEventListener("click", () => {
    state.env = "preview";
    setEnvButtons();
    toast("Environment", "Switched to Preview.");
    render();
  });

  $("#envLiveBtn").addEventListener("click", () => {
    state.env = "live";
    setEnvButtons();
    toast("Environment", "Switched to Live.");
    render();
  });

  // Global search
  $("#globalSearch").addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    // lightweight: if searching, jump to customers and filter there
    if (q.length >= 2) {
      state.route = "customers";
      state.__customerSearch = q;
      render();
    } else {
      state.__customerSearch = "";
    }
  });

  // Nav routing
  $$(".nav__item[data-route]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.route = btn.dataset.route;
      render();
    });
  });

  // ---------- Drawer / Modal ----------
  const drawer = $("#drawer");
  const modal = $("#modal");

  const openDrawer = ({ title, bodyHtml, footerHtml }) => {
    $("#drawerTitle").textContent = title || "Details";
    $("#drawerBody").innerHTML = bodyHtml || "";
    $("#drawerFooter").innerHTML = footerHtml || "";
    drawer.setAttribute("aria-hidden", "false");
  };

  const closeDrawer = () => drawer.setAttribute("aria-hidden", "true");

  const openModal = ({ title, bodyHtml, footerHtml }) => {
    $("#modalTitle").textContent = title || "Modal";
    $("#modalBody").innerHTML = bodyHtml || "";
    $("#modalFooter").innerHTML = footerHtml || "";
    modal.setAttribute("aria-hidden", "false");
  };

  const closeModal = () => modal.setAttribute("aria-hidden", "true");

  $$("[data-drawer-close]").forEach(el => el.addEventListener("click", closeDrawer));
  $$("[data-modal-close]").forEach(el => el.addEventListener("click", closeModal));

  // ---------- Data access (env-aware) ----------
  const getConfig = () => state.portalConfig[state.env];
  const getQuestionSets = () => state.questionSets[state.env];

  // ---------- Components ----------
  const badge = (kind, text) => `<span class="badge ${kind ? `badge--${kind}` : ""}">${escapeHtml(text)}</span>`;

  const pageHead = (title, sub, actionsHtml = "") => `
    <div class="pagehead">
      <div>
        <div class="pagehead__title">${escapeHtml(title)}</div>
        <div class="pagehead__sub">${escapeHtml(sub || "")}</div>
      </div>
      <div class="pagehead__actions">${actionsHtml}</div>
    </div>
  `;

  const kebabMenu = (items) => {
    // items: [{label, action, danger}]
    return (e) => {
      e.stopPropagation();
      closeAnyMenu();
      const menu = document.createElement("div");
      menu.className = "menu";
      items.forEach(it => {
        const b = document.createElement("button");
        if (it.danger) b.classList.add("danger");
        b.innerHTML = `<span>${escapeHtml(it.label)}</span><span></span>`;
        b.onclick = () => {
          it.action?.();
          closeAnyMenu();
        };
        menu.appendChild(b);
      });
      positionMenu(menu, e.currentTarget);
      document.body.appendChild(menu);
      window.__activeMenu = menu;
    };
  };

  // ---------- Pages ----------
  function renderDashboard() {
    setCrumbs("Dashboard");
    setPrimaryAction("New", () => {
      openModal({
        title: "Quick create",
        bodyHtml: `
          <div class="note">This is a Phase 1 shell. Codex can wire this to real back-end actions later.</div>
          <div class="form" style="margin-top:12px;">
            <div class="field">
              <label>What do you want to create?</label>
              <select id="qcType">
                <option value="invite">Portal invite</option>
                <option value="doc-request">Document request</option>
                <option value="question-set">Question set (draft)</option>
                <option value="release-note">Release note (draft)</option>
              </select>
            </div>
          </div>
        `,
        footerHtml: `
          <button class="btn" data-modal-close>Cancel</button>
          <button class="btn btn--primary" id="qcCreateBtn">Create</button>
        `
      });
      $("#qcCreateBtn").onclick = () => {
        const type = $("#qcType").value;
        toast("Created", `New ${type} created (stub).`);
        closeModal();
      };
    });

    const a = state.analytics.overview;

    pageEl.innerHTML = `
      ${pageHead("Broker Portal — Dashboard", `Environment: ${state.env.toUpperCase()} • Role: ${roles.find(r => r.id === state.role)?.label}`)}
      <div class="grid grid--3">
        <div class="card kpi">
          <div>
            <div class="kpi__label">Avg registration time</div>
            <div class="kpi__value">${a.avgRegistrationMins}m</div>
            <div class="kpi__meta">How long it takes customers to complete registration</div>
          </div>
          ${badge("good", "Tracking")}
        </div>

        <div class="card kpi">
          <div>
            <div class="kpi__label">Invite → registration</div>
            <div class="kpi__value">${a.inviteToRegPct}%</div>
            <div class="kpi__meta">% of invited customers who register</div>
          </div>
          ${badge("warn", "Monitor")}
        </div>

        <div class="card kpi">
          <div>
            <div class="kpi__label">Quote → payment</div>
            <div class="kpi__value">${a.quoteToPaymentPct}%</div>
            <div class="kpi__meta">% who proceed from quote to payment</div>
          </div>
          ${badge("warn", "Funnel")}
        </div>
      </div>

      <div class="grid grid--2" style="margin-top:12px;">
        <div class="panel">
          <div class="panel__pad">
            <div style="font-weight:800; margin-bottom:8px;">Customer issues (examples)</div>
            <div class="note">
              • “I’ve registered online but I can’t see my policy?”<br>
              • “I can’t access my online account”<br>
              • “I haven’t received the verification code to my email address?”<br>
              • “I’m entering my email verification code but it’s not working”<br>
              • “I can’t find my documents”<br>
              • GDPR risk: wrong document uploaded
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel__pad">
            <div style="font-weight:800; margin-bottom:8px;">Quick links</div>
            <div class="pillrow">
              <span class="pill">Customers</span>
              <span class="pill">Documents</span>
              <span class="pill">Portal config</span>
              <span class="pill">Question sets</span>
              <span class="pill">Analytics</span>
              <span class="pill">Help & AI assist</span>
            </div>

            <div class="note" style="margin-top:10px;">
              Phase 1 includes: account visibility, audit log, document access timestamps + deletion,
              self-serve config + preview/publish, question management with validation/conditional logic,
              analytics dashboards, help content + AI assist, release notes, and internal onboarding.
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderCustomers() {
    setCrumbs("Customers");
    setPrimaryAction("New customer (stub)", () => toast("Stub", "Customer creation is not wired in this Phase 1 shell."));

    const q = (state.__customerSearch || "").toLowerCase();
    const rows = state.customers
      .filter(c => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
      .map(c => {
        const statusKind = c.accountStatus === "Registered" ? "good" : (c.accountStatus === "Locked" ? "bad" : "warn");
        return `
          <tr data-customer="${c.id}">
            <td>
              <div class="rowtitle">
                <div class="avatar">${initials(c.name)}</div>
                <div>
                  <div class="rowtitle__main">${escapeHtml(c.name)}</div>
                  <div class="rowtitle__sub">${escapeHtml(c.email)}</div>
                </div>
              </div>
            </td>
            <td>${badge(statusKind, c.accountStatus)}</td>
            <td>${c.registeredAt ? fmtDT(c.registeredAt) : "—"}</td>
            <td>${c.lastLoginAt ? fmtDT(c.lastLoginAt) : "—"}</td>
            <td class="table__right">
              <button class="kebab" data-kebab="${c.id}" aria-label="Actions">⋯</button>
            </td>
          </tr>
        `;
      }).join("");

    pageEl.innerHTML = `
      ${pageHead("Customers", "View and manage customer online accounts to resolve portal issues.")}
      <div class="panel">
        <div class="panel__pad">
          <table class="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Account status</th>
                <th>Registered</th>
                <th>Last login</th>
                <th class="table__right"></th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="5" style="color:var(--muted);">No results.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Row click -> drawer
    $$("tr[data-customer]").forEach(tr => {
      tr.addEventListener("click", () => openCustomerDrawer(tr.dataset.customer));
    });

    // Kebab actions
    $$("button[data-kebab]").forEach(btn => {
      const id = btn.dataset.kebab;
      btn.addEventListener("click", kebabMenu([
        { label: "View details", action: () => openCustomerDrawer(id) },
        { label: "View documents", action: () => { state.route = "documents"; state.__docCustomer = id; render(); } },
        { label: "Resend verification (stub)", action: () => toast("Verification", "Resend triggered (stub).") },
        { label: "Unlock account (stub)", action: () => toast("Account", "Unlock requested (stub).") }
      ]));
    });
  }

  function openCustomerDrawer(customerId) {
    const c = state.customers.find(x => x.id === customerId);
    if (!c) return;

    const statusKind = c.accountStatus === "Registered" ? "good" : (c.accountStatus === "Locked" ? "bad" : "warn");

    const policiesHtml = (c.policies || []).map(p => `
      <div class="note" style="display:flex; justify-content:space-between; gap:10px; margin-bottom:8px;">
        <div>
          <div style="font-weight:800;">${escapeHtml(p.policyNumber)}</div>
          <div style="color:var(--muted); font-size:12px;">${escapeHtml(p.line)}</div>
        </div>
        <div>${badge(p.status === "In force" ? "good" : "warn", p.status)}</div>
      </div>
    `).join("") || `<div class="note">No policies linked.</div>`;

    const docsHtml = (c.documents || []).slice(0,3).map(d => `
      <div class="note" style="margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between; gap:10px;">
          <div>
            <div style="font-weight:800;">${escapeHtml(d.name)}</div>
            <div style="color:var(--muted); font-size:12px;">${escapeHtml(d.type)} • Uploaded by ${escapeHtml(d.uploadedBy)} • ${fmtDT(d.createdAt)}</div>
          </div>
          <div>${d.accessed ? badge("good", "Accessed") : badge("warn", "Not accessed")}</div>
        </div>
        <div style="margin-top:8px; color:var(--muted); font-size:12px;">
          ${d.accessedAt ? `Last accessed: ${fmtDT(d.accessedAt)}` : "No access recorded"}
        </div>
      </div>
    `).join("") || `<div class="note">No documents in portal.</div>`;

    const auditHtml = (c.audit || []).map(a => `
      <div class="note" style="margin-bottom:8px;">
        <div style="font-weight:800;">${escapeHtml(a.event)}</div>
        <div style="color:var(--muted); font-size:12px;">${fmtDT(a.at)} • ${escapeHtml(a.detail)}</div>
      </div>
    `).join("") || `<div class="note">No recent activity.</div>`;

    openDrawer({
      title: c.name,
      bodyHtml: `
        <div class="note">
          <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
            <div>
              <div style="font-weight:800;">${escapeHtml(c.email)}</div>
              <div style="color:var(--muted); font-size:12px;">
                Registered: ${c.registeredAt ? fmtDT(c.registeredAt) : "—"} • Last login: ${c.lastLoginAt ? fmtDT(c.lastLoginAt) : "—"}
              </div>
            </div>
            <div>${badge(statusKind, c.accountStatus)}</div>
          </div>
        </div>

        <div style="margin-top:12px; font-weight:900;">Policies</div>
        <div style="margin-top:8px;">${policiesHtml}</div>

        <div style="margin-top:12px; font-weight:900;">Documents (top 3)</div>
        <div style="margin-top:8px;">${docsHtml}</div>

        <div style="margin-top:12px; font-weight:900;">Recent activity (audit log)</div>
        <div style="margin-top:8px;">${auditHtml}</div>

        <div style="margin-top:12px;" class="note">
          <strong>GDPR note:</strong> If a wrong document is uploaded, delete it immediately and record actions.
        </div>
      `,
      footerHtml: `
        <button class="btn" data-drawer-close>Close</button>
        <button class="btn" id="openDocsBtn">Open documents</button>
        <button class="btn btn--primary" id="helpBtn">Open help</button>
      `
    });

    $("#openDocsBtn").onclick = () => {
      closeDrawer();
      state.route = "documents";
      state.__docCustomer = customerId;
      render();
    };

    $("#helpBtn").onclick = () => {
      closeDrawer();
      state.route = "help-support";
      render();
      toast("Help", "Jumped to Help & Support for troubleshooting steps.");
    };
  }

  function renderDocuments() {
    setCrumbs("Documents");
    setPrimaryAction("Request document (stub)", () => toast("Stub", "Document request creation is stubbed."));

    // Flatten docs with customer context
    const all = [];
    state.customers.forEach(c => {
      (c.documents || []).forEach(d => all.push({ customerId: c.id, customerName: c.name, customerEmail: c.email, ...d }));
    });

    const focusCustomerId = state.__docCustomer || "";
    const focusCustomer = focusCustomerId ? state.customers.find(c => c.id === focusCustomerId) : null;

    const rows = all
      .filter(d => !focusCustomerId || d.customerId === focusCustomerId)
      .map(d => `
        <tr>
          <td>
            <div class="rowtitle">
              <div class="avatar">${initials(d.customerName)}</div>
              <div>
                <div class="rowtitle__main">${escapeHtml(d.customerName)}</div>
                <div class="rowtitle__sub">${escapeHtml(d.customerEmail)}</div>
              </div>
            </div>
          </td>
          <td>
            <div style="font-weight:800;">${escapeHtml(d.name)}</div>
            <div style="color:var(--muted); font-size:12px;">${escapeHtml(d.type)} • Uploaded by ${escapeHtml(d.uploadedBy)}</div>
          </td>
          <td>${fmtDT(d.createdAt)}</td>
          <td>${d.accessed ? badge("good", "Viewed/Downloaded") : badge("warn", "Not accessed")}</td>
          <td>${d.accessedAt ? fmtDT(d.accessedAt) : "—"}</td>
          <td class="table__right">
            <button class="kebab" data-doc-kebab="${d.customerId}:${d.id}" aria-label="Actions">⋯</button>
          </td>
        </tr>
      `).join("");

    pageEl.innerHTML = `
      ${pageHead("Documents", focusCustomer ? `Showing documents for ${focusCustomer.name}` : "See what documents are in the portal and whether customers accessed them.")}
      <div class="panel">
        <div class="panel__pad">
          <table class="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Document</th>
                <th>Uploaded</th>
                <th>Access</th>
                <th>Accessed at</th>
                <th class="table__right"></th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="6" style="color:var(--muted);">No documents found.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;

    $$("button[data-doc-kebab]").forEach(btn => {
      const [customerId, docId] = btn.dataset.docKebab.split(":");
      btn.addEventListener("click", kebabMenu([
        { label: "View customer", action: () => openCustomerDrawer(customerId) },
        { label: "Download (stub)", action: () => toast("Stub", "Download action is stubbed.") },
        {
          label: "Delete from portal",
          danger: true,
          action: () => {
            if (!can.deleteDocuments()) {
              toast("Not permitted", "Your role cannot delete documents.");
              return;
            }
            confirmDeleteDocument(customerId, docId);
          }
        }
      ]));
    });
  }

  function confirmDeleteDocument(customerId, docId) {
    const c = state.customers.find(x => x.id === customerId);
    const d = c?.documents?.find(x => x.id === docId);
    if (!c || !d) return;

    openModal({
      title: "Delete document from portal",
      bodyHtml: `
        <div class="note">
          You are about to delete <strong>${escapeHtml(d.name)}</strong> for <strong>${escapeHtml(c.name)}</strong>.
          <br><br>
          Use this for GDPR issues (e.g. wrong document uploaded). This action should be audited.
        </div>
        <div class="field" style="margin-top:12px;">
          <label>Reason (for audit)</label>
          <textarea id="delReason" placeholder="E.g. wrong document uploaded / GDPR risk"></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn" data-modal-close>Cancel</button>
        <button class="btn btn--danger" id="confirmDelBtn">Delete</button>
      `
    });

    $("#confirmDelBtn").onclick = () => {
      const reason = ($("#delReason").value || "").trim() || "No reason provided";
      // Remove doc + add audit entry
      c.documents = c.documents.filter(x => x.id !== docId);
      c.audit.unshift({
        at: new Date().toISOString(),
        event: "Document deleted",
        detail: `${d.name} • Reason: ${reason}`
      });
      toast("Document deleted", `${d.name} removed from portal.`, "Audit log updated.");
      closeModal();
      render(); // refresh
    };
  }

  function renderPortalConfig() {
    setCrumbs("Portal styling & configuration");
    const cfg = getConfig();

    setPrimaryAction(can.editPortalConfig() ? "Edit config" : "View only", () => {
      if (!can.editPortalConfig()) {
        toast("View only", "Your role cannot edit portal configuration.");
        return;
      }
      openPortalConfigEditor();
    });

    const canPublish = can.publishPortalConfig();
    const previewLabel = state.env === "preview" ? badge("warn", "Editing in Preview") : badge("good", "Viewing Live");
    const publishBtn = canPublish && state.env === "preview"
      ? `<button class="btn btn--primary" id="publishConfigBtn">Publish to Live</button>`
      : "";

    pageEl.innerHTML = `
      ${pageHead("Portal styling & configuration", "Self-serve styling/content changes with preview and publish.", publishBtn)}
      <div class="grid grid--2">
        <div class="panel">
          <div class="panel__pad">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
              <div style="font-weight:900;">Current configuration</div>
              <div>${previewLabel}</div>
            </div>

            <div style="margin-top:12px;" class="note">
              <div style="font-weight:800;">Branding</div>
              Logo text: <strong>${escapeHtml(cfg.branding.logoText)}</strong><br>
              Primary colour: <strong>${escapeHtml(cfg.branding.primaryColour)}</strong><br>
              Office hours: <strong>${escapeHtml(cfg.branding.officeHours)}</strong><br>
              Phone: <strong>${escapeHtml(cfg.branding.phone)}</strong><br>
              Email: <strong>${escapeHtml(cfg.branding.email)}</strong>
            </div>

            <div style="margin-top:10px;" class="note">
              <div style="font-weight:800;">Links</div>
              ${(cfg.links || []).map(l => `• ${escapeHtml(l.label)} — ${escapeHtml(l.url)}`).join("<br>") || "No links."}
            </div>

            <div style="margin-top:10px;" class="note">
              <div style="font-weight:800;">FAQs</div>
              ${(cfg.faqs || []).slice(0,3).map(f => `• ${escapeHtml(f.q)}`).join("<br>") || "No FAQs."}
            </div>

            <div style="margin-top:10px;" class="note">
              <div style="font-weight:800;">Recommended section</div>
              ${cfg.recommended?.enabled ? `Enabled — ${escapeHtml(cfg.recommended.title)}` : "Disabled"}
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel__pad">
            <div style="font-weight:900;">Live preview (mock)</div>
            <div class="note" style="margin-top:8px;">
              This is a simple preview panel to demonstrate “see and test changes in real time”.
              Codex can replace this with an iframe to your real customer portal preview URL.
            </div>

            <div class="card" style="margin-top:10px; border-radius:16px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="font-weight:900;">${escapeHtml(cfg.branding.logoText)}</div>
                <span class="badge">Office hours: ${escapeHtml(cfg.branding.officeHours)}</span>
              </div>
              <div style="margin-top:10px; color:var(--muted); font-size:13px;">
                Phone: ${escapeHtml(cfg.branding.phone)} • Email: ${escapeHtml(cfg.branding.email)}
              </div>

              ${cfg.recommended?.enabled ? `
                <div style="margin-top:14px; font-weight:900;">${escapeHtml(cfg.recommended.title)}</div>
                <div class="pillrow" style="margin-top:8px;">
                  ${(cfg.recommended.items || []).map(i => `<span class="pill">${escapeHtml(i.title)}</span>`).join("")}
                </div>
              ` : ""}

              <div style="margin-top:14px; display:flex; gap:8px; flex-wrap:wrap;">
                ${(cfg.links || []).map(l => `<span class="badge">${escapeHtml(l.label)}</span>`).join("")}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    if (publishBtn) {
      $("#publishConfigBtn").onclick = () => {
        state.portalConfig.live = JSON.parse(JSON.stringify(state.portalConfig.preview));
        toast("Published", "Portal configuration pushed to Live.");
      };
    }
  }

  function openPortalConfigEditor() {
    const cfg = getConfig();
    openModal({
      title: "Edit portal configuration",
      bodyHtml: `
        <div class="note">Edits apply to the <strong>${escapeHtml(state.env.toUpperCase())}</strong> environment only.</div>

        <div class="form" style="margin-top:12px;">
          <div class="field">
            <label>Logo text</label>
            <input id="pcLogo" value="${escapeHtml(cfg.branding.logoText)}" />
          </div>

          <div class="grid grid--2">
            <div class="field">
              <label>Primary colour</label>
              <input id="pcColour" value="${escapeHtml(cfg.branding.primaryColour)}" />
            </div>
            <div class="field">
              <label>Office hours</label>
              <input id="pcHours" value="${escapeHtml(cfg.branding.officeHours)}" />
            </div>
          </div>

          <div class="grid grid--2">
            <div class="field">
              <label>Phone</label>
              <input id="pcPhone" value="${escapeHtml(cfg.branding.phone)}" />
            </div>
            <div class="field">
              <label>Email</label>
              <input id="pcEmail" value="${escapeHtml(cfg.branding.email)}" />
            </div>
          </div>

          <div class="field">
            <label>Links (JSON)</label>
            <textarea id="pcLinks">${escapeHtml(JSON.stringify(cfg.links || [], null, 2))}</textarea>
          </div>

          <div class="field">
            <label>FAQs (JSON)</label>
            <textarea id="pcFaqs">${escapeHtml(JSON.stringify(cfg.faqs || [], null, 2))}</textarea>
          </div>

          <div class="field">
            <label>Recommended section (JSON)</label>
            <textarea id="pcRecs">${escapeHtml(JSON.stringify(cfg.recommended || {enabled:false}, null, 2))}</textarea>
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn" data-modal-close>Cancel</button>
        <button class="btn btn--primary" id="savePcBtn">Save</button>
      `
    });

    $("#savePcBtn").onclick = () => {
      try {
        cfg.branding.logoText = $("#pcLogo").value.trim();
        cfg.branding.primaryColour = $("#pcColour").value.trim();
        cfg.branding.officeHours = $("#pcHours").value.trim();
        cfg.branding.phone = $("#pcPhone").value.trim();
        cfg.branding.email = $("#pcEmail").value.trim();
        cfg.links = JSON.parse($("#pcLinks").value || "[]");
        cfg.faqs = JSON.parse($("#pcFaqs").value || "[]");
        cfg.recommended = JSON.parse($("#pcRecs").value || "{}");

        toast("Saved", "Portal configuration updated.");
        closeModal();
        render();
      } catch (err) {
        toast("Invalid JSON", "Please fix JSON formatting in Links/FAQs/Recommended.");
      }
    };
  }

  function renderQuestionSets() {
    setCrumbs("Question set management");
    const sets = getQuestionSets();

    setPrimaryAction(can.editQuestionSets() ? "New question set" : "View only", () => {
      if (!can.editQuestionSets()) return toast("View only", "Your role cannot create/edit question sets.");
      createQuestionSet();
    });

    const rows = sets.map(s => `
      <tr>
        <td>
          <div style="font-weight:800;">${escapeHtml(s.name)}</div>
          <div style="color:var(--muted); font-size:12px;">Journey: ${escapeHtml(s.journey)} • ${s.questions.length} questions</div>
        </td>
        <td>${badge(s.status.includes("Published") ? "good" : "warn", s.status)}</td>
        <td>${fmtDT(s.updatedAt)}</td>
        <td class="table__right">
          <button class="kebab" data-qs-kebab="${s.id}" aria-label="Actions">⋯</button>
        </td>
      </tr>
    `).join("");

    pageEl.innerHTML = `
      ${pageHead("Question set management", "Manage titles, helper text, validation rules, assistive text, and conditional logic with preview/publish.")}
      <div class="panel">
        <div class="panel__pad">
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Updated</th>
                <th class="table__right"></th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="4" style="color:var(--muted);">No question sets.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
      <div class="note" style="margin-top:12px;">
        Phase 1 supports: question title, helper text, validation (required/optional), conditional logic, and preview/publish workflow.
        Codex can evolve this into your full Screen Builder engine.
      </div>
    `;

    $$("button[data-qs-kebab]").forEach(btn => {
      const id = btn.dataset.qsKebab;
      btn.addEventListener("click", kebabMenu([
        { label: "Open editor", action: () => openQuestionSetEditor(id) },
        { label: "Preview", action: () => previewQuestionSet(id) },
        { label: "Duplicate", action: () => duplicateQuestionSet(id) },
        ...(can.publishQuestionSets() && state.env === "preview" ? [{ label: "Publish to Live", action: () => publishQuestionSet(id) }] : [])
      ]));
    });
  }

  function createQuestionSet() {
    const sets = getQuestionSets();
    const id = `qs_${Math.random().toString(16).slice(2, 8)}`;
    sets.unshift({
      id,
      name: "New question set",
      journey: "MTA",
      updatedAt: new Date().toISOString(),
      status: "Draft",
      questions: [
        { id: "q1", type: "text", title: "Click to write the question text", helper: "", required: false, logic: "" }
      ]
    });
    toast("Created", "New question set created.");
    openQuestionSetEditor(id);
  }

  function duplicateQuestionSet(id) {
    const sets = getQuestionSets();
    const src = sets.find(s => s.id === id);
    if (!src) return;
    const copy = JSON.parse(JSON.stringify(src));
    copy.id = `qs_${Math.random().toString(16).slice(2, 8)}`;
    copy.name = `${src.name} (Copy)`;
    copy.status = "Draft";
    copy.updatedAt = new Date().toISOString();
    sets.unshift(copy);
    toast("Duplicated", "Question set duplicated.");
    render();
  }

  function publishQuestionSet(id) {
    if (!can.publishQuestionSets()) return toast("Not permitted", "Your role cannot publish.");
    const previewSets = state.questionSets.preview;
    const liveSets = state.questionSets.live;

    const src = previewSets.find(s => s.id === id);
    if (!src) return;
    const published = JSON.parse(JSON.stringify(src));
    published.status = "Published (Live)";
    published.updatedAt = new Date().toISOString();

    // Upsert into live
    const ix = liveSets.findIndex(s => s.id === id);
    if (ix >= 0) liveSets[ix] = published;
    else liveSets.unshift(published);

    toast("Published", `"${src.name}" published to Live.`);
  }

  function previewQuestionSet(id) {
    const sets = getQuestionSets();
    const s = sets.find(x => x.id === id);
    if (!s) return;

    const qHtml = s.questions.map(q => `
      <div class="note" style="margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; gap:10px;">
          <div style="font-weight:900;">${escapeHtml(q.title || "(Untitled question)")}</div>
          <div>${q.required ? badge("warn", "Required") : badge("", "Optional")}</div>
        </div>
        ${q.helper ? `<div style="color:var(--muted); font-size:12px; margin-top:6px;">${escapeHtml(q.helper)}</div>` : ""}
        <div style="margin-top:10px;">
          ${renderPreviewControl(q)}
        </div>
        ${q.logic ? `<div style="margin-top:10px; color:var(--muted); font-size:12px;">Logic: ${escapeHtml(q.logic)}</div>` : ""}
      </div>
    `).join("");

    openModal({
      title: `Preview — ${s.name}`,
      bodyHtml: `
        <div class="note">This is a simplified preview panel (Phase 1). Replace with your real journey preview later.</div>
        <div style="margin-top:12px;">${qHtml}</div>
      `,
      footerHtml: `<button class="btn" data-modal-close>Close</button>`
    });
  }

  function renderPreviewControl(q) {
    const id = `pv_${Math.random().toString(16).slice(2, 8)}`;
    switch (q.type) {
      case "choice":
        return `
          ${(q.choices || ["Choice 1"]).map(ch => `
            <label style="display:flex; gap:8px; align-items:center; margin:6px 0;">
              <input type="radio" name="${id}" />
              <span>${escapeHtml(ch)}</span>
            </label>
          `).join("")}
        `;
      case "date":
        return `<input type="date" style="width:220px; padding:10px; border-radius:12px; border:1px solid var(--line);" />`;
      case "email":
        return `<input type="email" placeholder="name@email.com" style="width:100%; padding:10px; border-radius:12px; border:1px solid var(--line);" />`;
      case "code":
        return `<input type="text" placeholder="6-digit code" style="width:220px; padding:10px; border-radius:12px; border:1px solid var(--line);" />`;
      default:
        return `<input type="text" placeholder="Answer" style="width:100%; padding:10px; border-radius:12px; border:1px solid var(--line);" />`;
    }
  }

  function openQuestionSetEditor(id) {
    const sets = getQuestionSets();
    const s = sets.find(x => x.id === id);
    if (!s) return;

    if (!can.editQuestionSets()) return toast("View only", "Your role cannot edit question sets.");

    const renderQuestionRow = (q, idx) => `
      <div class="note" data-q="${q.id}" style="margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
          <div style="font-weight:900;">Question ${idx + 1}</div>
          <button class="iconbtn" data-del-q="${q.id}" title="Remove question">🗑</button>
        </div>

        <div class="grid grid--2" style="margin-top:10px;">
          <div class="field">
            <label>Type</label>
            <select data-q-type="${q.id}">
              ${["text","choice","date","email","code"].map(t => `<option value="${t}" ${q.type===t?"selected":""}>${t}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label>Required</label>
            <select data-q-req="${q.id}">
              <option value="false" ${q.required ? "" : "selected"}>Optional</option>
              <option value="true" ${q.required ? "selected" : ""}>Required</option>
            </select>
          </div>
        </div>

        <div class="field" style="margin-top:10px;">
          <label>Question title</label>
          <input data-q-title="${q.id}" value="${escapeHtml(q.title || "")}" />
        </div>

        <div class="field">
          <label>Helper / assistive text</label>
          <input data-q-helper="${q.id}" value="${escapeHtml(q.helper || "")}" />
        </div>

        ${q.type === "choice" ? `
          <div class="field">
            <label>Choices (comma separated)</label>
            <input data-q-choices="${q.id}" value="${escapeHtml((q.choices || []).join(", "))}" />
          </div>
        ` : ""}

        <div class="field">
          <label>Conditional logic (free text, Phase 1)</label>
          <input data-q-logic="${q.id}" value="${escapeHtml(q.logic || "")}" />
        </div>
      </div>
    `;

    openModal({
      title: `Edit — ${s.name}`,
      bodyHtml: `
        <div class="note">You are editing in <strong>${escapeHtml(state.env.toUpperCase())}</strong>. Use Preview, then publish from the list.</div>

        <div class="form" style="margin-top:12px;">
          <div class="field">
            <label>Name</label>
            <input id="qsName" value="${escapeHtml(s.name)}" />
          </div>
          <div class="field">
            <label>Journey</label>
            <select id="qsJourney">
              ${["Registration","MTA","Quote"].map(j => `<option value="${j}" ${s.journey===j?"selected":""}>${j}</option>`).join("")}
            </select>
          </div>
        </div>

        <div style="margin-top:14px; font-weight:900;">Questions</div>
        <div style="margin-top:10px;" id="qsQuestions">
          ${s.questions.map(renderQuestionRow).join("")}
        </div>

        <button class="btn" id="addQuestionBtn" style="margin-top:8px;">+ Add question</button>
        <button class="btn" id="previewQsBtn" style="margin-top:8px;">Preview</button>
      `,
      footerHtml: `
        <button class="btn" data-modal-close>Close</button>
        <button class="btn btn--primary" id="saveQsBtn">Save changes</button>
      `
    });

    const redrawQuestions = () => {
      $("#qsQuestions").innerHTML = s.questions.map(renderQuestionRow).join("");
      wireQuestionEditorHandlers();
    };

    const wireQuestionEditorHandlers = () => {
      $$("[data-del-q]").forEach(b => {
        b.onclick = () => {
          const qid = b.dataset.delQ;
          s.questions = s.questions.filter(q => q.id !== qid);
          redrawQuestions();
        };
      });

      $$("[data-q-type]").forEach(sel => {
        sel.onchange = () => {
          const qid = sel.dataset.qType;
          const q = s.questions.find(x => x.id === qid);
          q.type = sel.value;
          if (q.type !== "choice") delete q.choices;
          if (q.type === "choice" && !q.choices) q.choices = ["Choice 1", "Choice 2"];
          redrawQuestions();
        };
      });
    };

    wireQuestionEditorHandlers();

    $("#addQuestionBtn").onclick = () => {
      const qid = `q_${Math.random().toString(16).slice(2, 8)}`;
      s.questions.push({ id: qid, type: "text", title: "", helper: "", required: false, logic: "" });
      redrawQuestions();
    };

    $("#previewQsBtn").onclick = () => previewQuestionSet(s.id);

    $("#saveQsBtn").onclick = () => {
      s.name = $("#qsName").value.trim() || s.name;
      s.journey = $("#qsJourney").value;

      // Pull values from editor
      s.questions.forEach(q => {
        const title = $(`[data-q-title="${q.id}"]`)?.value ?? q.title;
        const helper = $(`[data-q-helper="${q.id}"]`)?.value ?? q.helper;
        const logic = $(`[data-q-logic="${q.id}"]`)?.value ?? q.logic;
        const req = $(`[data-q-req="${q.id}"]`)?.value ?? String(q.required);
        const type = $(`[data-q-type="${q.id}"]`)?.value ?? q.type;

        q.title = title;
        q.helper = helper;
        q.logic = logic;
        q.required = req === "true";
        q.type = type;

        if (q.type === "choice") {
          const raw = $(`[data-q-choices="${q.id}"]`)?.value || "";
          q.choices = raw.split(",").map(x => x.trim()).filter(Boolean);
          if (!q.choices.length) q.choices = ["Choice 1"];
        } else {
          delete q.choices;
        }
      });

      s.updatedAt = new Date().toISOString();
      s.status = s.status.includes("Published") ? s.status : "Draft";
      toast("Saved", "Question set updated.");
      render(); // refresh list beneath if they closed and reopened
    };
  }

  function renderAnalytics() {
    setCrumbs("Analytics & tracking");
    setPrimaryAction("Export (stub)", () => toast("Stub", "Export is stubbed — wire to CSV later."));

    const a = state.analytics.overview;

    pageEl.innerHTML = `
      ${pageHead("Analytics & tracking", "Configurable dashboards showing conversion, completion and drop-off.")}
      <div class="grid grid--3">
        <div class="card kpi">
          <div>
            <div class="kpi__label">Registration time</div>
            <div class="kpi__value">${a.avgRegistrationMins}m</div>
            <div class="kpi__meta">Avg time to complete registration</div>
          </div>
          ${badge("good", "OK")}
        </div>

        <div class="card kpi">
          <div>
            <div class="kpi__label">Invited → registered</div>
            <div class="kpi__value">${a.inviteToRegPct}%</div>
            <div class="kpi__meta">% invited customers who register</div>
          </div>
          ${badge("warn", "Improve")}
        </div>

        <div class="card kpi">
          <div>
            <div class="kpi__label">Doc requests → upload</div>
            <div class="kpi__value">${a.docRequestToUploadPct}%</div>
            <div class="kpi__meta">% requests that result in upload</div>
          </div>
          ${badge("warn", "Friction")}
        </div>
      </div>

      <div class="grid grid--2" style="margin-top:12px;">
        <div class="panel">
          <div class="panel__pad">
            <div style="font-weight:900; margin-bottom:10px;">Funnel metrics</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>% registered customers who access documents</td><td>${a.regToDocAccessPct}%</td></tr>
                <tr><td>% customers who start an MTA quote</td><td>${a.mtaStartPct}%</td></tr>
                <tr><td>% customers who receive an MTA quote</td><td>${a.mtaQuoteIssuedPct}%</td></tr>
                <tr><td>% customers who proceed from quote to payment</td><td>${a.quoteToPaymentPct}%</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="panel">
          <div class="panel__pad">
            <div style="font-weight:900; margin-bottom:10px;">Segment snapshot (mock)</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Invite→Reg</th>
                  <th>Reg→Docs</th>
                  <th>Quote→Pay</th>
                </tr>
              </thead>
              <tbody>
                ${state.analytics.segments.map(s => `
                  <tr>
                    <td>${escapeHtml(s.label)}</td>
                    <td>${s.inviteToRegPct}%</td>
                    <td>${s.regToDocAccessPct}%</td>
                    <td>${s.quoteToPaymentPct}%</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <div class="note" style="margin-top:10px;">
              Codex can swap these mocks for real event data (registration, document access, MTA steps, payment).
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderHelpSupport() {
    setCrumbs("Help & support");
    setPrimaryAction("Open AI assist", () => openAIAssist());

    const guides = state.help.guides.map(g => `
      <tr>
        <td>
          <div style="font-weight:800;">${escapeHtml(g.title)}</div>
          <div style="color:var(--muted); font-size:12px;">
            ${(g.tags || []).map(t => `<span class="badge">${escapeHtml(t)}</span>`).join(" ")}
          </div>
        </td>
        <td class="table__right">
          <button class="btn" data-guide="${g.id}">Open</button>
        </td>
      </tr>
    `).join("");

    pageEl.innerHTML = `
      ${pageHead("Help & support", "Broker-specific guides, triage paths, and an AI assist bot for fast answers.")}
      <div class="grid grid--2">
        <div class="panel">
          <div class="panel__pad">
            <div style="font-weight:900; margin-bottom:10px;">Guides</div>
            <table class="table">
              <thead><tr><th>Guide</th><th class="table__right"></th></tr></thead>
              <tbody>${guides}</tbody>
            </table>
          </div>
        </div>

        <div class="panel">
          <div class="panel__pad">
            <div style="font-weight:900; margin-bottom:10px;">Triage & escalation</div>
            ${(state.help.escalation || []).map(e => `
              <div class="note" style="margin-bottom:10px;">
                <div style="font-weight:900;">When: ${escapeHtml(e.when)}</div>
                <div style="margin-top:6px;">Action: <strong>${escapeHtml(e.do)}</strong></div>
                <div style="margin-top:6px; color:var(--muted); font-size:12px;">
                  Include: ${(e.include || []).map(x => escapeHtml(x)).join(", ")}
                </div>
              </div>
            `).join("")}
            <button class="btn btn--primary" style="margin-top:6px;" id="aiAssistBtn">Ask AI Assist</button>
          </div>
        </div>
      </div>
    `;

    $$("button[data-guide]").forEach(b => {
      b.onclick = () => openGuide(b.dataset.guide);
    });

    $("#aiAssistBtn").onclick = () => openAIAssist();
  }

  function openGuide(id) {
    const g = state.help.guides.find(x => x.id === id);
    if (!g) return;

    openDrawer({
      title: g.title,
      bodyHtml: `
        <div class="note">Step-by-step guidance to help brokers support customers.</div>
        <div style="margin-top:12px;">
          ${(g.steps || []).map((s, i) => `
            <div class="note" style="margin-bottom:10px;">
              <div style="font-weight:900;">Step ${i + 1}</div>
              <div style="margin-top:6px; color:var(--muted);">${escapeHtml(s)}</div>
            </div>
          `).join("")}
        </div>
      `,
      footerHtml: `
        <button class="btn" data-drawer-close>Close</button>
        <button class="btn btn--primary" id="askAiFromGuide">Ask AI about this</button>
      `
    });

    $("#askAiFromGuide").onclick = () => {
      closeDrawer();
      openAIAssist(`I need help with: ${g.title}`);
    };
  }

  function openAIAssist(seed = "") {
    // Phase 1: local “AI-like” bot with canned responses.
    // Codex can wire this to your real AI endpoint later.
    openModal({
      title: "AI Assist (Phase 1 placeholder)",
      bodyHtml: `
        <div class="note">
          This is a placeholder AI Assist. Replace <code>answerAi()</code> with a real API call later.
        </div>

        <div class="panel" style="margin-top:12px;">
          <div class="panel__pad" id="aiChat" style="max-height:360px; overflow:auto;">
            <div class="note"><strong>AI:</strong> Ask me about registration, verification, login issues, documents, MTAs, payments, or escalation.</div>
          </div>
        </div>

        <div class="form" style="margin-top:12px;">
          <div class="field">
            <label>Your question</label>
            <input id="aiInput" placeholder="E.g. Customer didn’t receive verification email…" value="${escapeHtml(seed)}" />
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn" data-modal-close>Close</button>
        <button class="btn btn--primary" id="aiSendBtn">Send</button>
      `
    });

    const chat = $("#aiChat");
    const push = (who, text) => {
      const div = document.createElement("div");
      div.className = "note";
      div.style.marginTop = "10px";
      div.innerHTML = `<strong>${escapeHtml(who)}:</strong> ${escapeHtml(text)}`;
      chat.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
    };

    $("#aiSendBtn").onclick = () => {
      const q = ($("#aiInput").value || "").trim();
      if (!q) return;
      push("You", q);
      const a = answerAi(q);
      push("AI", a);
      $("#aiInput").value = "";
    };

    $("#aiInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") $("#aiSendBtn").click();
    });
  }

  function answerAi(q) {
    const t = q.toLowerCase();
    if (t.includes("verification") || t.includes("code") || t.includes("email")) {
      return "Check the registered email in Customers, confirm account status, ask customer to check spam, and trigger a resend. If still failing after 2 attempts, escalate with timestamp and audit log.";
    }
    if (t.includes("locked") || t.includes("password") || t.includes("login")) {
      return "If account is Locked, review audit log for failed attempts, advise lockout wait/reset, and escalate if lock persists beyond expected duration.";
    }
    if (t.includes("document") || t.includes("docs") || t.includes("gdpr")) {
      return "Open Documents to confirm what’s present, check access timestamps, and delete incorrect uploads immediately (record reason). Escalate urgently for GDPR risk with evidence of deletion + audit log.";
    }
    if (t.includes("mta") || t.includes("payment") || t.includes("quote")) {
      return "Capture where the customer dropped off (step), verify if quote issued, then escalate with journey type, failure step, timestamps, and screenshots. Use Analytics to see overall drop-off rates.";
    }
    if (t.includes("escalate") || t.includes("support")) {
      return "Escalate when self-serve steps fail or there’s compliance risk. Include: customer email/ID, timestamps, audit log excerpt, journey context, and any error codes/screens.";
    }
    return "I can help with registration, login, documents, MTAs/payments, analytics interpretation, and escalation. Tell me what the customer is trying to do and what error you see.";
  }

  function renderReleaseNotes() {
    setCrumbs("Release notes & product updates");
    setPrimaryAction("New note (stub)", () => toast("Stub", "Release note creation is stubbed."));

    const rows = state.releases
      .slice()
      .sort((a,b) => new Date(b.date) - new Date(a.date))
      .map(r => `
        <tr>
          <td>
            <div style="font-weight:900;">${escapeHtml(r.title)}</div>
            <div style="color:var(--muted); font-size:12px;">${escapeHtml(r.type)} • ${fmtDate(r.date)}</div>
          </td>
          <td>${r.live ? badge("good", "Live") : badge("warn", "Coming soon")}</td>
          <td>${escapeHtml(r.impact)}</td>
          <td class="table__right"><button class="kebab" data-rel="${r.id}">⋯</button></td>
        </tr>
      `).join("");

    pageEl.innerHTML = `
      ${pageHead("Release notes", "Clear, broker-focused summaries of what changed and what’s coming.")}
      <div class="panel">
        <div class="panel__pad">
          <table class="table">
            <thead>
              <tr>
                <th>Update</th>
                <th>Status</th>
                <th>Broker impact</th>
                <th class="table__right"></th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;

    $$("button[data-rel]").forEach(btn => {
      const id = btn.dataset.rel;
      btn.addEventListener("click", kebabMenu([
        { label: "View", action: () => viewRelease(id) },
        { label: "Search similar (stub)", action: () => toast("Stub", "Search is stubbed.") }
      ]));
    });
  }

  function viewRelease(id) {
    const r = state.releases.find(x => x.id === id);
    if (!r) return;

    openDrawer({
      title: r.title,
      bodyHtml: `
        <div class="note">
          <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
            <div>${escapeHtml(r.type)} • ${fmtDate(r.date)}</div>
            <div>${r.live ? badge("good", "Live") : badge("warn", "Coming soon")}</div>
          </div>
        </div>

        <div style="margin-top:12px; font-weight:900;">Broker impact (plain English)</div>
        <div class="note" style="margin-top:8px;">${escapeHtml(r.impact)}</div>

        <div style="margin-top:12px; font-weight:900;">Enablement</div>
        <div class="note" style="margin-top:8px;">
          Include links to guides/videos/FAQs here. (Phase 1 placeholder)
        </div>
      `,
      footerHtml: `<button class="btn" data-drawer-close>Close</button>`
    });
  }

  function renderOnboarding() {
    // internal only
    if (!can.viewInternal()) {
      pageEl.innerHTML = `
        ${pageHead("Implementation & onboarding", "Internal tool (OGI).")}
        <div class="note">You don’t have access to this area with your current role.</div>
      `;
      setPrimaryAction("Switch role", () => openRoleMenu($("#roleChip")));
      return;
    }

    setCrumbs("Implementation & onboarding (Internal)");
    setPrimaryAction("New onboarding (stub)", () => toast("Stub", "Onboarding creation is stubbed."));

    const rows = state.onboarding.brokers.map(b => `
      <tr>
        <td style="font-weight:900;">${escapeHtml(b.broker)}</td>
        <td>${badge(b.stage === "Live" ? "good" : "warn", b.stage)}</td>
        <td>${escapeHtml(b.owner)}</td>
        <td>${escapeHtml(String(b.readiness))}%</td>
        <td>${escapeHtml(b.blockers)}</td>
      </tr>
    `).join("");

    const checklist = state.onboarding.checklist.map(i => `
      <div class="note" style="margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
          <div style="font-weight:900;">${escapeHtml(i.item)}</div>
          <div>${i.done ? badge("good", "Done") : badge("warn", "Pending")}</div>
        </div>
      </div>
    `).join("");

    pageEl.innerHTML = `
      ${pageHead("Implementation & onboarding", "Internal management for onboarding and configuration readiness.")}
      <div class="grid grid--2">
        <div class="panel">
          <div class="panel__pad">
            <div style="font-weight:900; margin-bottom:10px;">Broker onboarding status</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Broker</th>
                  <th>Stage</th>
                  <th>Owner</th>
                  <th>Readiness</th>
                  <th>Blockers</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>

        <div class="panel">
          <div class="panel__pad">
            <div style="font-weight:900; margin-bottom:10px;">Go-live checklist</div>
            ${checklist}
            <div class="note">
              Codex can link these items to real objects: portal config, question sets, analytics tags, access provisioning.
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderSettings() {
    setCrumbs("Settings");
    setPrimaryAction("Save (stub)", () => toast("Stub", "Settings save is stubbed."));

    pageEl.innerHTML = `
      ${pageHead("Settings", "Basic product settings for this standalone portal shell.")}
      <div class="panel">
        <div class="panel__pad">
          <div class="form">
            <div class="field">
              <label>Broker organisation name</label>
              <input id="orgInput" value="${escapeHtml(state.orgName)}" />
            </div>

            <div class="field">
              <label>Default environment</label>
              <select id="envSelect">
                <option value="preview" ${state.env==="preview"?"selected":""}>Preview</option>
                <option value="live" ${state.env==="live"?"selected":""}>Live</option>
              </select>
            </div>

            <div class="note">
              In Phase 1 this is a standalone UI shell. Codex can wire identity, permissions, and data sources later.
            </div>

            <button class="btn btn--primary" id="applySettingsBtn">Apply</button>
          </div>
        </div>
      </div>
    `;

    $("#applySettingsBtn").onclick = () => {
      state.orgName = ($("#orgInput").value || "Broker Portal").trim();
      $("#orgName").textContent = state.orgName;
      state.env = $("#envSelect").value;
      setEnvButtons();
      toast("Updated", "Settings applied.");
      render();
    };
  }

  // ---------- Router ----------
  function render() {
    closeAnyMenu();
    setInternalVisibility();
    setRoleChip();
    setEnvButtons();
    setActiveNav(state.route);

    const routeMap = {
      dashboard: renderDashboard,
      customers: renderCustomers,
      documents: renderDocuments,
      "portal-config": renderPortalConfig,
      "question-sets": renderQuestionSets,
      analytics: renderAnalytics,
      "help-support": renderHelpSupport,
      "release-notes": renderReleaseNotes,
      onboarding: renderOnboarding,
      settings: renderSettings
    };

    const fn = routeMap[state.route] || renderDashboard;
    fn();
  }

  // ---------- Start ----------
  $("#orgName").textContent = state.orgName;
  setInternalVisibility();
  setRoleChip();
  setEnvButtons();
  render();

  // Close menus on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAnyMenu();
      closeModal();
      closeDrawer();
    }
  });
})();

