// ══════════════════════════════════════════
// MOCK DATA
// ══════════════════════════════════════════

const STYLES = [
  "Bachata",
  "Ballet",
  "Ballroom",
  "Bollywood",
  "Breaking",
  "Broadway",
  "Commercial",
  "Contemporary",
  "Heels",
  "Hip Hop",
  "House",
  "Jazz",
  "K-Pop",
  "Krump",
  "Popping",
  "Reggaeton",
  "Salsa",
  "Shuffle",
  "Tutting",
  "Waacking",
  "Zumba",
];

const LEVELS = ["Beginner", "Intermediate", "Advanced", "Open Level"];

const MOCK_SONGS = [
  { id: 1, name: "APT.", artist: "ROSE & Bruno Mars", color: "#555" },
  {
    id: 2,
    name: "Die With A Smile",
    artist: "Lady Gaga & Bruno Mars",
    color: "#666",
  },
  { id: 3, name: "Espresso", artist: "Sabrina Carpenter", color: "#444" },
  { id: 4, name: "Birds of a Feather", artist: "Billie Eilish", color: "#555" },
  { id: 5, name: "Good Luck, Babe!", artist: "Chappell Roan", color: "#666" },
  {
    id: 6,
    name: "MILLION DOLLAR BABY",
    artist: "Tommy Richman",
    color: "#444",
  },
  { id: 7, name: "Nasty", artist: "Tinashe", color: "#555" },
  { id: 8, name: "Lil Boo Thang", artist: "Paul Russell", color: "#666" },
  { id: 9, name: "Agora Hills", artist: "Doja Cat", color: "#444" },
  { id: 10, name: "Snooze", artist: "SZA", color: "#555" },
];

const MOCK_TEACHERS = [
  "Alex Rivera",
  "Mia Chen",
  "Jayden Park",
  "Sofia Martinez",
  "Kai Thompson",
  "Zara Williams",
  "Marcus Lee",
  "Luna Patel",
];

const MOCK_LOCATIONS = [
  "Dance Lab",
  "Studio 54",
  "The Hive",
  "Groove HQ",
  "Pulse Studio",
];
const MOCK_AVATARS = ["CC", "MR", "JP", "SM", "KT", "ZW", "ML", "LP"];

function generateMockClasses(song) {
  const classes = [];
  const count = 3;
  for (let i = 0; i < count; i++) {
    const s =
      i === 0
        ? song
        : MOCK_SONGS[Math.floor(Math.random() * MOCK_SONGS.length)];
    const st = STYLES[Math.floor(Math.random() * STYLES.length)];
    const lv = LEVELS[Math.floor(Math.random() * LEVELS.length)];
    const teacher =
      MOCK_TEACHERS[Math.floor(Math.random() * MOCK_TEACHERS.length)];
    const price = (10 + Math.floor(Math.random() * 30)).toFixed(2);
    const spots = 5 + Math.floor(Math.random() * 20);
    const booked = Math.floor(Math.random() * spots);
    classes.push({
      song: s,
      style: st,
      level: lv,
      teacher,
      price,
      spots,
      booked,
    });
  }
  return classes;
}

const BUBBLE_DATA = [
  { label: "Hip Hop", value: 42, color: "var(--bubble-1)" },
  { label: "Bachata", value: 35, color: "var(--bubble-2)" },
  { label: "Heels", value: 28, color: "var(--bubble-3)" },
  { label: "K-Pop", value: 24, color: "var(--bubble-4)" },
  { label: "Salsa", value: 19, color: "var(--bubble-1)" },
  { label: "Contemporary", value: 16, color: "var(--bubble-2)" },
  { label: "Breaking", value: 14, color: "var(--bubble-3)" },
  { label: "Reggaeton", value: 12, color: "var(--bubble-4)" },
  { label: "Jazz", value: 10, color: "var(--bubble-1)" },
  { label: "Popping", value: 8, color: "var(--bubble-2)" },
];

const ICONS = {
  PLAY: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  PAUSE: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`,
  LOCATION: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
  TIME: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>`,
  USERS: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
};

// ══════════════════════════════════════════
// DOM REFS
// ══════════════════════════════════════════

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const splitContainer = $("#split-container");
const panelStudent = $("#panel-student");
const panelTeacher = $("#panel-teacher");
const studentView = $("#student-view");
const teacherView = $("#teacher-view");

// ══════════════════════════════════════════
// STEP TRANSITIONS
// ══════════════════════════════════════════

function transitionSteps(leavingEl, enteringEl) {
  // Start leaving animation
  leavingEl.classList.add("step-leaving");

  // After leaving fades out, swap
  setTimeout(() => {
    leavingEl.classList.add("step-hidden");
    leavingEl.classList.remove("step-leaving");

    // Prepare entering
    enteringEl.classList.remove("step-hidden");
    enteringEl.classList.add("step-entering");

    // Force reflow then animate in
    enteringEl.offsetHeight;
    requestAnimationFrame(() => {
      enteringEl.classList.remove("step-entering");
    });
  }, 400);
}

function resetStep(stepEl, isVisible) {
  stepEl.classList.remove("step-leaving", "step-entering");
  if (isVisible) {
    stepEl.classList.remove("step-hidden");
  } else {
    stepEl.classList.add("step-hidden");
  }
}

// ══════════════════════════════════════════
// SPLIT SCREEN INTERACTION
// ══════════════════════════════════════════

let splitState = "idle";
let activeRole = null;
let expandTimeout = null;

function showRoleSections(role) {
  $$(".role-section").forEach((s) => s.classList.add("hidden"));
  if (role) {
    $$(`.role-${role}`).forEach((s) => s.classList.remove("hidden"));
  }
  activeRole = role;
}

function revealSide(side) {
  if (splitState === "expanded-student" || splitState === "expanded-teacher")
    return;
  splitContainer.className = "split-container";
  if (side) {
    splitContainer.classList.add(`revealing-${side}`);
    splitState = `revealing-${side}`;
  } else {
    splitState = "idle";
  }
}

function moveSharedSections(role) {
  const scrollContainer = document.getElementById(`${role}-feature-scroll`);
  const activePricing = document.getElementById(
    role === "student" ? "pricing" : "pricing-teacher",
  );
  const download = document.getElementById("download");
  const footer = document.querySelector(".footer");

  // Ensure they snap nicely into view
  activePricing.style.scrollSnapAlign = "center";
  download.style.scrollSnapAlign = "center";
  footer.style.scrollSnapAlign = "end";

  download.classList.remove("hidden");
  footer.classList.remove("hidden");

  // Move them to the active scroll container
  scrollContainer.appendChild(activePricing);
  scrollContainer.appendChild(download);
  scrollContainer.appendChild(footer);
}

// Example queries to prefill the song search bar with for each role
const PREFILL_QUERIES = {
  student: "The Fate of Ophelia",
  teacher: "FIELD TRIP",
};

function prefillSearchExample(side) {
  const inputId = side === "student" ? "#wish-search" : "#teacher-search";
  const inputEl = $(inputId);
  if (!inputEl || inputEl.value) return; // Skip if already has a value
  inputEl.value = PREFILL_QUERIES[side];
  // Dispatch native input event so the existing iTunes search listener fires
  inputEl.dispatchEvent(new Event("input", { bubbles: true }));
}

function expandSide(side) {
  splitState = `expanded-${side}`;

  // Animate: selected panel grows, other shrinks
  splitContainer.className = "split-container";
  splitContainer.classList.add(`selecting-${side}`);

  if (expandTimeout) clearTimeout(expandTimeout);
  expandTimeout = setTimeout(() => {
    expandTimeout = null;
    splitContainer.classList.remove(`selecting-${side}`);
    splitContainer.classList.add("expanded");

    const view = side === "student" ? studentView : teacherView;
    const step1 = $(`#${side}-step-1`);

    // Set initial state for animation
    step1.classList.add("step-entering");
    view.classList.add("active");

    // Trigger animate in next frame
    requestAnimationFrame(() => {
      step1.classList.remove("step-entering");
    });

    navRoleToggle.classList.remove("hidden");
    toggleStudent.classList.toggle("active", side === "student");
    toggleTeacher.classList.toggle("active", side === "teacher");

    // Also sync drawer role toggle
    const drt = document.getElementById("drawer-role-toggle");
    if (drt) drt.classList.remove("hidden");
    const dts = document.getElementById("drawer-toggle-student");
    const dtt = document.getElementById("drawer-toggle-teacher");
    if (dts) dts.classList.toggle("active", side === "student");
    if (dtt) dtt.classList.toggle("active", side === "teacher");

    moveSharedSections(side);
    showRoleSections(side);

    // Scroll to top so expanded view is visible (especially on mobile)
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Show nav section links
    if (navPricing) navPricing.classList.remove("hidden");
    if (navDownload) navDownload.classList.remove("hidden");
    if (drawerPricing) drawerPricing.classList.remove("hidden");
    if (drawerDownload) drawerDownload.classList.remove("hidden");

    // Prefill search bar with an example song after the view has settled
    setTimeout(() => prefillSearchExample(side), 200);
  }, 600);
}

function collapseSide() {
  if (expandTimeout) {
    clearTimeout(expandTimeout);
    expandTimeout = null;
  }
  studentView.classList.remove("active");
  teacherView.classList.remove("active");
  splitContainer.classList.remove("expanded");
  splitContainer.className = "split-container";

  // Explicitly reset the panels and divider
  panelStudent.classList.remove("touched");
  panelTeacher.classList.remove("touched");

  splitState = "idle";
  showRoleSections(null);
  sharedPickedSong = null; // Clear shared song state

  // DOM Restoration: Sections were moved into role-specific scroll containers using appendChild.
  // We must move them back to the end of <body> to restore the original layout hierarchy.
  const sectionsToMove = ["pricing", "pricing-teacher", "download", ".footer"];

  // Find the anchor element to insert before (the script tag) to maintain relative order
  const scriptTag = document.querySelector('script[src="script.js"]');

  sectionsToMove.forEach((sel) => {
    const el = sel.startsWith(".")
      ? document.querySelector(sel)
      : document.getElementById(sel);
    if (el) {
      if (sel === "download") el.classList.add("hidden");
      // footer stays visible
      if (sel === ".footer") el.classList.remove("hidden");

      document.body.insertBefore(el, scriptTag);
    }
  });

  navRoleToggle.classList.add("hidden");

  const drt = document.getElementById("drawer-role-toggle");
  if (drt) drt.classList.add("hidden");

  // Hide nav section links
  if (navPricing) navPricing.classList.add("hidden");
  if (navDownload) navDownload.classList.add("hidden");
  if (drawerPricing) drawerPricing.classList.add("hidden");
  if (drawerDownload) drawerDownload.classList.add("hidden");

  // Close search results
  $$(".wish-search-results").forEach((r) => r.classList.remove("open"));

  resetRoleView("student");
  resetRoleView("teacher");
}

function hideFeatureScroll(id) {
  const el = $(`#${id}`);
  if (el) el.style.display = "none";
}

function showFeatureScroll(id) {
  const el = $(`#${id}`);
  if (el) el.style.display = "";
}

function resetRoleView(role) {
  resetStep($(`#${role}-step-1`), true);
  resetStep($(`#${role}-step-2`), false);
  hideFeatureScroll(`${role}-feature-scroll`);
  // Restore background image
  const view = role === "student" ? studentView : teacherView;
  view.classList.remove("bg-hidden");
  const searchInput =
    role === "student" ? $("#wish-search") : $("#teacher-search");
  if (searchInput) searchInput.value = "";
  if (role === "student") {
    selectedSong = null;
  } else {
    teacherSelectedSong = null;
    cancelBubbleAnim();
  }
  stopPreview();
}

panelStudent.addEventListener("click", () => {
  if (splitState === "idle" || splitState.startsWith("revealing"))
    expandSide("student");
});

panelTeacher.addEventListener("click", () => {
  if (splitState === "idle" || splitState.startsWith("revealing"))
    expandSide("teacher");
});

// Desktop: no longer using revealing state; hover effect is pure CSS
splitContainer.addEventListener("mouseleave", () => revealSide(null));

// Mobile touch feedback: add .touched class on tap
let touchStartX = 0;
let touchedPanel = null;
splitContainer.addEventListener(
  "touchstart",
  (e) => {
    touchStartX = e.touches[0].clientX;
    // Determine which panel was touched
    const target = e.target.closest(".split-panel");
    if (target) {
      target.classList.add("touched");
      touchedPanel = target;
    }
  },
  { passive: true },
);
splitContainer.addEventListener(
  "touchend",
  (e) => {
    if (touchedPanel) {
      setTimeout(() => touchedPanel.classList.remove("touched"), 300);
      touchedPanel = null;
    }
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 60) expandSide(dx < 0 ? "teacher" : "student");
  },
  { passive: true },
);

const navRoleToggle = $("#nav-role-toggle");
const toggleStudent = $("#toggle-student");
const toggleTeacher = $("#toggle-teacher");
const navPricing = $("#nav-pricing");
const navDownload = $("#nav-download");
const drawerPricing = $("#drawer-pricing");
const drawerDownload = $("#drawer-download");

// Hide nav section links initially (no role chosen yet)
if (navPricing) navPricing.classList.add("hidden");
if (navDownload) navDownload.classList.add("hidden");
if (drawerPricing) drawerPricing.classList.add("hidden");
if (drawerDownload) drawerDownload.classList.add("hidden");

const roleOverlay = $("#role-overlay");

function switchToRole(role) {
  const songToReuse = sharedPickedSong;
  const currentRole = splitState.replace("expanded-", "");
  if (currentRole === role) return;

  // Use the departing view's background color to mask the swap
  const fromColor = currentRole === "student" ? "#ffffff" : "#050505";
  roleOverlay.style.background = fromColor;

  // Fade overlay IN to cover the view swap
  roleOverlay.classList.add("active");

  // After fade-in (200ms), perform the instant swap
  setTimeout(() => {
    studentView.classList.remove("active");
    teacherView.classList.remove("active");
    resetRoleView("student");
    resetRoleView("teacher");

    splitContainer.classList.add("expanded");
    splitState = `expanded-${role}`;

    const view = role === "student" ? studentView : teacherView;
    const step1 = $(`#${role}-step-1`);

    view.classList.add("active");
    step1.classList.add("step-entering");

    moveSharedSections(role);
    showRoleSections(role);

    // Update all toggle buttons
    toggleStudent.classList.toggle("active", role === "student");
    toggleTeacher.classList.toggle("active", role === "teacher");
    const drawerTogS = $("#drawer-toggle-student");
    const drawerTogT = $("#drawer-toggle-teacher");
    if (drawerTogS) drawerTogS.classList.toggle("active", role === "student");
    if (drawerTogT) drawerTogT.classList.toggle("active", role === "teacher");

    // Fade overlay OUT to reveal the new view
    requestAnimationFrame(() => {
      step1.classList.remove("step-entering");
      roleOverlay.classList.remove("active");
    });

    // Reuse song if available
    if (songToReuse) {
      if (role === "student") {
        selectedSong = songToReuse;
        $("#wish-search").value = `${songToReuse.name} — ${songToReuse.artist}`;
        showStudentClasses(songToReuse);
      } else {
        teacherSelectedSong = songToReuse;
        $("#teacher-search").value =
          `${songToReuse.name} — ${songToReuse.artist}`;
        showTeacherFeatures(songToReuse);
      }
    }
  }, 220);
}

toggleStudent.addEventListener("click", () => switchToRole("student"));
toggleTeacher.addEventListener("click", () => switchToRole("teacher"));

// ══════════════════════════════════════════
// MOBILE DRAWER
// ══════════════════════════════════════════

const drawer = $("#drawer");
const drawerBackdrop = $("#drawer-backdrop");
const navBurger = $("#nav-burger");

function openDrawer() {
  drawer.classList.add("open");
  drawerBackdrop.classList.add("open");
}

function closeDrawer() {
  drawer.classList.remove("open");
  drawerBackdrop.classList.remove("open");
}

if (navBurger) navBurger.addEventListener("click", openDrawer);
$("#drawer-close").addEventListener("click", closeDrawer);
drawerBackdrop.addEventListener("click", closeDrawer);

// Navigation and Drawer links
["drawer-pricing", "drawer-download", "nav-pricing", "nav-download"].forEach(
  (id) => {
    const link = $(`#${id}`);
    if (!link) return;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (id.startsWith("drawer-")) closeDrawer();

      const suffix = activeRole === "teacher" ? "-teacher" : "";
      const baseId = id.includes("pricing") ? "pricing" : "download";
      const targetId =
        baseId === "download" ? "download" : `${baseId}${suffix}`;
      const target = $(`#${targetId}`);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  },
);

// Drawer role toggles
const drawerRoleToggle = $("#drawer-role-toggle");
$("#drawer-toggle-student").addEventListener("click", () => {
  switchToRole("student");
  closeDrawer();
});
$("#drawer-toggle-teacher").addEventListener("click", () => {
  switchToRole("teacher");
  closeDrawer();
});

$("#nav-logo").addEventListener("click", (e) => {
  e.preventDefault();
  closeDrawer();
  collapseSide();
  returnToHero();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ══════════════════════════════════════════
// SHARED UTILS
// ══════════════════════════════════════════

let previewAudio = null;
let isPreviewPlaying = false;
let sharedPickedSong = null;

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

function stopPreview() {
  if (previewAudio) {
    previewAudio.pause();
    previewAudio = null;
  }
  isPreviewPlaying = false;
}

function setupItunesSearch(inputEl, resultsEl, spinnerEl, onSelect) {
  let searchTimeout = null;
  let searchAbort = null;

  inputEl.addEventListener("input", () => {
    const query = inputEl.value.trim();
    if (searchTimeout) clearTimeout(searchTimeout);
    if (searchAbort) searchAbort.abort();

    if (!query) {
      resultsEl.classList.remove("open");
      spinnerEl.classList.add("hidden");
      return;
    }

    spinnerEl.classList.remove("hidden");

    searchTimeout = setTimeout(async () => {
      searchAbort = new AbortController();
      try {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=10`;
        const res = await fetch(url, { signal: searchAbort.signal });
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();

        resultsEl.innerHTML = "";
        data.results.forEach((r) => {
          const el = document.createElement("div");
          el.className = "wish-result";
          el.innerHTML = `
            <div class="wish-result-art"><img src="${r.artworkUrl100 || ""}" alt="" /></div>
            <div class="wish-result-info">
              <div class="wish-result-name">${escapeHtml(r.trackName)}</div>
              <div class="wish-result-artist">${escapeHtml(r.artistName)}</div>
            </div>
          `;
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            const song = {
              name: r.trackName,
              artist: r.artistName,
              artworkUrl: (r.artworkUrl100 || "").replace("100x100", "600x600"),
              previewUrl: r.previewUrl || null,
              trackViewUrl: r.trackViewUrl || null,
            };
            resultsEl.classList.remove("open");
            inputEl.value = `${r.trackName} — ${r.artistName}`;
            onSelect(song);
          });
          resultsEl.appendChild(el);
        });

        resultsEl.classList.toggle("open", data.results.length > 0);
      } catch (err) {
        if (err.name !== "AbortError") resultsEl.classList.remove("open");
      }
      spinnerEl.classList.add("hidden");
    }, 500);
  });
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".wish-search-wrap")) {
    $$(".wish-search-results").forEach((r) => r.classList.remove("open"));
  }
});

// ══════════════════════════════════════════
// STUDENT — Song search → smooth transition
// ══════════════════════════════════════════

let selectedSong = null;

setupItunesSearch(
  $("#wish-search"),
  $("#wish-results"),
  $("#wish-spinner"),
  (song) => {
    selectedSong = song;
    sharedPickedSong = song;
    stopPreview();
    showStudentClasses(song);
  },
);

// ══════════════════════════════════════════
// STUDENT — Show classes (step 2)
// ══════════════════════════════════════════

function randomTime() {
  const h = 8 + Math.floor(Math.random() * 12);
  const m = Math.random() > 0.5 ? "00" : "30";
  const h2 = h + 1 + Math.floor(Math.random() * 2);
  return `${h}:${m} - ${h2}:${m}`;
}

function randomDate() {
  const d = new Date();
  d.setDate(d.getDate() + Math.floor(Math.random() * 14));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Render a single featured class card into the given container.
 */
function renderFeaturedCard(container, song) {
  const mockSong = { ...MOCK_SONGS[0], name: song.name, artist: song.artist };
  const cls = generateMockClasses(mockSong)[0];
  const artUrl = song.artworkUrl || "";
  const artStyle = artUrl
    ? ""
    : `style="background: linear-gradient(135deg, ${cls.song.color}66, ${cls.song.color}22); width:100%; height:100%;"`;
  const loc = MOCK_LOCATIONS[Math.floor(Math.random() * MOCK_LOCATIONS.length)];
  const avatar = MOCK_AVATARS[Math.floor(Math.random() * MOCK_AVATARS.length)];
  const date = randomDate();
  const time = randomTime();
  const previewUrl = song.previewUrl || "";

  container.innerHTML = `
    <div class="featured-card" data-preview-url="${escapeHtml(previewUrl)}">
      ${
        artUrl
          ? `<img class="featured-card-bg" src="${artUrl}" alt="" />`
          : `<div class="featured-card-bg" ${artStyle}></div>`
      }
      <div class="featured-card-overlay">
        <div class="featured-card-top">
          <div class="featured-avatar">${avatar}</div>
          <div class="featured-teacher-name">${escapeHtml(cls.teacher)}</div>
          <div class="featured-badges">
            <span class="featured-badge">${escapeHtml(cls.style)}</span>
            <span class="featured-badge">${escapeHtml(cls.level)}</span>
          </div>
        </div>
        <div class="featured-card-bottom">
          <div class="featured-card-middle">
            <div class="featured-song-name">${escapeHtml(cls.song.name)}</div>
            <div class="featured-song-artist">${escapeHtml(cls.song.artist)}</div>
          </div>
          <div class="featured-info-rows">
            <div class="featured-info-row">
              <div class="featured-info-left">
                ${ICONS.LOCATION}
                <span>${escapeHtml(loc)}</span>
              </div>
              <span class="featured-price">$${cls.price}</span>
            </div>
            <div class="featured-info-row">
              <div class="featured-info-left">
                ${ICONS.TIME}
                <span>${date}, ${time}</span>
              </div>
              <span class="featured-spots">${cls.booked}/${cls.spots} ${ICONS.USERS}</span>
            </div>
          </div>
          <div class="featured-card-actions">
            <button class="featured-book-btn">Book</button>
            <button class="featured-play-btn" data-preview-url="${escapeHtml(previewUrl)}">
              ${ICONS.PLAY}
            </button>
          </div>
          <div class="promo-attribution-wrap">
            <div class="promo-attribution">Provided courtesy of iTunes</div>
            ${
              song.trackViewUrl
                ? `<a href="${escapeHtml(song.trackViewUrl)}" target="_blank" class="itunes-badge">Download on iTunes</a>`
                : ""
            }
          </div>
        </div>
      </div>
    </div>
  `;

  // Wire up play button
  const playBtn = container.querySelector(".featured-play-btn");
  if (playBtn) {
    playBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const url = playBtn.dataset.previewUrl;
      if (!url) return;
      if (playBtn.classList.contains("playing")) {
        stopPreview();
        playBtn.classList.remove("playing");
        playBtn.innerHTML = ICONS.PLAY;
        return;
      }
      stopPreview();
      previewAudio = new Audio(url);
      previewAudio.volume = 0.5;
      previewAudio.play();
      playBtn.classList.add("playing");
      playBtn.innerHTML = ICONS.PAUSE;
      previewAudio.addEventListener("ended", () => {
        playBtn.classList.remove("playing");
        playBtn.innerHTML = ICONS.PLAY;
      });
    });
  }
}

function showStudentClasses(song) {
  renderFeaturedCard($("#featured-card-wrap"), song);

  // Build bookings demo list
  buildBookingsDemo(song);

  // Hide background image when entering step 2
  studentView.classList.add("bg-hidden");

  // Smooth transition from step 1 to step 2
  transitionSteps($("#student-step-1"), $("#student-step-2"));

  // Show the fixed scroll container + init reveal after transition
  setTimeout(() => {
    showFeatureScroll("student-feature-scroll");
    initRevealSections("student-feature-scroll");
  }, 500);
}

function buildBookingsDemo(song) {
  const demo = $("#bookings-demo");
  if (!demo) return;
  demo.innerHTML = "";

  const bookings = [];
  // First booking uses the selected song
  bookings.push({
    name: song.name,
    artist: song.artist,
    artworkUrl: song.artworkUrl || "",
    style: STYLES[Math.floor(Math.random() * STYLES.length)],
    level: null,
    wishes: Math.floor(Math.random() * 8),
    booked: 0,
    spots: 5 + Math.floor(Math.random() * 30),
    teacher: MOCK_TEACHERS[Math.floor(Math.random() * MOCK_TEACHERS.length)],
    avatar: MOCK_AVATARS[Math.floor(Math.random() * MOCK_AVATARS.length)],
  });

  // Additional mock bookings (now 3 for a total of 4)
  for (let i = 0; i < 3; i++) {
    const s = MOCK_SONGS[Math.floor(Math.random() * MOCK_SONGS.length)];
    const hasLevel = Math.random() > 0.4;
    bookings.push({
      name: s.name,
      artist: s.artist,
      artworkUrl: "",
      color: s.color,
      style: STYLES[Math.floor(Math.random() * STYLES.length)],
      level: hasLevel
        ? LEVELS[Math.floor(Math.random() * LEVELS.length)]
        : null,
      wishes: Math.floor(Math.random() * 12),
      booked: Math.floor(Math.random() * 20),
      spots: 10 + Math.floor(Math.random() * 25),
      teacher: MOCK_TEACHERS[Math.floor(Math.random() * MOCK_TEACHERS.length)],
      avatar: MOCK_AVATARS[Math.floor(Math.random() * MOCK_AVATARS.length)],
    });
  }

  bookings.forEach((b) => {
    const artInner = b.artworkUrl
      ? `<img src="${b.artworkUrl}" alt="" />`
      : `<div class="booking-tile-art-placeholder" style="background: #cececeff;"></div>`;

    const metadata = b.style + (b.level ? ` \u2022 ${b.level}` : "");

    const tile = document.createElement("div");
    tile.className = "booking-tile";
    tile.innerHTML = `
      <div class="booking-tile-left">
        <div class="booking-tile-art">${artInner}</div>
        <div class="booking-tile-text">
          <div class="booking-tile-title">${escapeHtml(b.name)}</div>
          <div class="booking-tile-subtitle">${escapeHtml(b.artist)}</div>
          <div class="booking-tile-metadata">${escapeHtml(metadata)}</div>
        </div>
      </div>
      <div class="booking-tile-right">
        <div class="booking-tile-avatar"><div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--dimmed);">${b.avatar}</div></div>
        <div class="booking-tile-status">${b.booked}/${b.spots} ${ICONS.USERS}</div>
      </div>
    `;
    demo.appendChild(tile);
  });
}

// initCarousel removed — single featured card is used instead

// ══════════════════════════════════════════
// TEACHER — Song search → smooth transition
// ══════════════════════════════════════════

let teacherSelectedSong = null;

setupItunesSearch(
  $("#teacher-search"),
  $("#teacher-results"),
  $("#teacher-spinner"),
  (song) => {
    teacherSelectedSong = song;
    sharedPickedSong = song;
    stopPreview();
    showTeacherFeatures(song);
  },
);

function showTeacherFeatures(song) {
  // Hide background image when entering step 2
  teacherView.classList.add("bg-hidden");

  // Populate studio song header
  if (song) {
    const artEl = $("#studio-song-art");
    const nameEl = $("#studio-song-name");
    const artistEl = $("#studio-song-artist");
    if (artEl) artEl.src = song.artworkUrl;
    if (nameEl) nameEl.textContent = song.name;
    if (artistEl) artistEl.textContent = song.artist;
  }

  // Render single featured card
  renderFeaturedCard($("#teacher-card-wrap"), song);

  transitionSteps($("#teacher-step-1"), $("#teacher-step-2"));

  // Init features after transition starts
  setTimeout(() => {
    showFeatureScroll("teacher-feature-scroll");
    initBubbleChart();
    initStudioDemo(song);
    initRevealSections("teacher-feature-scroll");
  }, 200);
}

// ══════════════════════════════════════════
// BUBBLE CHART — gravity + drag
// ══════════════════════════════════════════

let bubbleAnimId = null;

function cancelBubbleAnim() {
  if (bubbleAnimId) {
    cancelAnimationFrame(bubbleAnimId);
    bubbleAnimId = null;
  }
}

function initBubbleChart() {
  cancelBubbleAnim();

  // FIX: JQuery returns a collection, we need the raw element for getContext
  const canvas = document.querySelector("#bubble-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const container = canvas.parentElement;

  const dpr = window.devicePixelRatio || 1;

  function resize() {
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  const cw = () => canvas.width / dpr;
  const ch = () => canvas.height / dpr;

  const style = getComputedStyle(document.documentElement);
  const textColor = style.getPropertyValue("--text").trim() || "#ffffff";
  const dimColor = style.getPropertyValue("--dimmed").trim() || "#999999";

  const resolvedColors = {
    "var(--bubble-1)": style.getPropertyValue("--bubble-1").trim() || "#ffffff",
    "var(--bubble-2)": style.getPropertyValue("--bubble-2").trim() || "#bbbbbb",
    "var(--bubble-3)": style.getPropertyValue("--bubble-3").trim() || "#888888",
    "var(--bubble-4)": style.getPropertyValue("--bubble-4").trim() || "#555555",
  };

  const maxVal = Math.max(...BUBBLE_DATA.map((d) => d.value));
  const W = cw();
  const H = ch();
  const responsiveScale = Math.min(W, 600) / 600;

  const bubbles = BUBBLE_DATA.map((d) => {
    // 0.15 of width on desktop, but scaled down for mobile
    // + 10 is the minimum "touchable" size in pixels
    const r =
      (d.value / maxVal) * (W * 0.2 * responsiveScale) +
      (10 * responsiveScale + 8);

    return {
      ...d,
      x: W / 2 + (Math.random() - 0.5) * W * 0.4,
      y: H / 2 + (Math.random() - 0.5) * H * 0.4,
      r,
      vx: 0,
      vy: 0,
    };
  });

  // PHYSICS CONSTANTS
  const GRAVITY_STRENGTH = 0.002;
  const ROTATE_STRENGTH = 0.0004; // Slow orbital push
  const DAMPING = 0.9; // Lowered from 0.97 to reduce "spinning"
  const COLLISION_STRENGTH = 0.5;

  let dragBubble = null;
  let dragOffX = 0,
    dragOffY = 0;

  function canvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    // Map client coordinates directly to CSS pixel coordinates
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function findBubble(pos) {
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      const dx = pos.x - b.x,
        dy = pos.y - b.y;
      if (dx * dx + dy * dy < b.r * b.r) return b;
    }
    return null;
  }

  function onDown(e) {
    const pos = canvasPos(e);
    const b = findBubble(pos);
    if (b) {
      dragBubble = b;
      dragOffX = pos.x - b.x;
      dragOffY = pos.y - b.y;
      container.style.cursor = "grabbing";
    }
  }

  function onMove(e) {
    const pos = canvasPos(e);
    if (!dragBubble) {
      container.style.cursor = findBubble(pos) ? "grab" : "default";
      return;
    }

    // FIX: Calculate velocity while dragging so it doesn't "die" when released
    const nextX = pos.x - dragOffX;
    const nextY = pos.y - dragOffY;
    dragBubble.vx = (nextX - dragBubble.x) * 0.5;
    dragBubble.vy = (nextY - dragBubble.y) * 0.5;
    dragBubble.x = nextX;
    dragBubble.y = nextY;
  }

  function onUp() {
    dragBubble = null;
    container.style.cursor = "default";
  }

  canvas.addEventListener("mousedown", onDown);
  window.addEventListener("mousemove", onMove); // Better to track on window while dragging
  window.addEventListener("mouseup", onUp);
  canvas.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      onDown(e);
    },
    { passive: false },
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      onMove(e);
    },
    { passive: false },
  );
  canvas.addEventListener("touchend", onUp);

  function draw() {
    const W = cw(),
      H = ch();
    const cx = W / 2,
      cy = H / 2;

    ctx.clearRect(0, 0, W, H);

    // Physics Phase
    bubbles.forEach((b) => {
      if (b === dragBubble) return;

      // Gravity toward center
      b.vx += (cx - b.x) * GRAVITY_STRENGTH;
      b.vy += (cy - b.y) * GRAVITY_STRENGTH;

      // Slow orbital rotation
      const driftX = b.x - cx;
      const driftY = b.y - cy;
      b.vx -= driftY * ROTATE_STRENGTH;
      b.vy += driftX * ROTATE_STRENGTH;

      // Damping (Friction)
      b.vx *= DAMPING;
      b.vy *= DAMPING;

      b.x += b.vx;
      b.y += b.vy;
    });

    // Collision Resolution Phase
    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const a = bubbles[i],
          b = bubbles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.r + b.r + 5; // Added small gap

        if (dist < minDist && dist > 0) {
          const overlap = (minDist - dist) / dist;
          const moveX = dx * overlap * COLLISION_STRENGTH;
          const moveY = dy * overlap * COLLISION_STRENGTH;

          if (a !== dragBubble) {
            a.x -= moveX;
            a.y -= moveY;
            a.vx -= moveX * 0.1;
            a.vy -= moveY * 0.1; // Add friction to collision
          }
          if (b !== dragBubble) {
            b.x += moveX;
            b.y += moveY;
            b.vx += moveX * 0.1;
            b.vy += moveY * 0.1;
          }
        }
      }
    }

    // Bounds check
    bubbles.forEach((b) => {
      if (b.x - b.r < 0) {
        b.x = b.r;
        b.vx *= -0.5;
      }
      if (b.x + b.r > W) {
        b.x = W - b.r;
        b.vx *= -0.5;
      }
      if (b.y - b.r < 0) {
        b.y = b.r;
        b.vy *= -0.5;
      }
      if (b.y + b.r > H) {
        b.y = H - b.r;
        b.vy *= -0.5;
      }
    });

    // Render Phase
    bubbles.forEach((b) => {
      const color = resolvedColors[b.color] || "#ffffff";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = color + "22";
      ctx.fill();
      ctx.strokeStyle = color + "55";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = `600 ${Math.max(b.r * 0.3, 11)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(b.label, b.x, b.y - b.r * 0.1);

      ctx.fillStyle = dimColor;
      ctx.font = `${Math.max(b.r * 0.2, 9)}px sans-serif`;
      ctx.fillText(b.value + " wishes", b.x, b.y + b.r * 0.25);
    });

    bubbleAnimId = requestAnimationFrame(draw);
  }

  draw();
  window.addEventListener("resize", resize);
}

// ══════════════════════════════════════════
// STUDIO DEMO (matching app screenshot)
// ══════════════════════════════════════════

function initStudioDemo(song) {
  const songTimeline = $("#song-timeline");
  const countTimeline = $("#count-timeline");
  if (!songTimeline || !countTimeline) return;

  // Keep playheads, clear segments
  songTimeline.querySelectorAll(".timeline-segment").forEach((s) => s.remove());
  countTimeline
    .querySelectorAll(".timeline-segment")
    .forEach((s) => s.remove());

  // Generate song segments
  const songSegments = [
    { time: "00:00", num: 1 },
    { time: "00:05", num: 2 },
    { time: "00:10", num: 3 },
  ];

  const countSegments = [
    { time: "00:05", num: 1 },
    { time: "00:10", num: 2 },
    { time: "00:15", num: 3 },
  ];

  const renderSegments = (timeline, segments, getActiveCondition) => {
    segments.forEach((seg, i) => {
      const el = document.createElement("div");
      el.className = "timeline-segment";
      el.innerHTML = `
        <div class="segment-time">${seg.time}</div>
        <div class="segment-block ${getActiveCondition(i) ? "active-segment" : ""}">${seg.num}</div>
      `;
      timeline.appendChild(el);
    });
  };

  renderSegments(songTimeline, songSegments, (i) => i === 1);
  renderSegments(countTimeline, countSegments, (i) => i >= 1);

  // Tempo chips
  $$(".tempo-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      $$(".tempo-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
    });
  });

  // Track selection & playback
  const trackSong = $("#track-song");
  const trackCount = $("#track-count");
  const playBtn = $("#studio-play");
  let selectedTrack = "song";
  let playing = false;
  let playInterval = null;
  let playheadPos = 0;

  function stopStudioPlayback() {
    clearInterval(playInterval);
    stopPreview();
    playing = false;
    if (playBtn) playBtn.innerHTML = ICONS.PLAY;
    const songPH = $("#song-playhead");
    const countPH = $("#count-playhead");
    if (songPH) songPH.style.left = "0%";
    if (countPH) countPH.style.left = "0%";
    playheadPos = 0;
  }

  function selectTrack(track) {
    if (track === selectedTrack) return;
    selectedTrack = track;
    if (track === "song") {
      if (trackSong) {
        trackSong.classList.add("track-selected");
        trackSong.classList.remove("track-dimmed");
      }
      if (trackCount) {
        trackCount.classList.add("track-dimmed");
        trackCount.classList.remove("track-selected");
      }
    } else {
      if (trackCount) {
        trackCount.classList.add("track-selected");
        trackCount.classList.remove("track-dimmed");
      }
      if (trackSong) {
        trackSong.classList.add("track-dimmed");
        trackSong.classList.remove("track-selected");
      }
    }
    if (playing) stopStudioPlayback();
  }

  if (trackSong) trackSong.addEventListener("click", () => selectTrack("song"));
  if (trackCount)
    trackCount.addEventListener("click", () => selectTrack("count"));

  if (playBtn) {
    playBtn.addEventListener("click", () => {
      if (playing) {
        stopStudioPlayback();
      } else {
        playing = true;
        playheadPos = 0;
        playBtn.innerHTML = ICONS.PAUSE;

        if (selectedTrack === "song" && song && song.previewUrl) {
          stopPreview();
          previewAudio = new Audio(song.previewUrl);
          previewAudio.volume = 0.5;
          previewAudio.play();
          previewAudio.addEventListener("ended", () => stopStudioPlayback());
        }
        // Count track: placeholder — no audio source yet

        const activePH =
          selectedTrack === "song" ? $("#song-playhead") : $("#count-playhead");

        playInterval = setInterval(() => {
          playheadPos += 1;
          if (playheadPos > 100) {
            if (selectedTrack === "count") {
              stopStudioPlayback();
              return;
            }
            playheadPos = 0;
          }
          if (activePH) activePH.style.left = playheadPos + "%";
        }, 50);
      }
    });
  }
}

// ══════════════════════════════════════════
// SCROLL-SNAP REVEAL OBSERVER
// ══════════════════════════════════════════

// We create one observer per scroll container (since `root` differs).
const revealObservers = new Map();

function createRevealObserver(scrollContainer) {
  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const section = entry.target;
        if (entry.isIntersecting) {
          section.classList.add("in-view");
          const els = section.querySelectorAll(".reveal-el");
          els.forEach((el, i) => {
            el.style.transitionDelay = `${i * 100}ms`;
          });
        } else {
          section.classList.remove("in-view");
          const els = section.querySelectorAll(".reveal-el");
          els.forEach((el) => {
            el.style.transitionDelay = "0ms";
          });
        }
      });
    },
    { root: scrollContainer, threshold: 0.2 },
  );
}

function initRevealSections(containerId) {
  const container = $(`#${containerId}`);
  if (!container) return;

  // Disconnect previous observer if re-initing
  if (revealObservers.has(containerId)) {
    revealObservers.get(containerId).disconnect();
  }

  const observer = createRevealObserver(container);
  revealObservers.set(containerId, observer);

  // Reset scroll position to top
  container.scrollTop = 0;

  // Observe each snap section
  container.querySelectorAll(".reveal-section").forEach((section) => {
    section.classList.remove("in-view");
    observer.observe(section);
  });
}

// ══════════════════════════════════════════
// FOOTER YEAR
// ══════════════════════════════════════════

$$(".year").forEach((el) => {
  el.textContent = new Date().getFullYear();
});

// ══════════════════════════════════════════
// PAGE-LEVEL REVEAL OBSERVER
// ══════════════════════════════════════════

const pageRevealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
      } else {
        entry.target.classList.remove("in-view");
        entry.target.querySelectorAll(".reveal-el").forEach((el) => {
          el.style.transitionDelay = "0ms";
        });
      }
    });
  },
  { threshold: 0.15 },
);

document
  .querySelectorAll(
    ".pricing-hero.reveal-section, .download-hero.reveal-section",
  )
  .forEach((section) => {
    pageRevealObserver.observe(section);
  });

// ══════════════════════════════════════════
// LANDING HERO
// ══════════════════════════════════════════

const landingHero = document.getElementById("landing-hero");
const splitHero = document.getElementById("split-hero");

function revealSplitFromHero() {
  landingHero.classList.add("exiting");

  setTimeout(() => {
    landingHero.classList.add("gone");
    splitHero.classList.remove("hero-hidden");
  }, 300);
}

function returnToHero() {
  splitHero.classList.add("hero-hidden");
  landingHero.classList.remove("exiting", "gone");
}

// Single CTA button
document.getElementById("hero-cta-btn").addEventListener("click", () => {
  revealSplitFromHero();
});

// Initialize: split-hero hidden until CTA is clicked
splitHero.classList.add("hero-hidden");
