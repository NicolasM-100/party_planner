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
    const event = await api(`/api/events/${id}`);
    document.getElementById("eventTitleBreadcrumb").textContent = event.title;
    document.getElementById("eventTitle").textContent = event.title;
    document.getElementById("eventMeta").textContent = `${event.event_date || "TBD"} — ${event.location || "No location"} — $${event.budget_cap}`;
    loadTimeline(id);
    loadVendors(id);
    loadBudget(id);
    loadRSVPs(id);
    loadSustainability(id);
  }

  async function loadTimeline(id) {
    const items = await api(`/api/events/${id}/timeline`);
    const list = document.getElementById("timelineList");
    list.innerHTML = "";
    items.forEach((i) => list.appendChild(renderTimelineItem(i)));
    lucide.createIcons();
  }

  async function loadVendors(id) {
    const items = await api(`/api/events/${id}/vendors`);
    const list = document.getElementById("vendorList");
    list.innerHTML = items.length ? "" : '<p class="text-muted small mb-0">No vendors yet.</p>';
    items.forEach((v) => list.appendChild(renderVendor(v)));
    lucide.createIcons();
  }

  async function loadBudget(id) {
    const items = await api(`/api/events/${id}/budget`);
    const list = document.getElementById("budgetList");
    list.innerHTML = items.length ? "" : '<p class="text-muted small mb-0">No budget items yet.</p>';
    items.forEach((b) => list.appendChild(renderBudgetItem(b)));
  }

  async function loadRSVPs(id) {
    const items = await api(`/api/events/${id}/rsvps`);
    const list = document.getElementById("rsvpList");
    list.innerHTML = items.length ? "" : '<p class="text-muted small mb-0">No RSVPs yet.</p>';
    items.forEach((r) => list.appendChild(renderRSVP(r)));
  }

  async function loadSustainability(id) {
    const items = await api(`/api/events/${id}/sustainability`);
    const section = document.getElementById("sustainabilitySection");
    section.innerHTML = items.length ? "" : '<p class="text-muted small mb-0">No sustainability data yet.</p>';
    items.forEach((s) => section.appendChild(renderSustainability(s)));
  }

  async function submitModalForm(formId, endpoint) {
    const form = document.getElementById(formId);
    const data = Object.fromEntries(new FormData(form));
    if (data.eco_verified === "on") data.eco_verified = true;
    else if ("eco_verified" in data) delete data.eco_verified;
    if (data.event_datetime === "") data.event_datetime = null;
    if (data.event_datetime) data.event_datetime = new Date(data.event_datetime).toISOString();
    Object.entries(data).forEach(([k, v]) => {
      if (v === "") delete data[k];
    });
    await api(`/api/events/${eventId}/${endpoint}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    bootstrap.Modal.getInstance(document.querySelector(`#${formId.replace("Form", "Modal")}`)).hide();
    form.reset();
    loadEvent(eventId);
  }

  document.getElementById("saveTimelineBtn")?.addEventListener("click", () => submitModalForm("timelineForm", "timeline"));
  document.getElementById("saveVendorBtn")?.addEventListener("click", () => submitModalForm("vendorForm", "vendors"));
  document.getElementById("saveBudgetBtn")?.addEventListener("click", () => submitModalForm("budgetForm", "budget"));
  document.getElementById("saveRSVPBtn")?.addEventListener("click", () => submitModalForm("rsvpForm", "rsvps"));
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

document.getElementById("aiGenerateBtn")?.addEventListener("click", async () => {
  const input = document.getElementById("aiPrompt");
  const prompt = input.value.trim();
  if (!prompt) return;
  loading("aiLoading", true);
  try {
    const result = await api("/api/ai/generate", { method: "POST", body: JSON.stringify({ prompt }) });
    if (result.title) {
      const event = await api("/api/events", {
        method: "POST",
        body: JSON.stringify({ title: result.title, description: result.description || "", status: "planning" }),
      });
      const promises = [];
      (result.timeline_items || []).forEach((t, i) => {
        promises.push(api(`/api/events/${event.id}/timeline`, {
          method: "POST", body: JSON.stringify({ title: t.title, sort_order: t.sort_order || i }),
        }));
      });
      (result.vendor_suggestions || []).forEach((v) => {
        promises.push(api(`/api/events/${event.id}/vendors`, {
          method: "POST", body: JSON.stringify({ name: v.name, category: v.category }),
        }));
      });
      (result.budget_estimates || []).forEach((b) => {
        promises.push(api(`/api/events/${event.id}/budget`, {
          method: "POST", body: JSON.stringify({ category: b.category, allocated: b.allocated }),
        }));
      });
      await Promise.all(promises);
      window.location.href = `/events/${event.id}`;
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading("aiLoading", false);
  }
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
