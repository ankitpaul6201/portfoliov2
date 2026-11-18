/**
 * Portfolio v2 - Vanilla ES6+ Interactive Script
 * High performance, zero dependencies.
 * Hardened for Security & Robustness.
 */

// Safe Web Storage helpers resilient to SecurityError in sandboxed/private browsing
const safeStorage = {
  get: (storageType, key) => {
    try {
      const storage = storageType === "session" ? window.sessionStorage : window.localStorage;
      return storage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  set: (storageType, key, val) => {
    try {
      const storage = storageType === "session" ? window.sessionStorage : window.localStorage;
      storage.setItem(key, String(val));
    } catch (e) {
      // Storage unavailable, partitioned, or quota exceeded
    }
  }
};

// URL validation for dynamic media previews (prevents javascript: / vbscript: execution)
const isSafeImageUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (/^(?:javascript|vbscript):/i.test(trimmed)) return false;
  return /^(?:assets\/|\.\/|\/|https:\/\/|data:image\/)/i.test(trimmed);
};

// Target ID validation for DOM lookups (prevents CSS Selector Injection / unhandled DOMExceptions)
const isValidDomId = (id) => {
  return typeof id === "string" && /^[a-zA-Z0-9_\-]+$/.test(id);
};

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
    if (!isSafeImageUrl(src)) return;
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
    const savedNavScroll = safeStorage.get("session", "nav_scroll_x");
    if (savedNavScroll !== null) {
      const parsedX = parseFloat(savedNavScroll);
      if (Number.isFinite(parsedX)) {
        navLinksContainer.scrollLeft = parsedX;
      }
    }

    navLinksContainer.addEventListener("scroll", () => {
      safeStorage.set("session", "nav_scroll_x", navLinksContainer.scrollLeft);
    }, { passive: true });

    navLinksContainer.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        const curX = navLinksContainer.scrollLeft;
        safeStorage.set("session", "nav_scroll_x", curX);
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
    if (!href || !href.startsWith("#") || href === "#") return;

    const targetId = href.slice(1);
    if (!isValidDomId(targetId)) return;

    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    e.preventDefault();
    const navScrollX = navLinksContainer ? navLinksContainer.scrollLeft : 0;
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

  // On page load with hash, safely auto open relevant section (hardened against DOM exception injection)
  if (window.location.hash && window.location.hash.length > 1) {
    const rawHash = window.location.hash.slice(1);
    if (isValidDomId(rawHash)) {
      try {
        const hashEl = document.getElementById(rawHash);
        if (hashEl) {
          setTimeout(() => {
            const accordion = hashEl.querySelector("details") || hashEl.closest(".smooth-details");
            if (accordion) accordion.open = true;
          }, 300);
        }
      } catch (e) {
        // Suppress unexpected DOM query failure
      }
    }
  }

  // 4. GALLERY SHOW MORE / SHOW LESS TOGGLE
  document.querySelectorAll(".gallery-show-more-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      if (!isValidDomId(targetId)) return;
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

  // 5. CIRCULAR WATER-RIPPLE THEME TOGGLE (LIGHT / DARK)
  const themeToggleBtn = document.getElementById("theme-toggle");
  const storedTheme = safeStorage.get("local", "preferred-theme");

  const applyThemeState = (theme) => {
    const safeTheme = theme === "dark" ? "dark" : "light";
    if (safeTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      if (themeToggleBtn) themeToggleBtn.setAttribute("aria-label", "Switch to light mode");
    } else {
      document.documentElement.removeAttribute("data-theme");
      if (themeToggleBtn) themeToggleBtn.setAttribute("aria-label", "Switch to dark mode");
    }
    safeStorage.set("local", "preferred-theme", safeTheme);
  };

  // Initialize theme without animation on load
  if (storedTheme === "dark" || storedTheme === "light") {
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

  // 6. SCROLLSPY (Highlight active nav link while scrolling)
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

  // 7. DIRECT RESUME PDF DOWNLOAD (Forces direct download without opening browser PDF viewer)
  const resumeDownloadBtn = document.querySelector(".resume-download-btn");
  if (resumeDownloadBtn) {
    resumeDownloadBtn.addEventListener("click", async (e) => {
      const href = resumeDownloadBtn.getAttribute("href");
      if (!href) return;

      e.preventDefault();
      try {
        const response = await fetch(href);
        if (!response.ok) throw new Error("Fetch failed");
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const tempLink = document.createElement("a");
        tempLink.style.display = "none";
        tempLink.href = blobUrl;
        tempLink.setAttribute("download", resumeDownloadBtn.getAttribute("download") || "Ankit_Paul_Resume.pdf");
        document.body.appendChild(tempLink);
        tempLink.click();
        tempLink.remove();
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
      } catch (err) {
        // Fallback: standard anchor download
        const tempLink = document.createElement("a");
        tempLink.href = href;
        tempLink.setAttribute("download", resumeDownloadBtn.getAttribute("download") || "Ankit_Paul_Resume.pdf");
        document.body.appendChild(tempLink);
        tempLink.click();
        tempLink.remove();
      }
    });
  }
});
