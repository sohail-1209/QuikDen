// SMS Service — Textlocal integration with fallback mock mode
const AppError = require('../utils/AppError');

/**
 * Sends a mobile verification OTP via Textlocal.
 * If TEXTLOCAL_API_KEY is not set, prints to console and returns the OTP in mock mode.
 * 
 * @param {string} phone - User's phone number
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<{success: boolean, mode?: string, otp?: string, error?: string}>}
 */
async function sendSMSOTP(phone, otp) {
  const apiKey = process.env.TEXTLOCAL_API_KEY;
  const sender = process.env.TEXTLOCAL_SENDER || 'TXTLCL';

  if (!apiKey) {
    console.log(`\n==================================================`);
    console.log(`[SMS MOCK] Verification OTP for ${phone}: ${otp}`);
    console.log(`==================================================\n`);
    return { success: false, mode: 'mock', otp };
  }

  // Textlocal expects phone numbers to have country prefix (e.g., 91 for India)
  // Clean phone number: remove +, spaces, dashes
  let cleanPhone = phone.replace(/[+\s-]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone; // Default to India country code if 10 digits
  }

  // The message template must match DLT configuration in India
  // e.g. "Your Quikden verification code is: 123456"
  const messageText = `Your Quikden verification code is: ${otp}`;
  const encodedMessage = encodeURIComponent(messageText);
  const url = `https://api.textlocal.in/send/?apikey=${apiKey}&numbers=${cleanPhone}&message=${encodedMessage}&sender=${sender}`;

  try {
    const response = await fetch(url, { method: 'POST' });
    const data = await response.json();
    
    if (data.status === 'success') {
      console.log(`[SMS] OTP sent successfully via Textlocal to ${phone}`);
      return { success: true };
    } else {
      console.error(`[SMS] Textlocal API error response:`, data);
      const errorMsg = data.errors?.[0]?.message || 'Unknown Textlocal API error';
      return { success: false, error: errorMsg, otp };
    }
  } catch (err) {
    console.error(`[SMS] Failed to send SMS via Textlocal:`, err.message);
    return { success: false, error: err.message, otp };
  }
}

module.exports = {
  sendSMSOTP,
};
