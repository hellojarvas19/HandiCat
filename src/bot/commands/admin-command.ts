import TelegramBot from 'node-telegram-bot-api'
import { BotMiddleware } from '../../config/bot-middleware'
import { SUB_MENU } from '../../config/bot-menus'
import { adminExpectingBannedWallet } from '../../constants/flags'
import { PublicKey } from '@solana/web3.js'
import { PrismaWalletRepository } from '../../repositories/prisma/wallet'
import { TrackWallets } from '../../lib/track-wallets'

export class AdminCommand {
  private walletRespository: PrismaWalletRepository
  private trackWallets: TrackWallets
  constructor(private bot: TelegramBot) {
    this.bot = bot
    this.walletRespository = new PrismaWalletRepository()
    this.trackWallets = new TrackWallets()
  }
  public banWalletCommandHandler() {
    this.bot.onText(/\/ban_wallet/, async (msg) => {
      const userId = String(msg.from?.id)
      const chatId = msg.chat.id

      if (!userId) return

      const isAdmin = BotMiddleware.isUserBotAdmin(userId)
      if (!isAdmin) return

      this.bot.removeAllListeners('message')

      this.bot.sendMessage(chatId, `Enter the wallet <b>Public Key</b> you want to <b>Pause</b>`, {
        reply_markup: SUB_MENU,
        parse_mode: 'HTML',
      })

      adminExpectingBannedWallet[Number(userId)] = true
      const listener = async (responseMsg: TelegramBot.Message) => {
        if (responseMsg.text?.startsWith('/')) {
          adminExpectingBannedWallet[Number(userId)] = false
          return
        }

        if (!adminExpectingBannedWallet[Number(userId)]) return
        const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
        const walletAddress = responseMsg.text

        if (!walletAddress) return

        const isValid = base58Regex.test(walletAddress) && PublicKey.isOnCurve(new PublicKey(walletAddress).toBytes())
        if (!isValid) {
          adminExpectingBannedWallet[Number(userId)] = false
          this.bot.sendMessage(chatId, `Address <b>${walletAddress}</b> is not a valid Solana wallet`, {
            parse_mode: 'HTML',
          })
          return
        }

        const walletToPause = await this.walletRespository.getWalletByAddress(walletAddress)
        console.log('WALLET TO PAUSE:', walletToPause)
        if (!walletToPause?.id) {
          this.bot.sendMessage(chatId, `Wallet with address <code>${walletAddress}</code> is not in the Database!`, {
            parse_mode: 'HTML',
          })
          adminExpectingBannedWallet[Number(userId)] = false
          return
        }

        const pausedWallet = await this.walletRespository.pauseUserWalletSpam(walletToPause?.id, 'SPAM_PAUSED')

        if (pausedWallet) {
          this.trackWallets.setupWalletWatcher({ event: 'update', walletId: walletToPause.id })
          this.bot.sendMessage(chatId, `wallet with address <code>${walletAddress}</code> has been paused!`, {
            parse_mode: 'HTML',
          })
        } else {
          this.bot.sendMessage(chatId, `Failed to pause wallet with address <code>${walletAddress}</code>`)
        }

        this.bot.removeListener('message', listener)
        adminExpectingBannedWallet[Number(userId)] = false
      }

      this.bot.once('message', listener)
    })
  }
}
