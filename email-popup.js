// Email Popup with Beehiiv Integration - Simplified for bottom form only
class EmailPopup {
  constructor(options = {}) {
    this.publicationId = options.publicationId || process.env.BEEHIIV_PUBLICATION_ID;
    this.apiKey = options.apiKey || process.env.BEEHIIV_API_KEY;
    this.discountCode = options.discountCode || '$500Saved1stOrder-xyyx';

    if (!this.publicationId || !this.apiKey) {
      console.error('EmailPopup: Missing BEEHIIV credentials');
      return;
    }

    this.init();
  }

  init() {
    this.setupHeaderButton();
    this.setupBottomForm();
  }

  setupHeaderButton() {
    const headerBtn = document.getElementById('emailPopupHeaderBtn');
    if (headerBtn) {
      headerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.scrollToBottom();
      });
    }
  }

  setupBottomForm() {
    const bottomForm = document.getElementById('emailPopupBottomForm');
    if (bottomForm) {
      bottomForm.addEventListener('submit', (e) => this.handleBottomSubmit(e));
    }

    // Check if user already submitted
    if (sessionStorage.getItem('emailPopupSubmitted')) {
      this.disableBottomForm();
    }
  }

  scrollToBottom() {
    const bottomSection = document.querySelector('.email-popup-bottom-section');
    if (bottomSection) {
      bottomSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        const emailInput = document.getElementById('emailPopupBottomInput');
        if (emailInput) {
          emailInput.focus();
        }
      }, 500);
    }
  }

  disableBottomForm() {
    const bottomInput = document.getElementById('emailPopupBottomInput');
    const bottomBtn = document.getElementById('emailPopupBottomSubmit');
    
    if (bottomInput && bottomBtn) {
      bottomInput.disabled = true;
      bottomBtn.disabled = true;
      bottomBtn.textContent = 'Already Subscribed ✓';
    }
  }

  async handleBottomSubmit(e) {
    e.preventDefault();

    const email = document.getElementById('emailPopupBottomInput').value.trim();
    const errorDiv = document.getElementById('emailPopupBottomError');
    const submitBtn = document.getElementById('emailPopupBottomSubmit');
    const input = document.getElementById('emailPopupBottomInput');

    errorDiv.textContent = '';
    errorDiv.classList.remove('show');

    if (!this.validateEmail(email)) {
      errorDiv.textContent = 'Please enter a valid email address';
      errorDiv.classList.add('show');
      return;
    }

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Adding to list...';

    try {
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

      sessionStorage.setItem('emailPopupSubmitted', 'true');

      submitBtn.textContent = '✓ Success! Code: ' + this.discountCode;
      submitBtn.style.backgroundColor = '#00d4ff';
      input.disabled = true;
      
      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        submitBtn.style.backgroundColor = '';
        input.value = '';
      }, 5000);
    } catch (error) {
      console.error('Error:', error);
      errorDiv.textContent = 'Error submitting email. Please try again.';
      errorDiv.classList.add('show');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new EmailPopup({
    publicationId: 'pub_710fefe1-f78e-436a-a1d7-c0b71ea9ac2f',
    apiKey: '5PEvsxrZkNIuOgPnzysNqwmNn9UBj6gOpAXTct91hNKGvz5EFN2PPWfbkyX58ciS',
    discountCode: '$500Saved1stOrder-xyyx',
  });
});
