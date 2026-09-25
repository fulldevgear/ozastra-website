/* ozastra-legacy-script:26 */
gsap.registerPlugin(ScrollTrigger,SplitText,Flip,MotionPathPlugin,ScrambleTextPlugin,ScrollSmoother,ScrollToPlugin,TextPlugin);

;
/* ozastra-legacy-script:39 */

document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll(".tab-item input[type='checkbox']").forEach(checkbox => {
    const tabItem = checkbox.closest(".tab-item");

    const updateStyles = () => {
      tabItem.style.backgroundColor = checkbox.checked ? "#121212" : "#FFFFFF";
      tabItem.style.color = checkbox.checked ? "#FFFFFF" : "#000000";
    };

    updateStyles();
    checkbox.addEventListener("change", updateStyles);
  });

});


;
/* ozastra-legacy-script:40 */

function initAdvancedFormValidation() {
  const forms = document.querySelectorAll('[data-form-validate]');

  forms.forEach((formContainer) => {
    const startTime = new Date().getTime();

    const form = formContainer.querySelector('form');
    if (!form) return;

    const validateFields = form.querySelectorAll('[data-validate]');
    const dataSubmit = form.querySelector('[data-submit]');
    if (!dataSubmit) return;

    const realSubmitInput = dataSubmit.querySelector('input[type="submit"]');
    if (!realSubmitInput) return;

    function isSpam() {
      const currentTime = new Date().getTime();
      return currentTime - startTime < 5000;
    }

    // Disable select options with invalid values on page load
    validateFields.forEach(function (fieldGroup) {
      const select = fieldGroup.querySelector('select');
      if (select) {
        const options = select.querySelectorAll('option');
        options.forEach(function (option) {
          if (
            option.value === '' ||
            option.value === 'disabled' ||
            option.value === 'null' ||
            option.value === 'false'
          ) {
            option.setAttribute('disabled', 'disabled');
          }
        });
      }
    });

    function validateAndStartLiveValidationForAll() {
      let allValid = true;
      let firstInvalidField = null;

      validateFields.forEach(function (fieldGroup) {
        const input = fieldGroup.querySelector('input, textarea, select');
        const radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');
        if (!input && !radioCheckGroup) return;

        if (input) input.__validationStarted = true;
        if (radioCheckGroup) {
          radioCheckGroup.__validationStarted = true;
          const inputs = radioCheckGroup.querySelectorAll('input[type="radio"], input[type="checkbox"]');
          inputs.forEach(function (input) {
            input.__validationStarted = true;
          });
        }

        updateFieldStatus(fieldGroup);

        if (!isValid(fieldGroup)) {
          allValid = false;
          if (!firstInvalidField) {
            firstInvalidField = input || radioCheckGroup.querySelector('input');
          }
        }
      });

      if (!allValid && firstInvalidField) {
        firstInvalidField.focus();
      }

      return allValid;
    }

    function isValid(fieldGroup) {
      const radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');
      if (radioCheckGroup) {
        const inputs = radioCheckGroup.querySelectorAll('input[type="radio"], input[type="checkbox"]');
        const checkedInputs = radioCheckGroup.querySelectorAll('input:checked');
        const min = parseInt(radioCheckGroup.getAttribute('min')) || 1;
        const max = parseInt(radioCheckGroup.getAttribute('max')) || inputs.length;
        const checkedCount = checkedInputs.length;

        if (inputs[0].type === 'radio') {
          return checkedCount >= 1;
        } else {
          if (inputs.length === 1) {
            return inputs[0].checked;
          } else {
            return checkedCount >= min && checkedCount <= max;
          }
        }
      } else {
        const input = fieldGroup.querySelector('input, textarea, select');
        if (!input) return false;

        let valid = true;
        const min = parseInt(input.getAttribute('min')) || 0;
        const max = parseInt(input.getAttribute('max')) || Infinity;
        const value = input.value.trim();
        const length = value.length;

        if (input.type === 'file') {
          // File-Upload: gültig, wenn mindestens eine Datei gewählt wurde
          valid = input.files && input.files.length > 0;
        } else if (input.tagName.toLowerCase() === 'select') {
          if (
            value === '' ||
            value === 'disabled' ||
            value === 'null' ||
            value === 'false'
          ) {
            valid = false;
          }
        } else if (input.type === 'email') {
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          valid = emailPattern.test(value);
        } else {
          if (input.hasAttribute('min') && length < min) valid = false;
          if (input.hasAttribute('max') && length > max) valid = false;
        }

        return valid;
      }
    }

    function updateFieldStatus(fieldGroup) {
      const radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');
      if (radioCheckGroup) {
        const inputs = radioCheckGroup.querySelectorAll('input[type="radio"], input[type="checkbox"]');
        const checkedInputs = radioCheckGroup.querySelectorAll('input:checked');

        if (checkedInputs.length > 0) {
          fieldGroup.classList.add('is--filled');
        } else {
          fieldGroup.classList.remove('is--filled');
        }

        const valid = isValid(fieldGroup);

        if (valid) {
          fieldGroup.classList.add('is--success');
          fieldGroup.classList.remove('is--error');
        } else {
          fieldGroup.classList.remove('is--success');
          const anyInputValidationStarted = Array.from(inputs).some(input => input.__validationStarted);
          if (anyInputValidationStarted) {
            fieldGroup.classList.add('is--error');
          } else {
            fieldGroup.classList.remove('is--error');
          }
        }
      } else {
        const input = fieldGroup.querySelector('input, textarea, select');
        if (!input) return;

        let filled;
        if (input.type === 'file') {
          filled = input.files && input.files.length > 0;
        } else {
          filled = input.value.trim().length > 0;
        }

        if (filled) {
          fieldGroup.classList.add('is--filled');
        } else {
          fieldGroup.classList.remove('is--filled');
        }

        const valid = isValid(fieldGroup);

        if (valid) {
          fieldGroup.classList.add('is--success');
          fieldGroup.classList.remove('is--error');
        } else {
          fieldGroup.classList.remove('is--success');
          if (input.__validationStarted) {
            fieldGroup.classList.add('is--error');
          } else {
            fieldGroup.classList.remove('is--error');
          }
        }
      }
    }

    validateFields.forEach(function (fieldGroup) {
      const input = fieldGroup.querySelector('input, textarea, select');
      const radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');

      if (radioCheckGroup) {
        const inputs = radioCheckGroup.querySelectorAll('input[type="radio"], input[type="checkbox"]');
        inputs.forEach(function (input) {
          input.__validationStarted = false;

          input.addEventListener('change', function () {
            requestAnimationFrame(function () {
              if (!input.__validationStarted) {
                const checkedCount = radioCheckGroup.querySelectorAll('input:checked').length;
                const min = parseInt(radioCheckGroup.getAttribute('min')) || 1;

                if (checkedCount >= min) {
                  input.__validationStarted = true;
                }
              }

              if (input.__validationStarted) {
                updateFieldStatus(fieldGroup);
              }
            });
          });

          input.addEventListener('blur', function () {
            input.__validationStarted = true;
            updateFieldStatus(fieldGroup);
          });
        });
      } else if (input) {
        input.__validationStarted = false;

        if (input.type === 'file') {
          input.addEventListener('change', function () {
            input.__validationStarted = true;
            updateFieldStatus(fieldGroup);
          });
        } else if (input.tagName.toLowerCase() === 'select') {
          input.addEventListener('change', function () {
            input.__validationStarted = true;
            updateFieldStatus(fieldGroup);
          });
        } else {
          input.addEventListener('input', function () {
            const value = input.value.trim();
            const length = value.length;
            const min = parseInt(input.getAttribute('min')) || 0;
            const max = parseInt(input.getAttribute('max')) || Infinity;

            if (!input.__validationStarted) {
              if (input.type === 'email') {
                if (isValid(fieldGroup)) input.__validationStarted = true;
              } else {
                if (
                  (input.hasAttribute('min') && length >= min) ||
                  (input.hasAttribute('max') && length <= max)
                ) {
                  input.__validationStarted = true;
                }
              }
            }

            if (input.__validationStarted) {
              updateFieldStatus(fieldGroup);
            }
          });

          input.addEventListener('blur', function () {
            input.__validationStarted = true;
            updateFieldStatus(fieldGroup);
          });
        }
      }
    });

    dataSubmit.addEventListener('click', function () {
      if (validateAndStartLiveValidationForAll()) {
        if (isSpam()) {
          alert('Form submitted too quickly. Please try again.');
          return;
        }
        realSubmitInput.click();
      }
    });

    form.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
        event.preventDefault();
        if (validateAndStartLiveValidationForAll()) {
          if (isSpam()) {
            alert('Form submitted too quickly. Please try again.');
            return;
          }
          realSubmitInput.click();
        }
      }
    });
  });
}

// Initialize Advanced Form Validation
document.addEventListener('DOMContentLoaded', () => {
  initAdvancedFormValidation();
});


;
/* ozastra-legacy-script:41 */

    // Array der Paare: [Linkblock-Klasse, Text-Klasse]
  const linkPairs = [
    ['nav-link', 'nav-link-txt'],
    ['nav-link-transparent', 'nav-link-txt-transparent']
  ];

  linkPairs.forEach(([linkClass, textClass]) => {
    document.querySelectorAll(`.${textClass}[underline="true"]`).forEach(el => {
      // Linie erzeugen
      const line = document.createElement('span');
      line.classList.add('underline-line');
      el.appendChild(line);

      // Parent Linkblock ermitteln
      const parentLink = el.closest(`.${linkClass}`);

      // Linie sofort sichtbar, falls Link aktuell
      if (parentLink && parentLink.classList.contains('w--current')) {
        gsap.set(line, { scaleX: 1 });
      }

      // Hover In
      el.addEventListener('mouseenter', () => {
        line.style.transformOrigin = 'left center';
        gsap.to(line, {
          scaleX: 1,
          duration: 0.4,
          ease: "power2.out"
        });
      });

      // Hover Out
      el.addEventListener('mouseleave', () => {
        if (!parentLink.classList.contains('w--current')) {
          line.style.transformOrigin = 'right center';
          gsap.to(line, {
            scaleX: 0,
            duration: 0.4,
            ease: "power2.in"
          });
        }
      });
    });
  });



;
/* ozastra-legacy-script:42 */

  document.querySelectorAll('.footer-link[underline="true"]').forEach(el => {
    const line = document.createElement('span');
    line.classList.add('underline-line');
    el.appendChild(line);

    // Hover In → Linie zeichnen
    el.addEventListener('mouseenter', () => {
      line.style.transformOrigin = 'left center';
      gsap.to(line, {
        scaleX: 1,
        duration: 0.4,
        ease: "power2.out"
      });
    });

    // Hover Out → Linie nach rechts verschwinden
    el.addEventListener('mouseleave', () => {
      line.style.transformOrigin = 'right center';
      gsap.to(line, {
        scaleX: 0,
        duration: 0.4,
        ease: "power2.in"
      });
    });
  });


;
/* ozastra-legacy-script:43 */

function runPageOnceAnimation(next) {
  const tl = gsap.timeline();

  tl.call(() => {
    resetPage(next);
  }, null, 0);

  return tl;
}

function runPageLeaveAnimation(current, next) {
  const transitionWrap = document.querySelector("[data-transition-wrap]");
  const transitionDark = transitionWrap.querySelector("[data-transition-dark]");

  const tl = gsap.timeline({
    onComplete: () => {
      current.remove(); 
    }
  })
  
  CustomEase.create("parallax", "0.7, 0.05, 0.13, 1");
  
  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    return tl.set(current, { autoAlpha: 0 });
  }
  
  tl.set(transitionWrap, {
    zIndex: 2
  });
  
  tl.fromTo(transitionDark, {
    autoAlpha: 0
  },{
    autoAlpha: 0.8,
    duration: 1.2,
    ease: "parallax"
  }, 0);
  
  tl.fromTo(current,{
    y: "0vh"
  },{
    y: "-25vh",
    duration: 1.2,
    ease: "parallax",
  }, 0);
  
  tl.set(transitionDark, {
    autoAlpha: 0,
  });

  return tl;
}

function runPageEnterAnimation(next){
  const tl = gsap.timeline();
  
  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady")
    tl.call(resetPage, [next], "pageReady");
    return new Promise(resolve => tl.call(resolve, null, "pageReady"));
  }
  
  tl.add("startEnter", 0);
  
  tl.set(next, {
    zIndex: 3
  });
  
  tl.fromTo(next, {
    y: "100vh"
  }, {
    y: "0vh",
    duration: 1.2,
    clearProps: "all",
    ease: "parallax"
  }, "startEnter");

  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");

  return new Promise(resolve => {
    tl.call(resolve, null, "pageReady");
  });
}
  

;
/* ozastra-legacy-script:44 */

gsap.registerPlugin(ScrollTrigger);

document.querySelectorAll('[counter="true"]').forEach((el) => {
  const endValue = parseInt(el.getAttribute("data-count"), 10);

  if (isNaN(endValue)) return;

  // Startwert absichern
  el.textContent = "0";

  let counter = { value: 0 };

  gsap.to(counter, {
    value: endValue,
    duration: 3,
    ease: "power3.out",
    scrollTrigger: {
      trigger: el,
      start: "top 80%",
      toggleActions: "play none none none",
      once: true
    },
    onUpdate: () => {
      el.textContent = Math.round(counter.value);
    }
  });
});


;
/* ozastra-legacy-script:45 */

gsap.registerPlugin(ScrollTrigger);

document.querySelectorAll('.stroke[animate-stroke="true"]').forEach(stroke => {

  // Initial State
  gsap.set(stroke, {
    scaleX: 0
  });

  // Animation
  gsap.to(stroke, {
    scaleX: 1,
    duration: 1.2,
    ease: "power2.out",
    scrollTrigger: {
      trigger: stroke,
      start: "top 85%",
      toggleActions: "play none none none"
    }
  });

});


;
/* ozastra-legacy-script:46 */


function initDynamicCurrentTime() {
  const defaultTimezone = "Europe/Amsterdam";

  // Helper function to format numbers with leading zero
  const formatNumber = (number) => number.toString().padStart(2, '0');

  // Function to create a time formatter with the correct timezone
  const createFormatter = (timezone) => {
    return new Intl.DateTimeFormat([], {
      timeZone: timezone,
      timeZoneName: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false, // Optional: Remove to match your simpler script
    });
  };

  // Function to parse the formatted string into parts
  const parseFormattedTime = (formattedDateTime) => {
    const match = formattedDateTime.match(/(\d+):(\d+):(\d+)\s*([\w+]+)/);
    if (match) {
      return {
        hours: match[1],
        minutes: match[2],
        seconds: match[3],
        timezone: match[4], // Handles both GMT+X and CET cases
      };
    }
    return null;
  };

  // Function to update the time for all elements
  const updateTime = () => {
    document.querySelectorAll('[data-current-time]').forEach((element) => {
      const timezone = element.getAttribute('data-current-time') || defaultTimezone;
      const formatter = createFormatter(timezone);
      const now = new Date();
      const formattedDateTime = formatter.format(now);

      const timeParts = parseFormattedTime(formattedDateTime);
      if (timeParts) {
        const {
          hours,
          minutes,
          seconds,
          timezone
        } = timeParts;

        // Update child elements if they exist
        const hoursElem = element.querySelector('[data-current-time-hours]');
        const minutesElem = element.querySelector('[data-current-time-minutes]');
        const secondsElem = element.querySelector('[data-current-time-seconds]');
        const timezoneElem = element.querySelector('[data-current-time-timezone]');

        if (hoursElem) hoursElem.textContent = hours;
        if (minutesElem) minutesElem.textContent = minutes;
        if (secondsElem) secondsElem.textContent = seconds;
        if (timezoneElem) timezoneElem.textContent = timezone;
      }
    });
  };

  // Initial update and interval for subsequent updates
  updateTime();
  setInterval(updateTime, 1000);
}

// Initialize Dynamic Current Time
document.addEventListener('DOMContentLoaded', () => {
  initDynamicCurrentTime();
});


;
/* ozastra-legacy-script:49 */

  document.addEventListener("DOMContentLoaded", function () {
    const yearElement = document.getElementById("year");
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  });


;
/* ozastra-legacy-script:50 */

  function initModalBasic() {

  const modalGroup = document.querySelector('[data-modal-group-status]');
  const modals = document.querySelectorAll('[data-modal-name]');
  const modalTargets = document.querySelectorAll('[data-modal-target]');

  // Open modal
  modalTargets.forEach((modalTarget) => {
    modalTarget.addEventListener('click', function () {
      const modalTargetName = this.getAttribute('data-modal-target');

      // Close all modals
      modalTargets.forEach((target) => target.setAttribute('data-modal-status', 'not-active'));
      modals.forEach((modal) => modal.setAttribute('data-modal-status', 'not-active'));

      // Activate clicked modal
      document.querySelector(`[data-modal-target="${modalTargetName}"]`).setAttribute('data-modal-status', 'active');
      document.querySelector(`[data-modal-name="${modalTargetName}"]`).setAttribute('data-modal-status', 'active');

      // Set group to active
      if (modalGroup) {
        modalGroup.setAttribute('data-modal-group-status', 'active');
      }
    });
  });

  // Close modal
  document.querySelectorAll('[data-modal-close]').forEach((closeBtn) => {
    closeBtn.addEventListener('click', closeAllModals);
  });

  // Close modal on `Escape` key
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeAllModals();
    }
  });

  // Function to close all modals
  function closeAllModals() {
    modalTargets.forEach((target) => target.setAttribute('data-modal-status', 'not-active'));
    
    if (modalGroup) {
      modalGroup.setAttribute('data-modal-group-status', 'not-active');
    }
  }
}

// Initialize Basic Modal
document.addEventListener('DOMContentLoaded', () => {
  initModalBasic();
});


;
/* ozastra-legacy-script:51 */

  function initCopyEmailClipboard() {
  const buttons = document.querySelectorAll('.copy-email-button');
  if (!buttons.length) return;

  const copyEmail = (button) => {
  	// Email to copy to clipboard is taking from the button itself, or if that's empty,
    // from a text element inside the button
    const email =
      button.getAttribute('data-copy-email') ||
      button.querySelector('[data-copy-email-element]').textContent.trim();
    if (email) {
      navigator.clipboard.writeText(email).then(() => {
        button.setAttribute('data-copy-button', 'copied');
        button.setAttribute('aria-label', 'Email copied to clipboard!');
      });
    }
  };

  const handleInteraction = (e) => {
    if (
      e.type === 'click' ||
      (e.type === 'keydown' && (e.key === 'Enter' || e.key === ' '))
    ) {
      e.preventDefault();
      copyEmail(e.currentTarget);
    }
  };

  buttons.forEach((button) => {
    button.addEventListener('click', handleInteraction);
    button.addEventListener('keydown', handleInteraction);
    button.addEventListener('mouseleave', () => {
    	// Remove 'active' attribute to reset color and text transform
      button.removeAttribute('data-copy-button');
      // Remove focus on mouseleave to clear keyboard focus styling
      button.blur();
      button.setAttribute('aria-label', 'Copy email to clipboard');
    });
    button.addEventListener('blur', () => {
      button.removeAttribute('data-copy-button');
      button.setAttribute('aria-label', 'Copy email to clipboard');
    });
  });
}

// Initialize Copy Email to Clipboard Button
document.addEventListener('DOMContentLoaded', () => {
  initCopyEmailClipboard();
});


;
/* ozastra-legacy-script:52 */

document.addEventListener("DOMContentLoaded", () => {
  const transition = document.querySelector(".page-transition");
  if (!transition) return;

  // ENTRY: bei jedem Seitenaufruf
  gsap.to(transition, {
    y: "-100%",
    duration: 0.7,
    ease: "power2.out"
  });

  // EXIT: bei jedem internen Link
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute("href");

    if (
      !href ||
      href.startsWith("http") ||
      href.startsWith("#") ||
      href.startsWith("mailto")
    ) return;

    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetUrl = link.href;

      gsap.set(transition, { y: "100%" });
      gsap.to(transition, {
        y: "0%",
        duration: 0.7,
        ease: "power2.inOut",
        onComplete: () => {
          window.location.href = targetUrl;
        }
      });
    });
  });
});

// Bfcache Fix – bei Browser Vor/Zurück Navigation
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    const transition = document.querySelector(".page-transition");
    if (!transition) return;

    gsap.set(transition, { y: "100%" });
    gsap.to(transition, {
      y: "-100%",
      duration: 0.7,
      ease: "power2.out"
    });
  }
});


;
/* ozastra-legacy-script:53 */

  function initTextScramble() {
    const CHARS    = '01#/()[]_';
    const DURATION = 0.7;
    const INTERVAL = 40;
    const CHAR_WIDTH_FACTOR = 0.65;

    function getCharWidth(el) {
      const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
      return (fontSize * CHAR_WIDTH_FACTOR) + 'px';
    }

    function buildSpans(target, original, fixedWidth) {
      if (fixedWidth) {
        const charWidth = getCharWidth(target);
        target.innerHTML = original
          .split('')
          .map(char => char === ' '
            ? `<span style="display:inline-block;width:${charWidth};text-align:center;">&nbsp;</span>`
            : `<span style="display:inline-block;width:${charWidth};text-align:center;">${char}</span>`
          )
          .join('');
      } else {
        target.innerHTML = original
          .split('')
          .map(char => char === ' '
            ? `<span>&nbsp;</span>`
            : `<span>${char}</span>`
          )
          .join('');
      }
      return Array.from(target.querySelectorAll('span'));
    }

    document.querySelectorAll('[data-scramble]').forEach((el) => {
      const target = el.querySelector('[data-scramble-text]') || el;
      const original = target.textContent.trim();

      // data-scramble-fixed-width="false" → kein CHAR_WIDTH_FACTOR
      const fixedWidth = el.getAttribute('data-scramble-fixed-width') !== 'false';

      let spans = buildSpans(target, original, fixedWidth);

      window.addEventListener('resize', () => {
        spans = buildSpans(target, original, fixedWidth);
      });

      function scramble() {
        if (el._scrambleInterval) clearInterval(el._scrambleInterval);
        let iterations = 0;
        const totalFrames = (DURATION * 1000) / INTERVAL;
        el._scrambleInterval = setInterval(() => {
          spans.forEach((span, i) => {
            if (original[i] === ' ') return;
            if (i < Math.floor(iterations / (totalFrames / original.length))) {
              span.textContent = original[i];
            } else {
              span.textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
            }
          });
          iterations++;
          if (iterations >= totalFrames) {
            clearInterval(el._scrambleInterval);
            spans.forEach((span, i) => { span.textContent = original[i]; });
          }
        }, INTERVAL);
      }

      function reset() {
        if (el._scrambleInterval) clearInterval(el._scrambleInterval);
        spans.forEach((span, i) => { span.textContent = original[i]; });
      }

      el.addEventListener('mouseenter', scramble);
      el.addEventListener('mouseleave', reset);
    });
  }

  document.addEventListener('DOMContentLoaded', initTextScramble);


;
/* ozastra-legacy-script:54 */

  gsap.registerPlugin(ScrollTrigger);

  function initTextScrambleScroll() {
    const CHARS    = '01#/()[]_';
    const DURATION = 1.2;
    const INTERVAL = 30;

    document.querySelectorAll('[data-scramble-scroll]').forEach((el) => {
      const original = el.textContent.trim();
      const delay = parseFloat(el.getAttribute('data-delay')) || 0; // Sekunden
      let hasPlayed = false;

      function scramble() {
        if (hasPlayed) return;
        hasPlayed = true;

        setTimeout(() => {
          let iterations = 0;
          const totalFrames = (DURATION * 1000) / INTERVAL;

          const intervalId = setInterval(() => {
            el.textContent = original
              .split('')
              .map((char, i) => {
                if (char === ' ') return ' ';
                if (i < Math.floor(iterations / (totalFrames / original.replace(/ /g, '').length))) {
                  return char;
                }
                return CHARS[Math.floor(Math.random() * CHARS.length)];
              })
              .join('');

            iterations++;

            if (iterations >= totalFrames) {
              clearInterval(intervalId);
              el.textContent = original;
            }
          }, INTERVAL);
        }, delay * 1000); // Delay in ms umrechnen
      }

      ScrollTrigger.create({
        trigger: el,
        start: 'top 80%',
        once: true,
        onEnter: scramble
      });
    });
  }

  document.addEventListener('DOMContentLoaded', initTextScrambleScroll);


;
/* ozastra-legacy-script:55 */

  function initMenuScramble() {
      const CHARS    = '01#/()[]_';
    const DURATION = 0.6;
    const INTERVAL = 30;

    const TEXT_OPEN  = 'Open_menu';
    const TEXT_CLOSE = 'Close_menu';

    document.querySelectorAll('[data-scramble-toggle]').forEach((el) => {
      const target = el.querySelector('[data-scramble-text]') || el;
      let isOpen = false; // false = zeigt "Open menu", true = zeigt "Close menu"
      let intervalId = null;

      // Startzustand sicherstellen
      target.textContent = TEXT_OPEN;

      function scrambleTo(toText) {
        clearInterval(intervalId);
        const original = toText;
        let iterations = 0;
        const totalFrames = (DURATION * 1000) / INTERVAL;

        intervalId = setInterval(() => {
          target.textContent = original
            .split('')
            .map((char, i) => {
              if (char === ' ') return ' ';
              if (i < Math.floor(iterations / (totalFrames / original.replace(/ /g, '').length))) {
                return char;
              }
              return CHARS[Math.floor(Math.random() * CHARS.length)];
            })
            .join('');

          iterations++;

          if (iterations >= totalFrames) {
            clearInterval(intervalId);
            target.textContent = original;
          }
        }, INTERVAL);
      }

      el.addEventListener('click', () => {
        isOpen = !isOpen;
        scrambleTo(isOpen ? TEXT_CLOSE : TEXT_OPEN);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', initMenuScramble);


;
/* ozastra-legacy-script:56 */

  function initMenuItemsScramble() {
    const CHARS    = '01#/()[]_';
    const DURATION = 0.6;
    const INTERVAL = 30;
    const STAGGER  = 80; // ms Versatz zwischen den Elementen

    const items = document.querySelectorAll('[data-scramble-menu]');
    if (!items.length) return;

    function scrambleEl(el, delay) {
      const original = el.textContent.trim();
      setTimeout(() => {
        let iterations = 0;
        const totalFrames = (DURATION * 1000) / INTERVAL;
        clearInterval(el._menuScrambleInterval);

        el._menuScrambleInterval = setInterval(() => {
          el.textContent = original
            .split('')
            .map((char, i) => {
              if (char === ' ') return ' ';
              if (i < Math.floor(iterations / (totalFrames / original.replace(/ /g, '').length))) {
                return char;
              }
              return CHARS[Math.floor(Math.random() * CHARS.length)];
            })
            .join('');

          iterations++;

          if (iterations >= totalFrames) {
            clearInterval(el._menuScrambleInterval);
            el.textContent = original;
          }
        }, INTERVAL);
      }, delay);
    }

    function scrambleAll() {
      items.forEach((el, i) => scrambleEl(el, i * STAGGER));
    }

    // An den Menü-Button koppeln: beim Öffnen scramblen
    const menuBtn = document.querySelector('[data-scramble-toggle]');
    if (menuBtn) {
      let isOpen = false;
      menuBtn.addEventListener('click', () => {
        isOpen = !isOpen;
        if (isOpen) scrambleAll(); // nur beim Öffnen, nicht beim Schließen
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initMenuItemsScramble);


;
/* ozastra-legacy-script:57 */

  function initMenuScramble() {
    const CHARS    = '01#/()[]_';
    const DURATION = 0.6;
    const INTERVAL = 30;

    const TEXT_OPEN  = 'Open menu';
    const TEXT_CLOSE = 'Close menu';

    document.querySelectorAll('[data-scramble-toggle]').forEach((el) => {
      const target = el.querySelector('[data-scramble-text]') || el;
      let isOpen = false;
      let intervalId = null;

      target.textContent = TEXT_OPEN;

      function scrambleTo(toText) {
        clearInterval(intervalId);
        const original = toText;
        let iterations = 0;
        const totalFrames = (DURATION * 1000) / INTERVAL;

        intervalId = setInterval(() => {
          target.textContent = original
            .split('')
            .map((char, i) => {
              if (char === ' ') return ' ';
              if (i < Math.floor(iterations / (totalFrames / original.replace(/ /g, '').length))) {
                return char;
              }
              return CHARS[Math.floor(Math.random() * CHARS.length)];
            })
            .join('');

          iterations++;

          if (iterations >= totalFrames) {
            clearInterval(intervalId);
            target.textContent = original;
          }
        }, INTERVAL);
      }

      el.addEventListener('click', () => {
        isOpen = !isOpen;
        scrambleTo(isOpen ? TEXT_CLOSE : TEXT_OPEN);
      });

      // Von außen aufrufbar: Menü-Status auf "geschlossen" zurücksetzen
      el._resetMenuScramble = () => {
        if (!isOpen) return;        // schon zu, nichts tun
        isOpen = false;
        scrambleTo(TEXT_OPEN);
      };
    });

    // Beim Klick auf einen Menü-Anchor-Link den Toggle zurücksetzen
    document.querySelectorAll('[data-scramble-menu-close]').forEach((link) => {
      link.addEventListener('click', () => {
        document.querySelectorAll('[data-scramble-toggle]').forEach((el) => {
          if (typeof el._resetMenuScramble === 'function') el._resetMenuScramble();
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', initMenuScramble);


;
/* ozastra-legacy-script:58 */

  document.addEventListener('DOMContentLoaded', function () {
    let openId = null;

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(255,255,255,0.0);opacity:0;pointer-events:none;transition:opacity 0.3s ease;z-index:99;';
    document.body.appendChild(overlay);

    function showOverlay() {
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'all';
    }

    function hideOverlay() {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
    }

    function getDropdown(id) {
      return document.querySelector('[data-dropdown="' + id + '"]');
    }

    function rotateIcon(trigger, open) {
      const icon = trigger.querySelector('.chevron');
      if (!icon) return;
      icon.style.transition = 'transform 0.3s ease';
      icon.style.transform = open ? 'rotate(-90deg)' : 'rotate(0deg)';
    }

    function fadeTrigger(trigger, open) {
      trigger.style.transition = 'opacity 0.3s ease';
      trigger.style.opacity = open ? '0.5' : '';
    }

    function closeAll() {
      document.querySelectorAll('[data-dropdown]').forEach(function (d) {
        d.style.display = 'none';
      });
      document.querySelectorAll('[data-dropdown-trigger]').forEach(function (t) {
        rotateIcon(t, false);
        fadeTrigger(t, false);
      });
      hideOverlay();
      openId = null;
    }

    closeAll();

    document.querySelectorAll('[data-dropdown-trigger]').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        const id = trigger.getAttribute('data-dropdown-trigger');
        const dropdown = getDropdown(id);
        if (!dropdown) return;

        if (openId === id) {
          closeAll();
        } else {
          closeAll();
          dropdown.style.display = 'flex';
          rotateIcon(trigger, true);
          fadeTrigger(trigger, true);
          showOverlay();
          openId = id;
        }
      });
    });

    overlay.addEventListener('click', function () {
      closeAll();
    });

    document.addEventListener('click', function (e) {
      const insideTrigger = e.target.closest('[data-dropdown-trigger]');
      const insideDropdown = e.target.closest('[data-dropdown]');
      if (!insideTrigger && !insideDropdown && openId !== null) {
        closeAll();
      }
    });
  });


;
/* ozastra-legacy-script:59 */

// Lenis
const lenis = new Lenis({
  autoRaf: true,
});


;
/* ozastra-legacy-script:61 */

  document.addEventListener('DOMContentLoaded', function () {
    const el = document.getElementById('mission-lottie');
    if (!el) return;

    // Warte bis Webflow die Lottie-Instanz initialisiert hat
    const check = setInterval(function () {
      const lottie = el._lottie || el.lottieInstance;
      if (lottie && typeof lottie.setSpeed === 'function') {
        lottie.setSpeed(0.6); // 100% - 40% = 60% = 0.6
        clearInterval(check);
      }
    }, 100);

    // Stopp nach 5 Sekunden falls keine Instanz gefunden
    setTimeout(function () { clearInterval(check); }, 5000);
  });

