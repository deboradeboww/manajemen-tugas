// ==========================================
// 1. INISIALISASI SUPABASE
// ==========================================
const SUPABASE_URL = 'https://tppjfbdyazitrbwmvyxm.supabase.co';[cite: 1]
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwcGpmYmR5YXppdHJid212eXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMjY3NTgsImV4cCI6MjEwNjYwMjc1OH0.gi8yOyHhGk7nhu7rTd1Z1poo0cGInfLa-lAPwFqP5Io';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    let taskListArray = [];
    let toastTimeout;

    // Element Navigasi & Halaman
    const navInput = document.getElementById('navInput');
    const navList = document.getElementById('navList');
    const pageInput = document.getElementById('pageInput');
    const pageList = document.getElementById('pageList');

    // Element Form
    const taskForm = document.getElementById('taskForm');
    const taskTitle = document.getElementById('taskTitle');
    const taskCategory = document.getElementById('taskCategory');
    const taskDeadline = document.getElementById('taskDeadline');
    const taskPriority = document.getElementById('taskPriority');
    const taskStatus = document.getElementById('taskStatus');

    const titleError = document.getElementById('titleError');
    const categoryError = document.getElementById('categoryError');
    const deadlineError = document.getElementById('deadlineError');

    // Element List, Filter & Pop-up Notifikasi Atas
    const taskListContainer = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyState');
    const taskCountBadge = document.getElementById('taskCountBadge');
    const filterCategory = document.getElementById('filterCategory');
    const filterStatus = document.getElementById('filterStatus');
    const toastNotification = document.getElementById('toastNotification');
    const closeToastBtn = document.getElementById('closeToastBtn');

    // Load Data dari Supabase saat aplikasi dibuka
    fetchTasksFromSupabase();

    // Set tampilan awal: Masukkan Tugas aktif
    pageInput.classList.remove('hidden');
    pageList.classList.add('hidden');

    // Tab Navigasi Masukkan Tugas
    navInput.addEventListener('click', () => {
        navInput.classList.add('active');
        navList.classList.remove('active');
        pageInput.classList.remove('hidden');
        pageList.classList.add('hidden');
    });

    // Tab Navigasi List Tugas
    navList.addEventListener('click', () => {
        navList.classList.add('active');
        navInput.classList.remove('active');
        pageList.classList.remove('hidden');
        pageInput.classList.add('hidden');
        fetchTasksFromSupabase(); // Ambil data terbaru dari server
    });

    // Tombol silang untuk menutup notifikasi manual
    closeToastBtn.addEventListener('click', () => {
        toastNotification.classList.remove('show');
        if (toastTimeout) clearTimeout(toastTimeout);
    });

    // --- MENDENGARKAN TOMBOL ENTER DI APAPUN KOLOM INPUT ---
    taskForm.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            simpanTugas();
        }
    });

    // Submit saat Klik Tombol "Simpan Tugas"
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        simpanTugas();
    });

    // --- FUNGSI UTAMA AMBIL DATA DARI SUPABASE (READ) ---
    async function fetchTasksFromSupabase() {
        const { data, error } = await supabaseClient
            .from('todos')
            .select('*')
            .order('id', { ascending: false });

        if (error) {
            console.error('Gagal mengambil data dari Supabase:', error.message);
            return;
        }

        taskListArray = data;
        renderTasks();
    }

    // --- FUNGSI UTAMA SIMPAN TUGAS (CREATE) ---
    async function simpanTugas() {
        // Reset Error
        titleError.style.display = 'none';
        categoryError.style.display = 'none';
        deadlineError.style.display = 'none';

        let isValid = true;

        if (!taskTitle.value.trim()) {
            titleError.style.display = 'block';
            isValid = false;
        }
        if (!taskCategory.value) {
            categoryError.style.display = 'block';
            isValid = false;
        }
        if (!taskDeadline.value) {
            deadlineError.style.display = 'block';
            isValid = false;
        }

        if (!isValid) return;

        const newTask = {
            title: taskTitle.value.trim(),
            category: taskCategory.value,
            deadline: taskDeadline.value,
            priority: taskPriority.value,
            status: taskStatus.value
        };

        // Simpan Data ke Supabase
        const { error } = await supabaseClient
            .from('todos')
            .insert([newTask]);

        if (error) {
            alert('Gagal menyimpan ke database: ' + error.message);
            return;
        }

        // Reset Isian Form Input
        taskTitle.value = '';
        taskCategory.value = '';
        taskDeadline.value = '';
        taskPriority.value = 'Sedang';
        taskStatus.value = 'Belum Selesai';

        // Refresh Data dan Otomatis Pindah ke Tab List Tugas
        await fetchTasksFromSupabase();
        navList.click();

        // Tampilkan Notifikasi Pop-up di Atas
        if (toastTimeout) clearTimeout(toastTimeout);
        toastNotification.classList.add('show');

        // Otomatis Sembunyi setelah 3.5 detik
        toastTimeout = setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 3500);
    }

    // --- FILTER & RENDER TAMPILAN ---
    filterCategory.addEventListener('change', renderTasks);
    filterStatus.addEventListener('change', renderTasks);

    function renderTasks() {
        const catVal = filterCategory.value;
        const statVal = filterStatus.value;

        const filtered = taskListArray.filter(t => {
            const matchCat = (catVal === 'Semua' || t.category === catVal);
            const matchStat = (statVal === 'Semua' || t.status === statVal);
            return matchCat && matchStat;
        });

        taskCountBadge.textContent = taskListArray.length;
        taskListContainer.innerHTML = '';

        if (filtered.length === 0) {
            taskListContainer.appendChild(emptyState);
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        filtered.forEach(task => {
            const card = document.createElement('div');
            card.className = 'task-card-item';
            card.innerHTML = `
                <div class="task-header-row">
                    <p class="task-title-text">${escapeHTML(task.title)}</p>
                    <button class="btn-act btn-del" onclick="deleteTask(${task.id})" title="Hapus Tugas">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
                <div class="task-meta-tags">
                    <span class="tag-badge tag-mk"><i class="fa-solid fa-book"></i> ${task.category || '-'}</span>
                    <span class="tag-badge tag-date"><i class="fa-solid fa-calendar"></i> ${task.deadline || '-'}</span>
                    <span class="tag-badge tag-prio-${task.priority}">Prioritas: ${task.priority || 'Sedang'}</span>
                </div>
                <div class="task-footer-row">
                    <span class="status-badge status-${task.status ? task.status.split(' ')[0] : 'Belum'}">${task.status}</span>
                    <button class="btn-act" onclick="toggleStatus(${task.id}, '${task.status}')">
                        Ubah Status <i class="fa-solid fa-rotate"></i>
                    </button>
                </div>
            `;
            taskListContainer.appendChild(card);
        });
    }

    // --- HAPUS TUGAS DARI SUPABASE (DELETE) ---
    window.deleteTask = async function(id) {
        if (confirm('Apakah kamu yakin ingin menghapus tugas ini?')) {
            const { error } = await supabaseClient
                .from('todos')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Gagal menghapus tugas:', error.message);
            } else {
                fetchTasksFromSupabase();
            }
        }
    };

    // --- UBAH STATUS TUGAS DI SUPABASE (UPDATE) ---
    window.toggleStatus = async function(id, currentStatus) {
        let nextStatus = 'Belum Selesai';
        if (currentStatus === 'Belum Selesai') nextStatus = 'Sedang Dikerjakan';
        else if (currentStatus === 'Sedang Dikerjakan') nextStatus = 'Selesai';

        const { error } = await supabaseClient
            .from('todos')
            .update({ status: nextStatus })
            .eq('id', id);

        if (error) {
            console.error('Gagal mengupdate status:', error.message);
        } else {
            fetchTasksFromSupabase();
        }
    };

    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[tag] || tag));
    }

    // Sembunyikan pesan error saat pengguna mulai mengetik/memilih kembali
    taskTitle.addEventListener('input', () => {
        titleError.style.display = 'none';
    });

    taskCategory.addEventListener('change', () => {
        categoryError.style.display = 'none';
    });

    taskDeadline.addEventListener('change', () => {
        deadlineError.style.display = 'none';
    });
});