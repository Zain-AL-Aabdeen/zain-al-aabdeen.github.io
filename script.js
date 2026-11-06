const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');

let width = 0;
let height = 0;
let particles = [];
let animationId = null;
let resizeTimer = null;

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Fewer particles and no glow on small screens, so phones stay smooth
const isSmallScreen = () => window.innerWidth < 768;
const maxParticles = () => (isSmallScreen() ? 40 : 90);

function initCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
        this.radius = Math.random() * 2 + 1;
        this.alpha = Math.random() * 0.5 + 0.3;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${this.alpha})`;
        ctx.fill();
    }
}

function createParticles() {
    particles = [];
    const count = Math.min(Math.floor((width * height) / 12000), maxParticles());
    for (let i = 0; i < count; i++) {
        particles.push(new Particle());
    }
}

function drawParticles() {
    // Glow is set once per frame (not per particle) and only on larger screens
    ctx.shadowBlur = isSmallScreen() ? 0 : 8;
    ctx.shadowColor = '#38bdf8';
    particles.forEach(p => p.draw());
    ctx.shadowBlur = 0;
}

function connectParticles() {
    const maxDist = 130;
    ctx.lineWidth = 0.8;
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < maxDist) {
                const alpha = (1 - dist / maxDist) * 0.25;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
                ctx.stroke();
            }
        }
    }
}

function drawStaticFrame() {
    ctx.clearRect(0, 0, width, height);
    connectParticles();
    drawParticles();
}

function animate() {
    if (document.hidden) {
        animationId = null;
        return;
    }

    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => p.update());
    connectParticles();
    drawParticles();
    animationId = requestAnimationFrame(animate);
}

function startAnimation() {
    if (animationId === null && !document.hidden) {
        animationId = requestAnimationFrame(animate);
    }
}

// Debounced resize. On phones the address bar showing/hiding changes only the
// height, so particles are rebuilt only when the width actually changes.
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const widthChanged = window.innerWidth !== width;
        initCanvas();
        if (widthChanged) createParticles();
        if (prefersReducedMotion) drawStaticFrame();
    }, 150);
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (animationId !== null) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    } else if (!prefersReducedMotion) {
        startAnimation();
    }
});

initCanvas();
createParticles();

if (prefersReducedMotion) {
    drawStaticFrame();
} else {
    startAnimation();
}
