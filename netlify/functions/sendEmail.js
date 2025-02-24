const sgMail = require('@sendgrid/mail');
const querystring = require('querystring');
const axios = require('axios');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    // Determine content type and parse the data
    const contentType =
      event.headers['content-type'] || event.headers['Content-Type'];
    let data = {};

    if (contentType && contentType.includes('application/json')) {
      data = JSON.parse(event.body);
    } else {
      // Fallback: assume URL-encoded
      data = querystring.parse(event.body);
    }

    // Anti-spam: Honeypot field ("website" should be empty)
    if (data.website) {
      console.warn('Honeypot triggered!');
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Spam detected!' }),
      };
    }

    // Verify reCAPTCHA token (if provided)
    if (data['g-recaptcha-response']) {
      const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
      const recaptchaResponse = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        {},
        {
          params: {
            secret: recaptchaSecret,
            response: data['g-recaptcha-response'],
          },
        }
      );

      if (
        !recaptchaResponse.data.success ||
        recaptchaResponse.data.score < 0.5
      ) {
        // Adjust the score threshold as needed
        console.warn('reCAPTCHA validation failed or score too low');
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: 'reCAPTCHA validation failed. Please try again.',
          }),
        };
      }
    } else {
      console.warn('Missing reCAPTCHA response.');
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing reCAPTCHA response.' }),
      };
    }

    // Destructure common fields
    const { name, email, comment, phone, subject, formType, sponsor_package } =
      data;

    // Build email subject and body based on formType
    let emailSubject = `New Form Submission from ${name}`;
    let emailText = `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nSubject: ${subject}\nMessage: ${comment}`;

    if (formType === 'register') {
      emailSubject = `New Registration Form Submission from ${name}`;
    } else if (formType === 'sponsor') {
      emailSubject = `New Sponsor Form Submission from ${name}`;
      emailText += `\nSponsor Package: ${sponsor_package}`;
    }

    const msg = {
      to: 'andoverapacheswc@gmail.com',
      from: 'andoverapacheswc@gmail.com',
      subject: emailSubject,
      text: emailText,
    };

    await sgMail.send(msg);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email sent successfully' }),
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to send email' }),
    };
  }
};
