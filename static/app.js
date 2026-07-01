const AUTH_TOKEN_KEY = "pp_token";

function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function storeToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

function api(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(path, { ...options, headers: { ...headers, ...options.headers } }).then((r) => {
    if (r.status === 204) return null;
    if (!r.ok) return r.json().then((e) => Promise.reject(e));
    return r.json();
  });
}

function loading(id, show) {
  document.getElementById(id)?.classList.toggle("d-none", !show);
}

function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "className") e.className = v;
    else if (k === "dataset") Object.assign(e.dataset, v);
    else e.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    if (typeof c === "string") e.appendChild(document.createTextNode(c));
    else e.appendChild(c);
  }
  return e;
}

function lucIcon(name, className = "") {
  const i = document.createElement("i");
  i.setAttribute("data-lucide", name);
  if (className) i.className = className;
  return i;
}

async function deleteItem(endpoint, id) {
  const eid = window.__EVENT_ID__;
  if (!eid) return;
  await api(`/api/events/${eid}/${endpoint}/${id}`, { method: "DELETE" });
  window.location.reload();
}

function renderTimelineItem(item) {
  const icon = item.completed ? "check-circle" : "circle";
  const cls = item.completed ? "text-success" : "text-muted";
  const statusBadge = item.completed
    ? el("span", { className: "badge bg-success ms-1" }, ["Completed"])
    : el("span", { className: "badge bg-secondary ms-1" }, ["Pending"]);
  const delBtn = el("button", { className: "btn btn-sm text-danger p-0" }, [lucIcon("trash-2")]);
  delBtn.onclick = (e) => { e.stopPropagation(); deleteItem("timeline", item.id); };
  const timeStr = item.event_datetime
    ? new Date(item.event_datetime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      + " " + new Date(item.event_datetime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : null;
  const row = el("div", { className: "d-flex align-items-center gap-2 py-1 border-bottom border-secondary" }, [
    lucIcon(icon, cls),
    el("div", { className: "flex-grow-1" }, [
      el("div", { className: "d-flex align-items-center" }, [
        el("span", { className: "small fw-bold" }, [item.title]),
        statusBadge,
        item.sort_order > 0 ? el("small", { className: "text-muted ms-1" }, [`#${item.sort_order}`]) : null,
      ]),
      timeStr ? el("small", { className: "text-muted" }, [timeStr]) : null,
    ]),
    delBtn,
  ]);
  row.style.cursor = "pointer";
  row.onclick = () => openEditTimeline(item);
  return row;
}

function renderVendor(v) {
  const delBtn = el("button", { className: "btn btn-sm text-danger p-0 ms-2" }, [lucIcon("trash-2")]);
  delBtn.onclick = (e) => { e.stopPropagation(); deleteItem("vendors", v.id); };
  const row = el("div", { className: "d-flex justify-content-between align-items-center py-1 border-bottom border-secondary" }, [
    el("div", {}, [
      el("span", { className: "small fw-bold" }, [v.name]),
      v.category ? el("small", { className: "text-muted ms-2" }, [v.category]) : null,
      v.eco_verified ? el("span", { className: "badge bg-success ms-1" }, ["eco"]) : null,
    ]),
    el("div", { className: "d-flex align-items-center gap-2" }, [
      el("span", { className: "text-muted small" }, [v.contact ? `${v.contact} — ` : "", `$${v.cost}`]),
      delBtn,
    ]),
  ]);
  row.style.cursor = "pointer";
  row.onclick = () => openEditVendor(v);
  return row;
}

function renderBudgetItem(b) {
  const pct = b.allocated > 0 ? Math.min((b.spent / b.allocated) * 100, 100) : 0;
  const clr = pct > 90 ? "danger" : pct > 70 ? "warning" : "success";
  const delBtn = el("button", { className: "btn btn-sm text-danger p-0 ms-2" }, [lucIcon("trash-2")]);
  delBtn.onclick = (e) => { e.stopPropagation(); deleteItem("budget", b.id); };
  const row = el("div", { className: "mb-2" }, [
    el("div", { className: "d-flex justify-content-between small mb-1" }, [
      el("span", {}, [b.category]),
      el("span", { className: "d-flex align-items-center gap-1" }, [`$${b.spent} / $${b.allocated}`, delBtn]),
    ]),
    el("div", { className: "progress", style: "height:6px" }, [
      el("div", { className: `progress-bar bg-${clr}`, style: `width:${pct}%`, role: "progressbar" }),
    ]),
  ]);
  row.style.cursor = "pointer";
  row.onclick = () => openEditBudget(b);
  return row;
}

function renderRSVP(r) {
  const clr = r.status === "confirmed" ? "success" : r.status === "declined" ? "danger" : "warning";
  const delBtn = el("button", { className: "btn btn-sm text-danger p-0 ms-1" }, [lucIcon("trash-2")]);
  delBtn.onclick = (e) => { e.stopPropagation(); deleteItem("rsvps", r.id); };
  const row = el("div", { className: "d-flex justify-content-between align-items-center py-1 border-bottom border-secondary" }, [
    el("div", {}, [
      el("span", { className: "small fw-bold" }, [r.guest_name]),
      r.email ? el("small", { className: "text-muted ms-2" }, [r.email]) : null,
    ]),
    el("div", { className: "d-flex align-items-center gap-2" }, [
      el("span", { className: `badge bg-${clr}` }, [r.status]),
      r.plus_ones ? el("small", { className: "text-muted" }, [`+${r.plus_ones}`]) : null,
      delBtn,
    ]),
  ]);
  row.style.cursor = "pointer";
  row.onclick = () => openEditRSVP(r);
  return row;
}

function renderSustainability(s) {
  const kilosToTons = (kg) => (kg / 1000).toFixed(2);
  const delBtn = el("button", { className: "btn btn-sm text-danger p-0 ms-2" }, [lucIcon("trash-2")]);
  delBtn.onclick = (e) => { e.stopPropagation(); deleteItem("sustainability", s.id); };
  const row = el("div", { className: "d-flex justify-content-between align-items-center py-1 border-bottom border-secondary" }, [
    el("div", { className: "d-flex flex-wrap gap-3" }, [
      el("span", { className: "small" }, [`Carbon Offset: ${kilosToTons(s.carbon_offset_kg)} tonnes`]),
      el("span", { className: "small" }, [`Local Sourcing: ${s.local_sourcing_pct}%`]),
      el("span", { className: "small" }, [`Waste Reduced: ${s.waste_reduction_kg} kg`]),
    ]),
    delBtn,
  ]);
  row.style.cursor = "pointer";
  row.onclick = () => openEditSustainability(s);
  return row;
}

function showAlert(msg) {
  const el = document.getElementById("authAlert");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("d-none");
  setTimeout(() => el.classList.add("d-none"), 4000);
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.classList.toggle("loading", loading);
  btn.disabled = loading;
}

async function checkAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = "/";
    return null;
  }
  try {
    const user = await api("/api/auth/me");
    const navEl = document.getElementById("navUsername");
    if (navEl) navEl.textContent = user.username;
    return user;
  } catch {
    clearToken();
    window.location.href = "/";
    return null;
  }
}

document.getElementById("loginBtn")?.addEventListener("click", async () => {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;
  if (!username || !password) return showAlert("Please fill in all fields");
  setLoading("loginBtn", true);
  try {
    const res = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    storeToken(res.token);
    window.location.href = "/dashboard";
  } catch (e) {
    showAlert(e.detail || "Login failed");
  } finally {
    setLoading("loginBtn", false);
  }
});

document.getElementById("registerBtn")?.addEventListener("click", async () => {
  const username = document.getElementById("regUsername").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  const confirm = document.getElementById("regConfirm").value;
  if (!username || !email || !password || !confirm) return showAlert("Please fill in all fields");
  if (password !== confirm) return showAlert("Passwords do not match");
  if (password.length < 6) return showAlert("Password must be at least 6 characters");
  setLoading("registerBtn", true);
  try {
    const res = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
    storeToken(res.token);
    window.location.href = "/dashboard";
  } catch (e) {
    showAlert(e.detail || "Registration failed");
  } finally {
    setLoading("registerBtn", false);
  }
});

document.getElementById("loginUsername")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("loginBtn")?.click();
});
document.getElementById("loginPassword")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("loginBtn")?.click();
});
document.getElementById("regPassword")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("registerBtn")?.click();
});

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

loginTab?.addEventListener("click", () => {
  loginTab.classList.add("active");
  registerTab.classList.remove("active");
  loginForm.classList.remove("d-none");
  registerForm.classList.add("d-none");
});
registerTab?.addEventListener("click", () => {
  registerTab.classList.add("active");
  loginTab.classList.remove("active");
  registerForm.classList.remove("d-none");
  loginForm.classList.add("d-none");
});

document.getElementById("loginUsername")?.focus();

if (document.getElementById("bentoGrid")) {
  checkAuth().then(() => {
    api("/api/dashboard").then((d) => {
      document.getElementById("totalEvents").textContent = d.total_events;
      document.getElementById("upcomingEvents").textContent = d.upcoming_events;
      document.getElementById("totalBudget").textContent = `$${d.total_budget}`;
      document.getElementById("totalSpent").textContent = `$${d.total_spent}`;
      document.getElementById("pendingRsvps").textContent = d.pending_rsvps;
      document.getElementById("confirmedGuests").textContent = d.confirmed_guests;
      document.getElementById("ecoVendors").textContent = d.eco_vendors;

      const bar = document.getElementById("budgetBar");
      const pct = d.total_budget > 0 ? Math.min((d.total_spent / d.total_budget) * 100, 100) : 0;
      bar.style.width = `${pct}%`;
      bar.classList.toggle("bg-danger", pct > 90);
      bar.classList.toggle("bg-warning", pct > 70 && pct <= 90);

      const recent = document.getElementById("recentEvents");
      d.recent_events.forEach((e) => {
        const a = el("a", {
          className: "list-group-item list-group-item-action bg-transparent d-flex justify-content-between align-items-center",
          href: `/events/${e.id}`,
        }, [
          el("span", {}, [e.title]),
          el("small", { className: "text-muted" }, [e.event_date || "TBD"]),
        ]);
        recent.appendChild(a);
      });

      const timelinePreview = document.getElementById("timelinePreview");
      Promise.all(
        d.recent_events.slice(0, 3).map((e) => api(`/api/events/${e.id}/timeline`))
      ).then((results) => {
        results.flat().slice(0, 5).forEach((item) => {
          timelinePreview.appendChild(renderTimelineItem(item));
        });
        lucide.createIcons();
      });

      lucide.createIcons();
    });
  });
}

if (document.querySelector("#eventDetailPage")) {
  const eventId = window.__EVENT_ID__;

  checkAuth().then(() => loadEvent(eventId));

  async function loadEvent(id) {
    try {
      const event = await api(`/api/events/${id}`);
      document.getElementById("eventTitleBreadcrumb").textContent = event.title;
      const titleEl = document.getElementById("eventTitle");
      titleEl.textContent = event.title;
      titleEl.classList.remove("placeholder-glow");
      const metaEl = document.getElementById("eventMeta");
      metaEl.textContent = `${event.event_date || "TBD"} — ${event.location || "No location"} — $${event.budget_cap}`;
      metaEl.classList.remove("placeholder-glow");
    } catch (e) {
      console.error("Failed to load event:", e);
    }
    loadTimeline(id);
    loadVendors(id);
    loadBudget(id);
    loadRSVPs(id);
    loadSustainability(id);
  }

  async function loadTimeline(id) {
    try {
      const items = await api(`/api/events/${id}/timeline`);
      const list = document.getElementById("timelineList");
      list.classList.remove("placeholder-glow");
      list.innerHTML = "";
      items.forEach((i) => list.appendChild(renderTimelineItem(i)));
      lucide.createIcons();
    } catch (e) {
      console.error("Failed to load timeline:", e);
      const list = document.getElementById("timelineList");
      list.classList.remove("placeholder-glow");
      list.innerHTML = '<p class="text-muted small mb-0">Failed to load.</p>';
    } finally {
      document.getElementById("addTimelineBtn").disabled = false;
    }
  }

  async function loadVendors(id) {
    try {
      const items = await api(`/api/events/${id}/vendors`);
      const list = document.getElementById("vendorList");
      list.classList.remove("placeholder-glow");
      list.innerHTML = items.length ? "" : '<p class="text-muted small mb-0">No vendors yet.</p>';
      items.forEach((v) => list.appendChild(renderVendor(v)));
      lucide.createIcons();
    } catch (e) {
      console.error("Failed to load vendors:", e);
      const list = document.getElementById("vendorList");
      list.classList.remove("placeholder-glow");
      list.innerHTML = '<p class="text-muted small mb-0">Failed to load.</p>';
    } finally {
      document.getElementById("addVendorBtn").disabled = false;
    }
  }

  async function loadBudget(id) {
    try {
      const items = await api(`/api/events/${id}/budget`);
      const list = document.getElementById("budgetList");
      list.classList.remove("placeholder-glow");
      list.innerHTML = items.length ? "" : '<p class="text-muted small mb-0">No budget items yet.</p>';
      items.forEach((b) => list.appendChild(renderBudgetItem(b)));
      lucide.createIcons();
    } catch (e) {
      console.error("Failed to load budget:", e);
      const list = document.getElementById("budgetList");
      list.classList.remove("placeholder-glow");
      list.innerHTML = '<p class="text-muted small mb-0">Failed to load.</p>';
    } finally {
      document.getElementById("addBudgetBtn").disabled = false;
    }
  }

  async function loadRSVPs(id) {
    try {
      const items = await api(`/api/events/${id}/rsvps`);
      const list = document.getElementById("rsvpList");
      list.classList.remove("placeholder-glow");
      list.innerHTML = items.length ? "" : '<p class="text-muted small mb-0">No RSVPs yet.</p>';
      items.forEach((r) => list.appendChild(renderRSVP(r)));
      lucide.createIcons();
    } catch (e) {
      console.error("Failed to load RSVPs:", e);
      const list = document.getElementById("rsvpList");
      list.classList.remove("placeholder-glow");
      list.innerHTML = '<p class="text-muted small mb-0">Failed to load.</p>';
    } finally {
      document.getElementById("addRSVPBtn").disabled = false;
    }
  }

  async function loadSustainability(id) {
    try {
      const items = await api(`/api/events/${id}/sustainability`);
      const section = document.getElementById("sustainabilitySection");
      section.classList.remove("placeholder-glow");
      section.innerHTML = items.length ? "" : '<p class="text-muted small mb-0">No sustainability data yet.</p>';
      items.forEach((s) => section.appendChild(renderSustainability(s)));
      lucide.createIcons();
    } catch (e) {
      console.error("Failed to load sustainability:", e);
      const section = document.getElementById("sustainabilitySection");
      section.classList.remove("placeholder-glow");
      section.innerHTML = '<p class="text-muted small mb-0">Failed to load.</p>';
    }
  }

  async function submitModalForm(formId, endpoint) {
    const form = document.getElementById(formId);
    const formData = new FormData(form);
    const editId = formData.get("edit_id");
    formData.delete("edit_id");
    const data = Object.fromEntries(formData);
    if (data.eco_verified === "on") data.eco_verified = true;
    else if ("eco_verified" in data) delete data.eco_verified;
    if (data.event_datetime === "") data.event_datetime = null;
    if (data.event_datetime) data.event_datetime = new Date(data.event_datetime).toISOString();
    Object.entries(data).forEach(([k, v]) => {
      if (v === "") delete data[k];
    });
    if (editId) {
      const method = endpoint === "vendors" ? "PUT" : "PATCH";
      await api(`/api/events/${eventId}/${endpoint}/${editId}`, { method, body: JSON.stringify(data) });
    } else {
      await api(`/api/events/${eventId}/${endpoint}`, { method: "POST", body: JSON.stringify(data) });
    }
    bootstrap.Modal.getInstance(document.querySelector(`#${formId.replace("Form", "Modal")}`)).hide();
    form.reset();
    loadEvent(eventId);
  }

  function openEditTimeline(item) {
    document.getElementById("timelineModalTitle").textContent = "Edit Timeline Item";
    const form = document.getElementById("timelineForm");
    form.querySelector('[name="title"]').value = item.title || "";
    form.querySelector('[name="event_datetime"]').value = item.event_datetime
      ? new Date(item.event_datetime).toISOString().slice(0, 16) : "";
    form.querySelector('[name="sort_order"]').value = item.sort_order ?? 0;
    document.getElementById("timelineEditId").value = item.id;
    document.getElementById("saveTimelineBtn").textContent = "Save";
    new bootstrap.Modal(document.getElementById("timelineModal")).show();
  }

  function openEditVendor(v) {
    document.getElementById("vendorModalTitle").textContent = "Edit Vendor";
    const form = document.getElementById("vendorForm");
    form.querySelector('[name="name"]').value = v.name || "";
    form.querySelector('[name="category"]').value = v.category || "";
    form.querySelector('[name="contact"]').value = v.contact || "";
    form.querySelector('[name="cost"]').value = v.cost || 0;
    form.querySelector('[name="eco_verified"]').checked = v.eco_verified || false;
    document.getElementById("vendorEditId").value = v.id;
    document.getElementById("saveVendorBtn").textContent = "Save";
    new bootstrap.Modal(document.getElementById("vendorModal")).show();
  }

  function openEditBudget(b) {
    document.getElementById("budgetModalTitle").textContent = "Edit Budget Item";
    const form = document.getElementById("budgetForm");
    form.querySelector('[name="category"]').value = b.category || "";
    form.querySelector('[name="allocated"]').value = b.allocated || 0;
    form.querySelector('[name="spent"]').value = b.spent || 0;
    document.getElementById("budgetEditId").value = b.id;
    document.getElementById("saveBudgetBtn").textContent = "Save";
    new bootstrap.Modal(document.getElementById("budgetModal")).show();
  }

  function openEditRSVP(r) {
    document.getElementById("rsvpModalTitle").textContent = "Edit RSVP";
    const form = document.getElementById("rsvpForm");
    form.querySelector('[name="guest_name"]').value = r.guest_name || "";
    form.querySelector('[name="email"]').value = r.email || "";
    form.querySelector('[name="status"]').value = r.status || "pending";
    form.querySelector('[name="plus_ones"]').value = r.plus_ones || 0;
    document.getElementById("rsvpEditId").value = r.id;
    document.getElementById("saveRSVPBtn").textContent = "Save";
    new bootstrap.Modal(document.getElementById("rsvpModal")).show();
  }

  function openEditSustainability(s) {
    document.getElementById("sustainabilityModalTitle").textContent = "Edit Sustainability Metric";
    const form = document.getElementById("sustainabilityForm");
    form.querySelector('[name="carbon_offset_kg"]').value = s.carbon_offset_kg || 0;
    form.querySelector('[name="local_sourcing_pct"]').value = s.local_sourcing_pct || 0;
    form.querySelector('[name="waste_reduction_kg"]').value = s.waste_reduction_kg || 0;
    document.getElementById("sustainabilityEditId").value = s.id;
    document.getElementById("saveSustainabilityBtn").textContent = "Save";
    new bootstrap.Modal(document.getElementById("sustainabilityModal")).show();
  }

  document.getElementById("timelineModal").addEventListener("hidden.bs.modal", () => {
    document.getElementById("timelineModalTitle").textContent = "Add Timeline Item";
    document.getElementById("timelineEditId").value = "";
    document.getElementById("saveTimelineBtn").textContent = "Add";
  });
  document.getElementById("vendorModal").addEventListener("hidden.bs.modal", () => {
    document.getElementById("vendorModalTitle").textContent = "Add Vendor";
    document.getElementById("vendorEditId").value = "";
    document.getElementById("saveVendorBtn").textContent = "Add";
  });
  document.getElementById("budgetModal").addEventListener("hidden.bs.modal", () => {
    document.getElementById("budgetModalTitle").textContent = "Add Budget Item";
    document.getElementById("budgetEditId").value = "";
    document.getElementById("saveBudgetBtn").textContent = "Add";
  });
  document.getElementById("rsvpModal").addEventListener("hidden.bs.modal", () => {
    document.getElementById("rsvpModalTitle").textContent = "Add RSVP";
    document.getElementById("rsvpEditId").value = "";
    document.getElementById("saveRSVPBtn").textContent = "Add";
  });
  document.getElementById("sustainabilityModal").addEventListener("hidden.bs.modal", () => {
    document.getElementById("sustainabilityEditId").value = "";
  });

  document.getElementById("saveTimelineBtn")?.addEventListener("click", () => submitModalForm("timelineForm", "timeline"));
  document.getElementById("saveVendorBtn")?.addEventListener("click", () => submitModalForm("vendorForm", "vendors"));
  document.getElementById("saveBudgetBtn")?.addEventListener("click", () => submitModalForm("budgetForm", "budget"));
  document.getElementById("saveRSVPBtn")?.addEventListener("click", () => submitModalForm("rsvpForm", "rsvps"));
  document.getElementById("saveSustainabilityBtn")?.addEventListener("click", () => submitModalForm("sustainabilityForm", "sustainability"));
}

document.getElementById("saveEventBtn")?.addEventListener("click", async () => {
  const form = document.getElementById("eventForm");
  const data = Object.fromEntries(new FormData(form));
  if (data.event_date === "") data.event_date = null;
  await api("/api/events", { method: "POST", body: JSON.stringify(data) });
  bootstrap.Modal.getInstance(document.getElementById("eventModal")).hide();
  location.reload();
});

document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  try { await api("/api/auth/logout", { method: "DELETE" }); } catch {}
  clearToken();
  window.location.href = "/";
});

async function startGeneration(prompt) {
  sessionStorage.setItem("generating", "true");
  sessionStorage.setItem("generating_prompt", prompt);
  const modal = new bootstrap.Modal(document.getElementById("generateLoadingModal"));
  modal.show();
  try {
    const result = await api("/api/ai/generate", { method: "POST", body: JSON.stringify({ prompt }) });
    if (result.title) {
      const event = await api("/api/events", {
        method: "POST",
        body: JSON.stringify({
          title: result.title,
          description: result.description || "",
          event_date: result.event_date || null,
          location: result.location || "",
          budget_cap: result.budget_cap || 0,
          status: "planning",
        }),
      });
      const promises = [];
      (result.timeline_items || []).forEach((t, i) => {
        promises.push(api(`/api/events/${event.id}/timeline`, {
          method: "POST",
          body: JSON.stringify({
            title: t.title,
            sort_order: t.sort_order ?? i,
            event_datetime: t.event_datetime ? new Date(t.event_datetime).toISOString() : null,
            completed: t.completed || false,
          }),
        }));
      });
      (result.vendor_suggestions || []).forEach((v) => {
        promises.push(api(`/api/events/${event.id}/vendors`, {
          method: "POST",
          body: JSON.stringify({
            name: v.name,
            category: v.category || "",
            contact: v.contact || "",
            cost: v.cost || 0,
            eco_verified: v.eco_verified || false,
          }),
        }));
      });
      (result.budget_estimates || []).forEach((b) => {
        promises.push(api(`/api/events/${event.id}/budget`, {
          method: "POST",
          body: JSON.stringify({
            category: b.category,
            allocated: b.allocated || 0,
            spent: b.spent || 0,
          }),
        }));
      });
      (result.guest_suggestions || []).forEach((r) => {
        promises.push(api(`/api/events/${event.id}/rsvps`, {
          method: "POST",
          body: JSON.stringify({
            guest_name: r.guest_name,
            email: r.email || "",
            status: r.status || "pending",
            plus_ones: r.plus_ones || 0,
          }),
        }));
      });
      if (result.sustainability) {
        promises.push(api(`/api/events/${event.id}/sustainability`, {
          method: "POST",
          body: JSON.stringify({
            carbon_offset_kg: result.sustainability.carbon_offset_kg || 0,
            local_sourcing_pct: result.sustainability.local_sourcing_pct || 0,
            waste_reduction_kg: result.sustainability.waste_reduction_kg || 0,
          }),
        }));
      }
      await Promise.all(promises);
      sessionStorage.removeItem("generating");
      sessionStorage.removeItem("generating_prompt");
      window.location.href = `/events/${event.id}`;
    }
  } catch (e) {
    console.error(e);
    sessionStorage.removeItem("generating");
    sessionStorage.removeItem("generating_prompt");
    modal.hide();
  }
}

document.getElementById("aiGenerateBtn")?.addEventListener("click", () => {
  const input = document.getElementById("aiPrompt");
  const prompt = input.value.trim();
  if (!prompt) return;
  startGeneration(prompt);
});

document.getElementById("voiceFab")?.addEventListener("click", () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { alert("Voice recognition not supported."); return; }
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  const fab = document.getElementById("voiceFab");
  fab.querySelector("i").setAttribute("data-lucide", "mic");
  fab.classList.add("mic-pulse");
  lucide.createIcons();
  recognition.start();
  recognition.onresult = async (event) => {
    fab.classList.remove("mic-pulse");
    const transcript = event.results[0][0].transcript;
    try {
      const result = await api("/api/ai/voice", { method: "POST", body: JSON.stringify({ prompt: transcript }) });
      alert(`Action: ${result.action}\nItem: ${result.item}\nValue: ${result.value}`);
    } catch (e) { console.error(e); }
    fab.querySelector("i").setAttribute("data-lucide", "mic");
    lucide.createIcons();
  };
  recognition.onerror = () => {
    fab.classList.remove("mic-pulse");
    fab.querySelector("i").setAttribute("data-lucide", "mic");
    lucide.createIcons();
  };
});

document.getElementById("aiPrompt")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("aiGenerateBtn")?.click();
});

lucide.createIcons();

const topNav = document.getElementById("topNav");
if (topNav) {
  window.addEventListener("scroll", () => {
    topNav.classList.toggle("scrolled", window.scrollY > 50);
  });
  document.querySelectorAll("[data-scroll-to]").forEach((el) => {
    el.addEventListener("click", () => {
      const target = document.querySelector(el.dataset.scrollTo);
      target?.scrollIntoView({ behavior: "smooth" });
    });
  });
  const reveals = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); }
    }),
    { threshold: 0.15 }
  );
  reveals.forEach((el) => observer.observe(el));
  const statsEl = document.getElementById("statsSection");
  if (statsEl) {
    const counterObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            document.querySelectorAll("[data-count]").forEach((el) => {
              const target = +el.dataset.count;
              const suffix = el.dataset.suffix || "";
              const duration = 1500;
              const start = performance.now();
              function tick(now) {
                const p = Math.min((now - start) / duration, 1);
                el.textContent = Math.floor(p * target) + suffix;
                if (p < 1) requestAnimationFrame(tick);
              }
              requestAnimationFrame(tick);
            });
            counterObs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counterObs.observe(statsEl);
  }
}

document.getElementById("aiDemoBtn")?.addEventListener("click", () => {
  const results = document.getElementById("aiDemoResults");
  const skeleton = document.getElementById("aiDemoSkeleton");
  const items = [
    "Venue reserved & confirmed",
    "Guest list for 25 compiled",
    "Catering: 3 vendors contacted",
    "DJ & lighting scheduled",
    "Decor & setup finalized",
  ];
  skeleton?.classList.remove("d-none");
  results.innerHTML = "";
  document.getElementById("aiDemoBtn").disabled = true;
  setTimeout(() => {
    skeleton?.classList.add("d-none");
    items.forEach((title, i) => {
      setTimeout(() => {
        const div = document.createElement("div");
        div.className = "d-flex align-items-center gap-2 py-1 ai-result-item";
        div.innerHTML = `<i data-lucide="check-circle" class="text-success"></i><span style="font-size:0.9rem;">${title}</span>`;
        results.appendChild(div);
        lucide.createIcons();
      }, i * 180);
    });
  }, 1200);
});

(function () {
  if (sessionStorage.getItem("generating") === "true") {
    const prompt = sessionStorage.getItem("generating_prompt");
    if (prompt) {
      const modal = new bootstrap.Modal(document.getElementById("generateLoadingModal"));
      modal.show();
      startGeneration(prompt);
    } else {
      sessionStorage.removeItem("generating");
    }
  }
})();
