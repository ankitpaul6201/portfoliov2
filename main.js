/**
 * Portfolio v2 - Vanilla ES6+ Interactive Script
 * High performance, zero dependencies.
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. LIGHTBOX MODAL SETUP
  const lightbox = document.createElement("div");
  lightbox.className = "image-lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Image preview");
  lightbox.innerHTML = `
    <button class="image-lightbox-close" aria-label="Close image viewer">&times;</button>
    <div class="image-lightbox-inner">
      <img src="" alt="Expanded view">
      <div class="image-lightbox-caption"></div>
    </div>
  `;
  document.body.appendChild(lightbox);

  const lightboxImg = lightbox.querySelector("img");
  const lightboxCaption = lightbox.querySelector(".image-lightbox-caption");
  const lightboxClose = lightbox.querySelector(".image-lightbox-close");

  const openLightbox = (src, captionText) => {
    lightboxImg.src = src;
    lightboxCaption.textContent = captionText || "";
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    lightboxImg.removeAttribute("src");
    lightboxCaption.textContent = "";
    document.body.style.overflow = "";
  };

  // Attach lightbox trigger to all project & gallery images
  document.querySelectorAll(".gallery-item img, .project-gallery-item img, .pub-media-frame img").forEach(img => {
    img.addEventListener("click", e => {
      e.preventDefault();
      const caption = img.alt || img.getAttribute("data-caption") || (img.closest("figure")?.querySelector("figcaption")?.textContent) || "";
      openLightbox(img.currentSrc || img.src, caption);
    });
  });

  lightbox.addEventListener("click", e => {
    if (e.target === lightbox || e.target.classList.contains("image-lightbox-inner")) {
      closeLightbox();
    }
  });

  lightboxClose.addEventListener("click", closeLightbox);

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && lightbox.classList.contains("is-open")) {
      closeLightbox();
    }
  });

  // 2. NAVIGATION HORIZONTAL SCROLL PERSISTENCE (Keeps position on mobile)
  const navLinksContainer = document.querySelector(".site-nav-links");
  if (navLinksContainer) {
    const savedNavScroll = sessionStorage.getItem("nav_scroll_x");
    if (savedNavScroll !== null) {
      navLinksContainer.scrollLeft = parseFloat(savedNavScroll);
    }

    navLinksContainer.addEventListener("scroll", () => {
      sessionStorage.setItem("nav_scroll_x", navLinksContainer.scrollLeft);
    }, { passive: true });

    navLinksContainer.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        const curX = navLinksContainer.scrollLeft;
        sessionStorage.setItem("nav_scroll_x", curX);
        requestAnimationFrame(() => {
          navLinksContainer.scrollLeft = curX;
        });
        setTimeout(() => {
          navLinksContainer.scrollLeft = curX;
        }, 50);
      });
    });
  }

  // 3. SMOOTH SCROLLING & HASH JUMP WITH ACCORDION AUTO-OPEN
  const handleAnchorClick = (e, link) => {
    const href = link.getAttribute("href");
    if (!href || !href.startsWith("#")) return;

    const navScrollX = navLinksContainer ? navLinksContainer.scrollLeft : 0;

    const targetEl = document.querySelector(href);
    if (!targetEl) return;

    e.preventDefault();
    const navOffset = 52;
    const targetTop = targetEl.getBoundingClientRect().top + window.scrollY - navOffset;

    window.scrollTo({
      top: targetTop,
      behavior: "smooth"
    });

    if (navLinksContainer) {
      navLinksContainer.scrollLeft = navScrollX;
      requestAnimationFrame(() => {
        navLinksContainer.scrollLeft = navScrollX;
      });
    }

    // Auto-open accordion if the target contains or is inside one
    const accordion = targetEl.closest(".smooth-details") || 
                      targetEl.querySelector("details.experience-more") || 
                      targetEl.querySelector("details.project-more") ||
                      targetEl.querySelector("details.education-more") ||
                      targetEl.querySelector("details");

    if (accordion) {
      setTimeout(() => {
        if (!accordion.open) {
          accordion.open = true;
        }
      }, 400);
    }

    if (history.pushState) {
      history.pushState(null, "", href);
    }
  };

  document.querySelectorAll('.site-nav a[href^="#"], .header-text a[href^="#"], .news-content a[href^="#"], .achievement-content a[href^="#"]').forEach(link => {
    link.addEventListener("click", e => handleAnchorClick(e, link));
  });

  // On page load with hash, auto open relevant section
  if (window.location.hash) {
    const hashEl = document.querySelector(window.location.hash);
    if (hashEl) {
      setTimeout(() => {
        const accordion = hashEl.querySelector("details") || hashEl.closest(".smooth-details");
        if (accordion) accordion.open = true;
      }, 300);
    }
  }

  // 3. GALLERY SHOW MORE / SHOW LESS TOGGLE
  document.querySelectorAll(".gallery-show-more-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const targetContainer = document.getElementById(targetId);
      if (!targetContainer) return;

      const labelShow = btn.getAttribute("data-label-show") || "Show more";
      const labelHide = btn.getAttribute("data-label-hide") || "Show less";
      const isHidden = targetContainer.classList.contains("gallery-hidden");

      if (isHidden) {
        targetContainer.classList.remove("gallery-hidden");
        btn.textContent = labelHide;
        btn.setAttribute("aria-expanded", "true");
      } else {
        targetContainer.classList.add("gallery-hidden");
        btn.textContent = labelShow;
        btn.setAttribute("aria-expanded", "false");
      }
    });
  });

  // 4. CIRCULAR WATER-RIPPLE THEME TOGGLE (LIGHT / DARK)
  const themeToggleBtn = document.getElementById("theme-toggle");
  const storedTheme = localStorage.getItem("preferred-theme");

  const applyThemeState = (theme) => {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      if (themeToggleBtn) themeToggleBtn.setAttribute("aria-label", "Switch to light mode");
    } else {
      document.documentElement.removeAttribute("data-theme");
      if (themeToggleBtn) themeToggleBtn.setAttribute("aria-label", "Switch to dark mode");
    }
    localStorage.setItem("preferred-theme", theme);
  };

  // Initialize theme without animation on load
  if (storedTheme) {
    applyThemeState(storedTheme);
  } else {
    applyThemeState("light");
  }

  const triggerCircularThemeTransition = (e) => {
    const isDark = document.documentElement.hasAttribute("data-theme");
    const nextTheme = isDark ? "light" : "dark";

    // Determine circular origin point (click coordinates or button center)
    let x = window.innerWidth / 2;
    let y = 0;
    if (e && typeof e.clientX === "number" && typeof e.clientY === "number" && e.clientX > 0) {
      x = e.clientX;
      y = e.clientY;
    } else if (themeToggleBtn) {
      const rect = themeToggleBtn.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }

    // Distance to furthest viewport corner
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Native modern View Transitions API (Chrome / Edge / Opera / Safari 18+)
    if (document.startViewTransition) {
      const transition = document.startViewTransition(() => {
        applyThemeState(nextTheme);
      });

      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`
            ]
          },
          {
            duration: 600,
            easing: "cubic-bezier(0.2, 0, 0, 1)",
            pseudoElement: "::view-transition-new(root)"
          }
        );
      });
    } else {
      // Smooth circular overlay fallback
      const ripple = document.createElement("div");
      ripple.className = "theme-ripple-circle";
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.backgroundColor = nextTheme === "dark" ? "#0d0e12" : "#ffffff";
      document.body.appendChild(ripple);

      // Trigger expansion
      requestAnimationFrame(() => {
        const scaleFactor = Math.ceil((endRadius / 5) * 2.2);
        ripple.style.transform = `translate(-50%, -50%) scale(${scaleFactor})`;

        setTimeout(() => {
          applyThemeState(nextTheme);
          ripple.style.opacity = "0";
          setTimeout(() => {
            ripple.remove();
          }, 350);
        }, 320);
      });
    }
  };

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", triggerCircularThemeTransition);
  }

  // 5. SCROLLSPY (Highlight active nav link while scrolling)
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".site-nav a[href^='#']");

  window.addEventListener("scroll", () => {
    let currentId = "";
    const scrollPos = window.scrollY + 100;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = section.getAttribute("id");
      }
    });

    navLinks.forEach(link => {
      const href = link.getAttribute("href");
      if (href === `#${currentId}`) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }, { passive: true });
});
