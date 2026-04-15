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
    const slides = [];

    // スライド要素の作成
    for (let i = 1; i <= slideCount; i++) {
        const slide = document.createElement('div');
        slide.className = 'slide';
        // 18番目だけPNG、他はJPG
        const ext = i === 18 ? 'png' : 'jpg';
        const slideNum = String(i).padStart(2, '0');
        slide.style.backgroundImage = `url('./img/slides/slide_${slideNum}.${ext}')`;
        slideshowContainer.appendChild(slide);
        slides.push(slide);
    }

    let currentSlide = 0;
    slides[currentSlide].classList.add('active');

    // スライドの切り替え
    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 5000); // 5秒ごとに切り替え
  }

  // Set Current Year in Footer
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
});
