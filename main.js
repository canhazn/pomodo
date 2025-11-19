let WORK_TIME = 10 * 60; // thời gian làm việc mặc định (giây)
let timeLeft = WORK_TIME;
let isRunning = false;
let interval = null;
let wakeLock = null; // Screen Wake Lock handle

const timerDisplay = document.getElementById('timer');
const body = document.body;

async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator && wakeLock == null) {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLock.addEventListener('release', () => {
                wakeLock = null;
            });
        }
    } catch (err) {
        // Wake Lock có thể không được hỗ trợ hoặc bị chặn
    }
}

async function releaseWakeLock() {
    try {
        if (wakeLock) {
            await wakeLock.release();
            wakeLock = null;
        }
    } catch (_) {
        // ignore
    }
}

// Tự động xin lại wake lock khi trở lại tab
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isRunning) {
        requestWakeLock();
    }
});

function formatTime(seconds) {
    const absSeconds = Math.abs(seconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateDisplay() {
    timerDisplay.textContent = formatTime(timeLeft);
    document.title = formatTime(timeLeft);
}

function startTimer() {
    isRunning = true;
    body.classList.add('running');
    requestWakeLock();
    
    // Bắt đầu phát nhạc khi timer chạy
    if (window.musicPlayer && window.musicPlayer.playRandomTrackWithLoop) {
        window.musicPlayer.playRandomTrackWithLoop();
        window.musicPlayer.startMusicRotation(); // Bắt đầu đổi nhạc mỗi 10 phút
    }
    
    interval = setInterval(() => {
        timeLeft--;
        
        if (timeLeft === 0) {
            playSound();
        }
        
        updateDisplay();
    }, 1000);
}

function stopAndReset() {
    isRunning = false;
    body.classList.remove('running');
    clearInterval(interval);
    timeLeft = WORK_TIME;
    updateDisplay();
    releaseWakeLock();
    
    // Dừng nhạc khi timer dừng
    if (window.musicPlayer && window.musicPlayer.stopMusic) {
        window.musicPlayer.stopMusic();
    }
}

function playSound() {
    const audio = new Audio('https://pomofocus.io/audios/alarms/alarm-wood.mp3');
    audio.play();
}

function resetTimer() {
    stopAndReset();
}

body.addEventListener('click', () => {
    if (isRunning) {
        stopAndReset();
    } else {
        startTimer();
    }
});

// Export hàm để kiểm tra timer có đang chạy
window.timerIsRunning = () => isRunning;

updateDisplay();

