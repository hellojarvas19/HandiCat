import axios from 'axios'
import { NativeParserInterface } from '../types/general-interfaces'
import { TxMessages } from '../bot/messages/tx-messages'
import { FormatNumbers } from '../lib/format-numbers'
import { PrismaUserRepository } from '../repositories/prisma/user'

export class TelegramUserClient {
  private apiId: string
  private apiHash: string
  private sessionString: string
  private prismaUserRepository: PrismaUserRepository

  constructor() {
    this.apiId = process.env.TELEGRAM_API_ID || ''
    this.apiHash = process.env.TELEGRAM_API_HASH || ''
    this.sessionString = process.env.TELEGRAM_SESSION_STRING || ''
    this.prismaUserRepository = new PrismaUserRepository()
  }

  async connect() {
    // Connection logic would go here
    console.log('Telegram User Client initialized')
  }

  async sendBuyMessageToGroups(message: NativeParserInterface, walletName: string) {
    // Only send BUY messages to groups
    if (message.type !== 'buy') {
      return
    }

    try {
      // Get all user groups that have this wallet
      const userGroups = await this.prismaUserRepository.getUserGroupsByWallet(message.owner)
      
      for (const group of userGroups) {
        try {
          const tokenMarketCap = message.swappedTokenMc
          const formattedMarketCap = tokenMarketCap ? FormatNumbers.formatPrice(tokenMarketCap) : undefined
          
          let messageText = ''
          
          if (message.platform === 'raydium' || message.platform === 'jupiter' || message.platform === 'pumpfun_amm' || message.platform === 'pumpfun') {
            messageText = TxMessages.defiTxMessage(message, formattedMarketCap, walletName)
          } else if (message.platform === 'mint_pumpfun') {
            messageText = TxMessages.tokenMintedMessage(message, walletName)
          }

          if (messageText) {
            // For now, just log the message that would be sent
            // You'll need to implement actual Telegram User API calls here
            console.log(`[GROUP ${group.chatId}] BUY: ${messageText.substring(0, 100)}...`)
          }
        } catch (error) {
          console.log(`Failed to send message to group ${group.chatId}:`, error)
        }
      }
    } catch (error) {
      console.log('Error sending buy message to groups:', error)
    }
  }
}
