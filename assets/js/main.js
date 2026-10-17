/* Home Split Text */
const { animate, text, stagger } = anime;

const { chars: chars1 } = text.split(".home__profession-1", {
  chars: true,
});
const { chars: chars2 } = text.split(".home__profession-2", {
  chars: true,
});

animate(chars1, {
  y: [{ to: ["100%", "0%"] }, { to: "-100%", delay: 4000, ease: "in(3)" }],
  duration: 900,
  ease: "out(3)",
  delay: stagger(80),
  loop: true,
});

animate(chars2, {
  y: [{ to: ["100%", "0%"] }, { to: "-100%", delay: 4000, ease: "in(3)" }],
  duration: 900,
  ease: "out(3)",
  delay: stagger(80),
  loop: true,
});

/* Swiper Projects - Orbital Arc Wheel */
const updateOrbitTransforms = (swiper) => {
  if (!swiper || !swiper.slides) return;

  const isMobile = window.innerWidth < 768;
  const anglePerStep = isMobile ? 8.5 : 11;
  const yDropFactor = isMobile ? 18 : 26;
  const overlapShift = isMobile ? -35 : -55;

  swiper.slides.forEach((slide) => {
    const progress = slide.progress;
    if (typeof progress === "undefined" || isNaN(progress)) return;

    const absProgress = Math.abs(progress);

    // Continuous orbital curve formulas
    const rotateZ = progress * anglePerStep;
    const translateX = progress * overlapShift; // Pull cards closer for fanned overlap
    const translateY = Math.pow(absProgress, 1.82) * yDropFactor;
    const rotateY = -progress * 6; // subtle 3D curvature facing viewer
    const scale = Math.max(0.72, 1 - absProgress * 0.05);
    const zIndex = Math.max(1, 100 - Math.round(absProgress * 15));

    // Smooth opacity fade for cards that are too far away
    const opacity = absProgress > 3.4 ? Math.max(0, 1 - (absProgress - 3.4) * 1.5) : 1;
    const pointerEvents = absProgress > 2.2 ? "none" : "auto";

    slide.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) rotateZ(${rotateZ}deg) rotateY(${rotateY}deg) scale(${scale})`;
    slide.style.zIndex = zIndex;
    slide.style.opacity = opacity;
    slide.style.pointerEvents = pointerEvents;

    if (absProgress < 0.35) {
      slide.classList.add("projects__card--active");
    } else {
      slide.classList.remove("projects__card--active");
    }
  });

  // Update live counter (01 / 08)
  const currentEl = document.getElementById("projects-current");
  if (currentEl && typeof swiper.realIndex !== "undefined") {
    const currentNum = String(swiper.realIndex + 1).padStart(2, "0");
    if (currentEl.textContent !== currentNum) {
      currentEl.textContent = currentNum;
    }
  }
};

const swiperProjects = new Swiper(".projects__swiper", {
  loop: true,
  centeredSlides: true,
  slidesPerView: "auto",
  spaceBetween: 10,
  grabCursor: true,
  speed: 700,
  watchSlidesProgress: true,
  slideToClickedSlide: true,

  autoplay: {
    delay: 3500,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  },

  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },

  navigation: {
    nextEl: "#projects-next",
    prevEl: "#projects-prev",
  },

  on: {
    init: function () {
      updateOrbitTransforms(this);
    },
    setTranslate: function () {
      updateOrbitTransforms(this);
    },
    setTransition: function (swiper, transition) {
      swiper.slides.forEach((slide) => {
        slide.style.transition = `${transition}ms cubic-bezier(0.25, 1, 0.5, 1)`;
      });
    },
    slideChange: function () {
      updateOrbitTransforms(this);
    },
    resize: function () {
      updateOrbitTransforms(this);
    },
  },
});

const orbitPrevBtn = document.getElementById("projects-prev");
const orbitNextBtn = document.getElementById("projects-next");
if (orbitPrevBtn) {
  orbitPrevBtn.addEventListener("click", () => swiperProjects.slidePrev());
}
if (orbitNextBtn) {
  orbitNextBtn.addEventListener("click", () => swiperProjects.slideNext());
}

/* Prevent Swiper from hijacking project link clicks & ensure reliable navigation */
document.addEventListener(
  "click",
  (e) => {
    const btn = e.target.closest(".projects__button");
    if (!btn) return;

    const href = btn.getAttribute("href");
    if (href && href !== "#" && !href.startsWith("javascript")) {
      e.stopPropagation();
      e.preventDefault();
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      e.preventDefault();
      e.stopPropagation();
    }
  },
  true
);

/* ================= WORK TIMELINE DYNAMIC PROGRESS BAR ================= */
const workSection = document.querySelector(".work");
const workLine = document.querySelector(".work__line");
let workTimelineTimeouts = [];

function clearTimelineTimeouts() {
  workTimelineTimeouts.forEach((t) => clearTimeout(t));
  workTimelineTimeouts = [];
}

function updateWorkTimeline(animate = true) {
  const line = document.getElementById("work-line") || document.querySelector(".work__line");
  const area = document.querySelector(".work__area");
  const activeContent = document.querySelector(".work__content.work-active");
  if (!line || !area || !activeContent) return;

  const milestonesContainer = document.getElementById("work-milestones") || line.querySelector(".work__milestones");
  const progress = line.querySelector(".work__line-progress");
  const cards = Array.from(activeContent.querySelectorAll(".work__card"));
  if (cards.length === 0) return;

  clearTimelineTimeouts();

  // Calculate coordinates relative to .work__area
  const areaRect = area.getBoundingClientRect();
  
  const dotCoords = cards.map((card) => {
    const anchor = card.querySelector(".work__title") || card.querySelector(".work__year") || card;
    const anchorRect = anchor.getBoundingClientRect();
    // Center Y of the card's header row relative to the work area
    return (anchorRect.top + anchorRect.height / 2) - areaRect.top;
  });

  const firstY = Math.max(0, dotCoords[0]);
  const lastY = dotCoords[dotCoords.length - 1];
  const span = Math.max(lastY - firstY, 24);

  // Position line track directly spanning from first card to last card dot
  line.style.top = `${firstY}px`;
  line.style.height = `${span}px`;

  // Render dynamic milestone dots
  if (milestonesContainer) {
    milestonesContainer.innerHTML = "";
    
    const dotObjects = dotCoords.map((y, idx) => {
      const dot = document.createElement("span");
      dot.className = "work__milestone-dot";
      const relativeTop = y - firstY;
      dot.style.top = `${relativeTop}px`;
      dot.setAttribute("data-index", idx);
      dot.setAttribute("title", `Milestone ${idx + 1}`);

      const card = cards[idx];
      if (card) {
        card.addEventListener("mouseenter", () => dot.classList.add("hovered"));
        card.addEventListener("mouseleave", () => dot.classList.remove("hovered"));
        dot.addEventListener("mouseenter", () => card.classList.add("work__card--active"));
        dot.addEventListener("mouseleave", () => card.classList.remove("work__card--active"));
      }

      milestonesContainer.appendChild(dot);
      const ratio = span > 0 ? relativeTop / span : 0;
      return { el: dot, ratio };
    });

    if (animate && progress) {
      line.classList.remove("animate");
      progress.style.transition = "none";
      progress.style.height = "0%";
      dotObjects.forEach((d) => d.el.classList.remove("reached"));

      // Force reflow
      void line.offsetWidth;

      // Start smooth slow fill (5.5s)
      const animDuration = 5500;
      progress.style.transition = `height ${animDuration}ms cubic-bezier(0.2, 0.8, 0.25, 1)`;
      line.classList.add("animate");
      progress.style.height = "100%";

      // Sequentially light up milestone dots as the progress runner reaches each one
      dotObjects.forEach((d) => {
        const delay = Math.round(d.ratio * animDuration * 0.95);
        const timeout = setTimeout(() => {
          d.el.classList.add("reached");
        }, delay);
        workTimelineTimeouts.push(timeout);
      });
    } else if (progress) {
      progress.style.transition = "none";
      line.classList.add("animate");
      progress.style.height = "100%";
      dotObjects.forEach((d) => d.el.classList.add("reached"));
    }
  }

  // Animate horizontal progress bars under each card (slow smooth fill 5.5s)
  const cardFills = activeContent.querySelectorAll(".work__progress-fill");
  if (animate) {
    cardFills.forEach((fill) => {
      fill.style.transition = "none";
      fill.style.width = "0%";
      void fill.offsetWidth;
    });

    cardFills.forEach((fill, idx) => {
      const target = fill.getAttribute("data-progress") || "100";
      const timeout = setTimeout(() => {
        fill.style.transition = "width 5.5s cubic-bezier(0.2, 0.8, 0.25, 1)";
        fill.style.width = `${target}%`;
      }, 120 + idx * 200);
      workTimelineTimeouts.push(timeout);
    });
  } else {
    cardFills.forEach((fill) => {
      const target = fill.getAttribute("data-progress") || "100";
      fill.style.transition = "none";
      fill.style.width = `${target}%`;
    });
  }
}

// Work Tabs
const tabs = document.querySelectorAll("[data-target]"),
  tabContents = document.querySelectorAll("[data-content]");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const targetSelector = tab.dataset.target,
      targetContent = document.querySelector(targetSelector);

    // Disable all content and active tabs
    tabContents.forEach((content) => content.classList.remove("work-active"));
    tabs.forEach((t) => t.classList.remove("work-active"));

    // Activate the tab and corresponding content
    tab.classList.add("work-active");
    if (targetContent) targetContent.classList.add("work-active");

    // Allow DOM to update active class and compute new positions
    requestAnimationFrame(() => {
      setTimeout(() => updateWorkTimeline(true), 40);
    });
  });
});

// Trigger on IntersectionObserver (scroll into view)
if (workSection) {
  const workObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          updateWorkTimeline(true);
        }
      });
    },
    { threshold: 0.15 }
  );
  workObserver.observe(workSection);
}

// Trigger on initial window load
window.addEventListener("load", () => {
  setTimeout(() => updateWorkTimeline(true), 100);
});

// Update positions on resize without re-animating
let workResizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(workResizeTimer);
  workResizeTimer = setTimeout(() => updateWorkTimeline(false), 120);
});

/* Skills Filter Tabs */
const skillFilterBtns = document.querySelectorAll(".skills__filter-btn");
const skillCards = document.querySelectorAll(".skills__card");

skillFilterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    skillFilterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const filter = btn.getAttribute("data-filter");

    skillCards.forEach((card) => {
      const category = card.getAttribute("data-category");
      if (filter === "all" || category === filter) {
        card.classList.remove("skills__card--hidden");
        if (filter !== "all") {
          card.style.gridColumn = "1 / -1";
        } else {
          card.style.gridColumn = "";
        }
      } else {
        card.classList.add("skills__card--hidden");
      }
    });
  });
});

/* Testimonials of Duplicate Cards */
// Duplicate images to make the animation work
const tracks = document.querySelectorAll(".testimonials__content");

tracks.forEach((track) => {
  const cards = [...track.children]; // spread to make a static copy

  // Duplicate cards only once
  for (const card of cards) {
    track.appendChild(card.cloneNode(true));
  }
});

/* Copy Email In Contact */
const copyBtn = document.getElementById("contact-btn"),
  copyEmail = document.getElementById("contact-email").textContent;

copyBtn.addEventListener("click", () => {
  //use the clipboard Api to copy text
  navigator.clipboard.writeText(copyEmail).then(() => {
    copyBtn.innerHTML = 'Email Copied <i class="ri-check-line"></i>';

    // Restore the original text
    setTimeout(() => {
      copyBtn.innerHTML = 'Copy email <i class="ri-file-copy-line"></i>';
    }, 2000);
  });
});

/* Current Year of Footer */
const textYear = document.getElementById("footer-year"),
  currentYear = new Date().getFullYear();

//Each year it is updated to the current year
textYear.textContent = currentYear;

/* Scroll Section Active Link */
const sections = document.querySelectorAll("section[id]");

const scrollActive = () => {
  // We get the position by scrolling down
  const scrollY = window.scrollY;

  sections.forEach((section) => {
    const id = section.id, //id of each section
      top = section.offsetTop - 50, // Distance from the top edge
      height = section.offsetHeight, //Element height
      link = document.querySelector(".nav__menu a[href*=" + id + "]"); //id nav link

    if (!link) return;
    link.classList.toggle(
      "active-link",
      scrollY > top && scrollY <= top + height
    );
  });
};
window.addEventListener("scroll", scrollActive);

/* Custom Cursor */
const cursor = document.querySelector(".cursor");
let mouseX = 0,
  mouseY = 0; // Store mouse position

const cursorMove = () => {
  cursor.style.left = `${mouseX}px`;
  cursor.style.top = `${mouseY}px`;
  cursor.style.transform = "translate(-50%, -50%)";

  //update the cursor animation
  requestAnimationFrame(cursorMove);
};
document.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});
cursorMove();

/* Hide custom cursor on links */
const a = document.querySelectorAll("a");

a.forEach((item) => {
  item.addEventListener("mouseover", () => {
    cursor.classList.add("hide-cursor");
  });
  item.addEventListener("mouseleave", () => {
    cursor.classList.remove("hide-cursor");
  });
});

/* Scroll Reveal Animation */
const sr = ScrollReveal({
  origin: "top",
  distance: "60px",
  duration: 2000,
  delay: 300,
  reset: true, // Animation repeat
});

//home, project and work section animations
sr.reveal(
  `.home__image, .projects__container, .work__container, .testimonials__container, .contact__container`
);
sr.reveal(`.home__data`, { delay: 900, origin: "bottom" });
sr.reveal(`.home__info`, { delay: 1200, origin: "bottom" });
sr.reveal(`.home__social, .home__cv`, { delay: 1200 });
//About section animations
sr.reveal(`.about__data`, { origin: "left" });
sr.reveal(`.about__image`, { origin: "right" });
//Skills section animation
sr.reveal(`.skills__filters, .skills__card`, { interval: 100 });

// Skills card description left slide-in animation on scroll
const skillsCards = document.querySelectorAll(".skills__card");
if (skillsCards.length > 0) {
  const skillsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        } else {
          entry.target.classList.remove("is-visible");
        }
      });
    },
    { threshold: 0.15 }
  );

  skillsCards.forEach((card) => skillsObserver.observe(card));
}

/* Solar System Interactive 3D Parallax Tilt & Particle Reactions */
const heroSection = document.querySelector(".home");
const solarSystemEl = document.querySelector(".solar-system");

if (heroSection && solarSystemEl) {
  let targetTiltX = 0;
  let targetTiltY = 0;
  let currentTiltX = 0;
  let currentTiltY = 0;

  window.addEventListener("mousemove", (e) => {
    const rect = heroSection.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) / (window.innerWidth / 2);
    const deltaY = (e.clientY - centerY) / (window.innerHeight / 2);

    targetTiltX = -deltaY * 8; // subtle 3D tilt
    targetTiltY = deltaX * 8;
  });

  const tiltLerp = () => {
    currentTiltX += (targetTiltX - currentTiltX) * 0.06;
    currentTiltY += (targetTiltY - currentTiltY) * 0.06;

    solarSystemEl.style.setProperty("--tilt-x", `${currentTiltX.toFixed(2)}deg`);
    solarSystemEl.style.setProperty("--tilt-y", `${currentTiltY.toFixed(2)}deg`);

    requestAnimationFrame(tiltLerp);
  };
  requestAnimationFrame(tiltLerp);

  // Orbit Nodes & Glowing Particles Interactions
  const interactiveNodes = document.querySelectorAll(".orbit-dot, .solar-planet");
  interactiveNodes.forEach((node) => {
    node.addEventListener("mouseenter", () => {
      node.closest(".solar-orbit")?.classList.add("orbit-active");
    });
    node.addEventListener("mouseleave", () => {
      node.closest(".solar-orbit")?.classList.remove("orbit-active");
    });
  });
}

/* Typewriter Effect for About Section Description */
const aboutDescription = document.querySelector(".about__description");
if (aboutDescription) {
  // Wrap all text characters in hidden spans while fully preserving HTML tags (like <b>)
  const wrapChars = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      const frag = document.createDocumentFragment();
      for (const char of text) {
        const span = document.createElement("span");
        span.className = "typewriter-char";
        span.textContent = char;
        span.style.display = "none";
        frag.appendChild(span);
      }
      node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach(wrapChars);
    }
  };

  wrapChars(aboutDescription);

  // Add the blinking cursor
  const cursor = document.createElement("span");
  cursor.className = "typewriter-cursor";
  cursor.textContent = "|";
  aboutDescription.prepend(cursor);

  const charSpans = Array.from(aboutDescription.querySelectorAll(".typewriter-char"));
  let charIndex = 0;
  let hasTyped = false;

  const typeNext = () => {
    if (charIndex < charSpans.length) {
      const span = charSpans[charIndex];
      span.style.display = "inline";
      span.after(cursor);
      charIndex++;

      const char = span.textContent;
      let delay = Math.floor(Math.random() * 20) + 25;
      if (char === "." || char === "!") {
        delay = 340; // Natural pause at sentence end
      } else if (char === ",") {
        delay = 180; // Natural pause at comma
      }

      setTimeout(typeNext, delay);
    }
  };

  const aboutObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasTyped) {
          hasTyped = true;
          setTimeout(typeNext, 450); // Slight delay after ScrollReveal animation starts
        }
      });
    },
    { threshold: 0.2 }
  );

  aboutObserver.observe(aboutDescription);
}

/* Typewriter Effect for Navbar Logo */
const navLogo = document.querySelector(".nav__logo");
if (navLogo) {
  const wrapLogoChars = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      const frag = document.createDocumentFragment();
      for (const char of text) {
        const span = document.createElement("span");
        span.className = "logo-typewriter-char";
        span.textContent = char;
        span.style.display = "none";
        frag.appendChild(span);
      }
      node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach(wrapLogoChars);
    }
  };

  wrapLogoChars(navLogo);

  // Add the blinking cursor for logo
  const logoCursor = document.createElement("span");
  logoCursor.className = "logo-typewriter-cursor";
  logoCursor.textContent = "|";
  navLogo.appendChild(logoCursor);

  const charSpans = Array.from(navLogo.querySelectorAll(".logo-typewriter-char"));
  let charIndex = 0;

  const typeLogo = () => {
    if (charIndex < charSpans.length) {
      const span = charSpans[charIndex];
      span.style.display = "inline";
      span.after(logoCursor);
      charIndex++;

      // Typing speed: natural and punchy
      let delay = Math.floor(Math.random() * 25) + 60;
      if (charIndex === 3) {
        delay = 180; // Small breath between ZGO and Developers
      }

      setTimeout(typeLogo, delay);
    }
  };

  // Start typing smoothly after page loads
  setTimeout(typeLogo, 250);
}


