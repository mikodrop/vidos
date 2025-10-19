// Основная логика фронтенда — хранение метаданных в localStorage и загрузка на Cloudinary при наличии конфигурации.
const STORAGE_KEY = "pvs_gallery_v1";
const itemsEl = document.getElementById("items");
const emptyEl = document.getElementById("empty");
const urlInput = document.getElementById("urlInput");
const addUrlBtn = document.getElementById("addUrl");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const dropzone = document.getElementById("dropzone");

const CONFIG = window.CONFIG || { CLOUDINARY_UPLOAD_URL: "", UPLOAD_PRESET: "", MAX_FILE_MB: 25 };

function loadGallery(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch(e){ return []; } }
function saveGallery(g){ localStorage.setItem(STORAGE_KEY, JSON.stringify(g)); }

function isVideo(url){
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/.test(url) || /youtube\.com|youtu\.be|vimeo\.com/.test(url);
}
function createItemNode(item){
  const wrap = document.createElement("div"); wrap.className="item";
  if(isVideo(item.url)){
    // YouTube/Vimeo embed handling simple
    if(/youtube\.com|youtu\.be/.test(item.url)){
      // convert to embed
      let id = null;
      const yt = item.url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
      if(yt) id = yt[1];
      if(id){
        const iframe = document.createElement("iframe");
        iframe.width="100%"; iframe.height="150"; iframe.src=`https://www.youtube.com/embed/${id}`;
        iframe.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        wrap.appendChild(iframe);
      } else {
        const v = document.createElement("video"); v.controls=true;
        v.src = item.url; wrap.appendChild(v);
      }
    } else if(/vimeo\.com/.test(item.url)){
      // naive vimeo embed
      const m = item.url.match(/vimeo\.com\/(\d+)/);
      const iframe = document.createElement("iframe");
      iframe.width="100%"; iframe.height="150";
      iframe.src = m ? `https://player.vimeo.com/video/${m[1]}` : item.url;
      iframe.allowFullscreen = true;
      wrap.appendChild(iframe);
    } else {
      const v = document.createElement("video"); v.controls=true; v.src=item.url; wrap.appendChild(v);
    }
  } else {
    const img = document.createElement("img"); img.src = item.url; wrap.appendChild(img);
  }

  const meta = document.createElement("div"); meta.className="meta";
  const t = document.createElement("div"); t.textContent = item.title || "";
  const btns = document.createElement("div");
  const del = document.createElement("button"); del.textContent="Удалить"; del.style.background="#d9534f";
  del.onclick = ()=>{ removeItem(item.id); };
  const copy = document.createElement("button"); copy.textContent="Копировать ссылку"; copy.style.background="#3a3a3a";
  copy.onclick = ()=>{ navigator.clipboard.writeText(item.url); copy.textContent="Скопировано!"; setTimeout(()=>copy.textContent="Копировать ссылку",1200); };
  btns.appendChild(copy); btns.appendChild(del);
  meta.appendChild(t); meta.appendChild(btns);
  wrap.appendChild(meta);
  return wrap;
}

function render(){
  const g = loadGallery();
  itemsEl.innerHTML = "";
  if(g.length===0) { emptyEl.style.display="block"; return; } else emptyEl.style.display="none";
  g.slice().reverse().forEach(it => itemsEl.appendChild(createItemNode(it)));
}

function addMedia(url, title=""){
  const g = loadGallery();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  g.push({ id, url, title, created: new Date().toISOString() });
  saveGallery(g);
  render();
}

// remove
function removeItem(id){
  let g = loadGallery();
  g = g.filter(x=>x.id!==id);
  saveGallery(g);
  render();
}

// Add by pasted url
addUrlBtn.addEventListener("click", ()=>{
  const url = urlInput.value.trim();
  if(!url) return alert("Вставьте ссылку.");
  addMedia(url);
  urlInput.value = "";
});

// Upload file (client-side) -> third-party
uploadBtn.addEventListener("click", async ()=>{
  const f = fileInput.files[0];
  if(!f) return alert("Выберите файл.");
  if(f.size > CONFIG.MAX_FILE_MB*1024*1024) {
    const ok = confirm(`Файл больше ${CONFIG.MAX_FILE_MB} МБ. Рекомендуется загрузить файл на YouTube/Cloudinary/Dropbox и вставить ссылку. Продолжить клиентскую загрузку (если настроен endpoint)?`);
    if(!ok) return;
  }
  if(CONFIG.CLOUDINARY_UPLOAD_URL && CONFIG.UPLOAD_PRESET){
    await uploadToCloudinary(f);
  } else {
    alert("Настройте config.js для автоматической загрузки (Cloudinary) или загрузите файл в сторонний сервис и вставьте ссылку.");
  }
  fileInput.value = "";
});

// drag & drop
dropzone.addEventListener("dragover", e=>{ e.preventDefault(); dropzone.style.borderColor="#0b74de"; });
dropzone.addEventListener("dragleave", e=>{ dropzone.style.borderColor="#ccc"; });
dropzone.addEventListener("drop", async e=>{
  e.preventDefault(); dropzone.style.borderColor="#ccc";
  const f = e.dataTransfer.files[0];
  if(f) {
    fileInput.files = e.dataTransfer.files;
    uploadBtn.click();
  }
});

async function uploadToCloudinary(file){
  try{
    const url = CONFIG.CLOUDINARY_UPLOAD_URL;
    const preset = CONFIG.UPLOAD_PRESET;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", preset);
    // optional: public_id or folder
    const res = await fetch(url, { method: "POST", body: fd });
    if(!res.ok) throw new Error("Upload failed: "+res.status);
    const data = await res.json();
    // Cloudinary returns secure_url
    const mediaUrl = data.secure_url || data.url;
    if(!mediaUrl) throw new Error("Upload succeeded but no URL returned.");
    addMedia(mediaUrl, file.name);
    alert("Файл загружен и добавлен в галерею.");
  }catch(err){
    console.error(err);
    alert("Ошибка загрузки: "+err.message + ". Проверьте консоль.");
  }
}

render();
