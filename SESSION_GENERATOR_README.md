# Telegram Session String Generator

## Quick Setup

1. **Install Python dependencies:**
```bash
pip3 install -r requirements.txt
```

2. **Get Telegram API credentials:**
   - Go to https://my.telegram.org/apps
   - Create a new application
   - Note your `api_id` and `api_hash`

3. **Run the generator:**
```bash
python3 generate_session.py
```

4. **Follow the prompts:**
   - Enter your API ID
   - Enter your API Hash  
   - Enter your phone number (with country code, e.g., +1234567890)
   - Enter the verification code sent to your Telegram
   - If you have 2FA, enter your password

5. **Copy the session string to your .env file:**
```env
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_SESSION_STRING=your_generated_session_string
```

## Security Note
Keep your session string private - it gives full access to your Telegram account!
