// Danh sách các file nhạc (sẽ được tải động)
const MUSIC_FOLDER = 'mp3/';
const playlist = document.getElementById('playlist');
const audioPlayer = document.getElementById('audioPlayer');
const refreshBtn = document.getElementById('refreshBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
let currentTrackIndex = -1;
let musicFiles = [];
let musicChangeInterval = null; // Interval để đổi nhạc mỗi 10 phút
let musicStartTime = null; // Thời gian bắt đầu phát nhạc hiện tại
let currentVolume = 0.5;

function setVolume(value) {
    currentVolume = Math.min(1, Math.max(0, value));
    if (audioPlayer) {
        audioPlayer.volume = currentVolume;
    }
    if (volumeSlider) {
        volumeSlider.value = Math.round(currentVolume * 100);
    }
    if (volumeValue) {
        volumeValue.textContent = `${Math.round(currentVolume * 100)}%`;
    }
}

if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
        e.stopPropagation(); // tránh kích hoạt timer
        const newValue = Number(e.target.value) / 100;
        setVolume(newValue);
    });
}

// Khởi tạo âm lượng mặc định
setVolume(currentVolume);

// Danh sách các file nhạc trong folder mp3
// File này sẽ tự động tải tất cả file .mp3 từ folder
async function loadMusicFiles() {
    playlist.innerHTML = '<div class="playlist-loading">Đang tải danh sách nhạc...</div>';
    
    try {
        // Trong môi trường web, chúng ta cần liệt kê các file
        // Vì không thể đọc thư mục trực tiếp, ta sẽ thử tải từng file
        // hoặc sử dụng một danh sách được định nghĩa trước
        
        // Danh sách các file nhạc (có thể mở rộng)
        const knownFiles = [
            'Past Lives (Instrumental).mp3',
            'Aaron Lansing   Naive Spin.mp3',
            'Advanced La La Land Suite - Piano Cover - Jacob Koller.mp3',
            'Always - Piano Love Ballad Instrumental Song.mp3',
            'Canon in C - Johann Pachelbel - Full Speed.mp3',
            'Canon in D (Pachelbel) Piano Cover by Ryan Jones.mp3',
            'Chopin - Nocturne Op. 9 No. 2 - EASY Piano Tutorial by PlutaX.mp3',
            'Christina Perri - A Thousand Years - EASY Piano Tutorial by PlutaX.mp3',
            'Fly Me to the Moon.mp3',
            'Fragile - Emotional Beautiful Deep Piano Instrumental 2018.mp3',
            'Kung Fu Panda - Oogway Ascends (Piano Version).mp3',
            'La La Land _ City of Stars _ Advanced Jazz Piano Cover _ With Sheet Music.mp3',
            'LA LA LAND - Mia and Seb\'s Theme_Epilogue __ Synthesia Piano Tutorial.mp3',
            'LI XIANG LAN 李香兰 Piano Cover and Tutorial.mp3',
            'Ludovico Einaudi - Nuvole Bianche.mp3',
            'Miss Her - Piano Love Ballad Instrumental Song.mp3',
            'Naive Spin, Aaron Lansing.mp3',
            'Quiet Resource.mp3',
            'Spirited Away Theme Song (piano).mp3',
            'The Sound of Silence  _  Simon & Garfunkel (Harp Cover).mp3',
            'The Sound of Silence _ Piano cover _ Linh Nhi.mp3',
            'Tom & Jerry Nostalgia _ Yannie Tan plays the Cat Concerto, Hungarian Rhapsody No.2 by Liszt.mp3'
        ];
        
        // Kiểm tra file nào thực sự tồn tại
        musicFiles = [];
        for (const file of knownFiles) {
            const filePath = MUSIC_FOLDER + encodeURIComponent(file);
            try {
                const response = await fetch(filePath, { method: 'HEAD' });
                if (response.ok) {
                    musicFiles.push(file);
                }
            } catch (e) {
                // File không tồn tại, bỏ qua
            }
        }
        
        // Nếu không tìm thấy file nào, thử tải tất cả file đã biết
        if (musicFiles.length === 0) {
            musicFiles = knownFiles;
        }
        
        renderPlaylist();
    } catch (error) {
        console.error('Lỗi khi tải danh sách nhạc:', error);
        playlist.innerHTML = '<div class="playlist-empty">Không thể tải danh sách nhạc</div>';
    }
}

function renderPlaylist() {
    if (musicFiles.length === 0) {
        playlist.innerHTML = '<div class="playlist-empty">Không có bài nhạc nào</div>';
        return;
    }
    
    playlist.innerHTML = '';
    
    musicFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'playlist-item';
        if (index === currentTrackIndex) {
            item.classList.add('playing');
        }
        
        const playIcon = document.createElement('span');
        playIcon.className = 'play-icon';
        playIcon.textContent = index === currentTrackIndex && !audioPlayer.paused ? '▶' : '▶';
        
        const title = document.createElement('span');
        title.className = 'playlist-item-title';
        // Lấy tên file không có extension
        const fileName = file.replace(/\.mp3$/i, '');
        title.textContent = fileName;
        title.title = fileName;
        
        item.appendChild(playIcon);
        item.appendChild(title);
        
        item.addEventListener('click', () => {
            // Nếu timer đang chạy, phát bài được chọn với loop và reset timer 10 phút
            if (window.timerIsRunning && window.timerIsRunning()) {
                stopMusicRotation();
                playTrack(index, true); // Loop khi timer đang chạy
                musicStartTime = Date.now(); // Reset thời gian bắt đầu
                startMusicRotation(); // Tiếp tục rotation (sẽ đổi sau 10 phút)
            } else {
                playTrack(index, false); // Không loop khi timer không chạy
            }
        });
        
        playlist.appendChild(item);
    });
}

function playTrack(index, loop = false) {
    if (index < 0 || index >= musicFiles.length) return;
    
    currentTrackIndex = index;
    const file = musicFiles[index];
    const filePath = MUSIC_FOLDER + encodeURIComponent(file);
    
    audioPlayer.src = filePath;
    audioPlayer.loop = loop; // Set loop nếu được yêu cầu
    
    audioPlayer.play().catch(error => {
        console.error('Lỗi khi phát nhạc:', error);
    });
    
    // Nếu không loop, khi nhạc kết thúc, tự động phát bài tiếp theo
    if (!loop) {
        audioPlayer.onended = () => {
            const nextIndex = (currentTrackIndex + 1) % musicFiles.length;
            playTrack(nextIndex, false);
        };
    } else {
        // Nếu loop, không cần onended
        audioPlayer.onended = null;
    }
    
    // Cập nhật UI
    audioPlayer.onplay = () => {
        updatePlaylistUI();
    };
    
    audioPlayer.onpause = () => {
        updatePlaylistUI();
    };
    
    updatePlaylistUI();
}

// Phát nhạc ngẫu nhiên với loop
function playRandomTrackWithLoop() {
    if (musicFiles.length === 0) return;
    
    // Chọn bài nhạc ngẫu nhiên (khác bài hiện tại nếu có)
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * musicFiles.length);
    } while (randomIndex === currentTrackIndex && musicFiles.length > 1);
    
    playTrack(randomIndex, true); // Loop = true
    musicStartTime = Date.now(); // Ghi lại thời gian bắt đầu
}

// Đổi bài nhạc mỗi 10 phút
function startMusicRotation() {
    // Xóa interval cũ nếu có
    if (musicChangeInterval) {
        clearInterval(musicChangeInterval);
    }
    
    // Đổi nhạc mỗi 10 phút (600000 milliseconds)
    musicChangeInterval = setInterval(() => {
        if (musicFiles.length > 0) {
            playRandomTrackWithLoop();
        }
    }, 10 * 60 * 1000); // 10 phút
}

// Dừng đổi nhạc tự động
function stopMusicRotation() {
    if (musicChangeInterval) {
        clearInterval(musicChangeInterval);
        musicChangeInterval = null;
    }
}

// Dừng nhạc
function stopMusic() {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    stopMusicRotation();
    musicStartTime = null;
}

// Export các hàm để main.js có thể sử dụng
window.musicPlayer = {
    playRandomTrackWithLoop,
    startMusicRotation,
    stopMusicRotation,
    stopMusic,
    setVolume
};

function updatePlaylistUI() {
    const items = playlist.querySelectorAll('.playlist-item');
    items.forEach((item, index) => {
        item.classList.remove('playing');
        if (index === currentTrackIndex) {
            item.classList.add('playing');
            const playIcon = item.querySelector('.play-icon');
            if (playIcon) {
                playIcon.textContent = !audioPlayer.paused ? '⏸' : '▶';
            }
        } else {
            const playIcon = item.querySelector('.play-icon');
            if (playIcon) {
                playIcon.textContent = '▶';
            }
        }
    });
}

// Ngăn click vào music player kích hoạt timer
const musicPlayer = document.querySelector('.music-player');
musicPlayer.addEventListener('click', (e) => {
    e.stopPropagation(); // Ngăn kích hoạt timer khi click vào music player
});

// Nút làm mới danh sách
refreshBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Ngăn kích hoạt timer khi click
    loadMusicFiles();
});

// Tải danh sách nhạc khi trang được tải
loadMusicFiles();

