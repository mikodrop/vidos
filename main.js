
// Enhanced gallery with lightbox, search, export, theme toggle
const STORAGE_KEY = "embed_gallery_visual_v1";
const urlInput = document.getElementById("urlInput");
const titleInput = document.getElementById("titleInput");
const addBtn = document.getElementById("addUrl");
const itemsEl = document.getElementById("items");
const emptyEl = document.getElementById("empty");
const searchInput = document.getElementById("search");
const exportBtn = document.getElementById("exportBtn");
const themeToggle = document.getElementById("themeToggle");

const lb = document.getElementById("lightbox");
const lbInner = document.getElementById("lbInner");
const lbMeta = document.getElementById("lbMeta");
const lbClose = document.getElementById("lbClose");
const lbPrev = document.getElementById("lbPrev");
const lbNext = document.getElementById("lbNext");

let gallery = loadGallery();
let currentIndex = -1;
let filtered = null;

// helpers
function loadGallery(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch(e){ return []; } }
function saveGallery(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(gallery)); }
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

function guessMediaType(url){
  const low = url.toLowerCase();
  if(/\.(jpe?g|png|gif|bmp|webp)(\?.*)?$/.test(low)) return "image";
  if(/\.(mp4|webm|ogg|mov)(\?.*)?$/.test(low)) return "video";
  return "iframe";
}

function normalize(url){
  url = url.trim();
  const lower = url.toLowerCase();
  // youtube
  const yt = url.match(/(?:v=|youtu\.be\/|\/embed\/)([A-Za-z0-9_-]{6,})/);
  if(/youtube\.com|youtu\.be/.test(lower) && yt) return { type: "youtube", src: "https://www.youtube.com/embed/" + yt[1] };
  // try URL param v=
  try { const u = new URL(url); if(u.hostname.includes("youtube.com") && u.searchParams.get("v")) return { type: "youtube", src: "https://www.youtube.com/embed/" + u.searchParams.get("v") }; } catch(e){}
  // vimeo
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if(vm) return { type: "vimeo", src: "https://player.vimeo.com/video/" + vm[1] };
  // dropbox -> dl raw
  if(/dropbox\.com/.test(lower)){ url = url.replace("www.dropbox.com", "dl.dropboxusercontent.com").replace("dl=0","raw=1"); return { type: guessMediaType(url), src: url }; }
  // drive
  const gd = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if(/drive.google.com/.test(lower) && gd){ const id = gd[1]; const direct = "https://drive.google.com/uc?export=download&id=" + id; return { type: guessMediaType(direct), src: direct }; }
  // imgur short -> add .jpg
  if(/imgur\.com\/[A-Za-z0-9]+$/.test(lower) && !/\.(jpg|png|gif)$/.test(lower)) return { type: "image", src: url + ".jpg" };
  // direct image/video
  if(/\.(jpe?g|png|gif|bmp|webp)(\?.*)?$/.test(lower)) return { type: "image", src: url };
  if(/\.(mp4|webm|ogg|mov)(\?.*)?$/.test(lower)) return { type: "video", src: url };
  // fallback to iframe
  return { type: "iframe", src: url };
}

function renderList(list=null){
  const src = list || gallery;
  itemsEl.innerHTML = "";
  if(!src || src.length === 0){ emptyEl.style.display = "block"; return; } else emptyEl.style.display = "none";
  src.slice().reverse().forEach((item, i) => {
    const idx = src.length - 1 - i; // map to original order for navigation
    const n = normalize(item.url);
    const card = document.createElement("div"); card.className = "card";
    const thumbWrap = document.createElement("div");
    // thumbnail element depending on type
    if(n.type === "image"){
      const img = document.createElement("img"); img.className="thumb"; img.loading="lazy"; img.src = n.src; thumbWrap.appendChild(img);
    } else if(n.type === "video"){
      const v = document.createElement("video"); v.className="thumb"; v.src = n.src; v.muted=true; v.playsInline=true; v.controls=false; v.preload="metadata"; thumbWrap.appendChild(v);
    } else {
      // generate iframe thumbnail placeholder via embed or a screenshot fallback
      const iframe = document.createElement("div"); iframe.style.height = "180px"; iframe.style.display="flex"; iframe.style.alignItems="center"; iframe.style.justifyContent="center"; iframe.style.background = "linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))";
      iframe.innerHTML = '<div style="text-align:center;color:var(--muted)"><strong>Preview</strong><br/><small style="color:var(--muted)">' + n.src + '</small></div>';
      thumbWrap.appendChild(iframe);
    }
    card.appendChild(thumbWrap);

    const meta = document.createElement("div"); meta.className="meta";
    const left = document.createElement("div"); left.innerHTML = '<div style="font-weight:600;font-size:0.95rem;color:inherit">' + (item.title || "Без названия") + '</div><div style="font-size:0.8rem;color:var(--muted)">' + n.type + '</div>';
    const actions = document.createElement("div"); actions.className = "actions";
    const openBtn = document.createElement("button"); openBtn.innerText = "Открыть"; openBtn.onclick = ()=>{ openLightboxWith(item); };
    const delBtn = document.createElement("button"); delBtn.innerText = "Удалить"; delBtn.onclick = ()=>{ removeItem(item.id); };
    const copyBtn = document.createElement("button"); copyBtn.innerText = "Копировать"; copyBtn.onclick = ()=>{ navigator.clipboard.writeText(item.url); copyBtn.innerText="Скопировано"; setTimeout(()=>copyBtn.innerText="Копировать",1200); };
    actions.appendChild(openBtn); actions.appendChild(copyBtn); actions.appendChild(delBtn);

    meta.appendChild(left); meta.appendChild(actions);
    card.appendChild(meta);

    // click whole card opens lightbox
    card.onclick = (e)=>{ if(e.target.tagName.toLowerCase() === 'button') return; openLightboxWith(item); };
    itemsEl.appendChild(card);
  });
}

function addMedia(url, title=""){
  const trimmed = url.trim();
  if(!trimmed) return alert("Вставьте ссылку.");
  gallery.push({ id: uid(), url: trimmed, title: title || "", created: new Date().toISOString() });
  saveGallery();
  renderList(filtered);
  urlInput.value = ""; titleInput.value = "";
}

function removeItem(id){
  if(!confirm("Удалить элемент?")) return;
  gallery = gallery.filter(x=>x.id !== id);
  saveGallery();
  renderList(filtered);
}

// Lightbox functions
function openLightboxWith(item){
  currentIndex = gallery.findIndex(g => g.id === item.id);
  showLightbox();
}
function showLightbox(){
  if(currentIndex < 0 || currentIndex >= gallery.length) return;
  const item = gallery[currentIndex];
  const n = normalize(item.url);
  lbInner.innerHTML = "";
  lbMeta.textContent = item.title || item.url;
  if(n.type === "youtube" || n.type === "vimeo" || n.type === "iframe"){
    const iframe = document.createElement("iframe"); iframe.src = n.src; iframe.width = "100%"; iframe.height = "560"; iframe.allow = "accelerometer; autoplay; encrypted-media; picture-in-picture"; iframe.allowFullscreen = true;
    lbInner.appendChild(iframe);
  } else if(n.type === "video"){
    const v = document.createElement("video"); v.src = n.src; v.controls = true; v.autoplay = true; v.style.maxHeight = "78vh"; lbInner.appendChild(v);
  } else if(n.type === "image"){
    const img = document.createElement("img"); img.src = n.src; lbInner.appendChild(img);
  } else {
    const a = document.createElement("a"); a.href = n.src; a.target = "_blank"; a.textContent = n.src; lbInner.appendChild(a);
  }
  lb.classList.add("show");
  lb.setAttribute("aria-hidden","false");
  updateNav();
}

function closeLightbox(){ lb.classList.remove("show"); lb.setAttribute("aria-hidden","true"); lbInner.innerHTML = ""; currentIndex = -1; }

function prevLightbox(){ if(currentIndex > 0) { currentIndex--; showLightbox(); } }
function nextLightbox(){ if(currentIndex < gallery.length - 1) { currentIndex++; showLightbox(); } }

function updateNav(){
  lbPrev.disabled = currentIndex <= 0;
  lbNext.disabled = currentIndex >= gallery.length - 1;
}

// search/filter
searchInput.addEventListener("input", ()=>{
  const q = searchInput.value.trim().toLowerCase();
  if(!q){ filtered = null; renderList(); return; }
  filtered = gallery.filter(item => (item.title && item.title.toLowerCase().includes(q)) || item.url.toLowerCase().includes(q));
  renderList(filtered);
});

// export
exportBtn.addEventListener("click", ()=>{
  const data = JSON.stringify(gallery, null, 2);
  const blob = new Blob([data], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "gallery_export_" + new Date().toISOString().slice(0,10) + ".json"; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

// theme toggle (simple)
themeToggle.addEventListener("click", ()=>{
  const root = document.documentElement;
  root.classList.toggle("light");
  localStorage.setItem("embed_theme_light", root.classList.contains("light") ? "1" : "0");
});
// restore theme
if(localStorage.getItem("embed_theme_light") === "1") document.documentElement.classList.add("light");

addBtn.addEventListener("click", ()=>{ addMedia(urlInput.value, titleInput.value); });
urlInput.addEventListener("keydown", (e)=>{ if(e.key === "Enter") addBtn.click(); });
titleInput.addEventListener("keydown", (e)=>{ if(e.key === "Enter") addBtn.click(); });

// lightbox controls
lbClose.addEventListener("click", closeLightbox);
lbPrev.addEventListener("click", prevLightbox);
lbNext.addEventListener("click", nextLightbox);
document.addEventListener("keydown", (e)=>{ if(e.key === "Escape") closeLightbox(); if(e.key === "ArrowLeft") prevLightbox(); if(e.key === "ArrowRight") nextLightbox(); });

// initial render
renderList();
