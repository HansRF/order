
// ===============================
// 1) Konfigurasi Firebase
// ===============================
// TODO: GANTI dengan konfigurasi project kamu
const firebaseConfig = {
    apiKey: "AIzaSyB0tOUfkH3VQMYTUsAOX1rMhAx_Z_NALIA",
    authDomain: "lovebridgegame-7cd34.firebaseapp.com",
    databaseURL:
        "https://lovebridgegame-7cd34-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "lovebridgegame-7cd34",
    storageBucket: "lovebridgegame-7cd34.firebasestorage.app",
    messagingSenderId: "516740531695",
    appId: "1:516740531695:web:1d9bfdd7c128092651221a",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ===============================
// 2) State & Util
// ===============================
const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = canvas.clientWidth = window.innerWidth;
    canvas.height = canvas.clientHeight = document
        .getElementById("stage")
        .getBoundingClientRect().height;
    draw();
}
window.addEventListener("resize", resize);

const world = {
    roomId: null,
    role: null, // 'A' atau 'B'
    you: Math.random().toString(36).slice(2, 10),
    groundY: 0,
    leftCliff: { x: 80 },
    rightCliff: { x: 0 },
    nodes: [], // {id,x,y}
    planks: [], // {id,a,b}
    // cache
    scale: 1,
};

const ui = {
    roomInput: document.getElementById("roomId"),
    roomBadge: document.getElementById("roomBadge"),
    roleBadge: document.getElementById("roleBadge"),
    roleLabel: document.getElementById("roleLabel"),
    status: document.getElementById("status"),
    toast: document.getElementById("toast"),
    winModal: document.getElementById("winModal"),
    closeModal: document.getElementById("closeModal"),
};

function toast(msg) {
    ui.toast.textContent = msg;
    ui.toast.style.display = "block";
    setTimeout(() => (ui.toast.style.display = "none"), 1500);
}

// Simple ID
const nid = () => "n" + Math.random().toString(36).slice(2, 9);
const pid = () => "p" + Math.random().toString(36).slice(2, 9);

// ===============================
// 3) Room ops
// ===============================
function setStatus(s) {
    ui.status.textContent = s;
}

function roomRef(id) {
    return db.ref("rooms/" + id);
}

async function createRoom() {
    const id = (ui.roomInput.value || "").trim().toUpperCase() || "ROOM";
    await roomRef(id).set({
        createdAt: Date.now(),
        nodes: [],
        planks: [],
    });
    joinRoom(id);
}

function joinRoom(id) {
    world.roomId = id;
    ui.roomBadge.textContent = id;
    setStatus("Terhubung");
    // Listen
    roomRef(id + "/nodes").on("value", (snap) => {
        world.nodes = snap.val() || [];
        draw();
    });
    roomRef(id + "/planks").on("value", (snap) => {
        world.planks = snap.val() || [];
        draw();
    });
}

async function resetRoom() {
    if (!world.roomId) return;
    await roomRef(world.roomId).update({ nodes: [], planks: [] });
    toast("Room direset");
}

async function pushNode(x, y) {
    if (!world.roomId) return;
    const n = { id: nid(), x, y };
    const arr = (world.nodes || []).slice();
    arr.push(n);
    await roomRef(world.roomId).update({ nodes: arr });
}

async function pushPlank(aId, bId) {
    if (!world.roomId) return;
    if (aId === bId) return; // ignore sama
    // Cegah duplikat
    const exists = world.planks.some(
        (p) => (p.a === aId && p.b === bId) || (p.a === bId && p.b === aId)
    );
    if (exists) return;
    const p = { id: pid(), a: aId, b: bId };
    const arr = (world.planks || []).slice();
    arr.push(p);
    await roomRef(world.roomId).update({ planks: arr });
}

async function undo() {
    if (!world.roomId) return;
    // Hapus elemen terakhir (prioritas papan dulu, lalu pilar)
    if (world.planks.length) {
        const arr = world.planks.slice(0, -1);
        await roomRef(world.roomId).update({ planks: arr });
        return;
    }
    if (world.nodes.length) {
        const arr = world.nodes.slice(0, -1);
        await roomRef(world.roomId).update({ nodes: arr });
    }
}

// ===============================
// 4) Stage & input
// ===============================
function worldMetrics() {
    world.groundY = canvas.height - 80;
    world.rightCliff.x = canvas.width - 80;
    world.scale = 1; // placeholder kalau mau zoom
}

function screenToWorld(x, y) {
    return { x, y };
}

let pendingPlank = null; // simpan titik A saat role B memilih

function onTap(e) {
    if (!world.roomId || !world.role) {
        toast("Join room & pilih peran dulu");
        return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    const pt = screenToWorld(x, y);

    if (world.role === "A") {
        // Letakkan pilar (node) — batasi agar tidak terlalu dekat tanah
        if (pt.y > world.groundY - 16) return; // hindari di tanah
        pushNode(pt.x, pt.y);
    } else if (world.role === "B") {
        // Hubungkan dua node terdekat
        const nearest = nearestNode(pt);
        if (!nearest) {
            toast("Butuh pilar dari A");
            return;
        }
        if (!pendingPlank) {
            pendingPlank = nearest;
            toast("Pilih titik kedua");
        } else {
            if (nearest.id !== pendingPlank.id) {
                pushPlank(pendingPlank.id, nearest.id);
            }
            pendingPlank = null;
        }
    }
}

canvas.addEventListener("click", onTap);
canvas.addEventListener("touchstart", onTap, { passive: true });

function nearestNode(pt) {
    let best = null,
        dmin = 99999;
    for (const n of world.nodes) {
        const d = Math.hypot(n.x - pt.x, n.y - pt.y);
        if (d < dmin) {
            dmin = d;
            best = n;
        }
    }
    return dmin < 40 ? best : null; // radius snap 40px
}

// ===============================
// 5) Drawing
// ===============================
function drawGround() {
    // Tebing kiri & kanan
    ctx.fillStyle = "#0e1526";
    ctx.fillRect(
        0,
        world.groundY,
        canvas.width,
        canvas.height - world.groundY
    );

    // Tebing kiri
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 0, world.leftCliff.x, canvas.height);
    // Tebing kanan
    ctx.fillRect(
        world.rightCliff.x,
        0,
        canvas.width - world.rightCliff.x,
        canvas.height
    );

    // Label
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px system-ui";
    ctx.fillText("Tebing A", 14, 18);
    ctx.fillText("Tebing B", canvas.width - 74, 18);
}

function drawNodes() {
    for (const n of world.nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#f472b6";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.stroke();
    }
}

function drawPlanks() {
    ctx.lineWidth = 4;
    for (const p of world.planks) {
        const a = world.nodes.find((n) => n.id === p.a);
        const b = world.nodes.find((n) => n.id === p.b);
        if (!a || !b) continue;
        ctx.strokeStyle = "#22c55e";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    }
}

function drawPending() {
    if (world.role === "B" && pendingPlank) {
        // garis ghost ke kursor terakhir
        // (di-omit untuk kesederhanaan; bisa ditambah dengan mousemove listener)
    }
}

function drawCouple(xFrac) {
    // xFrac: 0..1 posisi pasangan saat test
    const y = world.groundY - 18;
    const leftX = 30 + xFrac * (canvas.width - 60);
    ctx.font = "24px serif";
    ctx.fillText("👦", leftX - 20, y);
    ctx.fillText("👧", leftX + 8, y);
}

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function draw() {
    worldMetrics();
    clear();
    drawGround();
    drawPlanks();
    drawNodes();
    drawPending();
}

// ===============================
// 6) Test Bridge (validasi sederhana path)
// ===============================
function buildGraph() {
    const g = new Map();
    for (const n of world.nodes) {
        g.set(n.id, new Set());
    }
    for (const p of world.planks) {
        if (g.has(p.a) && g.has(p.b)) {
            g.get(p.a).add(p.b);
            g.get(p.b).add(p.a);
        }
    }
    return g;
}

function cliffGhostNodes() {
    // Tambah node virtual di tebing kiri & kanan pada ketinggian yang layak
    const left = { id: "_L", x: world.leftCliff.x, y: world.groundY - 120 };
    const right = {
        id: "_R",
        x: world.rightCliff.x,
        y: world.groundY - 120,
    };
    return { left, right };
}

function connectGhosts(copyNodes) {
    // Hubungkan ghost dengan node terdekat (< 80px)
    const { left, right } = cliffGhostNodes();
    copyNodes.push(left, right);
    const edges = [];
    const near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < 100;
    for (const n of copyNodes) {
        if (n.id !== "_L" && near(n, left))
            edges.push({ _ghost: true, a: n.id, b: left.id });
        if (n.id !== "_R" && near(n, right))
            edges.push({ _ghost: true, a: n.id, b: right.id });
    }
    return { nodes: copyNodes, edges };
}

function pathExists() {
    // Graph BFS dari _L ke _R termasuk ghost edges
    const baseNodes = world.nodes.map((n) => ({ ...n }));
    const { nodes, edges } = connectGhosts(baseNodes);

    const g = new Map();
    for (const n of nodes) {
        g.set(n.id, new Set());
    }
    for (const p of world.planks) {
        g.get(p.a)?.add(p.b);
        g.get(p.b)?.add(p.a);
    }
    for (const e of edges) {
        g.get(e.a)?.add(e.b);
        g.get(e.b)?.add(e.a);
    }

    if (!g.has("_L") || !g.has("_R")) return false;
    const q = ["_L"];
    const vis = new Set(["_L"]);
    while (q.length) {
        const u = q.shift();
        if (u === "_R") return true;
        for (const v of g.get(u) || []) {
            if (!vis.has(v)) {
                vis.add(v);
                q.push(v);
            }
        }
    }
    return false;
}

function animateTest(successCb, failCb) {
    let t = 0,
        ok = pathExists();
    const start = performance.now();
    function step(now) {
        const dt = (now - start) / 3000; // 3 detik ke kanan
        t = Math.min(1, dt);
        draw();
        // progress bar di bawah
        const barW = canvas.width - 160;
        const x = 80,
            y = canvas.height - 28,
            h = 8;
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(x, y, barW, h);
        ctx.fillStyle = ok ? "#22c55e" : "#ef4444";
        ctx.fillRect(x, y, barW * t, h);
        drawCouple(t);
        if (t < 1) {
            requestAnimationFrame(step);
        } else {
            ok ? successCb() : failCb();
        }
    }
    requestAnimationFrame(step);
}

function onTest() {
    if (!world.roomId) return toast("Buat/join room dulu");
    if (world.nodes.length < 2 || world.planks.length < 1)
        return toast("Bangun jembatan dulu");

    animateWalk(
        () => {
            ui.winModal.style.display = "flex";
        },
        () => {
            toast("Jembatan belum nyambung, coba lagi!");
        }
    );
}

// Cari path nyata dari _L ke _R
function findPath() {
    const baseNodes = world.nodes.map((n) => ({ ...n }));
    const { nodes, edges } = connectGhosts(baseNodes);

    const g = new Map();
    for (const n of nodes) g.set(n.id, new Set());
    for (const p of world.planks) {
        g.get(p.a)?.add(p.b);
        g.get(p.b)?.add(p.a);
    }
    for (const e of edges) {
        g.get(e.a)?.add(e.b);
        g.get(e.b)?.add(e.a);
    }

    // BFS simpan parent
    const q = ["_L"], parent = { _L: null };
    while (q.length) {
        const u = q.shift();
        if (u === "_R") break;
        for (const v of g.get(u) || []) {
            if (!(v in parent)) {
                parent[v] = u;
                q.push(v);
            }
        }
    }
    if (!("_R" in parent)) return null;

    // Rekonstruksi path
    const path = [];
    let cur = "_R";
    while (cur) {
        path.push(cur);
        cur = parent[cur];
    }
    path.reverse();

    // Mapping ke koordinat asli
    const mapNode = (id) =>
        id === "_L" ? cliffGhostNodes().left
            : id === "_R" ? cliffGhostNodes().right
                : world.nodes.find((n) => n.id === id);
    return path.map(mapNode);
}

// Animasi karakter jalan mengikuti path
function animateWalk(successCb, failCb) {
    const path = findPath();
    if (!path) return failCb();

    let seg = 0; // segment index
    let t = 0;
    function step() {
        draw();
        const a = path[seg];
        const b = path[seg + 1];
        const x = a.x + (b.x - a.x) * t;
        const y = a.y + (b.y - a.y) * t;

        // gambar pasangan di titik ini
        ctx.font = "24px serif";
        ctx.fillText("👦", x - 20, y);
        ctx.fillText("👧", x + 8, y);

        t += 0.02; // kecepatan
        if (t >= 1) {
            seg++;
            t = 0;
        }
        if (seg < path.length - 1) {
            requestAnimationFrame(step);
        } else {
            successCb();
        }
    }
    requestAnimationFrame(step);
}

// ===============================
// 7) UI wiring
// ===============================
document.getElementById("btnCreate").onclick = () => createRoom();
document.getElementById("btnJoin").onclick = () => {
    const id = (ui.roomInput.value || "").trim().toUpperCase();
    if (!id) return toast("Isi kode room");
    joinRoom(id);
};
document.getElementById("btnRoleA").onclick = () => {
    world.role = "A";
    ui.roleBadge.textContent = "A • Pilar";
    ui.roleLabel.style.display = "inline-block";
    ui.roleLabel.textContent = "Peran: A";
    toast("Kamu: Penjaga Pilar");
    draw();
};
document.getElementById("btnRoleB").onclick = () => {
    world.role = "B";
    ui.roleBadge.textContent = "B • Papan";
    ui.roleLabel.style.display = "inline-block";
    ui.roleLabel.textContent = "Peran: B";
    toast("Kamu: Penghubung Papan");
    draw();
};
document.getElementById("btnReset").onclick = resetRoom;
document.getElementById("btnUndo").onclick = undo;
document.getElementById("btnTest").onclick = onTest;
ui.closeModal.onclick = () => (ui.winModal.style.display = "none");

// Inisialisasi kanvas
resize();
draw();
