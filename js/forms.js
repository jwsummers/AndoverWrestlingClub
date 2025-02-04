document.addEventListener('DOMContentLoaded', function () {
  const forms = document.querySelectorAll('form.contact-form-style-02');

  forms.forEach((form) => {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();

      // Execute reCAPTCHA v3 and get the token
      grecaptcha.ready(function () {
        grecaptcha
          .execute('6LcuEswqAAAAAMDQDdV8--Wff96Ub970YjoTqBck', {
            action: 'submit',
          })
          .then(async function (token) {
            console.log('reCAPTCHA token received:', token);
            if (!token) {
              console.error('No token generated!');
            }

            // Append token and timestamp to the form data
            let formData = new FormData(form);
            formData.append('g-recaptcha-response', token);
            const timestamp = Date.now();
            formData.append('formTimestamp', timestamp);

            // Debug: Log appended values directly from FormData
            console.log(
              'g-recaptcha-response in FormData:',
              formData.get('g-recaptcha-response')
            );
            console.log(
              'formTimestamp in FormData:',
              formData.get('formTimestamp')
            );

            // Convert FormData to a plain object
            const data = {};
            formData.forEach((value, key) => {
              data[key] = value;
            });

            console.log('Data object to be sent:', data);

            try {
              const response = await fetch('/.netlify/functions/sendEmail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              });

              const result = await response.json();
              console.log('Network response:', result);
              const formResults = form.querySelector('.form-results');

              if (response.ok) {
                formResults.textContent = result.message;
                formResults.classList.remove('d-none');
                formResults.classList.add('alert', 'alert-success');
                form.reset();

                if (data.formType === 'sponsor') {
                  showLogoUploadModal();
                }
              } else {
                formResults.textContent =
                  result.message || 'An error occurred.';
                formResults.classList.remove('d-none');
                formResults.classList.add('alert', 'alert-danger');
              }
            } catch (error) {
              console.error('Form submission error:', error);
              const formResults = form.querySelector('.form-results');
              formResults.textContent =
                'An error occurred while submitting the form.';
              formResults.classList.remove('d-none');
              formResults.classList.add('alert', 'alert-danger');
            }
          });
      });
    });
  });

  // Custom modal function for sponsor forms...
  function showLogoUploadModal() {
    // (Modal code remains unchanged)
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'logoUploadModal';
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100%';
    modalOverlay.style.height = '100%';
    modalOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';
    modalOverlay.style.zIndex = '1000';

    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#fff';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '8px';
    modalContent.style.textAlign = 'center';
    modalContent.style.maxWidth = '400px';
    modalContent.style.width = '90%';

    modalContent.innerHTML = `
          <h3 class="alt-font">Upload Your Logo</h3>
          <p>Would you like to upload an image of your company logo now? This will open your email client with a pre-populated message for you to attach your logo.</p>
          <div style="margin-top: 20px;">
            <button id="modalYes" class="btn btn-base-color btn-round-edge" style="margin-right: 10px;">Yes</button>
            <button id="modalNo" class="btn btn-dark-gray btn-round-edge">No</button>
          </div>
        `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    document.getElementById('modalYes').addEventListener('click', function () {
      window.location.href =
        'mailto:andoverapacheswc@gmail.com?subject=Logo Submission for Sponsorship&body=Hello,%0D%0A%0D%0APlease attach your company logo image for my sponsorship application.%0D%0A%0D%0AThank you.';
      closeModal();
    });
    document.getElementById('modalNo').addEventListener('click', closeModal);

    function closeModal() {
      document.body.removeChild(modalOverlay);
    }
  }
});
