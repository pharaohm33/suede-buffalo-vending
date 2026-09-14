// Email Popup with Beehiiv Integration
class EmailPopup {
  constructor(options = {}) {
    this.publicationId = options.publicationId || process.env.BEEHIIV_PUBLICATION_ID;
    this.apiKey = options.apiKey || process.env.BEEHIIV_API_KEY;
    this.discountCode = options.discountCode || '$500Saved1stOrder-xyyx';
    this.isOpen = false;
    this.hasSubmitted = false;

    if (!this.publicationId || !this.apiKey) {
      console.error('EmailPopup: Missing BEEHIIV_PUBLICATION_ID or BEEHIIV_API_KEY');
      return;
    }

    this.init();
  }

  init() {
    this.createPopupHTML();
    this.attachEventListeners();
    this.setupButtonTriggers();
  }

  createPopupHTML() {
    const popupHTML = `
      <div class="email-popup-overlay hidden" id="emailPopupOverlay">
        <div class="email-popup-modal">
          <button class="email-popup-close" id="emailPopupClose">&times;</button>
          
          <div class="email-popup-content" id="emailPopupContent">
            <h2>Exclusive Offer</h2>
            <div class="email-popup-discount">$500 OFF</div>
            <p>Join our mailing list and get <strong>$500 off your next order</strong></p>
            <p>Enter your email below to receive your exclusive discount code</p>
            
            <form class="email-popup-form" id="emailPopupForm">
              <input
                type="email"
                class="email-popup-input"
                id="emailPopupInput"
                placeholder="Enter your email address"
                required
                autocomplete="email"
              />
              <div class="email-popup-error" id="emailPopupError"></div>
              <button type="submit" class="email-popup-button" id="emailPopupSubmit">
                Get My Discount Code
              </button>
            </form>
          </div>

          <div class="email-popup-success" id="emailPopupSuccess">
            <h3>✓ Success!</h3>
            <p>Thank you for subscribing!</p>
            <p>Your exclusive discount code:</p>
            <div class="email-popup-code" id="emailPopupCodeDisplay"></div>
            <p style="font-size: 12px; color: #808080; margin-top: 12px;">
              Share this code with our sales team before purchase
            </p>
            <button class="email-popup-copy-btn" id="emailPopupCopyBtn">Copy Code</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', popupHTML);
  }

  attachEventListeners() {
    const overlay = document.getElementById('emailPopupOverlay');
    const closeBtn = document.getElementById('emailPopupClose');
    const form = document.getElementById('emailPopupForm');
    const copyBtn = document.getElementById('emailPopupCopyBtn');

    closeBtn.addEventListener('click', () => this.closePopup());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closePopup();
    });
    form.addEventListener('submit', (e) => this.handleSubmit(e));
    copyBtn.addEventListener('click', () => this.copyCodeToClipboard());
  }

  setupButtonTriggers() {
    // Get Discount button in header - scroll to bottom form
    const headerBtn = document.getElementById('emailPopupHeaderBtn');
    if (headerBtn) {
      headerBtn.addEventListener('click', () => this.scrollToBottom());
    }

    // Bottom form submission
    const bottomForm = document.getElementById('emailPopupBottomForm');
    if (bottomForm) {
      bottomForm.addEventListener('submit', (e) => this.handleBottomSubmit(e));
    }

    // Check if user has already submitted in this session
    if (sessionStorage.getItem('emailPopupSubmitted')) {
      this.disableBottomForm();
      return;
    }
  }

  scrollToBottom() {
    const bottomSection = document.querySelector('.email-popup-bottom-section');
    if (bottomSection) {
      bottomSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Focus on email input for better UX
      setTimeout(() => {
        const emailInput = document.getElementById('emailPopupBottomInput');
        if (emailInput) {
          emailInput.focus();
        }
      }, 500);
    }
  }

  disableBottomForm() {
    const bottomForm = document.getElementById('emailPopupBottomForm');
    const bottomInput = document.getElementById('emailPopupBottomInput');
    const bottomBtn = document.getElementById('emailPopupBottomSubmit');
    
    if (bottomForm) {
      bottomInput.disabled = true;
      bottomBtn.disabled = true;
      bottomBtn.textContent = 'Already Subscribed ✓';
      bottomInput.value = '';
    }
  }

  openPopup() {
    const overlay = document.getElementById('emailPopupOverlay');
    overlay.classList.remove('hidden');
    this.isOpen = true;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  closePopup() {
    const overlay = document.getElementById('emailPopupOverlay');
    overlay.classList.add('hidden');
    this.isOpen = false;

    // Restore body scroll
    document.body.style.overflow = 'auto';
  }

  async handleSubmit(e) {
    e.preventDefault();

    const email = document.getElementById('emailPopupInput').value.trim();
    const errorDiv = document.getElementById('emailPopupError');
    const submitBtn = document.getElementById('emailPopupSubmit');
    const contentDiv = document.getElementById('emailPopupContent');
    const successDiv = document.getElementById('emailPopupSuccess');

    // Clear previous errors
    errorDiv.textContent = '';
    errorDiv.classList.remove('show');

    // Validate email
    if (!this.validateEmail(email)) {
      errorDiv.textContent = 'Please enter a valid email address';
      errorDiv.classList.add('show');
      return;
    }

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding to list...';

    try {
      // Add subscriber to Beehiiv with "smart vending buyer" tag
      const response = await fetch(
        `https://api.beehiiv.com/v1/publications/${this.publicationId}/subscriptions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            email: email,
            reactivate_existing: true,
            send_welcome_email: true,
            tags: ['smart vending buyer'], // This tag triggers the specific automation
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Beehiiv API error: ${response.statusText}`);
      }

      // Success! Show success state
      this.hasSubmitted = true;
      sessionStorage.setItem('emailPopupSubmitted', 'true');

      // Update UI
      contentDiv.style.display = 'none';
      successDiv.classList.add('show');
      document.getElementById('emailPopupCodeDisplay').textContent = this.discountCode;

      // Auto-close after 10 seconds
      setTimeout(() => {
        this.closePopup();
      }, 10000);
    } catch (error) {
      console.error('Error adding subscriber:', error);
      errorDiv.textContent =
        'Error submitting your email. Please try again later.';
      errorDiv.classList.add('show');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Get My Discount Code';
    }
  }

  copyCodeToClipboard() {
    const code = this.discountCode;
    navigator.clipboard.writeText(code).then(() => {
      const copyBtn = document.getElementById('emailPopupCopyBtn');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    });
  }

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  async handleBottomSubmit(e) {
    e.preventDefault();

    const email = document.getElementById('emailPopupBottomInput').value.trim();
    const errorDiv = document.getElementById('emailPopupBottomError');
    const submitBtn = document.getElementById('emailPopupBottomSubmit');
    const input = document.getElementById('emailPopupBottomInput');

    // Clear previous errors
    errorDiv.textContent = '';
    errorDiv.classList.remove('show');

    // Validate email
    if (!this.validateEmail(email)) {
      errorDiv.textContent = 'Please enter a valid email address';
      errorDiv.classList.add('show');
      return;
    }

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding to list...';

    try {
      // Add subscriber to Beehiiv with "smart vending buyer" tag
      const response = await fetch(
        `https://api.beehiiv.com/v1/publications/${this.publicationId}/subscriptions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            email: email,
            reactivate_existing: true,
            send_welcome_email: true,
            tags: ['smart vending buyer'],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Beehiiv API error: ${response.statusText}`);
      }

      // Success! Update UI
      this.hasSubmitted = true;
      sessionStorage.setItem('emailPopupSubmitted', 'true');

      // Show success state
      submitBtn.textContent = '✓ Success! Code: ' + this.discountCode;
      submitBtn.style.backgroundColor = '#00d4ff';
      input.disabled = true;
      
      // Reset after 5 seconds
      setTimeout(() => {
        submitBtn.textContent = 'Get My Discount Code';
        submitBtn.disabled = false;
        submitBtn.style.backgroundColor = '';
        input.disabled = false;
        input.value = '';
      }, 5000);
    } catch (error) {
      console.error('Error adding subscriber:', error);
      errorDiv.textContent = 'Error submitting your email. Please try again later.';
      errorDiv.classList.add('show');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Get My Discount Code';
    }
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new EmailPopup({
    publicationId: 'pub_710fefe1-f78e-436a-a1d7-c0b71ea9ac2f',
    apiKey: '5PEvsxrZkNIuOgPnzysNqwmNn9UBj6gOpAXTct91hNKGvz5EFN2PPWfbkyX58ciS',
    discountCode: '$500Saved1stOrder-xyyx',
  });
});

  createPopupHTML() {
    const popupHTML = `
      <div class="email-popup-overlay hidden" id="emailPopupOverlay">
        <div class="email-popup-modal">
          <button class="email-popup-close" id="emailPopupClose">&times;</button>
          
          <div class="email-popup-content" id="emailPopupContent">
            <h2>Exclusive Offer</h2>
            <div class="email-popup-discount">$500 OFF</div>
            <p>Join our mailing list and get <strong>$500 off your next order</strong></p>
            <p>Enter your email below to receive your exclusive discount code</p>
            
            <form class="email-popup-form" id="emailPopupForm">
              <input
                type="email"
                class="email-popup-input"
                id="emailPopupInput"
                placeholder="Enter your email address"
                required
                autocomplete="email"
              />
              <div class="email-popup-error" id="emailPopupError"></div>
              <button type="submit" class="email-popup-button" id="emailPopupSubmit">
                Get My Discount Code
              </button>
            </form>
          </div>

          <div class="email-popup-success" id="emailPopupSuccess">
            <h3>✓ Success!</h3>
            <p>Thank you for subscribing!</p>
            <p>Your exclusive discount code:</p>
            <div class="email-popup-code" id="emailPopupCodeDisplay"></div>
            <p style="font-size: 12px; color: #808080; margin-top: 12px;">
              Share this code with our sales team before purchase
            </p>
            <button class="email-popup-copy-btn" id="emailPopupCopyBtn">Copy Code</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', popupHTML);
  }

  attachEventListeners() {
    const overlay = document.getElementById('emailPopupOverlay');
    const closeBtn = document.getElementById('emailPopupClose');
    const form = document.getElementById('emailPopupForm');
    const copyBtn = document.getElementById('emailPopupCopyBtn');

    closeBtn.addEventListener('click', () => this.closePopup());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closePopup();
    });
    form.addEventListener('submit', (e) => this.handleSubmit(e));
    copyBtn.addEventListener('click', () => this.copyCodeToClipboard());
  }

  schedulePopup() {
    // Check if user has already submitted in this session
    if (sessionStorage.getItem('emailPopupSubmitted')) {
      return;
    }

    setTimeout(() => {
      this.openPopup();
      this.initialPopupShown = true;
    }, this.delayMs);
  }

  setupScrollDetection() {
    // Check if user has already submitted - no need to show on scroll
    if (sessionStorage.getItem('emailPopupSubmitted')) {
      return;
    }

    window.addEventListener('scroll', () => {
      // Don't show if user already submitted
      if (sessionStorage.getItem('emailPopupSubmitted')) {
        return;
      }

      // Don't show if currently open
      if (this.isOpen) {
        return;
      }

      // Calculate scroll percentage
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;

      // Show popup when user scrolls to threshold (e.g., 80% down)
      if (scrollPercent >= this.scrollThreshold && !this.hasScrollShown) {
        this.hasScrollShown = true;
        this.openPopup();
      }

      // Reset scroll flag if user scrolls back up (allow showing again on next scroll down)
      if (scrollPercent < this.scrollThreshold * 0.5) {
        this.hasScrollShown = false;
      }
    });
  }

  openPopup() {
    const overlay = document.getElementById('emailPopupOverlay');
    overlay.classList.remove('hidden');
    this.isOpen = true;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  closePopup() {
    const overlay = document.getElementById('emailPopupOverlay');
    overlay.classList.add('hidden');
    this.isOpen = false;

    // Restore body scroll
    document.body.style.overflow = 'auto';

    // Reset scroll flag to allow showing again if they scroll back down
    // (but only if they haven't already submitted)
    if (!sessionStorage.getItem('emailPopupSubmitted')) {
      this.hasScrollShown = false;
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    const email = document.getElementById('emailPopupInput').value.trim();
    const errorDiv = document.getElementById('emailPopupError');
    const submitBtn = document.getElementById('emailPopupSubmit');
    const contentDiv = document.getElementById('emailPopupContent');
    const successDiv = document.getElementById('emailPopupSuccess');

    // Clear previous errors
    errorDiv.textContent = '';
    errorDiv.classList.remove('show');

    // Validate email
    if (!this.validateEmail(email)) {
      errorDiv.textContent = 'Please enter a valid email address';
      errorDiv.classList.add('show');
      return;
    }

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding to list...';

    try {
      // Add subscriber to Beehiiv with "smart vending buyer" tag
      const response = await fetch(
        `https://api.beehiiv.com/v1/publications/${this.publicationId}/subscriptions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            email: email,
            reactivate_existing: true,
            send_welcome_email: true,
            tags: ['smart vending buyer'], // This tag triggers the specific automation
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Beehiiv API error: ${response.statusText}`);
      }

      // Success! Show success state
      this.hasSubmitted = true;
      sessionStorage.setItem('emailPopupSubmitted', 'true');

      // Update UI
      contentDiv.style.display = 'none';
      successDiv.classList.add('show');
      document.getElementById('emailPopupCodeDisplay').textContent = this.discountCode;

      // Auto-close after 10 seconds
      setTimeout(() => {
        this.closePopup();
      }, 10000);
    } catch (error) {
      console.error('Error adding subscriber:', error);
      errorDiv.textContent =
        'Error submitting your email. Please try again later.';
      errorDiv.classList.add('show');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Get My Discount Code';
    }
  }

  copyCodeToClipboard() {
    const code = this.discountCode;
    navigator.clipboard.writeText(code).then(() => {
      const copyBtn = document.getElementById('emailPopupCopyBtn');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    });
  }

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new EmailPopup({
    publicationId: 'pub_710fefe1-f78e-436a-a1d7-c0b71ea9ac2f',
    apiKey: '5PEvsxrZkNIuOgPnzysNqwmNn9UBj6gOpAXTct91hNKGvz5EFN2PPWfbkyX58ciS',
    discountCode: '$500Saved1stOrder-xyyx',
    delayMs: 2000, // Show after 2 seconds on page load
    scrollThreshold: 0.8, // Show when user scrolls to 80% down the page
  });
});
