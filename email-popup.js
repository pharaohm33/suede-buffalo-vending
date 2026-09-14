// Email Popup with Beehiiv Integration
class EmailPopup {
  constructor(options = {}) {
    this.publicationId = options.publicationId || process.env.BEEHIIV_PUBLICATION_ID;
    this.apiKey = options.apiKey || process.env.BEEHIIV_API_KEY;
    this.discountCode = options.discountCode || '$500Saved1stOrder-xyyx';
    this.delayMs = options.delayMs || 2000; // Show popup after 2 seconds
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
    this.schedulePopup();
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

  schedulePopup() {
    // Check if user has already submitted in this session
    if (sessionStorage.getItem('emailPopupSubmitted')) {
      return;
    }

    setTimeout(() => {
      this.openPopup();
    }, this.delayMs);
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
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new EmailPopup({
    publicationId: 'pub_710fefe1-f78e-436a-a1d7-c0b71ea9ac2f',
    apiKey: '5PEvsxrZkNIuOgPnzysNqwmNn9UBj6gOpAXTct91hNKGvz5EFN2PPWfbkyX58ciS',
    discountCode: '$500Saved1stOrder-xyyx',
    delayMs: 2000, // Show after 2 seconds
  });
});
