const BACKEND_URL = "http://127.0.0.1:8000"; 
let currentRegisterEmail = "";
let isForgotPasswordFlow = false; 
let filmDipilih = "";
let tanggalDipilih = "";
let jamDipilih = "";
let kursiTerpilih = [];
const HARGA_PER_KURSI = 35000;

// ============================================
// TIMER PEMBAYARAN
// ============================================
let selectedPaymentMethod = '';
let paymentTimerInterval = null;
let paymentTimeLeft = 30 * 60; // 30 menit

// ============================================
// AUTH FUNCTIONS
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

    document.getElementById(sectionId).classList.add('active');
}

// ============================================
// NAVIGATION FUNCTIONS (LENGKAP!)
// ============================================

// FUNGSI UTAMA: Buka halaman jadwal dari poster film
function bukaModulJadwal(movieTitle, posterUrl) {
    filmDipilih = movieTitle;
    document.getElementById('detail-title').innerText = movieTitle;
    if (posterUrl) {
        document.getElementById('detail-poster').src = posterUrl;
    }
    
    // Sembunyikan semua halaman
    document.getElementById('page-home').classList.add('hidden');
    document.getElementById('page-riwayat').classList.add('hidden');
    document.getElementById('page-data-diri').classList.add('hidden');
    document.getElementById('page-e-ticket').classList.add('hidden');
    document.getElementById('page-pembayaran').classList.add('hidden');
    document.getElementById('page-kursi').classList.add('hidden');
    
    // Tampilkan halaman jadwal
    document.getElementById('page-jadwal').classList.remove('hidden');
    renderJadwalKomponen();
    window.scrollTo(0, 0);
}

// Buka halaman pilih kursi
// Buka halaman pilih kursi (DENGAN CEK LOGIN)
function bukaModulKursi() {
    // Cek apakah user sudah login
    const currentUser = localStorage.getItem('currentUser');
    
    if (!currentUser) {
        // Jika belum login, tampilkan alert dan arahkan ke login
        if (confirm('⚠️ Anda harus login terlebih dahulu untuk memilih kursi.\n\nKlik OK untuk login, atau Cancel untuk batal.')) {
            // Buka modul login
            openAuthModule('section-login');
        }
        return;
    }
    
    // Validasi jadwal
    if (!tanggalDipilih || !jamDipilih) {
        alert('Silakan pilih tanggal dan jam terlebih dahulu!');
        return;
    }
    
    // Lanjut ke halaman kursi
    document.getElementById('page-jadwal').classList.add('hidden');
    document.getElementById('page-kursi').classList.remove('hidden');
    renderPetaKursi();
    window.scrollTo(0, 0);
}

// Lanjut ke halaman pembayaran (DENGAN TIMER)
// Lanjut ke halaman pembayaran (DENGAN TIMER)
function bukaModulKonfirmasi() {
    // Cek login lagi
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        alert('⚠️ Anda harus login terlebih dahulu!');
        openAuthModule('section-login');
        return;
    }
    
    if (kursiTerpilih.length === 0) {
        alert('Silakan pilih kursi terlebih dahulu!');
        return;
    }
    
    // Hide halaman kursi
    document.getElementById('page-kursi').classList.add('hidden');
    
    // Show halaman pembayaran
    document.getElementById('page-pembayaran').classList.remove('hidden');
    
    // Populate data
    populatePaymentInfo();
    
    // MULAI TIMER SEKARANG (langsung saat masuk halaman pembayaran)
    startPaymentTimer();
    
    window.scrollTo(0, 0);
}

// Kembali ke home
function kembaliKeHome() {
    stopPaymentTimer();
    
    const allPages = ['page-jadwal', 'page-kursi', 'page-riwayat', 'page-data-diri', 'page-e-ticket', 'page-pembayaran'];
    allPages.forEach(pageId => {
        const page = document.getElementById(pageId);
        if (page) {
            page.classList.add('hidden');
        }
    });
    
    const homePage = document.getElementById('page-home');
    if (homePage) {
        homePage.classList.remove('hidden');
    }
    
    window.scrollTo(0, 0);
}

// Kembali ke halaman jadwal (INI YANG KAMU CARI!)
function kembaliKeJadwal() {
    stopPaymentTimer();
    
    document.getElementById('page-kursi').classList.add('hidden');
    document.getElementById('page-pembayaran').classList.add('hidden');
    document.getElementById('page-e-ticket').classList.add('hidden');
    document.getElementById('page-jadwal').classList.remove('hidden');
    window.scrollTo(0, 0);
}

// ============================================
// TIMER FUNCTIONS
// ============================================
function startPaymentTimer() {
    const timerElement = document.getElementById('payment-timer');
    if (!timerElement) {
        console.error('Timer element tidak ditemukan!');
        return;
    }
    
    // Reset waktu ke 30 menit
    paymentTimeLeft = 30 * 60;
    
    // Hentikan timer lama jika ada
    if (paymentTimerInterval) {
        clearInterval(paymentTimerInterval);
    }
    
    // Update display awal
    updateTimerDisplay(timerElement, paymentTimeLeft);
    
    // Start countdown
    paymentTimerInterval = setInterval(() => {
        paymentTimeLeft--;
        
        if (paymentTimeLeft <= 0) {
            clearInterval(paymentTimerInterval);
            timerElement.textContent = "00:00";
            
            // Tampilkan halaman timeout
            showTimeoutPage();
        } else {
            updateTimerDisplay(timerElement, paymentTimeLeft);
            
            // Warning jika < 5 menit
            if (paymentTimeLeft <= 300) {
                timerElement.parentElement.classList.remove('bg-white/10');
                timerElement.parentElement.classList.add('bg-red-500');
                timerElement.classList.add('animate-pulse');
            }
        }
    }, 1000);
}

// Fungsi baru untuk halaman timeout
function showTimeoutPage() {
    stopPaymentTimer();
    
    // Hide semua halaman
    document.getElementById('page-home').classList.add('hidden');
    document.getElementById('page-jadwal').classList.add('hidden');
    document.getElementById('page-kursi').classList.add('hidden');
    document.getElementById('page-pembayaran').classList.add('hidden');
    document.getElementById('page-e-ticket').classList.add('hidden');
    document.getElementById('page-riwayat').classList.add('hidden');
    document.getElementById('page-data-diri').classList.add('hidden');
    
    // Show halaman timeout
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
    try {
        const mockMovies = [
            { title: "Sekawan Limo", status: "now-playing", poster_url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&auto=format&fit=crop" },
            { title: "Ipar Adalah Maut", status: "now-playing", poster_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop" },
            { title: "Badarawuhi", status: "now-playing", poster_url: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=300&auto=format&fit=crop" },
            { title: "Tumbal Proyek", status: "now-playing", poster_url: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=300&auto=format&fit=crop" },
            { title: "Badut Gendong", status: "now-playing", poster_url: "https://images.unsplash.com/photo-1509347528160-9a9e33742cd4?w=300&auto=format&fit=crop" },
            { title: "Inside Out 2", status: "upcoming", poster_url: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=300&auto=format&fit=crop" },
            { title: "Despicable Me 4", status: "upcoming", poster_url: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=300&auto=format&fit=crop" }
        ];

        const nowPlayingBanner = document.getElementById('now-playing-banner');
        const trendingMovies = document.getElementById('trending-movies');
        const upcomingMovies = document.getElementById('upcoming-movies');

        if (nowPlayingBanner) nowPlayingBanner.innerHTML = '';
        if (trendingMovies) trendingMovies.innerHTML = '';
        if (upcomingMovies) upcomingMovies.innerHTML = '';

        const nowPlayingMovies = mockMovies.filter(m => m.status === 'now-playing');
        const moviesForBanner = [...nowPlayingMovies, ...nowPlayingMovies];

        if (nowPlayingBanner) {
            moviesForBanner.forEach((movie, index) => {
                const bannerItem = `
                    <div class="banner-item flex flex-col space-y-1.5 text-center group cursor-pointer" 
                         onclick="bukaModulJadwal('${movie.title}', '${movie.poster_url}')">
                        <div class="w-full aspect-[2/3] rounded-sm overflow-hidden border border-sky-500/30 shadow-lg">
                            <img src="${movie.poster_url}" alt="${movie.title}" class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
                        </div>
                        <p class="text-[9px] font-bold text-sky-300 uppercase tracking-tight truncate px-0.5">${movie.title}</p>
                    </div>
                `;
                nowPlayingBanner.innerHTML += bannerItem;

                if (index < nowPlayingMovies.length && trendingMovies) {
                    const movieCard = `
                        <div onclick="bukaModulJadwal('${movie.title}', '${movie.poster_url}')" class="flex flex-col space-y-2 group cursor-pointer">
                            <div class="w-full aspect-[2/3] bg-slate-800 rounded-md overflow-hidden shadow-sm border border-slate-300/50 group-hover:shadow-md transition">
                                <img src="${movie.poster_url}" alt="${movie.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                            </div>
                            <h4 class="font-bold text-[11px] text-slate-700 tracking-tight uppercase truncate px-1">${movie.title}</h4>
                        </div>
                    `;
                    trendingMovies.innerHTML += movieCard;
                }
            });
        }

        if (upcomingMovies) {
            mockMovies.filter(m => m.status === 'upcoming').forEach(movie => {
                const movieCard = `
                    <div onclick="bukaModulJadwal('${movie.title}', '${movie.poster_url}')" class="flex flex-col space-y-2 group cursor-pointer">
                        <div class="w-full aspect-[2/3] bg-slate-800 rounded-md overflow-hidden shadow-sm border border-slate-300/50 group-hover:shadow-md transition">
                            <img src="${movie.poster_url}" alt="${movie.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                        </div>
                        <h4 class="font-bold text-[11px] text-slate-700 tracking-tight uppercase truncate px-1">${movie.title}</h4>
                    </div>
                `;
                upcomingMovies.innerHTML += movieCard;
            });
        }

    } catch (error) {
        console.log("Gagal memuat grid film.");
    }
}

// ============================================
// JADWAL FUNCTIONS
// ============================================
function renderJadwalKomponen() {
    const containerTgl = document.getElementById('container-tanggal');
    const containerJam = document.getElementById('container-jam');
    
    containerTgl.innerHTML = '';
    containerJam.innerHTML = '';
    
    tanggalDipilih = ""; 
    jamDipilih = "";
    document.getElementById('btn-pilih-kursi').disabled = true;
    document.getElementById('selectedLabel').innerText = "Belum memilih jadwal";

    const hariArr = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
    
    for(let i = 0; i < 7; i++) {
        let d = new Date(); 
        d.setDate(d.getDate() + i);
        let tglStr = d.getDate(); 
        let hariStr = hariArr[d.getDay()];
        
        if (i === 0 || i === 1) {
            containerTgl.innerHTML += `
                <div class="date-btn" onclick="pilihTanggal(this, '${tglStr}')">
                    <p class="text-[9px] font-bold text-slate-400">${hariStr}</p>
                    <p class="text-sm font-black">${tglStr}</p>
                </div>
            `;
        } else {
            containerTgl.innerHTML += `
                <div class="date-btn disabled" style="opacity: 0.35; cursor: not-allowed; background: #f1f5f9;">
                    <p class="text-[9px] font-bold text-slate-400">${hariStr}</p>
                    <p class="text-sm font-black text-slate-400">${tglStr}</p>
                </div>
            `;
        }
    }
}

function pilihTanggal(element, tanggal) {
    const containerJam = document.getElementById('container-jam');

    if (tanggalDipilih === tanggal) {
        element.classList.remove('active');
        tanggalDipilih = "";
        jamDipilih = "";
        containerJam.innerHTML = '';
        updateLabelStatusJadwal();
        return;
    }

    const semuaTombolTgl = document.querySelectorAll('.date-grid .date-btn');
    semuaTombolTgl.forEach(btn => btn.classList.remove('active'));

    element.classList.add('active');
    tanggalDipilih = tanggal; 
    jamDipilih = "";

    containerJam.innerHTML = '';
    const jamArr = ['10:30', '13:15', '15:50', '18:45', '21:30'];
    jamArr.forEach(jam => {
        containerJam.innerHTML += `<div class="time-btn" onclick="pilihJam(this, '${jam}')">${jam}</div>`;
    });

    updateLabelStatusJadwal();
}

function pilihJam(element, jam) {
    if (jamDipilih === jam) {
        element.classList.remove('active');
        jamDipilih = "";
        updateLabelStatusJadwal();
        return;
    }

    const semuaTombolJam = document.querySelectorAll('.time-grid .time-btn');
    semuaTombolJam.forEach(btn => btn.classList.remove('active'));

    element.classList.add('active');
    jamDipilih = jam;

    updateLabelStatusJadwal();
}

function updateLabelStatusJadwal() {
    const labelJadwal = document.getElementById('selectedLabel');
    const namaBulan = new Date().toLocaleString('id-ID', { month: 'long' });

    if (tanggalDipilih && jamDipilih) {
        labelJadwal.innerText = `Tanggal ${tanggalDipilih} ${namaBulan}, Pukul ${jamDipilih}`;
        document.getElementById('btn-pilih-kursi').disabled = false;
    } else if (tanggalDipilih) {
        labelJadwal.innerText = `Tanggal ${tanggalDipilih} ${namaBulan} (Silakan pilih jam tayang)`;
        document.getElementById('btn-pilih-kursi').disabled = true;
    } else {
        labelJadwal.innerText = "Belum memilih jadwal";
        document.getElementById('btn-pilih-kursi').disabled = true;
    }
}

// ============================================
// KURSI FUNCTIONS
// ============================================
function renderPetaKursi() {
    const seatMap = document.getElementById('seatMap');
    if (!seatMap) return;
    
    seatMap.innerHTML = ''; 
    kursiTerpilih = [];

    const labelKursi = document.getElementById('selectedSeatsLabel');
    if (labelKursi) labelKursi.textContent = 'Belum memilih kursi';

    const daftarBaris = ['A', 'B', 'C', 'D', 'E'];
    
    daftarBaris.forEach(namaBaris => {
        for (let i = 1; i <= 13; i++) {
            if (i === 3) {
                seatMap.innerHTML += `<div class="w-[32px] h-[44px]"></div>`;
                continue;
            }
            if (i === 11) {
                seatMap.innerHTML += `<div class="w-[32px] h-[44px]"></div>`;
                continue;
            }

            let nomorKursiAsli = i;
            if (i > 3) nomorKursiAsli = i - 1;
            if (i > 11) nomorKursiAsli = i - 2;

            const idKursiUnique = `${namaBaris}${nomorKursiAsli}`;
            const isOccupied = ['A2', 'B2', 'B7', 'C1', 'C4', 'E2'].includes(idKursiUnique);
            
            if (isOccupied) {
                seatMap.innerHTML += `
                    <div class="seat occupied bg-slate-200 text-slate-400 opacity-60 flex items-center justify-center w-[44px] h-[44px] border border-slate-200 rounded-sm text-[11px] font-bold cursor-not-allowed select-none">
                         ${idKursiUnique}
                    </div>
                `;
            } else {
                seatMap.innerHTML += `
                    <div class="seat bg-slate-50 border-slate-300 text-slate-700 cursor-pointer hover:bg-slate-200 flex items-center justify-center w-[44px] h-[44px] border rounded-sm text-[11px] font-bold transition select-none" 
                         onclick="pilihKursi(this, '${idKursiUnique}')">
                         ${idKursiUnique}
                    </div>
                `;
            }
        }
    });
}

function pilihKursi(elemenKursi, idKursi) {
    const index = kursiTerpilih.indexOf(idKursi);

    if (index > -1) {
        kursiTerpilih.splice(index, 1);
        elemenKursi.className = "seat bg-slate-50 border border-slate-300 text-slate-700 cursor-pointer hover:bg-slate-200 flex items-center justify-center w-[44px] h-[44px] rounded-sm text-[11px] font-bold transition select-none";
    } else {
        kursiTerpilih.push(idKursi);
        elemenKursi.className = "seat bg-blue-600 text-white flex items-center justify-center w-[44px] h-[44px] border border-blue-600 rounded-sm text-[11px] font-bold transition select-none cursor-pointer";
    }

    kursiTerpilih.sort();
    updateBottomBar();
}

function updateBottomBar() {
    const elKursi = document.getElementById('selectedSeatsLabel');
    const btnKonfirmasi = document.getElementById('btn-konfirmasi-tiket');

    if (elKursi) {
        elKursi.innerText = kursiTerpilih.length > 0 ? kursiTerpilih.join(', ') : 'Belum memilih kursi';
    }

    if (btnKonfirmasi) {
        if (kursiTerpilih.length > 0) {
            btnKonfirmasi.removeAttribute('disabled');
            btnKonfirmasi.disabled = false;
            btnKonfirmasi.className = "bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-4 py-2 rounded-sm transition uppercase shadow-md cursor-pointer";
        } else {
            btnKonfirmasi.setAttribute('disabled', 'true');
            btnKonfirmasi.disabled = true;
            btnKonfirmasi.className = "bg-slate-900 text-white text-[11px] font-bold px-4 py-2 rounded-sm transition uppercase opacity-40 cursor-not-allowed shadow-sm";
        }
    }
}

// ============================================
// AUTH HANDLERS
// ============================================
document.getElementById('form-login').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(`Login berhasil! Selamat datang, ${data.username}`);
            closeAuthModule();
            
            const userData = {
                username: data.username,
                email: data.email,
                name: data.username
            };
            localStorage.setItem('currentUser', JSON.stringify(userData));
            checkLoginStatus();
        } else {
            alert("Login Gagal: " + data.detail);
        }
    } catch (error) {
        alert("Server backend Python belum kamu jalankan!");
    }
});

document.getElementById('form-register').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();
        
        if (response.ok) {
            alert(data.message);
            isForgotPasswordFlow = false; 
            currentRegisterEmail = data.email; 
            document.getElementById('display-target-email').innerText = data.email;
            switchSection('section-otp'); 
        } else {
            alert("Gagal: " + data.detail);
        }
    } catch (error) {
        alert("Server backend Python belum kamu jalankan!");
    }
});

document.getElementById('form-otp').addEventListener('submit', async function(e) {
    e.preventDefault();
    const otpBoxes = document.querySelectorAll('.otp-box');
    let otpCode = "";
    otpBoxes.forEach(box => otpCode += box.value);
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentRegisterEmail, otp_code: otpCode })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(data.message || "Verifikasi berhasil!");
            
            if (isForgotPasswordFlow) {
                switchSection('section-new-password');
            } else {
                switchSection('section-login');
            }
        } else {
            alert("Gagal: " + (data.detail || "Terjadi kesalahan"));
        }
    } catch (error) {
        alert("Gagal melakukan verifikasi OTP!");
    }
});

const otpBoxes = document.querySelectorAll('.otp-box');
otpBoxes.forEach((box, index) => {
    box.addEventListener('input', () => {
        if (box.value.length === 1 && index < otpBoxes.length - 1) otpBoxes[index + 1].focus();
    });
    box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && box.value.length === 0 && index > 0) otpBoxes[index - 1].focus();
    });
});

const formForgot = document.getElementById('form-forgot');
if (formForgot) {
    formForgot.addEventListener('submit', async function(e) {
        e.preventDefault(); 
        const emailInput = document.getElementById('forgot-email').value;
        const displayEmail = document.getElementById('display-target-email');
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailInput })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert(data.message || "OTP telah dikirim!");
                if (displayEmail) displayEmail.innerText = emailInput;
                currentRegisterEmail = emailInput; 
                isForgotPasswordFlow = true; 
                switchSection('section-otp');
            } else {
                alert("Gagal: " + (data.detail || "Email tidak terdaftar"));
            }
        } catch (error) {
            alert("Gagal menghubungi server!");
        }
    });
}

document.getElementById('form-new-password').addEventListener('submit', async function(e) {
    e.preventDefault();
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;
    
    if (newPassword !== confirmPassword) {
        alert("Password tidak cocok!");
        return;
    }
    
    if (newPassword.length < 6) {
        alert("Password minimal 6 karakter!");
        return;
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/update-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentRegisterEmail, new_password: newPassword })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert("Password berhasil diubah!");
            switchSection('section-login');
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-new-password').value = '';
        } else {
            alert("Gagal: " + (data.detail || "Terjadi kesalahan"));
        }
    } catch (error) {
        alert("Gagal mengubah password!");
    }
});

// ============================================
// BANNER SLIDER
// ============================================
let currentSlide = 0;
let slideInterval;

function initBannerSlider() {
    startSlideTimer();
    populateBanners();
}

function startSlideTimer() {
    if (slideInterval) clearInterval(slideInterval);
    
    slideInterval = setInterval(() => {
        nextSlide();
    }, 5000);
}

function nextSlide() {
    const slides = document.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.slide-dot');
    
    if (slides.length === 0) return;
    
    slides[currentSlide].classList.remove('active');
    if (dots[currentSlide]) dots[currentSlide].classList.remove('active');
    
    currentSlide = (currentSlide + 1) % slides.length;
    
    slides[currentSlide].classList.add('active');
    if (dots[currentSlide]) dots[currentSlide].classList.add('active');
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.slide-dot');
    
    slides[currentSlide].classList.remove('active');
    if (dots[currentSlide]) dots[currentSlide].classList.remove('active');
    
    currentSlide = index;
    
    slides[currentSlide].classList.add('active');
    if (dots[currentSlide]) dots[currentSlide].classList.add('active');
    
    startSlideTimer();
}

function populateBanners() {
    const nowPlayingBanner = document.getElementById('now-playing-banner');
    const nowPlayingMovies = [
        { title: "Tumbal Proyek", poster: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=300&auto=format&fit=crop" },
        { title: "Badut Gendong", poster: "https://images.unsplash.com/photo-1509347528160-9a9e33742cd4?w=300&auto=format&fit=crop" },
        { title: "Sekawan Limo 2", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&auto=format&fit=crop" }
    ];
    
    if (nowPlayingBanner) {
        nowPlayingBanner.innerHTML = '';
        nowPlayingMovies.forEach((movie) => {
            nowPlayingBanner.innerHTML += `
                <div class="banner-item-static group cursor-pointer" onclick="bukaModulJadwal('${movie.title}', '${movie.poster}')">
                    <div class="w-full aspect-[2/3] rounded-sm overflow-hidden border-2 border-sky-500/30">
                        <img src="${movie.poster}" alt="${movie.title}" class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
                    </div>
                    <p class="text-[9px] font-bold text-sky-300 uppercase tracking-tight text-center mt-2 truncate">${movie.title}</p>
                </div>
            `;
        });
    }
    
    const comingSoonBanner = document.getElementById('coming-soon-banner');
    const comingSoonMovies = [
        { title: "Garuda di Dadaku", poster: "https://images.unsplash.com/photo-1579373903781-fd5c0fd48f37?w=300&auto=format&fit=crop" },
        { title: "Suzzanna", poster: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=300&auto=format&fit=crop" },
        { title: "Darah Daging", poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop" }
    ];
    
    if (comingSoonBanner) {
        comingSoonBanner.innerHTML = '';
        comingSoonMovies.forEach((movie) => {
            comingSoonBanner.innerHTML += `
                <div class="banner-item-static group cursor-pointer relative">
                    <div class="w-full aspect-[2/3] rounded-sm overflow-hidden border-2 border-sky-500/30 relative">
                        <img src="${movie.poster}" alt="${movie.title}" class="w-full h-full object-cover group-hover:scale-110 transition duration-500 opacity-80">
                        <div class="absolute top-2 right-2">
                            <span class="bg-black/70 text-white text-[8px] font-bold px-2 py-1 rounded">SEGERA</span>
                        </div>
                    </div>
                    <p class="text-[9px] font-bold text-sky-300 uppercase tracking-tight text-center mt-2 truncate">${movie.title}</p>
                </div>
            `;
        });
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
            
            const userName = userData.username || 'User';
            const userEmail = userData.email || 'user@email.com';
            
            document.getElementById('user-name-dropdown').textContent = userName;
            document.getElementById('user-email-dropdown').textContent = userEmail;
            document.getElementById('data-username').textContent = userName;
            document.getElementById('data-email').textContent = userEmail;
            
            const avatarUrl = `https://ui-avatars.com/api/?name=${userName}&background=0ea5e9&color=fff&size=40`;
            document.getElementById('user-avatar').src = avatarUrl;
        }
    } else {
        if (btnLogin) btnLogin.classList.remove('hidden');
        if (userProfile) userProfile.classList.add('hidden');
    }
}

function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.classList.toggle('hidden');
}

document.addEventListener('click', function(event) {
    const userProfile = document.getElementById('user-profile-menu');
    const dropdown = document.getElementById('user-dropdown');
    
    if (userProfile && !userProfile.contains(event.target)) {
        dropdown.classList.add('hidden');
    }
});

function showRiwayat() {
    toggleUserMenu();
    
    document.getElementById('page-home').classList.add('hidden');
    document.getElementById('page-jadwal').classList.add('hidden');
    document.getElementById('page-kursi').classList.add('hidden');
    document.getElementById('page-data-diri').classList.add('hidden');
    document.getElementById('page-e-ticket').classList.add('hidden');
    document.getElementById('page-pembayaran').classList.add('hidden');
    
    document.getElementById('page-riwayat').classList.remove('hidden');
    
    loadRiwayat();
    window.scrollTo(0, 0);
}

function showDataDiri() {
    toggleUserMenu();
    
    document.getElementById('page-home').classList.add('hidden');
    document.getElementById('page-jadwal').classList.add('hidden');
    document.getElementById('page-kursi').classList.add('hidden');
    document.getElementById('page-riwayat').classList.add('hidden');
    document.getElementById('page-e-ticket').classList.add('hidden');
    document.getElementById('page-pembayaran').classList.add('hidden');
    
    document.getElementById('page-data-diri').classList.remove('hidden');
    window.scrollTo(0, 0);
}

function loadRiwayat() {
    const riwayatList = document.getElementById('riwayat-list');
    const riwayatEmpty = document.getElementById('riwayat-empty');
    
    const mockRiwayat = [
        {
            title: "Sekawan Limo 2",
            poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300",
            tanggal: "25 Juli 2026",
            jam: "10:30",
            kursi: "E9",
            hall: "STUDIO 01",
            orderId: "CF-99283-68",
            status: "upcoming"
        },
        {
            title: "Tumbal Proyek",
            poster: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=300",
            tanggal: "15 Juni 2026",
            jam: "18:45",
            kursi: "C3, C4",
            hall: "STUDIO 02",
            orderId: "CF-88172-55",
            status: "completed"
        }
    ];
    
    if (mockRiwayat.length === 0) {
        riwayatEmpty.classList.remove('hidden');
    } else {
        riwayatEmpty.classList.add('hidden');
        riwayatList.innerHTML = '';
        
        mockRiwayat.forEach((ticket, index) => {
            const statusClass = ticket.status === 'upcoming' ? 'status-upcoming' : 'status-completed';
            const statusText = ticket.status === 'upcoming' ? 'Akan Datang' : 'Selesai';
            const cardClass = ticket.status === 'completed' ? 'status-completed-card' : '';
            const clickAction = ticket.status === 'upcoming' ? `onclick="downloadETicketFromRiwayat(${index})"` : '';
            
            riwayatList.innerHTML += `
                <div class="riwayat-card ${cardClass}" ${clickAction}>
                    <span class="download-hint">📥 KLIK UNTUK DOWNLOAD</span>
                    <img src="${ticket.poster}" alt="${ticket.title}" class="riwayat-poster">
                    <div class="riwayat-info">
                        <h3 class="riwayat-title">${ticket.title}</h3>
                        <p class="riwayat-detail">📅 ${ticket.tanggal} | 🕐 ${ticket.jam}</p>
                        <p class="riwayat-detail">🎬 ${ticket.hall} | 💺 Kursi: ${ticket.kursi}</p>
                        <p class="riwayat-detail">🎫 Order ID: ${ticket.orderId}</p>
                        <span class="riwayat-status ${statusClass}">${statusText}</span>
                    </div>
                </div>
            `;
        });
    }
    
    window.currentRiwayatData = mockRiwayat;
}

function logout() {
    if (confirm('Yakin ingin logout?')) {
        localStorage.removeItem('currentUser');
        checkLoginStatus();
        kembaliKeHome();
    }
}

// ============================================
// E-TIKET FUNCTIONS
// ============================================
function downloadETicketFromRiwayat(index) {
    const ticket = window.currentRiwayatData[index];
    if (!ticket) return;
    showETicketPage(ticket);
}

function showETicketPage(ticket) {
    stopPaymentTimer();
    
    document.getElementById('page-home').classList.add('hidden');
    document.getElementById('page-jadwal').classList.add('hidden');
    document.getElementById('page-kursi').classList.add('hidden');
    document.getElementById('page-riwayat').classList.add('hidden');
    document.getElementById('page-data-diri').classList.add('hidden');
    document.getElementById('page-pembayaran').classList.add('hidden');
    
    document.getElementById('page-e-ticket').classList.remove('hidden');
    
    document.getElementById('eticket-poster').src = ticket.poster;
    document.getElementById('eticket-title').textContent = ticket.title;
    document.getElementById('eticket-date').textContent = ticket.tanggal;
    document.getElementById('eticket-time').textContent = ticket.jam + ' WIB';
    document.getElementById('eticket-seats').textContent = ticket.kursi;
    document.getElementById('eticket-hall').textContent = ticket.hall || 'STUDIO 01';
    document.getElementById('eticket-orderid').textContent = ticket.orderId || 'CF-' + Math.floor(Math.random() * 99999);
    
    const qrData = `BIOSKOP7|${ticket.title}|${ticket.tanggal}|${ticket.jam}|${ticket.kursi}|${ticket.orderId}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
    document.getElementById('eticket-qrcode').src = qrUrl;
    
    window.scrollTo(0, 0);
}

function downloadETicket() {
    // Ambil data dari e-ticket
    const title = document.getElementById('eticket-title').textContent;
    const date = document.getElementById('eticket-date').textContent;
    const time = document.getElementById('eticket-time').textContent;
    const seats = document.getElementById('eticket-seats').textContent;
    const hall = document.getElementById('eticket-hall').textContent;
    const orderId = document.getElementById('eticket-orderid').textContent;
    const qrCode = document.getElementById('eticket-qrcode').src;
    
    // Buat konten HTML untuk PDF (TANPA TOMBOL)
    const ticketHTML = `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Header -->
            <div style="background: linear-gradient(to right, #0284c7, #1e40af); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 24px; font-weight: bold;">BIOSKOP 7</h1>
                <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.9;">E-TICKET CONFIRMATION</p>
            </div>
            
            <!-- Order ID -->
            <div style="background: #f1f5f9; padding: 15px; text-align: right;">
                <p style="margin: 0; font-size: 11px; color: #64748b;">ORDER ID</p>
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #0f172a;">${orderId}</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 20px; background: white;">
                <!-- Film Title -->
                <div style="margin-bottom: 20px;">
                    <p style="margin: 0 0 5px 0; font-size: 11px; color: #64748b; text-transform: uppercase;">Judul Film</p>
                    <h2 style="margin: 0; font-size: 20px; font-weight: bold; color: #1e293b;">${title}</h2>
                </div>
                
                <!-- Details Grid -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; padding: 20px; background: #f8fafc; border-radius: 8px;">
                    <div>
                        <p style="margin: 0 0 5px 0; font-size: 11px; color: #64748b;">📅 Tanggal</p>
                        <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1e293b;">${date}</p>
                    </div>
                    <div>
                        <p style="margin: 0 0 5px 0; font-size: 11px; color: #64748b;">🕐 Waktu</p>
                        <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1e293b;">${time}</p>
                    </div>
                    <div>
                        <p style="margin: 0 0 5px 0; font-size: 11px; color: #64748b;">🎬 Studio</p>
                        <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1e293b;">${hall}</p>
                    </div>
                    <div>
                        <p style="margin: 0 0 5px 0; font-size: 11px; color: #64748b;">💺 Kursi</p>
                        <p style="margin: 0; font-size: 14px; font-weight: bold; color: #0ea5e9;">${seats}</p>
                    </div>
                </div>
                
                <!-- QR Code -->
                <div style="text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px; margin-bottom: 15px;">
                    <img src="${qrCode}" alt="QR Code" style="width: 150px; height: 150px; margin: 0 auto; display: block;">
                    <p style="margin: 10px 0 0 0; font-size: 11px; color: #64748b;">Scan QR Code ini di bioskop</p>
                </div>
                
                <!-- Info -->
                <div style="padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                    <p style="margin: 0; font-size: 11px; color: #92400e; line-height: 1.6;">
                        <strong>Informasi:</strong><br>
                        Tunjukkan kode QR ini kepada petugas bioskop atau gunakan kios mandiri untuk mencetak tiket fisik jika diperlukan.
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f1f5f9; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
                <p style="margin: 0; font-size: 11px; color: #64748b;">Terima kasih telah memesan di Bioskop 7</p>
                <p style="margin: 5px 0 0 0; font-size: 10px; color: #94a3b8;">Selamat menonton!</p>
            </div>
        </div>
    `;
    
    // Konfigurasi PDF
    const opt = {
        margin: [0, 0, 0, 0],
        filename: `E-Tiket-${title.replace(/\s+/g, '_')}-${orderId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Buat elemen temporary untuk PDF
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = ticketHTML;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    document.body.appendChild(tempDiv);
    
    // Generate dan download PDF
    html2pdf().set(opt).from(tempDiv).save().then(() => {
        // Hapus elemen temporary
        document.body.removeChild(tempDiv);
        alert('✅ E-Tiket PDF berhasil didownload!');
    }).catch(err => {
        console.error('Error:', err);
        document.body.removeChild(tempDiv);
        alert('❌ Gagal download PDF. Silakan coba lagi.');
    });
}

// ============================================
// PEMBAYARAN FUNCTIONS
// ============================================
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    
    document.getElementById('payment-method-selection').classList.add('hidden');
    
    if (method === 'qris') {
        document.getElementById('qris-detail').classList.remove('hidden');
        document.getElementById('bank-detail').classList.add('hidden');
        
        const qrData = `BIOSKOP7|${filmDipilih}|${tanggalDipilih}|${jamDipilih}|${kursiTerpilih.join(',')}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
        document.getElementById('qris-code').src = qrUrl;
    } else if (method === 'bank') {
        document.getElementById('qris-detail').classList.add('hidden');
        document.getElementById('bank-detail').classList.remove('hidden');
        
        const total = kursiTerpilih.length * HARGA_PER_KURSI;
        document.getElementById('bank-transfer-amount').textContent = 'Rp. ' + total.toLocaleString('id-ID');
    }
}

function backToPaymentMethod() {
    document.getElementById('qris-detail').classList.add('hidden');
    document.getElementById('bank-detail').classList.add('hidden');
    document.getElementById('payment-method-selection').classList.remove('hidden');
    selectedPaymentMethod = '';
}

function confirmPayment(method) {
    stopPaymentTimer();
    
    if (!confirm('Konfirmasi pembayaran sudah dilakukan?')) {
        startPaymentTimer();
        return;
    }
    
    const orderId = 'B7-' + Date.now().toString().slice(-6);
    
    setTimeout(() => {
        showETicketPage({
            title: filmDipilih,
            poster: document.getElementById('detail-poster').src,
            tanggal: tanggalDipilih + ' ' + new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
            jam: jamDipilih,
            kursi: kursiTerpilih.join(', '),
            hall: 'STUDIO 01',
            orderId: orderId
        });
    }, 500);
}

function populatePaymentInfo() {
    const total = kursiTerpilih.length * HARGA_PER_KURSI;
    
    document.getElementById('summary-date').textContent = tanggalDipilih + ' ' + new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    document.getElementById('summary-time').textContent = jamDipilih + ' WIB';
    document.getElementById('summary-film').textContent = filmDipilih;
    document.getElementById('summary-seats').textContent = kursiTerpilih.join(', ');
    document.getElementById('summary-total').textContent = 'Rp. ' + total.toLocaleString('id-ID');
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    fetchMovies();
    initBannerSlider();
    checkLoginStatus();
});