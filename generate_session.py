#!/usr/bin/env python3
"""
Telegram Session String Generator
Run: python3 generate_session.py
"""

from telethon import TelegramClient
from telethon.sessions import StringSession
import asyncio

# API credentials
API_ID = 33087206
API_HASH = "8b58cda7eeecc309da3792d577162bb5"

async def main():
    print("Telegram Session String Generator")
    print("=" * 40)
    
    # Create client with empty string session
    client = TelegramClient(StringSession(), API_ID, API_HASH)
    
    print("Starting Telegram client...")
    await client.start()
    
    # Get the session string
    session_string = client.session.save()
    
    print("\n" + "="*50)
    print("SESSION STRING GENERATED SUCCESSFULLY!")
    print("="*50)
    print(f"Session String: {session_string}")
    print("="*50)
    print("\nAdd this to your .env file:")
    print(f"TELEGRAM_API_ID={API_ID}")
    print(f"TELEGRAM_API_HASH={API_HASH}")
    print(f"TELEGRAM_SESSION_STRING={session_string}")
    
    await client.disconnect()
    print("\nSession generation complete!")

if __name__ == "__main__":
    asyncio.run(main())
