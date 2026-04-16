// main.js

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.querySelector('.nav-links');

  if(mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenuBtn.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    // メニューリンククリック時に閉じる
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuBtn.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }

  // Navbar Scroll Effect
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Intersection Observer for Scroll Animations
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // 一度発火したら監視を止める
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in-up').forEach(element => {
    observer.observe(element);
  });

  // Hero Slideshow
  const slideshowContainer = document.getElementById('hero-slideshow');
  if (slideshowContainer) {
    const slideCount = 59;
    const slideIndices = Array.from({ length: slideCount }, (_, i) => i + 1);

    // Shuffle indices for random order
    for (let i = slideIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slideIndices[i], slideIndices[j]] = [slideIndices[j], slideIndices[i]];
    }

    const slides = [];

    // スライド要素の作成
    slideIndices.forEach(i => {
      const slide = document.createElement('div');
      slide.className = 'slide';
      const ext = i === 18 ? 'png' : 'jpg';
      const slideNum = String(i).padStart(2, '0');
      slide.style.backgroundImage = `url('./img/slides/slide_${slideNum}.${ext}')`;
      slideshowContainer.appendChild(slide);
      slides.push(slide);
    });

    let currentSlide = 0;
    slides[currentSlide].classList.add('active');

    const updateSlide = (index) => {
      slides[currentSlide].classList.remove('active');
      currentSlide = (index + slides.length) % slides.length;
      slides[currentSlide].classList.add('active');
      resetInterval();
    };

    // Manual Navigation
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) prevBtn.addEventListener('click', () => updateSlide(currentSlide - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => updateSlide(currentSlide + 1));

    // スライドの自動切り替え
    let slideInterval;
    function resetInterval() {
      clearInterval(slideInterval);
      slideInterval = setInterval(() => {
        updateSlide(currentSlide + 1);
      }, 6000); // 6秒ごとに切り替え
    }
    resetInterval();
  }

  // Set Current Year in Footer
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
});
