// ===== DOM Elements =====
const langToggle = document.getElementById('langToggle');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const projectModal = document.getElementById('projectModal');
const modalClose = document.getElementById('modalClose');
const contactForm = document.getElementById('contactForm');

const siteBot = document.getElementById('siteBot');
const botBubble = document.getElementById('botBubble');
const botStatus = document.getElementById('botStatus');
const botReplay = document.getElementById('botReplay');
const botVoice = document.getElementById('botVoice');
const botPin = document.getElementById('botPin');
const botClose = document.getElementById('botClose');
const botAvatar = document.getElementById('botAvatar');
const themeToggle = document.getElementById('themeToggle');

// ===== State =====
let currentLang = localStorage.getItem('lang') || 'en';
const languageOrder = ['en', 'tr', 'ar'];
let istanbulIsNight = false;
let themeMode = localStorage.getItem('themeMode') || 'auto';
const themeOrder = ['auto', 'light', 'dark'];
let themeClockInterval = null;
let botVoiceEnabled = localStorage.getItem('botVoiceEnabled') !== '0';
let botPinned = localStorage.getItem('botPinned') === '1';
let speechVoices = [];
let lastSpokenMessage = '';
let lastSpokenAt = 0;
let currentBotAudio = null;
let hasUserInteracted = false;

const botAudioMap = {
    en: {
        sleeping: 'en-sleeping.wav',
        awake: 'en-awake.wav',
        startIntro: 'en-startIntro.wav',
        paused: 'en-paused.wav',
        tourDone: 'en-tourDone.wav',
        'steps.home': 'en-steps-home.wav',
        'steps.about': 'en-steps-about.wav',
        'steps.skills': 'en-steps-skills.wav',
        'steps.projects': 'en-steps-projects.wav',
        'steps.contact': 'en-steps-contact.wav'
    },
    tr: {
        awake: 'tr-awake.mp3',
        startIntro: 'tr-startIntro.mp3',
        paused: 'tr-pausedIntro.mp3',
        tourDone: 'tr-tourDone.mp3',
        'steps.home': 'tr-steps-home.mp3',
        'steps.about': 'tr-steps-about.mp3',
        'steps.skills': 'tr-steps-skills-projects.mp3',
        'steps.projects': 'tr-steps-skills-projects.mp3',
        'steps.contact': 'tr-steps-contact.mp3'
    },
    ar: {}
};

const botState = {
    steps: ['home', 'about', 'skills', 'projects', 'contact'],
    stepIndex: 0,
    tourTimer: null,
    tourActive: false,
    tourPaused: false,
    focusedSectionId: null,
    interactionHandler: null,
    sessionId: null,
    flightTimer: null,
    flightRaf: null,
    isHovering: false,
    isFlying: false,
    narrationRunId: 0,
    isDragging: false,
    dragMoved: false,
    dragOffsetX: 0,
    dragOffsetY: 0
};

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    
    initLanguage();
    initThemeToggle();
    initIstanbulThemeClock();
    initParticles();
    initScrollAnimations();
    initProjectReveal();
    initMobileMenu();
    initProjectModal();
    initSiteBot();
    initContactForm();
    initBeforeAfterComparisons();
    initSmoothScroll();
});

// ===== Language System =====
function initLanguage() {
    if (!translations[currentLang]) {
        currentLang = 'en';
    }
    updateLanguage(currentLang);
    updateLangToggleUI();

    if (langToggle) {
        langToggle.addEventListener('click', () => {
            const idx = languageOrder.indexOf(currentLang);
            const nextIdx = idx === -1 ? 0 : (idx + 1) % languageOrder.length;
            currentLang = languageOrder[nextIdx];
            localStorage.setItem('lang', currentLang);
            updateLanguage(currentLang);
            updateLangToggleUI();
        });
    }
}

function updateLanguage(lang) {
    const t = translations[lang];
    if (!t) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const value = getNestedValue(t, key);
        if (value) el.textContent = value;
    });

    document.documentElement.lang = lang;
    const isRtl = lang === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.body.classList.toggle('rtl', isRtl);

    refreshBotLanguage();
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : null, obj);
}

function updateLangToggleUI() {
    if (!langToggle) return;
    const active = langToggle.querySelector('.lang-active');
    const inactive = langToggle.querySelector('.lang-inactive');
    if (!active || !inactive) return;

    const idx = languageOrder.indexOf(currentLang);
    const next = languageOrder[(idx + 1) % languageOrder.length];
    active.textContent = currentLang.toUpperCase();
    inactive.textContent = next.toUpperCase();
}

// ===== Theme Toggle =====
function initThemeToggle() {
    if (!themeToggle) return;
    applyThemeMode();
    themeToggle.setAttribute('data-mode', themeMode);

    themeToggle.addEventListener('click', () => {
        const idx = themeOrder.indexOf(themeMode);
        themeMode = themeOrder[(idx + 1) % themeOrder.length];
        localStorage.setItem('themeMode', themeMode);
        themeToggle.setAttribute('data-mode', themeMode);
        applyThemeMode();
    });
}

function applyThemeMode() {
    document.body.classList.remove('theme-night', 'theme-manual-light', 'theme-manual-dark');

    if (themeMode === 'light') {
        document.body.classList.add('theme-manual-light');
    } else if (themeMode === 'dark') {
        document.body.classList.add('theme-manual-dark');
    } else {
        if (istanbulIsNight) {
            document.body.classList.add('theme-night');
        }
    }
}

// ===== Istanbul Theme Clock =====
function initIstanbulThemeClock() {
    applyIstanbulThemeNow();
    if (themeClockInterval) clearInterval(themeClockInterval);
    themeClockInterval = setInterval(applyIstanbulThemeNow, 60000);
}

function getIstanbulHour() {
    try {
        const formatter = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Europe/Istanbul',
            hour: '2-digit',
            hour12: false
        });
        return Number.parseInt(formatter.format(new Date()), 10);
    } catch (error) {
        return new Date().getHours();
    }
}

function applyIstanbulThemeNow() {
    const hour = getIstanbulHour();
    const nextIsNight = hour >= 0 && hour < 7;
    const changed = nextIsNight !== istanbulIsNight;

    istanbulIsNight = nextIsNight;

    if (themeMode === 'auto') {
        document.body.classList.toggle('theme-night', istanbulIsNight);
    }

    if (changed) {
        refreshBotLanguage();
    }
}

// ===== Particles =====
function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const count = window.matchMedia('(max-width: 768px)').matches ? 20 : 50;

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        container.appendChild(particle);
    }
}

// ===== Scroll Animations =====
function initScrollAnimations() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    elements.forEach(el => observer.observe(el));
}

// ===== Project Reveal Sequence =====
function initProjectReveal() {
    const projectCards = document.querySelectorAll('.projects-grid .project-card');

    projectCards.forEach((card, index) => {
        card.style.setProperty('--reveal-delay', `${index * 120}ms`);
    });
}

// ===== Mobile Menu =====
function initMobileMenu() {
    if (!mobileMenuBtn || !mobileMenu) return;

    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
    });

    document.querySelectorAll('.mobile-nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
        });
    });
}

function initBeforeAfterComparisons() {
    const compareFrames = document.querySelectorAll('[data-compare]');
    if (!compareFrames.length) return;

    compareFrames.forEach((frame) => {
        const slider = frame.querySelector('.compare-slider');
        if (!slider) return;

        const updatePosition = () => {
            frame.style.setProperty('--compare-position', `${slider.value}%`);
        };

        updatePosition();
        slider.addEventListener('input', updatePosition);
        slider.addEventListener('change', updatePosition);
    });
}

// ===== Project Modal =====
function initProjectModal() {
    if (!projectModal || !modalClose) return;
    const projectCards = document.querySelectorAll('.project-card[data-project]');

    projectCards.forEach(card => {
        card.addEventListener('click', () => {
            const projectId = card.getAttribute('data-project');
            openProjectModal(projectId);
        });
    });

    modalClose.addEventListener('click', closeProjectModal);
    const modalOverlay = projectModal.querySelector('.modal-overlay');
    if (modalOverlay) modalOverlay.addEventListener('click', closeProjectModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && projectModal.classList.contains('active')) {
            closeProjectModal();
        }
    });
}

function openProjectModal(projectId) {
    const t = translations[currentLang].projects[`project${projectId}`];
    const pData = projectsData[projectId];
    if (!t || !pData) return;

    document.getElementById('modalImage').style.background = pData.gradient;
    document.getElementById('modalTitle').textContent = t.title;
    document.getElementById('modalDescription').textContent = t.description;

    const modalIframe = document.getElementById('modalIframe');
    if (pData.demoUrl) {
        modalIframe.src = pData.demoUrl;
        modalIframe.style.display = 'block';
    } else {
        modalIframe.style.display = 'none';
    }

    const techContainer = document.getElementById('modalTech');
    techContainer.innerHTML = pData.tech.map(tech => `<span>${tech}</span>`).join('');

    const featuresContainer = document.getElementById('modalFeatures');
    featuresContainer.innerHTML = t.features.map(f => `<li>${f}</li>`).join('');

    const demoBtn = document.getElementById('modalDemo');
    const codeBtn = document.getElementById('modalCode');

    if (pData.demoUrl) {
        demoBtn.href = pData.demoUrl;
        demoBtn.style.display = 'inline-flex';
    } else {
        demoBtn.style.display = 'none';
    }

    codeBtn.style.display = 'none';

    projectModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
    if (!projectModal) return;

    projectModal.classList.remove('active');
    document.body.style.overflow = '';

    setTimeout(() => {
        const iframe = document.getElementById('modalIframe');
        if (iframe) iframe.src = '';
    }, 300);
}

// ===== Site Bot =====
function initSiteBot() {
    if (!siteBot || !botBubble || !botStatus || !botReplay || !botClose || !botAvatar || !botVoice || !botPin) return;

    botState.sessionId = sessionStorage.getItem('botSessionId') || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('botSessionId', botState.sessionId);

    const hiddenSessionId = localStorage.getItem('botHidden');
    if (hiddenSessionId && hiddenSessionId === botState.sessionId) {
        siteBot.classList.add('bot-minimized');
    }

    botReplay.addEventListener('click', () => {
        siteBot.classList.remove('bot-minimized');
        localStorage.removeItem('botHidden');
        startGuidedTour(true);
    });

    botVoice.addEventListener('click', () => {
        botVoiceEnabled = !botVoiceEnabled;
        localStorage.setItem('botVoiceEnabled', botVoiceEnabled ? '1' : '0');
        updateBotVoiceButtonLabel();

        if (!botVoiceEnabled && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            stopBotAudioPlayback();
        } else if (botVoiceEnabled) {
            speakBotMessage(botBubble.textContent);
        }
    });

    botPin.addEventListener('click', () => {
        setBotPinned(!botPinned);
    });

    botClose.addEventListener('click', () => {
        stopGuidedTour();
        siteBot.classList.add('bot-minimized');
        localStorage.setItem('botHidden', botState.sessionId);
    });

    botAvatar.addEventListener('click', () => {
        if (botState.dragMoved) {
            botState.dragMoved = false;
            return;
        }

        if (siteBot.classList.contains('bot-minimized')) {
            siteBot.classList.remove('bot-minimized');
            localStorage.removeItem('botHidden');
            refreshBotLanguage();
            return;
        }

        if (istanbulIsNight) {
            showBotMessage(getBotMessages().sleeping, true, 'sleeping');
            return;
        }

        if (botState.tourActive && botState.tourPaused) {
            botState.tourPaused = false;
            queueNextStep(700);
            return;
        }

        if (botState.tourActive) {
            clearTimeout(botState.tourTimer);
            runTourStep();
            return;
        }

        const awakeMessage = getBotMessages().awake;
        showBotMessage(awakeMessage, false);
        startGuidedTour(true);
    });

    botAvatar.addEventListener('pointerdown', onBotDragStart);

    siteBot.addEventListener('mouseenter', () => {
        botState.isHovering = true;
    });

    siteBot.addEventListener('mouseleave', () => {
        botState.isHovering = false;
    });

    const markInteraction = () => {
        hasUserInteracted = true;
        window.removeEventListener('pointerdown', markInteraction);
        window.removeEventListener('keydown', markInteraction);
        window.removeEventListener('touchstart', markInteraction);
    };
    window.addEventListener('pointerdown', markInteraction, { once: true, passive: true });
    window.addEventListener('keydown', markInteraction, { once: true });
    window.addEventListener('touchstart', markInteraction, { once: true, passive: true });

    window.addEventListener('resize', clampBotToViewport);

    refreshBotLanguage();
    initBotSpeech();
    updateBotVoiceButtonLabel();
    updateBotPinButtonLabel();
    if (!applySavedBotPosition()) {
        setBotInitialPosition();
    }
    if (!botPinned) {
        startBotFlight();
    } else {
        stopBotFlight();
    }

    // Guide starts only on explicit user tap on the bot.
}

function startBotFlight() {
    if (botPinned || botState.tourActive) return;
    scheduleNextBotFlight(1200);
}

function scheduleNextBotFlight(delay) {
    clearTimeout(botState.flightTimer);
    botState.flightTimer = setTimeout(() => {
        moveBotRandomly();
    }, delay);
}

function moveBotRandomly() {
    if (!siteBot) return;

    if (botPinned || botState.tourActive || document.hidden || botState.isHovering || botState.isFlying || botState.isDragging) {
        scheduleNextBotFlight(1300);
        return;
    }

    const bounds = getBotFlightBounds();
    const nextX = randomBetween(bounds.minX, bounds.maxX);
    const nextY = randomBetween(bounds.minY, bounds.maxY);
    const duration = randomBetween(2600, 4200);
    flyBotAlongArc(nextX, nextY, duration, () => {
        scheduleNextBotFlight(randomBetween(550, 1500));
    });
}

function setBotInitialPosition() {
    if (!siteBot) return;
    const bounds = getBotFlightBounds();
    const startX = bounds.maxX;
    const startY = bounds.maxY;
    setBotPosition(startX, startY, false);
    persistBotPosition();
}

function clampBotToViewport() {
    if (!siteBot) return;
    const bounds = getBotFlightBounds();

    const currentX = Number.parseFloat(siteBot.style.left);
    const currentY = Number.parseFloat(siteBot.style.top);
    const hasPosition = Number.isFinite(currentX) && Number.isFinite(currentY);

    if (!hasPosition) {
        setBotInitialPosition();
        return;
    }

    const clampedX = Math.min(bounds.maxX, Math.max(bounds.minX, currentX));
    const clampedY = Math.min(bounds.maxY, Math.max(bounds.minY, currentY));
    setBotPosition(clampedX, clampedY, false);
    persistBotPosition();
}

function getBotFlightBounds() {
    const rect = siteBot.getBoundingClientRect();
    const margin = 10;
    const minX = margin;
    const minY = 90;
    const maxX = Math.max(minX, window.innerWidth - rect.width - margin);
    const maxY = Math.max(minY, window.innerHeight - rect.height - margin);
    return { minX, minY, maxX, maxY };
}

function setBotPosition(x, y, animate) {
    if (!siteBot) return;

    siteBot.style.right = 'auto';
    siteBot.style.bottom = 'auto';

    if (!animate) {
        const prevTransition = siteBot.style.transition;
        siteBot.style.transition = 'none';
        siteBot.style.left = `${x}px`;
        siteBot.style.top = `${y}px`;
        siteBot.offsetHeight;
        siteBot.style.transition = prevTransition;
        return;
    }

    siteBot.style.left = `${x}px`;
    siteBot.style.top = `${y}px`;
}

function enterGuidedMode(sectionEl = null) {
    if (!siteBot) return;
    stopBotFlight();
    siteBot.classList.add('guided-mode');
    moveBotToGuidedSpot(sectionEl);
}

function exitGuidedMode() {
    if (!siteBot) return;
    siteBot.classList.remove('guided-mode');
    if (!botPinned && !botState.isDragging && !siteBot.classList.contains('bot-minimized')) {
        startBotFlight();
    }
}

function moveBotToGuidedSpot(sectionEl = null) {
    if (!siteBot) return;
    const bounds = getBotFlightBounds();
    const rtl = document.documentElement.dir === 'rtl';
    const targetX = rtl ? bounds.minX : bounds.maxX;
    let targetY = bounds.minY + 24;

    if (sectionEl) {
        const sectionTop = sectionEl.getBoundingClientRect().top;
        targetY = Math.min(bounds.maxY, Math.max(bounds.minY, sectionTop + 24));
    }

    const currentX = Number.parseFloat(siteBot.style.left);
    const currentY = Number.parseFloat(siteBot.style.top);
    if (!Number.isFinite(currentX) || !Number.isFinite(currentY)) {
        setBotPosition(targetX, targetY, false);
        persistBotPosition();
        return;
    }

    flyBotAlongArc(targetX, targetY, 850, () => {
        persistBotPosition();
    });
}

function setBotPinned(nextPinned) {
    botPinned = !!nextPinned;
    localStorage.setItem('botPinned', botPinned ? '1' : '0');
    updateBotPinButtonLabel();

    if (botPinned) {
        stopBotFlight();
        persistBotPosition();
    } else {
        startBotFlight();
    }
}

function updateBotPinButtonLabel() {
    if (!botPin) return;
    const botCopy = translations[currentLang]?.bot || translations.en.bot;
    const pinText = botCopy.pin || 'Lock Position';
    const unpinText = botCopy.unpin || 'Auto Move';
    botPin.textContent = botPinned ? unpinText : pinText;
}

function stopBotFlight() {
    clearTimeout(botState.flightTimer);
    if (botState.flightRaf) {
        cancelAnimationFrame(botState.flightRaf);
        botState.flightRaf = null;
    }
    botState.isFlying = false;
}

function persistBotPosition() {
    if (!siteBot) return;
    const x = Number.parseFloat(siteBot.style.left);
    const y = Number.parseFloat(siteBot.style.top);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    localStorage.setItem('botPosX', String(Math.round(x)));
    localStorage.setItem('botPosY', String(Math.round(y)));
}

function applySavedBotPosition() {
    const savedX = Number.parseFloat(localStorage.getItem('botPosX'));
    const savedY = Number.parseFloat(localStorage.getItem('botPosY'));
    if (!Number.isFinite(savedX) || !Number.isFinite(savedY)) return false;
    setBotPosition(savedX, savedY, false);
    clampBotToViewport();
    return true;
}

function onBotDragStart(e) {
    if (!siteBot || !botAvatar) return;
    if (e.button !== undefined && e.button !== 0) return;

    stopBotFlight();
    botState.isDragging = true;
    botState.dragMoved = false;

    const rect = siteBot.getBoundingClientRect();
    botState.dragOffsetX = e.clientX - rect.left;
    botState.dragOffsetY = e.clientY - rect.top;
    siteBot.classList.add('dragging');

    if (botAvatar.setPointerCapture && e.pointerId !== undefined) {
        try {
            botAvatar.setPointerCapture(e.pointerId);
        } catch (_) { }
    }

    window.addEventListener('pointermove', onBotDragMove);
    window.addEventListener('pointerup', onBotDragEnd, { once: true });
    window.addEventListener('pointercancel', onBotDragEnd, { once: true });
}

function onBotDragMove(e) {
    if (!botState.isDragging || !siteBot) return;

    const bounds = getBotFlightBounds();
    const x = Math.min(bounds.maxX, Math.max(bounds.minX, e.clientX - botState.dragOffsetX));
    const y = Math.min(bounds.maxY, Math.max(bounds.minY, e.clientY - botState.dragOffsetY));

    setBotPosition(x, y, false);
    botState.dragMoved = true;
}

function onBotDragEnd() {
    if (!siteBot) return;

    botState.isDragging = false;
    siteBot.classList.remove('dragging');
    window.removeEventListener('pointermove', onBotDragMove);
    persistBotPosition();

    if (botState.dragMoved) {
        setBotPinned(true);
    } else if (!botPinned) {
        startBotFlight();
    }
}

function flyBotAlongArc(targetX, targetY, duration, onComplete) {
    if (!siteBot) return;

    const startX = Number.parseFloat(siteBot.style.left);
    const startY = Number.parseFloat(siteBot.style.top);
    const fromX = Number.isFinite(startX) ? startX : 20;
    const fromY = Number.isFinite(startY) ? startY : 20;

    const dx = targetX - fromX;
    const dy = targetY - fromY;
    const distance = Math.hypot(dx, dy);

    const midX = (fromX + targetX) / 2;
    const midY = (fromY + targetY) / 2;

    // Curved path via perpendicular offset from midpoint.
    const nx = distance > 0 ? -dy / distance : 0;
    const ny = distance > 0 ? dx / distance : 0;
    const curveStrength = Math.min(180, Math.max(50, distance * 0.35));
    const arcSign = Math.random() > 0.5 ? 1 : -1;
    const controlX = midX + nx * curveStrength * arcSign;
    const controlY = midY + ny * curveStrength * arcSign;

    const startTime = performance.now();
    botState.isFlying = true;
    if (botState.flightRaf) cancelAnimationFrame(botState.flightRaf);

    const frame = (now) => {
        const tRaw = Math.min(1, (now - startTime) / duration);
        const t = easeInOutSine(tRaw);
        const invT = 1 - t;

        // Quadratic Bezier position.
        const x = (invT * invT * fromX) + (2 * invT * t * controlX) + (t * t * targetX);
        const y = (invT * invT * fromY) + (2 * invT * t * controlY) + (t * t * targetY);
        setBotPosition(x, y, false);

        // Derivative gives heading for natural rotation.
        const tx = 2 * invT * (controlX - fromX) + 2 * t * (targetX - controlX);
        const ty = 2 * invT * (controlY - fromY) + 2 * t * (targetY - controlY);
        const angle = Math.atan2(ty, tx) * (180 / Math.PI);
        siteBot.style.setProperty('--bot-rot', `${angle * 0.12}deg`);

        if (tRaw < 1) {
            botState.flightRaf = requestAnimationFrame(frame);
            return;
        }

        botState.isFlying = false;
        botState.flightRaf = null;
        if (typeof onComplete === 'function') onComplete();
    };

    botState.flightRaf = requestAnimationFrame(frame);
}

function easeInOutSine(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
}

function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getBotMessages() {
    const bot = translations[currentLang]?.bot || translations.en.bot;
    return {
        sleeping: bot.sleeping,
        awake: bot.awake,
        startIntro: bot.startIntro,
        paused: bot.paused,
        tourDone: bot.tourDone,
        steps: bot.steps || {}
    };
}

function initBotSpeech() {
    if (!('speechSynthesis' in window)) return;

    speechVoices = window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
        speechVoices = window.speechSynthesis.getVoices();
    };
}

function updateBotVoiceButtonLabel() {
    if (!botVoice) return;
    const botCopy = translations[currentLang]?.bot || translations.en.bot;
    const onText = botCopy.voiceOn || 'Voice: On';
    const offText = botCopy.voiceOff || 'Voice: Off';
    botVoice.textContent = botVoiceEnabled ? onText : offText;
}

function getSpeechLangCode(lang) {
    if (lang === 'tr') return 'tr-TR';
    if (lang === 'ar') return 'ar-SA';
    return 'en-US';
}

function pickBestVoice(langCode) {
    if (!speechVoices.length) return null;
    const prefix = langCode.split('-')[0].toLowerCase();

    const exact = speechVoices.find(v => (v.lang || '').toLowerCase() === langCode.toLowerCase());
    if (exact) return exact;

    const byPrefix = speechVoices.find(v => (v.lang || '').toLowerCase().startsWith(prefix));
    if (byPrefix) return byPrefix;

    return speechVoices[0];
}

function stopBotAudioPlayback() {
    if (!currentBotAudio) return;
    currentBotAudio.pause();
    currentBotAudio.currentTime = 0;
    currentBotAudio = null;
}

function playBotAudio(audioKey) {
    if (!audioKey || !botVoiceEnabled) return Promise.resolve(false);
    const map = botAudioMap[currentLang] || {};
    const fileName = map[audioKey];
    if (!fileName) return Promise.resolve(false);

    stopBotAudioPlayback();
    const audio = new Audio(fileName);
    audio.preload = 'auto';
    currentBotAudio = audio;

    return new Promise((resolve) => {
        let settled = false;
        const finish = (ok) => {
            if (settled) return;
            settled = true;
            resolve(ok);
        };

        audio.onended = () => {
            if (currentBotAudio === audio) currentBotAudio = null;
            finish(true);
        };
        audio.onerror = () => {
            if (currentBotAudio === audio) currentBotAudio = null;
            finish(false);
        };

        audio.play().then(() => {
            // Wait for onended to resolve true.
        }).catch(() => {
            if (currentBotAudio === audio) currentBotAudio = null;
            finish(false);
        });
    });
}

function speakBotMessage(message, audioKey = null) {
    if (!botVoiceEnabled || !message) return Promise.resolve(false);
    if (siteBot && siteBot.classList.contains('bot-minimized')) return Promise.resolve(false);
    const map = botAudioMap[currentLang] || {};
    const hasAudioFile = !!(audioKey && map[audioKey]);
    if (!hasUserInteracted && hasAudioFile) return Promise.resolve(false);

    const now = Date.now();
    const normalized = message.trim();
    if (!normalized) return Promise.resolve(false);

    if (normalized === lastSpokenMessage && now - lastSpokenAt < 1200) return Promise.resolve(false);
    lastSpokenMessage = normalized;
    lastSpokenAt = now;

    return playBotAudio(audioKey).then((playedAudio) => {
        if (playedAudio) return true;
        if (hasAudioFile && !hasUserInteracted) return false;
        if (!('speechSynthesis' in window)) return false;

        const utterance = new SpeechSynthesisUtterance(normalized);
        utterance.lang = getSpeechLangCode(currentLang);
        const voice = pickBestVoice(utterance.lang);
        if (voice) utterance.voice = voice;

        utterance.rate = currentLang === 'ar' ? 0.95 : 1;
        utterance.pitch = 1;

        return new Promise((resolve) => {
            let done = false;
            const finish = (spoken) => {
                if (done) return;
                done = true;
                resolve(spoken);
            };

            const fallbackMs = getEstimatedNarrationMs(normalized) + 600;
            const fallbackTimer = setTimeout(() => finish(true), fallbackMs);

            utterance.onend = () => {
                clearTimeout(fallbackTimer);
                finish(true);
            };
            utterance.onerror = () => {
                clearTimeout(fallbackTimer);
                finish(false);
            };

            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        });
    });
}

function getEstimatedNarrationMs(text) {
    const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
    return Math.min(14000, Math.max(1800, 700 + words * 330));
}

function waitForNarration(message, audioKey = null) {
    const estimated = getEstimatedNarrationMs(message);
    return speakBotMessage(message, audioKey).then((spoken) => {
        if (spoken) return true;
        return new Promise(resolve => setTimeout(() => resolve(false), estimated));
    });
}

function getGuideCardTargets(sectionId) {
    if (!sectionId) return [];
    const map = {
        home: '',
        about: '#about .stat-card',
        skills: '#skills .skill-card',
        projects: '#projects .project-card',
        contact: '#contact .contact-method, #contact .contact-form'
    };
    const selector = map[sectionId];
    if (!selector) return [];
    return Array.from(document.querySelectorAll(selector));
}

function setGuideCardHighlight(sectionId, active) {
    const targets = getGuideCardTargets(sectionId);
    targets.forEach((el, idx) => {
        el.style.setProperty('--guide-delay', `${idx * 90}ms`);
        el.classList.toggle('guide-card-active', !!active);
    });
}

function refreshBotLanguage() {
    if (!siteBot || !botBubble || !botStatus) return;

    const messages = getBotMessages();

    if (istanbulIsNight) {
        botStatus.textContent =
            currentLang === 'tr' ? 'uyku' :
            currentLang === 'ar' ? 'نائم' :
            'sleeping';
        if (!botState.tourActive) showBotMessage(messages.sleeping, true, 'sleeping');
        updateBotVoiceButtonLabel();
        updateBotPinButtonLabel();
        return;
    }

    botStatus.textContent =
        currentLang === 'tr' ? 'aktif' :
        currentLang === 'ar' ? 'نشط' :
        'online';
    if (!botState.tourActive) {
        const tourDone = localStorage.getItem('botTourCompleted') === '1';
        const initialMessage = tourDone ? messages.awake : messages.startIntro;
        if (tourDone) {
            // Keep awake text visible but never speak it.
            showBotMessage(initialMessage, false);
        } else {
            showBotMessage(initialMessage, true, 'startIntro');
        }
    } else if (botState.tourPaused) {
        showBotMessage(messages.paused, true, 'paused');
    } else if (botState.focusedSectionId && messages.steps[botState.focusedSectionId]) {
        showBotMessage(messages.steps[botState.focusedSectionId], true, `steps.${botState.focusedSectionId}`);
    }
    updateBotVoiceButtonLabel();
    updateBotPinButtonLabel();
}

function startGuidedTour(forceReplay) {
    if (istanbulIsNight) {
        showBotMessage(getBotMessages().sleeping, true, 'sleeping');
        return;
    }

    if (!forceReplay && localStorage.getItem('botTourCompleted') === '1') return;

    stopGuidedTour();
    clearTourFocus();

    botState.stepIndex = 0;
    botState.tourActive = true;
    botState.tourPaused = false;
    enterGuidedMode();

    const introMessage = getBotMessages().startIntro;
    showBotMessage(introMessage, false, 'startIntro');
    bindTourPauseOnInteraction();
    const runId = ++botState.narrationRunId;
    waitForNarration(introMessage, 'startIntro').then(() => {
        if (!botState.tourActive || botState.tourPaused || runId !== botState.narrationRunId) return;
        queueNextStep(420);
    });
}

function runTourStep() {
    if (!botState.tourActive) return;

    if (botState.stepIndex >= botState.steps.length) {
        finishTour();
        return;
    }

    const sectionId = botState.steps[botState.stepIndex];
    botState.focusedSectionId = sectionId;
    botState.stepIndex += 1;

    const sectionEl = document.getElementById(sectionId);
    if (sectionEl) {
        clearTourFocus();
        sectionEl.classList.add('tour-focus');
        moveBotToGuidedSpot(sectionEl);
        smoothScrollToSection(sectionEl);
    }

    const messages = getBotMessages();
    const stepMessage = messages.steps[sectionId] || messages.awake;
    showBotMessage(stepMessage, false, `steps.${sectionId}`);
    const enableNarrationHighlight = botVoiceEnabled && hasUserInteracted;
    if (enableNarrationHighlight) setGuideCardHighlight(sectionId, true);

    const runId = ++botState.narrationRunId;
    waitForNarration(stepMessage, `steps.${sectionId}`).then(() => {
        if (enableNarrationHighlight) setGuideCardHighlight(sectionId, false);
        if (!botState.tourActive || botState.tourPaused || runId !== botState.narrationRunId) return;
        queueNextStep(450);
    });
}

function queueNextStep(delay) {
    clearTimeout(botState.tourTimer);
    botState.tourTimer = setTimeout(() => {
        if (botState.tourPaused) return;
        runTourStep();
    }, delay);
}

function finishTour() {
    stopGuidedTour();
    showBotMessage(getBotMessages().tourDone, true, 'tourDone');
    localStorage.setItem('botTourCompleted', '1');
}

function stopGuidedTour() {
    clearTimeout(botState.tourTimer);
    botState.narrationRunId += 1;
    botState.tourActive = false;
    botState.tourPaused = false;
    exitGuidedMode();
    unbindTourPauseOnInteraction();
    clearTourFocus();
    setGuideCardHighlight('home', false);
    setGuideCardHighlight('about', false);
    setGuideCardHighlight('skills', false);
    setGuideCardHighlight('projects', false);
    setGuideCardHighlight('contact', false);
}

function bindTourPauseOnInteraction() {
    unbindTourPauseOnInteraction();
    botState.interactionHandler = () => {
        if (!botState.tourActive || botState.tourPaused) return;
        botState.tourPaused = true;
        clearTimeout(botState.tourTimer);
        if (botState.focusedSectionId) setGuideCardHighlight(botState.focusedSectionId, false);
        showBotMessage(getBotMessages().paused, true, 'paused');
    };

    ['wheel', 'touchstart', 'keydown'].forEach(evt => {
        window.addEventListener(evt, botState.interactionHandler, { passive: true });
    });
}

function unbindTourPauseOnInteraction() {
    if (!botState.interactionHandler) return;
    ['wheel', 'touchstart', 'keydown'].forEach(evt => {
        window.removeEventListener(evt, botState.interactionHandler);
    });
    botState.interactionHandler = null;
}

function smoothScrollToSection(sectionEl) {
    const headerOffset = 90;
    const sectionTop = sectionEl.getBoundingClientRect().top + window.pageYOffset - headerOffset;
    window.scrollTo({
        top: sectionTop,
        behavior: 'smooth'
    });
}

function clearTourFocus() {
    document.querySelectorAll('.tour-focus').forEach(el => el.classList.remove('tour-focus'));
}

function showBotMessage(message, shouldSpeak = true, audioKey = null) {
    if (!botBubble) return;
    botBubble.textContent = message;
    if (shouldSpeak) speakBotMessage(message, audioKey);
}

// ===== Contact Form =====
function initContactForm() {
    if (!contactForm) return;

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;

        const subject = encodeURIComponent(`Portfolio Contact from ${name}`);
        const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
        window.location.href = `mailto:abdullaheltiby@email.com?subject=${subject}&body=${body}`;

        contactForm.reset();
    });
}

// ===== Smooth Scroll =====
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===== Navbar Scroll Effect =====
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        navbar.style.padding = '12px 0';
        navbar.style.boxShadow = '0 12px 30px rgba(18, 20, 32, 0.4)';
    } else {
        navbar.style.padding = '16px 0';
        navbar.style.boxShadow = 'none';
    }
});
