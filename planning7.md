Berikut adalah **`planning7.md`**, dokumen penutup yang mengidentifikasi celah fitur terakhir (terutama di ranah Multimedia, Produktivitas, dan Web Utilities) untuk menjadikan AIOTools benar-benar "All-In-One" yang komprehensif, sambil tetap berpegang teguh pada prinsip **Client-First**.

---

# 🚀 AIOTools - planning7.md (Phase 7: Multimedia, Productivity & The Final 1%)

## 1. STATUS & TUJUAN
**Dokumen Ini:** Ekstensi final dari `planning.md` hingga `planning6.md` (Fase 1-22 diasumsikan selesai, total ~91 tools).
**Tujuan Fase 7:** 
1. Menutup celah fitur di kategori **Audio & Video** (permintaan tinggi, feasible dengan WebAssembly).
2. Menambahkan **Productivity & Math Tools** untuk meningkatkan durasi sesi pengguna (time-on-site).
3. Menambahkan **Web & SEO Generators** untuk menarik trafik developer dan marketer.
4. Mencapai angka magis **100+ Tools** yang fully functional.

**Prinsip Kunci:** Tetap memprioritaskan Native Browser APIs dan WebAssembly (WASM). Fitur yang mutlak membutuhkan server akan ditandai sebagai *Out of Scope*.

---

## 2. GAP ANALYSIS: Fitur yang Masih Belum Ada

### 🆕 BELUM ADA - FEASIBLE Client-Side (Akan Ditambahkan)

**Kategori E: Audio Tools (Web Audio API / ffmpeg.wasm)**
| No | Tool | Estimasi Traffic | Kompleksitas |
|----|------|------------------|--------------|
| 1 | Audio Converter (MP3 ↔ WAV ↔ OGG) | 🔥🔥 | 🟡 Sedang (ffmpeg.wasm) |
| 2 | Audio Trimmer / Cutter | 🔥🔥🔥 | 🟡 Sedang (Web Audio API) |
| 3 | Audio Merger (Join MP3s) | 🔥🔥 | 🟡 Sedang (ffmpeg.wasm) |
| 4 | Audio Speed / Pitch Changer | 🔥 | 🟢 Rendah (Web Audio API) |

**Kategori F: Video Tools (ffmpeg.wasm)**
| No | Tool | Estimasi Traffic | Kompleksitas |
|----|------|------------------|--------------|
| 5 | Video Trimmer / Cutter | 🔥🔥🔥 | 🔴 Tinggi (ffmpeg.wasm) |
| 6 | Video Compressor | 🔥🔥🔥 | 🔴 Tinggi (ffmpeg.wasm) |
| 7 | Video to MP3 (Extract Audio) | 🔥🔥🔥 | 🟡 Sedang (ffmpeg.wasm) |
| 8 | Video Merger | 🔥🔥 | 🔴 Tinggi (ffmpeg.wasm) |

**Kategori G: Productivity & Time**
| No | Tool | Estimasi Traffic | Kompleksitas |
|----|------|------------------|--------------|
| 9 | Pomodoro Timer | 🔥🔥 | 🟢 Rendah |
| 10 | Typing Speed Test | 🔥🔥 | 🟢 Rendah |
| 11 | Stopwatch & Countdown Timer | 🔥 | 🟢 Rendah |
| 12 | Random Generator (Number, Name, Color) | 🔥 | 🟢 Rendah |

**Kategori H: Math & Science**
| No | Tool | Estimasi Traffic | Kompleksitas |
|----|------|------------------|--------------|
| 13 | Scientific Calculator | 🔥🔥 | 🟡 Sedang |
| 14 | Graph Plotter (2D Function) | 🔥 | 🟡 Sedang (`function-plot`) |

**Kategori I: Web & SEO Generators**
| No | Tool | Estimasi Traffic | Kompleksitas |
|----|------|------------------|--------------|
| 15 | Meta Tag Generator | 🔥🔥 | 🟢 Rendah |
| 16 | Robots.txt Generator | 🔥 | 🟢 Rendah |
| 17 | Sitemap.xml Generator (from list of URLs) | 🔥 | 🟢 Rendah |
| 18 | .htaccess Generator (Redirects, Security) | 🔥 | 🟢 Rendah |
| 19 | User Agent Parser | 🔥 | 🟢 Rendah |
| 20 | My IP Address & Info | 🔥🔥 | 🟢 Rendah (fetch ke public API) |

---

### ❌ TETAP OUT OF SCOPE (Membutuhkan Server)
| Tool | Alasan | Alternatif yang Ditampilkan |
|------|--------|-----------------------------|
| Website Screenshot | Butuh headless browser (Puppeteer) | "Gunakan ekstensi browser GoFullPage" |
| Ping / Traceroute / Port Scanner | Butuh akses network level server | "Gunakan tools seperti ping.eu" |
| Email Validator (SMTP Check) | Butuh koneksi SMTP server | "Gunakan hunter.io atau verifyemail.io" |
| Broken Link Checker | Butuh web crawling server | "Gunakan ekstensi browser Check My Links" |
| Video Format Converter (ke MP4) | Sangat berat untuk browser mobile | "Gunakan software desktop seperti Handbrake" |

---

## 3. PENAMBAHAN TECH STACK & DEPENDENCIES

```json
{
  "dependencies": {
    "@ffmpeg/ffmpeg": "^0.12.0",
    "@ffmpeg/util": "^0.12.0",
    "openpgp": "^5.11.0",
    "function-plot": "^1.24.0",
    "wavesurfer.js": "^7.7.0"
  }
}
```
**Catatan Kritis:** `@ffmpeg/ffmpeg` memiliki ukuran bundle yang besar (~25MB). **WAJIB** di-lazy load secara dinamis hanya ketika user membuka halaman Video/Audio tools, dan eksekusi harus dilakukan di dalam Web Worker agar tidak memblokir main thread.

---

## 4. TOOL SPECIFICATIONS (SCOPE EXPANSION)

### Kategori E: Audio Tools
1. **Audio Trimmer / Cutter** ⭐ (High Traffic)
   - **Input:** Upload file audio (MP3, WAV, OGG).
   - **UX Premium:** Visual waveform interaktif menggunakan `wavesurfer.js`. User bisa drag handle di awal dan akhir untuk memilih bagian yang dipotong.
   - **Output:** Download file audio yang sudah dipotong.
   - **Tech:** Web Audio API (untuk preview) + `ffmpeg.wasm` (untuk export final yang akurat).

2. **Video to MP3 (Extract Audio)** ⭐ (High Traffic)
   - **Input:** Upload file video (MP4, WebM, MOV).
   - **Controls:** Pilih kualitas audio (128kbps, 192kbps, 320kbps), format output (MP3, WAV).
   - **Output:** File audio hasil ekstraksi.
   - **Tech:** `ffmpeg.wasm` di Web Worker.

### Kategori F: Video Tools (Heavy Lifting)
3. **Video Compressor** ⭐ (High Traffic)
   - **Input:** Upload file video.
   - **Controls:** Target ukuran file (MB) atau preset kualitas (Low, Medium, High, Original), resolusi output (1080p, 720p, 480p).
   - **Output:** Video yang dikompres.
   - **Tech:** `ffmpeg.wasm` dengan codec `libx264` atau `libx265`.
   - **UX Premium:** Progress bar yang sangat detail ("Encoding frame 150/1000..."), estimasi waktu sisa.

4. **Video Trimmer**
   - **Input:** Upload video.
   - **UX Premium:** Thumbnail preview per detik, drag handle untuk start/end time.
   - **Output:** Video yang dipotong.
   - **Tech:** `ffmpeg.wasm` (stream copy untuk kecepatan maksimal jika tidak ada re-encoding).

### Kategori G: Productivity & Time
5. **Typing Speed Test**
   - **Input:** Teks acak (paragraphs) atau custom text.
   - **Processing:** Hitung WPM (Words Per Minute), CPM (Characters Per Minute), dan akurasi (%) secara real-time saat user mengetik.
   - **Output:** Dashboard hasil dengan chart performa per menit.
   - **Tech:** Native JS event listeners + `recharts`.

6. **Pomodoro Timer**
   - **Controls:** Customizable Work time (default 25m), Short Break (5m), Long Break (15m).
   - **Output:** Visual timer (circular progress), notifikasi suara/browser saat waktu habis.
   - **Tech:** `requestAnimationFrame` atau `setInterval` + Web Audio API untuk beep.

### Kategori H: Math & Science
7. **Graph Plotter**
   - **Input:** Fungsi matematika (misal: `x^2`, `sin(x)`, `x * cos(x)`).
   - **Controls:** Rentang sumbu X dan Y, zoom in/out, pan.
   - **Output:** Grafik 2D yang interaktif.
   - **Tech:** `function-plot` (ringan dan berbasis D3.js).

### Kategori I: Web & SEO Generators
8. **Meta Tag Generator**
   - **Input:** Judul, Deskripsi, URL, Gambar (OG Image), Author, Keywords.
   - **Output:** Kode HTML `<meta>` yang siap copy-paste, plus preview bagaimana tampilan link saat di-share di Facebook/Twitter/LinkedIn.
   - **Tech:** Native JS string interpolation.

9. **My IP Address & Info**
   - **Input:** Otomatis saat halaman dimuat.
   - **Output:** IP Address, ISP, Lokasi (Kota/Negara), Browser, OS, Resolusi Layar.
   - **Tech:** Fetch ke API gratis seperti `ipapi.co/json` atau `ipify.org`.

---

## 5. STEP-BY-STEP EXECUTION PHASES (FINAL)

### FASE 23: Audio & Video Tools (The WASM Challenge) - 2 Weeks
Fokus pada implementasi `ffmpeg.wasm` dengan manajemen memori dan lazy loading yang ketat.
- [ ] Setup `ffmpeg.wasm` di Web Worker dengan lazy loading.
- [ ] Implementasi **Video to MP3** (paling sederhana sebagai proof of concept).
- [ ] Implementasi **Audio Trimmer** (dengan `wavesurfer.js` untuk UX premium).
- [ ] Implementasi **Video Compressor** (dengan progress bar detail).
- [ ] Implementasi **Video Trimmer**.

### FASE 24: Productivity, Math & Web Generators (Quick Wins) - 1 Week
Fokus pada tools ringan yang menambah nilai guna harian.
- [ ] Implementasi **Typing Speed Test**.
- [ ] Implementasi **Pomodoro Timer** & **Stopwatch**.
- [ ] Implementasi **Random Generator** (Number, Color, Name).
- [ ] Implementasi **Scientific Calculator** & **Graph Plotter**.
- [ ] Implementasi **Meta Tag Generator**, **Robots.txt**, **Sitemap.xml**, **.htaccess** Generators.
- [ ] Implementasi **My IP Address & Info**.

### FASE 25: The "100 Tools" Milestone & Advanced Polish - 1 Week
- [ ] Audit total: Pastikan semua 100+ tools terdaftar di `tools-config.ts` dan searchable via Cmd+K.
- [ ] **Global Error Boundary:** Pastikan jika satu tool crash (misal karena kehabisan memori di ffmpeg), seluruh aplikasi Next.js tidak crash.
- [ ] **Memory Leak Check:** Pastikan semua Object URL di-revoke, dan Web Worker di-terminate setelah penggunaan.
- [ ] **Final Lighthouse Audit:** Target 100/100 di semua kategori untuk halaman landing dan tool populer.

---

## 6. STRATEGI PENGELOLAAN `ffmpeg.wasm` (Sangat Penting)

Karena `ffmpeg.wasm` berat dan membutuhkan `SharedArrayBuffer` (yang memerlukan header COOP/COEP), berikut aturan eksekusi ketat:

1. **Header Server:** Pastikan `next.config.js` atau middleware mengirimkan header:
   ```javascript
   headers: [
     { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
     { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
   ]
   ```
2. **Lazy Loading Ekstrem:** 
   ```typescript
   const FFmpegWorker = dynamic(() => import('@/lib/workers/ffmpeg.worker'), {
     ssr: false,
     loading: () => <p>Memuat engine video...</p>
   });
   ```
3. **Fallback UX:** Jika browser user tidak mendukung `SharedArrayBuffer` (misal beberapa versi Safari lama), tampilkan pesan yang sopan: 
   > "Browser Anda tidak mendukung pemrosesan video tingkat lanjut. Silakan gunakan Chrome/Edge terbaru, atau gunakan alternatif desktop seperti Handbrake."

---

## 7. METRIK KEBERHASILAN AKHIR (THE MASTER PLAN)

Setelah Fase 25 selesai, AIOTools akan menjadi:
- ✅ **100+ Tools** yang terdokumentasi dan fungsional.
- ✅ **Platform Multimedia Lengkap:** Image, PDF, Text, Code, Audio, Video.
- ✅ **100% Client-Side:** Privasi pengguna adalah fitur utama (USP).
- ✅ **Performant:** Lighthouse score >95, dengan lazy loading yang agresif.
- ✅ **Monetization-Ready:** Struktur kode sudah siap untuk menambahkan "Pro Features" atau non-intrusive ads di masa depan tanpa mengubah arsitektur.

---