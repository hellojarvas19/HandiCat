# Telegram User API Setup Guide

## Overview
The bot now supports dual messaging:
- **Personal chats**: All transaction messages (buy/sell) via bot
- **Group chats**: Only BUY messages via Telegram User API

## Implementation Status ✅
- ✅ Created TelegramUserClient class
- ✅ Added getUserGroupsByWallet method to user repository
- ✅ Modified watch-transactions to send buy messages to groups
- ✅ Updated environment variables

## Next Steps to Complete Setup:

### 1. Get Telegram User API Credentials
1. Go to https://my.telegram.org/apps
2. Create a new application
3. Get your `api_id` and `api_hash`

### 2. Update Environment Variables
Add to your `.env` file:
```env
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_SESSION_STRING=your_session_string
```

### 3. Install Telegram User API Library
```bash
npm install telegram
npm install --save-dev @types/telegram
```

### 4. Generate Session String
You'll need to generate a session string for your Telegram account. Create a script:

```javascript
// generate-session.js
const { TelegramApi } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');

const apiId = parseInt(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const stringSession = new StringSession('');

(async () => {
  const client = new TelegramApi(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });
  
  await client.start({
    phoneNumber: async () => await input.text('Phone number: '),
    password: async () => await input.text('Password: '),
    phoneCode: async () => await input.text('Code: '),
    onError: (err) => console.log(err),
  });
  
  console.log('Session string:', client.session.save());
  await client.disconnect();
})();
```

### 5. Update TelegramUserClient Implementation
Replace the placeholder implementation in `src/config/telegram-user-client.ts` with actual Telegram API calls.

## Current Behavior:
- ✅ Bot sends ALL messages to personal chats
- ✅ System logs BUY messages that would be sent to groups
- ✅ Database queries work for finding user groups by wallet

## To Complete:
1. Install telegram library
2. Generate session string
3. Replace console.log with actual API calls in TelegramUserClient

The infrastructure is ready - just need the Telegram User API implementation!
