/* ================================================================
EL ESCRITORIO DEL COLECCIONISTA - MOTOR COMPLETO Y CORREGIDO
================================================================  */
const CONFIG = {
    objects: [ 
        { word: "MANZANA", emoji: "🍎", image: "assets/manzana.png", sound: "audio/manzana.mp3", category: "fruta", size: 100 },
        { word: "GATO", emoji: "🐱", image: "assets/gato.png", sound: "audio/gato.mp3", category: "animal", size: 100 },
        { word: "PELOTA", emoji: "⚽", image: "assets/pelota.png", sound: "audio/click.mp3", category: "juguete", size: 90 },
        { word: "SOL", emoji: "☀️", image: "assets/sol.png", sound: "audio/sol.mp3", category: "naturaleza", size: 110 },
        { word: "CASA", emoji: "🏠", image: "assets/casa.png", sound: "audio/casa.mp3", category: "lugar", size: 100 },
    ],
    sounds: {
        correct: "audio/correcto.mp3",
        incorrect: "audio/error.mp3",
        click: "audio/click.mp3",
        celebrate: "audio/celebracion.mp3",
        camera: "audio/camara.mp3"
    },
    round: { objectsPerRound: 5, totalRounds: 5, distractors: 4 },
    visuals: { useEmojiFallback: false, objectRotationRange: [-8, 8], polaroidRotationRange: [-5, 5] },
    messages: {
        correct: ["📸 ¡Capturado!", "🎯 ¡Excelente!", "✨ ¡Muy bien!", "🌟 ¡Increíble!", "👏 ¡Genial!"],
        incorrect: ["🤔 ¡Ese no es! Sigue buscando...", "🔍 ¡Mira con tu lupa!", "💪 ¡Tú puedes! Intenta otro..."],
        celebration: "¡Encontraste todos los objetos!"
    }
};

class CollectorDesk {
    constructor(config) {
        this.config = config;
        this.currentRound = 1; this.score = 0; this.foundWords = [];
        this.currentTarget = null; this.isAnimating = false; this.soundEnabled = true;
        this.selectedConsonant = null; this.selectedVowel = null;
        this.dom = {}; this.audio = {};
        this.init();
    }

    init() {
        this.cacheDOM();
        this.loadAudio();
        this.bindEvents();
        this.showScreen('introScreen'); // Inicia en la intro, no en el juego
        this.renderPreview();
    }

    cacheDOM() {
        this.dom = {
            introScreen: document.getElementById('introScreen'),
            menuScreen: document.getElementById('menuScreen'),
            startScreen: document.getElementById('startScreen'),
            gameScreen: document.getElementById('gameScreen'),
            syllablesScreen: document.getElementById('syllablesScreen'),
            vowelsScreen: document.getElementById('vowelsScreen'),
            celebrationScreen: document.getElementById('celebrationScreen'),
            deskSurface: document.getElementById('deskSurface'),
            stickyNoteContainer: document.getElementById('stickyNoteContainer'),
            noteWord: document.getElementById('noteWord'),
            magnifier: document.getElementById('magnifier'),
            cameraFlash: document.getElementById('cameraFlash'),
            polaroidPopup: document.getElementById('polaroidPopup'),
            polaroidImg: document.getElementById('polaroidImg'),
            polaroidCaption: document.getElementById('polaroidCaption'),
            polaroidCheck: document.getElementById('polaroidCheck'),
            feedbackBubble: document.getElementById('feedbackBubble'),
            roundInfo: document.getElementById('roundInfo'),
            albumGrid: document.getElementById('albumGrid'),
            previewItems: document.getElementById('previewItems'),
            confettiContainer: document.getElementById('confettiContainer'),
            stars: [document.getElementById('star1'), document.getElementById('star2'), document.getElementById('star3'), document.getElementById('star4'), document.getElementById('star5')],
            btnIntro: document.getElementById('btnIntro'),
            btnModeGame: document.getElementById('btnModeGame'),
            btnModeSyllables: document.getElementById('btnModeSyllables'),
            btnModeVowels: document.getElementById('btnModeVowels'),
            btnStart: document.getElementById('btnStart'),
            btnBackToMenu: document.getElementById('btnBackToMenu'),
            btnBackSyllables: document.getElementById('btnBackSyllables'),
            btnBackVowels: document.getElementById('btnBackVowels'),
            btnMenuFromCeleb: document.getElementById('btnMenuFromCeleb'),
            btnListen: document.getElementById('btnListen'),
            btnNext: document.getElementById('btnNext'),
            btnRestart: document.getElementById('btnRestart'),
            btnSound: document.getElementById('btnSound'),
            combineResult: document.getElementById('combineResult'),
            btnPlayCombine: document.getElementById('btnPlayCombine')
        };
    }

    loadAudio() {
        const s = this.config.sounds;
        this.audio = { correct: new Audio(s.correct), incorrect: new Audio(s.incorrect), click: new Audio(s.click), celebrate: new Audio(s.celebrate), camera: new Audio(s.camera), word: new Audio() };
        Object.values(this.audio).forEach(a => a.preload = 'auto');
    }

    // SOLO SUENA EN EL JUEGO
    playSound(type) {
        if (!this.soundEnabled || !this.audio[type]) return;
        this.audio[type].currentTime = 0;
        this.audio[type].play().catch(() => {});
    }

    speak(text) {
        if (!this.soundEnabled) return;
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'es-ES'; u.rate = 0.85;
        speechSynthesis.speak(u);
    }

    playWordSound() {
        if (!this.currentTarget) return;
        if (this.currentTarget.sound) {
            this.audio.word.src = this.currentTarget.sound;
            this.audio.word.play().catch(() => {});
        } else {
            this.speak(this.currentTarget.word);
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.dom.btnSound.textContent = this.soundEnabled ? '🔊' : '🔇';
    }

    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(id);
        if (target) target.classList.add('active');
    }

    bindEvents() {
        // Navegación (SIN SONIDOS)
        this.dom.btnIntro.addEventListener('click', () => this.showScreen('menuScreen'));
        this.dom.btnModeGame.addEventListener('click', () => this.showScreen('startScreen'));
        this.dom.btnModeSyllables.addEventListener('click', () => this.showScreen('syllablesScreen'));
        this.dom.btnModeVowels.addEventListener('click', () => this.showScreen('vowelsScreen'));
        this.dom.btnBackToMenu.addEventListener('click', () => this.showScreen('menuScreen'));
        this.dom.btnBackSyllables.addEventListener('click', () => this.showScreen('menuScreen'));
        this.dom.btnBackVowels.addEventListener('click', () => this.showScreen('menuScreen'));
        this.dom.btnMenuFromCeleb.addEventListener('click', () => this.showScreen('menuScreen'));

        // Aprendizaje (Solo voz, sin efectos)
        document.querySelectorAll('.syllable-card').forEach(card => card.addEventListener('click', () => this.speak(card.dataset.syllable)));
        document.querySelectorAll('.vowel-card').forEach(card => {
            const btn = card.querySelector('.btn-play-vowel');
            const speak = () => this.speak(card.dataset.vowel);
            card.addEventListener('click', speak);
            if(btn) btn.addEventListener('click', e => { e.stopPropagation(); speak(); });
        });

        // Combinador de sílabas
        document.querySelectorAll('.consonant-btn').forEach(btn => btn.addEventListener('click', () => {
            this.selectedConsonant = btn.dataset.consonant; this.updateCombine(); this.updateActive();
        }));
        document.querySelectorAll('.vowel-btn').forEach(btn => btn.addEventListener('click', () => {
            this.selectedVowel = btn.dataset.vowel; this.updateCombine(); this.updateActive();
        }));
        this.dom.btnPlayCombine.addEventListener('click', () => {
            if(this.dom.combineResult.textContent !== '?') this.speak(this.dom.combineResult.textContent);
        });

        // JUEGO (CON SONIDOS)
        this.dom.btnStart.addEventListener('click', () => this.startGame());
        this.dom.btnListen.addEventListener('click', e => { e.stopPropagation(); this.playWordSound(); });
        this.dom.btnNext.addEventListener('click', () => { this.playSound('click'); this.nextRound(); });
        this.dom.btnRestart.addEventListener('click', () => { this.playSound('click'); this.restartGame(); });
        this.dom.btnSound.addEventListener('click', () => this.toggleSound());
        
        document.addEventListener('mousemove', e => this.moveMagnifier(e));
        document.addEventListener('touchmove', e => this.moveMagnifierTouch(e), { passive: false });
    }

    updateCombine() {
        this.dom.combineResult.textContent = (this.selectedConsonant && this.selectedVowel) ? (this.selectedConsonant + this.selectedVowel).toUpperCase() : '?';
    }
    updateActive() {
        document.querySelectorAll('.consonant-btn').forEach(b => b.classList.toggle('active', b.dataset.consonant === this.selectedConsonant));
        document.querySelectorAll('.vowel-btn').forEach(b => b.classList.toggle('active', b.dataset.vowel === this.selectedVowel));
    }

    moveMagnifier(e) { this.dom.magnifier.style.left = e.clientX + 'px'; this.dom.magnifier.style.top = e.clientY + 'px'; }
    moveMagnifierTouch(e) { e.preventDefault(); const t = e.touches[0]; this.dom.magnifier.style.left = t.clientX + 'px'; this.dom.magnifier.style.top = t.clientY + 'px'; }

    renderPreview() {
        const items = this.config.objects.slice(0, 5);
        this.dom.previewItems.innerHTML = items.map((obj, i) => `<div class="preview-item" style="--rot:${this.rand(-5,5)}deg; --delay:${i * 0.3}s">${obj.emoji}</div>`).join('');
    }

    startGame() {
        this.playSound('click');
        this.currentRound = 1; this.score = 0; this.foundWords = [];
        this.showScreen('gameScreen');
        this.resetStars(); this.startRound();
    }

    startRound() {
        this.dom.deskSurface.querySelectorAll('.game-object').forEach(el => el.remove());
        const available = this.config.objects.filter(obj => !this.foundWords.includes(obj.word));
        if (available.length === 0) { this.showCelebration(); return; }
        this.currentTarget = this.randomFrom(available);
        this.dom.noteWord.textContent = this.currentTarget.word;
        this.dom.stickyNoteContainer.style.animation = 'none';
        void this.dom.stickyNoteContainer.offsetHeight;
        this.dom.stickyNoteContainer.style.animation = 'noteAppear 0.6s ease';
        this.dom.roundInfo.textContent = `Ronda ${this.currentRound} de ${this.config.round.totalRounds}`;
        requestAnimationFrame(() => this.generateDeskObjects());
    }

    generateDeskObjects() {
        const desk = this.dom.deskSurface;
        const rect = desk.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) { requestAnimationFrame(() => this.generateDeskObjects()); return; }
        
        const others = this.config.objects.filter(o => o.word !== this.currentTarget.word);
        let objects = [this.currentTarget, ...this.shuffleArray(others).slice(0, this.config.round.distractors)];
        objects = this.shuffleArray(objects);
        const placed = []; const size = 120;

        objects.forEach(obj => {
            let pos, attempts = 0, valid = false;
            while (!valid && attempts < 100) {
                pos = { x: this.rand(10, rect.width - size), y: this.rand(10, rect.height - size) };
                valid = !placed.some(p => Math.abs(p.x - pos.x) < size && Math.abs(p.y - pos.y) < size);
                attempts++;
            }
            placed.push(pos || { x: 50, y: 50 });
            desk.appendChild(this.createObjectElement(obj, placed[placed.length-1].x, placed[placed.length-1].y));
        });
    }

    createObjectElement(obj, x, y) {
        const el = document.createElement('div');
        el.className = 'game-object';
        el.style.left = x + 'px'; el.style.top = y + 'px';
        el.style.setProperty('--obj-size', obj.size + 'px');
        el.style.transform = `rotate(${this.rand(-8, 8)}deg)`;
        
        const useImg = obj.image && !this.config.visuals.useEmojiFallback;
        if (useImg) {
            el.innerHTML = `
                <img class="obj-image" src="${obj.image}" alt="${obj.word}">
                <span class="obj-emoji-fallback" style="display:none;font-size:${obj.size*0.7}px;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;">${obj.emoji}</span>`;
            el.querySelector('img').onerror = function() { this.style.display='none'; this.nextElementSibling.style.display='block'; };
        } else {
            el.innerHTML = `<div class="obj-image" style="display:flex;align-items:center;justify-content:center;font-size:${obj.size*0.7}px;">${obj.emoji}</div>`;
        }

        const clickHandler = e => { e.preventDefault(); e.stopPropagation(); this.handleObjectClick(obj, el); };
        el.addEventListener('click', clickHandler);
        el.addEventListener('touchend', clickHandler);
        return el; // CORREGIDO
    }

    handleObjectClick(obj, el) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        if (obj.word === this.currentTarget.word) {
            this.playSound('camera');
            setTimeout(() => this.playSound('correct'), 200);
            this.dom.cameraFlash.classList.add('active');
            setTimeout(() => this.dom.cameraFlash.classList.remove('active'), 400);
            el.classList.add('found');
            this.foundWords.push(obj.word);
            this.score++; this.updateStars();
            setTimeout(() => { this.showPolaroid(obj); this.isAnimating = false; }, 800);
        } else {
            this.playSound('incorrect');
            el.classList.add('wrong');
            this.dom.feedbackBubble.querySelector('p').textContent = this.randomFrom(this.config.messages.incorrect);
            this.dom.feedbackBubble.classList.add('active');
            setTimeout(() => {
                this.dom.feedbackBubble.classList.remove('active');
                el.classList.remove('wrong');
                this.isAnimating = false;
            }, 1500);
        }
    }

    showPolaroid(obj) {
        const useImg = obj.image && !this.config.visuals.useEmojiFallback;
        this.dom.polaroidImg.innerHTML = useImg ? `<img src="${obj.image}">` : `<span>${obj.emoji}</span>`;
        this.dom.polaroidCaption.textContent = obj.word;
        this.dom.polaroidPopup.style.setProperty('--polaroid-rot', this.rand(-5, 5) + 'deg');
        this.dom.polaroidPopup.classList.add('active');
    }

    nextRound() {
        this.dom.polaroidPopup.classList.remove('active');
        this.currentRound++;
        if (this.currentRound > this.config.round.totalRounds || this.foundWords.length >= this.config.objects.length) {
            this.showCelebration();
        } else {
            this.startRound();
        }
    }

    showCelebration() {
        this.playSound('celebrate');
        this.showScreen('celebrationScreen');
        this.renderAlbum();
        this.launchConfetti();
    }

    renderAlbum() { // CORREGIDO
        this.dom.albumGrid.innerHTML = this.foundWords.map((word, i) => {
            const obj = this.config.objects.find(o => o.word === word);
            const useImg = obj.image && !this.config.visuals.useEmojiFallback;
            return `<div class="album-item" style="--rot:${this.rand(-8,8)}deg; --delay:${i*0.2}s">
                        <div class="album-item-img">${useImg ? `<img src="${obj.image}">` : obj.emoji}</div>
                        <div class="album-item-name">${word}</div>
                    </div>`;
        }).join('');
    }

    launchConfetti() {
        this.dom.confettiContainer.innerHTML = '';
        const colors = ['#FFD700','#FF6B6B','#4ECDC4','#45B7D1','#FFA07A','#98D8C8','#F7DC6F'];
        for (let i = 0; i < 60; i++) {
            const c = document.createElement('div');
            c.className = 'confetti';
            c.style.left = this.rand(0, 100) + '%';
            c.style.backgroundColor = this.randomFrom(colors);
            c.style.width = this.rand(6, 14) + 'px';
            c.style.height = this.rand(6, 14) + 'px';
            c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            c.style.animationDuration = this.rand(2, 5) + 's';
            c.style.animationDelay = this.rand(0, 3) + 's';
            this.dom.confettiContainer.appendChild(c);
        }
    }

    restartGame() {
        this.currentRound = 1; this.score = 0; this.foundWords = [];
        this.showScreen('startScreen'); this.renderPreview();
    }
    resetStars() { this.dom.stars.forEach(s => { s.textContent = '☆'; s.classList.remove('earned'); }); }
    updateStars() { if (this.score <= 5 && this.dom.stars[this.score - 1]) { const s = this.dom.stars[this.score - 1]; s.textContent = '★'; s.classList.add('earned'); } }
    
    rand(min, max) { return Math.random() * (max - min) + min; }
    randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    shuffleArray(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
}

document.addEventListener('DOMContentLoaded', () => { window.game = new CollectorDesk(CONFIG); });