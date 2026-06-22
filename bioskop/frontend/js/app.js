// ============================================
// KONFIGURASI GLOBAL
// ============================================
const BACKEND_URL = "http://127.0.0.1:8000";
let currentRegisterEmail = "";
let isForgotPasswordFlow = false;
let filmDipilih = "";
let filmIdDipilih = null;
let tanggalDipilih = "";
let jamDipilih = "";
let hargaDipilih = 35000;
let kursiTerpilih = [];
let selectedPaymentMethod = '';
let paymentTimerInterval = null;
let paymentTimeLeft = 30 * 60;

// ============================================
// AUTH MODULE
// ============================================
function openAuthModule(startSectionId) {
    document.getElementById('page-auth').classList.remove('hidden-wrapper');
    switchSection(startSectionId);
}

function closeAuthModule() {
    document.getElementById('page-auth').classList.add('hidden-wrapper');
}

function switchSection(sectionId) {
    document.querySelectorAll('.dynamic-section').forEach(section => {
        section.classList.remove('active');
    });
    
    if (sectionId === 'section-otp') {
        const otpBoxes = document.querySelectorAll('.otp-box');
        otpBoxes.forEach(box => { box.value = ""; });
        if (otpBoxes.length > 0) otpBoxes[0].focus();
    }

    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');
}

// ============================================
// FUNGSI LOGIN & REGISTER (PALING PENTING!)
// ============================================
async function handleLogin() {
    console.log('🔐 handleLogin dipanggil!');
    
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    console.log('Username:', username);
    
    if (!username || !password) {
        alert('⚠️ Username dan password harus diisi!');
        return;
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        console.log('Response:', data);
        
        if (response.ok && data.message && data.message.includes('berhasil')) {
            alert(`✅ Login berhasil!\nSelamat datang, ${data.username}`);
            
            localStorage.setItem('currentUser', JSON.stringify({
                username: data.username,
                email: data.email,
                user_id: data.user_id,
                name: data.username
            }));
            localStorage.setItem('loginTimestamp', Date.now().toString());
            
            document.getElementById('page-auth').classList.add('hidden-wrapper');
            checkLoginStatus();
        } else {
            alert(`❌ Login Gagal: ${data.detail || 'Username/password salah'}`);
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert(`❌ Server backend belum berjalan!\n\nPastikan sudah menjalankan:\npython main.py\n\nError: ${error.message}`);
    }
}

async function handleRegister() {
    console.log('📝 handleRegister dipanggil!');
    
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    
    if (!username || !email || !password) {
        alert('⚠️ Semua field harus diisi!');
        return;
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(`✅ ${data.message}`);
            currentRegisterEmail = data.email;
            isForgotPasswordFlow = false;
            document.getElementById('display-target-email').innerText = data.email;
            switchSection('section-otp');
        } else {
            alert(`❌ Gagal: ${data.detail}`);
        }
    } catch (error) {
        alert(`❌ Server backend belum berjalan!\n\nError: ${error.message}`);
    }
}

async function handleOtp() {
    const otpBoxes = document.querySelectorAll('.otp-box');
    let otpCode = "";
    otpBoxes.forEach(box => otpCode += box.value);
    
    if (otpCode.length !== 4) {
        alert('⚠️ Masukkan 4 digit kode OTP!');
        return;
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentRegisterEmail, otp_code: otpCode })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(`✅ ${data.message || 'Verifikasi berhasil!'}`);
            if (isForgotPasswordFlow) {
                switchSection('section-new-password');
            } else {
                switchSection('section-login');
            }
        } else {
            alert(`❌ Gagal: ${data.detail}`);
        }
    } catch (error) {
        alert('❌ Gagal verifikasi OTP!');
    }
}

// ============================================
// FUNGSI LUPA PASSWORD (YANG HILANG!)
// ============================================
async function handleForgotPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('forgot-email').value.trim();
    
    if (!email) {
        alert('⚠️ Email harus diisi!');
        return;
    }
    
    console.log('📧 Mengirim OTP ke:', email);
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(`✅ ${data.message || 'Kode OTP telah dikirim!'}\n\n⚠️ CEK TERMINAL BACKEND (Python) untuk melihat kode OTP!`);
            currentRegisterEmail = email;
            isForgotPasswordFlow = true;
            document.getElementById('display-target-email').innerText = email;
            switchSection('section-otp');
        } else {
            alert(`❌ Gagal: ${data.detail}`);
        }
    } catch (error) {
        alert(`❌ Server backend belum berjalan!\n\nError: ${error.message}`);
    }
}

// ============================================
// FETCH TANGGAL (FUNGSI YANG HILANG!)
// ============================================
async function fetchTodayDate() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/today-date`);
        if (!response.ok) throw new Error('Server error');
        const data = await response.json();
        return data.dates;
    } catch (error) {
        console.log('Backend belum jalan, pakai tanggal lokal');
        return getLocalDates();
    }
}

function getLocalDates() {
    const hariArr = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    const bulanArr = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        
        dates.push({
            day_offset: i,
            label: i === 0 ? 'HARI INI' : i === 1 ? 'BESOK' : `H+${i}`,
            day_name: hariArr[d.getDay()],
            date: d.getDate(),
            month: bulanArr[d.getMonth()],
            year: d.getFullYear(),
            full_date: `${d.getDate()} ${bulanArr[d.getMonth()]} ${d.getFullYear()}`,
            is_active: i <= 1
        });
    }
    return dates;
}

// ============================================
// NAVIGATION
// ============================================
async function bukaModulJadwal(movieTitle, posterUrl, status = 'now-playing', filmId = null) {
    console.log('=== MEMBUKA JADWAL ===', movieTitle, filmId, status);
    
    filmDipilih = movieTitle;
    filmIdDipilih = filmId;
    
    const titleEl = document.getElementById('detail-title');
    const posterEl = document.getElementById('detail-poster');
    
    if (titleEl) titleEl.innerText = movieTitle;
    if (posterEl && posterUrl) posterEl.src = posterUrl;
    
    ['page-home', 'page-riwayat', 'page-data-diri', 'page-e-ticket', 
     'page-pembayaran', 'page-kursi', 'page-timeout'].forEach(pageId => {
        const page = document.getElementById(pageId);
        if (page) page.classList.add('hidden');
    });
    
    const jadwalPage = document.getElementById('page-jadwal');
    if (jadwalPage) jadwalPage.classList.remove('hidden');
    
    if (status === 'upcoming') {
        document.getElementById('container-tanggal').innerHTML = `
            <div class="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-8 text-center text-white col-span-full">
                <div class="text-5xl mb-4">🎬</div>
                <h3 class="text-2xl font-black mb-3">COMING SOON</h3>
                <p>Film "${movieTitle}" belum tayang</p>
            </div>
        `;
        document.getElementById('container-jam').innerHTML = '';
        document.getElementById('selectedLabel').innerText = 'Belum ada jadwal';
        document.getElementById('btn-pilih-kursi').disabled = true;
    } else {
        if (filmId) {
            await loadFilmDetails(filmId);
        } else {
            resetFilmDetails();
        }
        await renderJadwalKomponen(filmId);
    }
    
    window.scrollTo(0, 0);
}

async function loadFilmDetails(filmId) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/films/${filmId}`);
        const data = await response.json();
        
        if (data.film) {
            const film = data.film;
            document.getElementById('detail-title').innerText = film.judul;
            document.getElementById('detail-poster').src = film.poster_url || 'https://placehold.co/300x450/1e293b/fff?text=Poster';
            document.getElementById('detail-sinopsis').innerText = film.deskripsi || 'Sinopsis belum tersedia';
            document.getElementById('detail-durasi').innerText = `${film.durasi || 0} menit`;
            document.getElementById('detail-rating').innerText = film.rating || 'R';
            document.getElementById('detail-genre').innerText = film.genre || 'Umum';
            document.getElementById('detail-bahasa').innerText = film.bahasa || 'Indonesia';
            document.getElementById('detail-aktor').innerText = film.aktor || 'Aktor belum tersedia';
        }
    } catch (error) {
        console.error('Error loading film:', error);
        resetFilmDetails();
    }
}

function resetFilmDetails() {
    document.getElementById('detail-sinopsis').innerText = 'Sinopsis belum tersedia';
    document.getElementById('detail-durasi').innerText = '0 menit';
    document.getElementById('detail-rating').innerText = 'R';
    document.getElementById('detail-genre').innerText = 'Umum';
    document.getElementById('detail-bahasa').innerText = 'Indonesia';
    document.getElementById('detail-aktor').innerText = 'Aktor belum tersedia';
}

async function renderJadwalKomponen(filmId = null) {
    const containerTgl = document.getElementById('container-tanggal');
    const containerJam = document.getElementById('container-jam');
    
    containerTgl.innerHTML = '<p class="text-sm text-slate-500">Memuat tanggal...</p>';
    containerJam.innerHTML = '';
    tanggalDipilih = "";
    jamDipilih = "";
    document.getElementById('btn-pilih-kursi').disabled = true;
    document.getElementById('selectedLabel').innerText = "Belum memilih jadwal";

    const dates = await fetchTodayDate();
    containerTgl.innerHTML = '';
    
    dates.forEach(dateData => {
        if (dateData.is_active) {
            containerTgl.innerHTML += `
                <div class="date-btn" onclick="pilihTanggal(this, '${dateData.full_date}', ${filmId})">
                    <p class="text-[8px] font-bold text-slate-500">${dateData.label}</p>
                    <p class="text-[9px] font-bold text-slate-400">${dateData.day_name}</p>
                    <p class="text-sm font-black">${dateData.date}</p>
                    <p class="text-[9px] font-bold text-sky-600">${dateData.month}</p>
                </div>
            `;
        } else {
            containerTgl.innerHTML += `
                <div class="date-btn disabled opacity-30 cursor-not-allowed bg-slate-100">
                    <p class="text-[8px] font-bold text-slate-400">${dateData.label}</p>
                    <p class="text-[9px] font-bold text-slate-400">${dateData.day_name}</p>
                    <p class="text-sm font-black text-slate-400">${dateData.date}</p>
                    <p class="text-[9px] font-bold text-slate-400">${dateData.month}</p>
                </div>
            `;
        }
    });
}

async function pilihTanggal(element, tanggal, filmId = null) {
    const containerJam = document.getElementById('container-jam');
    
    document.querySelectorAll('.date-grid .date-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    tanggalDipilih = tanggal;
    jamDipilih = "";

    if (filmId) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/jadwal/${filmId}/${encodeURIComponent(tanggal)}`);
            const data = await response.json();
            const jadwalList = data.jadwal || [];
            
            if (jadwalList.length > 0) {
                containerJam.innerHTML = '';
                jadwalList.forEach(jadwal => {
                    containerJam.innerHTML += `
                        <div class="time-btn" onclick="pilihJam(this, '${jadwal.jam}', ${jadwal.harga})">
                            ${jadwal.jam}<br>
                            <span class="text-[9px] text-sky-600 font-bold">${jadwal.studio}</span>
                        </div>
                    `;
                });
            } else {
                containerJam.innerHTML = '<p class="text-sm text-slate-400 text-center">Tidak ada jadwal</p>';
            }
        } catch (error) {
            containerJam.innerHTML = '<p class="text-sm text-red-400">Gagal memuat jadwal</p>';
        }
    } else {
        containerJam.innerHTML = '';
        ['10:30', '13:15', '15:50', '18:45', '21:30'].forEach(jam => {
            containerJam.innerHTML += `<div class="time-btn" onclick="pilihJam(this, '${jam}', 35000)">${jam}</div>`;
        });
    }

    updateLabelStatusJadwal();
}

function pilihJam(element, jam, harga = 35000) {
    if (jamDipilih === jam) {
        element.classList.remove('active');
        jamDipilih = "";
        hargaDipilih = 35000;
        updateLabelStatusJadwal();
        return;
    }

    document.querySelectorAll('.time-grid .time-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    jamDipilih = jam;
    hargaDipilih = harga;
    updateLabelStatusJadwal();
}

function updateLabelStatusJadwal() {
    const label = document.getElementById('selectedLabel');
    const btn = document.getElementById('btn-pilih-kursi');

    if (tanggalDipilih && jamDipilih) {
        label.innerText = `${tanggalDipilih}, Pukul ${jamDipilih}`;
        btn.disabled = false;
    } else if (tanggalDipilih) {
        label.innerText = `${tanggalDipilih} (Pilih jam)`;
        btn.disabled = true;
    } else {
        label.innerText = "Belum memilih jadwal";
        btn.disabled = true;
    }
}

function bukaModulKursi() {
    const currentUser = localStorage.getItem('currentUser');
    
    if (!currentUser) {
        if (confirm('⚠️ Anda harus login terlebih dahulu.\n\nKlik OK untuk login.')) {
            openAuthModule('section-login');
        }
        return;
    }
    
    if (!tanggalDipilih || !jamDipilih) {
        alert('Pilih tanggal dan jam dulu!');
        return;
    }
    
    document.getElementById('page-jadwal').classList.add('hidden');
    document.getElementById('page-kursi').classList.remove('hidden');
    renderPetaKursi();
    window.scrollTo(0, 0);
}

function bukaModulKonfirmasi() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        alert('⚠️ Login dulu!');
        openAuthModule('section-login');
        return;
    }
    
    if (kursiTerpilih.length === 0) {
        alert('Pilih kursi dulu!');
        return;
    }
    
    document.getElementById('page-kursi').classList.add('hidden');
    document.getElementById('page-pembayaran').classList.remove('hidden');
    populatePaymentInfo();
    startPaymentTimer();
    window.scrollTo(0, 0);
}

function kembaliKeHome() {
    stopPaymentTimer();
    ['page-jadwal', 'page-kursi', 'page-riwayat', 'page-data-diri', 
     'page-e-ticket', 'page-pembayaran', 'page-timeout'].forEach(pageId => {
        const page = document.getElementById(pageId);
        if (page) page.classList.add('hidden');
    });
    const homePage = document.getElementById('page-home');
    if (homePage) homePage.classList.remove('hidden');
    window.scrollTo(0, 0);
}

function kembaliKeJadwal() {
    stopPaymentTimer();
    document.getElementById('page-kursi').classList.add('hidden');
    document.getElementById('page-pembayaran').classList.add('hidden');
    document.getElementById('page-e-ticket').classList.add('hidden');
    document.getElementById('page-jadwal').classList.remove('hidden');
    window.scrollTo(0, 0);
}

// ============================================
// TIMER
// ============================================
function startPaymentTimer() {
    const timerElement = document.getElementById('payment-timer');
    if (!timerElement) return;
    
    paymentTimeLeft = 30 * 60;
    if (paymentTimerInterval) clearInterval(paymentTimerInterval);
    updateTimerDisplay(timerElement, paymentTimeLeft);
    
    paymentTimerInterval = setInterval(() => {
        paymentTimeLeft--;
        if (paymentTimeLeft <= 0) {
            clearInterval(paymentTimerInterval);
            timerElement.textContent = "00:00";
            showTimeoutPage();
        } else {
            updateTimerDisplay(timerElement, paymentTimeLeft);
            if (paymentTimeLeft <= 300) {
                timerElement.parentElement.classList.remove('bg-white/10');
                timerElement.parentElement.classList.add('bg-red-500');
                timerElement.classList.add('animate-pulse');
            }
        }
    }, 1000);
}

function showTimeoutPage() {
    stopPaymentTimer();
    ['page-home', 'page-jadwal', 'page-kursi', 'page-pembayaran', 
     'page-e-ticket', 'page-riwayat', 'page-data-diri'].forEach(pageId => {
        const page = document.getElementById(pageId);
        if (page) page.classList.add('hidden');
    });
    document.getElementById('page-timeout').classList.remove('hidden');
    window.scrollTo(0, 0);
}

function updateTimerDisplay(element, seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    element.textContent = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function stopPaymentTimer() {
    if (paymentTimerInterval) {
        clearInterval(paymentTimerInterval);
        paymentTimerInterval = null;
    }
}

// ============================================
// FETCH MOVIES
// ============================================
async function fetchMovies() {
    const mockMovies = [
        { judul: "Sekawan Limo", status_tayang: "Tayang", poster_url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300" },
        { judul: "Ipar Adalah Maut", status_tayang: "Tayang", poster_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300" },
        { judul: "Badarawuhi", status_tayang: "Tayang", poster_url: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=300" },
        { judul: "Tumbal Proyek", status_tayang: "Tayang", poster_url: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=300" },
        { judul: "Badut Gendong", status_tayang: "Tayang", poster_url: "https://images.unsplash.com/photo-1509347528160-9a9e33742cd4?w=300" },
        { judul: "Inside Out 2", status_tayang: "Segera", poster_url: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=300" },
        { judul: "Despicable Me 4", status_tayang: "Segera", poster_url: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=300" }
    ];
    
    const nowPlayingBanner = document.getElementById('now-playing-banner');
    const comingSoonBanner = document.getElementById('coming-soon-banner');
    const trendingMovies = document.getElementById('trending-movies');
    const upcomingMovies = document.getElementById('upcoming-movies');
    
    if (nowPlayingBanner) nowPlayingBanner.innerHTML = '';
    if (comingSoonBanner) comingSoonBanner.innerHTML = '';
    if (trendingMovies) trendingMovies.innerHTML = '';
    if (upcomingMovies) upcomingMovies.innerHTML = '';
    
    const nowPlaying = mockMovies.filter(m => m.status_tayang === 'Tayang');
    const upcoming = mockMovies.filter(m => m.status_tayang === 'Segera');
    
    // ✅ BANNER NOW PLAYING - GRID 3 POSTER
    if (nowPlayingBanner) {
        // Ambil 3 film pertama saja
        nowPlaying.slice(0, 3).forEach(m => {
            nowPlayingBanner.innerHTML += `
                <div class="banner-item flex flex-col space-y-1.5 text-center group cursor-pointer" 
                     onclick="bukaModulJadwal('${m.judul}', '${m.poster_url}', 'now-playing')">
                    <div class="poster-container">
                        <img src="${m.poster_url}" 
                             class="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                             onerror="this.src='https://placehold.co/300x450/1e293b/0ea5e9?text=${encodeURIComponent(m.judul)}'">
                    </div>
                    <p class="truncate">${m.judul}</p>
                </div>
            `;
        });
    }
    
    // ✅ BANNER COMING SOON - GRID 3 POSTER
    if (comingSoonBanner) {
        // Ambil 3 film pertama saja
        upcoming.slice(0, 3).forEach(m => {
            comingSoonBanner.innerHTML += `
                <div class="banner-item flex flex-col space-y-1.5 text-center group cursor-pointer" 
                     onclick="bukaModulJadwal('${m.judul}', '${m.poster_url}', 'upcoming')">
                    <div class="poster-container">
                        <img src="${m.poster_url}" 
                             class="w-full h-full object-cover group-hover:scale-110 transition duration-500 opacity-90"
                             onerror="this.src='https://placehold.co/300x450/1e293b/0ea5e9?text=${encodeURIComponent(m.judul)}'">
                        <div class="badge-segera">SEGERA</div>
                    </div>
                    <p class="truncate">${m.judul}</p>
                </div>
            `;
        });
    }
    
    // ✅ TRENDING MOVIES
    if (trendingMovies) {
        nowPlaying.forEach(m => {
            trendingMovies.innerHTML += `
                <div onclick="bukaModulJadwal('${m.judul}', '${m.poster_url}', 'now-playing')" 
                     class="flex flex-col space-y-2 group cursor-pointer">
                    <div class="w-full aspect-[2/3] bg-slate-800 rounded-md overflow-hidden shadow-sm border border-slate-300/50">
                        <img src="${m.poster_url}" 
                             class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                             onerror="this.src='https://placehold.co/300x450/1e293b/fff?text=Poster'">
                    </div>
                    <h4 class="font-bold text-[11px] text-slate-700 uppercase truncate px-1">${m.judul}</h4>
                </div>
            `;
        });
    }
    
    // ✅ UPCOMING MOVIES
    if (upcomingMovies) {
        upcoming.forEach(m => {
            upcomingMovies.innerHTML += `
                <div onclick="bukaModulJadwal('${m.judul}', '${m.poster_url}', 'upcoming')" 
                     class="flex flex-col space-y-2 group cursor-pointer">
                    <div class="w-full aspect-[2/3] bg-slate-800 rounded-md overflow-hidden shadow-sm border border-slate-300/50 relative">
                        <img src="${m.poster_url}" 
                             class="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-80"
                             onerror="this.src='https://placehold.co/300x450/1e293b/fff?text=Coming+Soon'">
                        <div class="absolute top-2 right-2">
                            <span class="bg-black/70 text-white text-[8px] font-bold px-2 py-1 rounded">SEGERA</span>
                        </div>
                    </div>
                    <h4 class="font-bold text-[11px] text-slate-700 uppercase truncate px-1">${m.judul}</h4>
                </div>
            `;
        });
    }
}
// ============================================
// KURSI
// ============================================
function renderPetaKursi() {
    const seatMap = document.getElementById('seatMap');
    if (!seatMap) return;
    
    seatMap.innerHTML = '';
    kursiTerpilih = [];
    document.getElementById('selectedSeatsLabel').textContent = 'Belum memilih kursi';

    const rows = ['A', 'B', 'C', 'D', 'E'];
    const occupied = ['A2', 'B2', 'B7', 'C1', 'C4', 'E2'];
    
    rows.forEach(row => {
        for (let i = 1; i <= 13; i++) {
            if (i === 3 || i === 11) {
                seatMap.innerHTML += `<div class="w-[32px] h-[44px]"></div>`;
                continue;
            }
            let num = i;
            if (i > 3) num = i - 1;
            if (i > 11) num = i - 2;
            const seatId = `${row}${num}`;
            const isOcc = occupied.includes(seatId);
            
            if (isOcc) {
                seatMap.innerHTML += `<div class="seat occupied bg-slate-200 text-slate-400 opacity-60 flex items-center justify-center w-[44px] h-[44px] border border-slate-200 rounded-sm text-[11px] font-bold cursor-not-allowed">${seatId}</div>`;
            } else {
                seatMap.innerHTML += `<div class="seat bg-slate-50 border border-slate-300 text-slate-700 cursor-pointer hover:bg-slate-200 flex items-center justify-center w-[44px] h-[44px] border rounded-sm text-[11px] font-bold" onclick="pilihKursi(this, '${seatId}')">${seatId}</div>`;
            }
        }
    });
    updateBottomBar();
}

function pilihKursi(el, id) {
    const idx = kursiTerpilih.indexOf(id);
    if (idx > -1) {
        kursiTerpilih.splice(idx, 1);
        el.className = "seat bg-slate-50 border border-slate-300 text-slate-700 cursor-pointer hover:bg-slate-200 flex items-center justify-center w-[44px] h-[44px] border rounded-sm text-[11px] font-bold";
    } else {
        kursiTerpilih.push(id);
        el.className = "seat bg-blue-600 text-white flex items-center justify-center w-[44px] h-[44px] border border-blue-600 rounded-sm text-[11px] font-bold cursor-pointer";
    }
    kursiTerpilih.sort();
    updateBottomBar();
}

function updateBottomBar() {
    const el = document.getElementById('selectedSeatsLabel');
    const btn = document.getElementById('btn-konfirmasi-tiket');
    if (el) el.innerText = kursiTerpilih.length > 0 ? kursiTerpilih.join(', ') : 'Belum memilih kursi';
    if (btn) {
        if (kursiTerpilih.length > 0) {
            btn.disabled = false;
            btn.className = "bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-4 py-2 rounded-sm transition uppercase cursor-pointer";
        } else {
            btn.disabled = true;
            btn.className = "bg-slate-900 text-white text-[11px] font-bold px-4 py-2 rounded-sm transition uppercase opacity-40 cursor-not-allowed";
        }
    }
}

// ============================================
// USER PROFILE
// ============================================
function checkLoginStatus() {
    const currentUser = localStorage.getItem('currentUser');
    const btnLogin = document.getElementById('btn-login-nav');
    const userProfile = document.getElementById('user-profile-menu');
    
    if (currentUser) {
        const userData = JSON.parse(currentUser);
        if (btnLogin) btnLogin.classList.add('hidden');
        if (userProfile) {
            userProfile.classList.remove('hidden');
            const nameEl = document.getElementById('user-name-dropdown');
            const emailEl = document.getElementById('user-email-dropdown');
            const dataUsername = document.getElementById('data-username');
            const dataEmail = document.getElementById('data-email');
            
            if (nameEl) nameEl.textContent = userData.username || 'User';
            if (emailEl) emailEl.textContent = userData.email || '';
            if (dataUsername) dataUsername.textContent = userData.username || '';
            if (dataEmail) dataEmail.textContent = userData.email || '';
            
            document.getElementById('user-avatar').src = 
                `https://ui-avatars.com/api/?name=${userData.username}&background=0ea5e9&color=fff&size=40`;
        }
    } else {
        if (btnLogin) btnLogin.classList.remove('hidden');
        if (userProfile) userProfile.classList.add('hidden');
    }
}

function toggleUserMenu() {
    document.getElementById('user-dropdown').classList.toggle('hidden');
}

function showRiwayat() {
    toggleUserMenu();
    ['page-home', 'page-jadwal', 'page-kursi', 'page-data-diri', 
     'page-e-ticket', 'page-pembayaran'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    document.getElementById('page-riwayat').classList.remove('hidden');
    loadRiwayat();
    window.scrollTo(0, 0);
}

function showDataDiri() {
    toggleUserMenu();
    ['page-home', 'page-jadwal', 'page-kursi', 'page-riwayat', 
     'page-e-ticket', 'page-pembayaran'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    document.getElementById('page-data-diri').classList.remove('hidden');
    window.scrollTo(0, 0);
}

async function loadRiwayat() {
    const riwayatList = document.getElementById('riwayat-list');
    const riwayatEmpty = document.getElementById('riwayat-empty');
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser || !currentUser.user_id) {
        riwayatEmpty.classList.remove('hidden');
        riwayatList.innerHTML = '';
        return;
    }
    
    riwayatList.innerHTML = '<p class="text-center text-slate-500">Memuat riwayat...</p>';
    
    // ✅ BACA DARI LOCALSTORAGE
    const bookings = JSON.parse(localStorage.getItem(`bookings_${currentUser.user_id}`) || '[]');
    
    if (bookings.length === 0) {
        riwayatEmpty.classList.remove('hidden');
        riwayatList.innerHTML = '';
    } else {
        riwayatEmpty.classList.add('hidden');
        riwayatList.innerHTML = '';
        
        bookings.forEach((ticket, index) => {
            riwayatList.innerHTML += `
                <div class="bg-white rounded-lg shadow-md overflow-hidden border border-slate-200 hover:shadow-lg transition">
                    <div class="flex flex-col md:flex-row">
                        <!-- Poster -->
                        <div class="md:w-1/4 flex-shrink-0">
                            <img src="${ticket.poster}" alt="${ticket.title}" 
                                 class="w-full h-48 md:h-full object-cover"
                                 onerror="this.src='https://placehold.co/300x450/1e293b/fff?text=Poster'">
                        </div>
                        
                        <!-- Info Tiket -->
                        <div class="flex-1 p-4 md:p-6">
                            <div class="flex justify-between items-start mb-3">
                                <div>
                                    <h3 class="text-lg font-bold text-slate-800 mb-1">${ticket.title}</h3>
                                    <p class="text-xs text-slate-500">Order ID: ${ticket.order_id}</p>
                                </div>
                                <span class="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                                    ✓ Terkonfirmasi
                                </span>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-3 mb-4">
                                <div>
                                    <p class="text-[10px] text-slate-500 uppercase font-bold mb-1">📅 Tanggal</p>
                                    <p class="text-sm font-bold text-slate-800">${ticket.tanggal}</p>
                                </div>
                                <div>
                                    <p class="text-[10px] text-slate-500 uppercase font-bold mb-1">🕐 Waktu</p>
                                    <p class="text-sm font-bold text-slate-800">${ticket.jam}</p>
                                </div>
                                <div>
                                    <p class="text-[10px] text-slate-500 uppercase font-bold mb-1"> Studio</p>
                                    <p class="text-sm font-bold text-slate-800">${ticket.hall || 'STUDIO 01'}</p>
                                </div>
                                <div>
                                    <p class="text-[10px] text-slate-500 uppercase font-bold mb-1">💺 Kursi</p>
                                    <p class="text-sm font-bold text-sky-600">${ticket.kursi}</p>
                                </div>
                            </div>
                            
                            <!-- Tombol Download -->
                            <div class="flex gap-2 pt-3 border-t border-slate-200">
                                <button onclick="downloadRiwayatTicket(${index})" 
                                        class="flex-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                    </svg>
                                    DOWNLOAD E-TIKET
                                </button>
                                <button onclick="viewTicketDetail(${index})" 
                                        class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                    DETAIL
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    }
}
// ============================================
// ✅ FUNGSI DOWNLOAD TIKET DARI RIWAYAT
// ============================================
function downloadRiwayatTicket(index) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser || !currentUser.user_id) {
        alert('❌ User tidak ditemukan!');
        return;
    }
    
    // Ambil data tiket dari localStorage atau fetch ulang
    const bookings = JSON.parse(localStorage.getItem(`bookings_${currentUser.user_id}`) || '[]');
    const ticket = bookings[index];
    
    if (!ticket) {
        alert('❌ Data tiket tidak ditemukan!');
        return;
    }
    
    // Buat elemen HTML untuk PDF
    const ticketHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); padding: 20px; border-radius: 10px 10px 0 0; color: white;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h1 style="margin: 0; font-size: 24px;">🎬 BIOSKOP 7</h1>
                        <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.9;">E-TICKET CONFIRMATION</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 0; font-size: 10px; opacity: 0.8;">Order ID</p>
                        <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: bold;">${ticket.order_id}</p>
                    </div>
                </div>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px; background: white; border: 1px solid #e2e8f0;">
                <div style="display: flex; gap: 30px;">
                    <!-- Left: Info -->
                    <div style="flex: 1;">
                        <div style="margin-bottom: 20px;">
                            <p style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; margin: 0 0 5px 0;">JUDUL FILM</p>
                            <h2 style="margin: 0; font-size: 20px; color: #1e293b;">${ticket.title}</h2>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                            <div>
                                <p style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; margin: 0 0 5px 0;">📅 Tanggal</p>
                                <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1e293b;">${ticket.tanggal}</p>
                            </div>
                            <div>
                                <p style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; margin: 0 0 5px 0;">🕐 Waktu</p>
                                <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1e293b;">${ticket.jam}</p>
                            </div>
                            <div>
                                <p style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; margin: 0 0 5px 0;"> Studio</p>
                                <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1e293b;">${ticket.hall || 'STUDIO 01'}</p>
                            </div>
                            <div>
                                <p style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; margin: 0 0 5px 0;">💺 Kursi</p>
                                <p style="margin: 0; font-size: 14px; font-weight: bold; color: #0ea5e9;">${ticket.kursi}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Right: QR Code -->
                    <div style="width: 150px; text-align: center;">
                        <div style="background: white; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px; margin-bottom: 10px;">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`BIOSKOP7|${ticket.title}|${ticket.tanggal}|${ticket.jam}|${ticket.kursi}|${ticket.order_id}`)}" 
                                 style="width: 120px; height: 120px;">
                        </div>
                        <p style="font-size: 9px; color: #64748b; margin: 0;">Scan QR Code ini di bioskop</p>
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fafc; padding: 15px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0; border-top: none;">
                <p style="font-size: 10px; color: #64748b; margin: 0;">
                    💡 Tunjukkan kode QR ini kepada petugas bioskop atau gunakan kios mandiri untuk mencetak tiket fisik.
                </p>
            </div>
        </div>
    `;
    
    // Buat elemen temporary untuk PDF
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = ticketHTML;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);
    
    // Generate PDF
    const opt = {
        margin: [10, 10, 10, 10],
        filename: `E-Ticket-${ticket.order_id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(tempDiv).save().then(() => {
        document.body.removeChild(tempDiv);
    }).catch(err => {
        console.error('Error:', err);
        document.body.removeChild(tempDiv);
        alert('❌ Gagal membuat PDF!');
    });
}

// ============================================
// ✅ FUNGSI VIEW DETAIL TIKET
// ============================================
function viewTicketDetail(index) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const bookings = JSON.parse(localStorage.getItem(`bookings_${currentUser.user_id}`) || '[]');
    const ticket = bookings[index];
    
    if (!ticket) {
        alert('❌ Data tiket tidak ditemukan!');
        return;
    }
    
    // Tampilkan detail di modal atau alert
    const detail = `
🎬 ${ticket.title}

📅 Tanggal: ${ticket.tanggal}
🕐 Waktu: ${ticket.jam}
🎬 Studio: ${ticket.hall || 'STUDIO 01'}
💺 Kursi: ${ticket.kursi}

🎫 Order ID: ${ticket.order_id}
    `;
    
    alert(detail);
}

function logout() {
    if (confirm('Yakin ingin logout?')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('loginTimestamp');
        checkLoginStatus();
        kembaliKeHome();
    }
}

// ============================================
// PEMBAYARAN
// ============================================
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    document.getElementById('payment-method-selection').classList.add('hidden');
    
    if (method === 'qris') {
        document.getElementById('qris-detail').classList.remove('hidden');
        document.getElementById('bank-detail').classList.add('hidden');
        const qrData = `BIOSKOP7|${filmDipilih}|${tanggalDipilih}|${jamDipilih}|${kursiTerpilih.join(',')}`;
        document.getElementById('qris-code').src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
    } else {
        document.getElementById('qris-detail').classList.add('hidden');
        document.getElementById('bank-detail').classList.remove('hidden');
        document.getElementById('bank-transfer-amount').textContent = 'Rp. ' + (kursiTerpilih.length * hargaDipilih).toLocaleString('id-ID');
    }
}

function backToPaymentMethod() {
    document.getElementById('qris-detail').classList.add('hidden');
    document.getElementById('bank-detail').classList.add('hidden');
    document.getElementById('payment-method-selection').classList.remove('hidden');
}

function selectBank(name) {
    document.querySelectorAll('#bank-detail .border-2').forEach(el => {
        el.classList.remove('border-sky-500', 'bg-sky-50');
        el.classList.add('border-slate-200');
    });
    event.currentTarget.classList.remove('border-slate-200');
    event.currentTarget.classList.add('border-sky-500', 'bg-sky-50');
    
    const nums = { 'mandiri': '1234567890', 'bca': '9876543210', 'bni': '5555666677', 'bri': '1111222233' };
    document.getElementById('bank-account-number').textContent = nums[name] || '1234567890';
    document.getElementById('bank-transfer-info').classList.remove('hidden');
}

async function confirmPayment(method) {
    stopPaymentTimer();
    if (!confirm('Konfirmasi pembayaran sudah dilakukan?')) {
        startPaymentTimer();
        return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.user_id) {
        alert('Login dulu!');
        return;
    }
    
    const orderId = 'B7-' + Date.now().toString().slice(-6);
    
    try {
        const res = await fetch(`${BACKEND_URL}/api/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_id: orderId,
                user_id: currentUser.user_id,
                film_title: filmDipilih,
                film_poster: document.getElementById('detail-poster').src,
                tanggal: tanggalDipilih,
                jam: jamDipilih,
                seats: kursiTerpilih,
                total_price: kursiTerpilih.length * hargaDipilih,
                payment_method: method
            })
        });
        const data = await res.json();
        
        if (res.ok) {
            // ✅ SIMPAN KE LOCALSTORAGE UNTUK RIWAYAT
            const bookingData = {
                order_id: orderId,
                title: filmDipilih,
                poster: document.getElementById('detail-poster').src,
                tanggal: tanggalDipilih,
                jam: jamDipilih,
                kursi: kursiTerpilih.join(', '),
                hall: 'STUDIO 01',
                total_price: kursiTerpilih.length * hargaDipilih,
                payment_method: method,
                created_at: new Date().toISOString()
            };
            
            // Ambil bookings yang sudah ada
            const existingBookings = JSON.parse(localStorage.getItem(`bookings_${currentUser.user_id}`) || '[]');
            existingBookings.push(bookingData);
            
            // Simpan kembali
            localStorage.setItem(`bookings_${currentUser.user_id}`, JSON.stringify(existingBookings));
            
            // Tampilkan e-ticket
            showETicketPage(bookingData);
        } else {
            alert('Gagal: ' + data.detail);
        }
    } catch (err) {
        alert('Error koneksi server!');
    }
}
function populatePaymentInfo() {
    document.getElementById('summary-date').textContent = tanggalDipilih;
    document.getElementById('summary-time').textContent = jamDipilih + ' WIB';
    document.getElementById('summary-film').textContent = filmDipilih;
    document.getElementById('summary-seats').textContent = kursiTerpilih.join(', ');
    document.getElementById('summary-total').textContent = 'Rp. ' + (kursiTerpilih.length * hargaDipilih).toLocaleString('id-ID');
}

function showETicketPage(ticket) {
    stopPaymentTimer();
    ['page-home', 'page-jadwal', 'page-kursi', 'page-riwayat', 
     'page-data-diri', 'page-pembayaran'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    document.getElementById('page-e-ticket').classList.remove('hidden');
    
    document.getElementById('eticket-title').textContent = ticket.title;
    document.getElementById('eticket-date').textContent = ticket.tanggal;
    document.getElementById('eticket-time').textContent = ticket.jam + ' WIB';
    document.getElementById('eticket-seats').textContent = ticket.kursi;
    document.getElementById('eticket-hall').textContent = ticket.hall;
    document.getElementById('eticket-orderid').textContent = ticket.orderId;
    
    const qrData = `BIOSKOP7|${ticket.title}|${ticket.tanggal}|${ticket.jam}|${ticket.kursi}|${ticket.orderId}`;
    document.getElementById('eticket-qrcode').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
    window.scrollTo(0, 0);
}

// ============================================
// BANNER SLIDER
// ============================================
let currentSlide = 0;
let slideInterval;

function initBannerSlider() {
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(() => {
        const slides = document.querySelectorAll('.banner-slide');
        const dots = document.querySelectorAll('.slide-dot');
        if (slides.length === 0) return;
        slides[currentSlide].classList.remove('active');
        if (dots[currentSlide]) dots[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
        if (dots[currentSlide]) dots[currentSlide].classList.add('active');
    }, 5000);
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.slide-dot');
    slides[currentSlide].classList.remove('active');
    if (dots[currentSlide]) dots[currentSlide].classList.remove('active');
    currentSlide = index;
    slides[currentSlide].classList.add('active');
    if (dots[currentSlide]) dots[currentSlide].classList.add('active');
}

// ============================================
// ✅ FUNGSI DOWNLOAD E-TIKET PDF
// ============================================
function downloadETicket() {
    // Ambil elemen e-ticket yang mau di-download
    const ticketElement = document.querySelector('#page-e-ticket .bg-white.rounded-lg');
    
    if (!ticketElement) {
        alert('❌ E-ticket tidak ditemukan!');
        return;
    }
    
    // Konfigurasi PDF
    const opt = {
        margin:       [10, 10, 10, 10],  // margin: [top, left, bottom, right]
        filename:     `E-Ticket-${document.getElementById('eticket-orderid').textContent}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Tampilkan loading
    const btn = event.target.closest('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ Membuat PDF...';
    btn.disabled = true;
    
    // Generate PDF
    html2pdf().set(opt).from(ticketElement).save().then(() => {
        // Kembalikan tombol ke keadaan semula
        btn.innerHTML = originalText;
        btn.disabled = false;
    }).catch(err => {
        console.error('Error generating PDF:', err);
        alert('❌ Gagal membuat PDF. Silakan coba lagi.');
        btn.innerHTML = originalText;
        btn.disabled = false;
    });
}
// ============================================
// INITIALIZATION - PALING PENTING!
// ============================================
window.addEventListener('load', function() {
    console.log('✅ Page loaded!');
    
    // Cek backend
    fetch(`${BACKEND_URL}/`)
        .then(res => res.json())
        .then(data => console.log('✅ Backend:', data))
        .catch(err => console.error('❌ Backend TIDAK TERHUBUNG! Jalankan: python main.py'));
    
    // Init
    fetchMovies();
    initBannerSlider();
    checkLoginStatus();

        // ✅ TAMBAHKAN INI: Setup form-forgot handler
    const forgotForm = document.getElementById('form-forgot');
    if (forgotForm) {
        forgotForm.addEventListener('submit', handleForgotPassword);
        console.log('✅ Form Lupa Password sudah terhubung!');
    }
    
    // Setup OTP auto-focus
    const otpBoxes = document.querySelectorAll('.otp-box');
    otpBoxes.forEach((box, index) => {
        box.addEventListener('input', () => {
            if (box.value.length === 1 && index < otpBoxes.length - 1) {
                otpBoxes[index + 1].focus();
            }
        });
        box.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && box.value.length === 0 && index > 0) {
                otpBoxes[index - 1].focus();
            }
        });
    });
    
    // Close dropdown on outside click
    document.addEventListener('click', function(e) {
        const userProfile = document.getElementById('user-profile-menu');
        const dropdown = document.getElementById('user-dropdown');
        if (userProfile && dropdown && !userProfile.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
    
    console.log('✅ App initialized!');
});

