import TelegramBot from 'node-telegram-bot-api'
import { SUB_MENU } from '../../config/bot-menus'
import { PublicKey } from '@solana/web3.js'
import { PrismaWalletRepository } from '../../repositories/prisma/wallet'
import { userExpectingWalletAddress } from '../../constants/flags'
import { TrackWallets } from '../../lib/track-wallets'
import { WalletMessages } from '../messages/wallet-messages'
import { GeneralMessages } from '../messages/general-messages'
import { BotMiddleware } from '../../config/bot-middleware'

export class AddCommand {
  private prismaWalletRepository: PrismaWalletRepository
  private trackWallets: TrackWallets
  constructor(private bot: TelegramBot) {
    this.bot = bot

    this.prismaWalletRepository = new PrismaWalletRepository()

    this.trackWallets = new TrackWallets()
  }

  public addCommandHandler() {
    this.bot.onText(/\/add/, async (msg) => {
      const chatId = msg.chat.id
      const userId = String(msg.from?.id)

      // check for group chats
      const groupValidationResult = await BotMiddleware.checkGroupChatRequirements(chatId, userId)

      if (!groupValidationResult.isValid) {
        return this.bot.sendMessage(chatId, groupValidationResult.message, {
          parse_mode: 'HTML',
        })
      }

      this.add({ message: msg, isButton: false })
    })
  }

  public addButtonHandler(msg: TelegramBot.Message) {
    this.add({ message: msg, isButton: true })
  }

  private add({ message, isButton }: { message: TelegramBot.Message; isButton: boolean }) {
    try {
      const userId = message.chat.id.toString()

      this.bot.removeAllListeners('message')

      const addMessage = WalletMessages.addWalletMessage
      if (isButton) {
        this.bot.editMessageText(addMessage, {
          chat_id: message.chat.id,
          message_id: message.message_id,
          reply_markup: BotMiddleware.isGroup(message.chat.id) ? undefined : SUB_MENU,
          parse_mode: 'HTML',
        })
      } else if (!isButton) {
        this.bot.sendMessage(message.chat.id, addMessage, {
          reply_markup: BotMiddleware.isGroup(message.chat.id) ? undefined : SUB_MENU,
          parse_mode: 'HTML',
        })
      }

      userExpectingWalletAddress[Number(userId)] = true
      const listener = async (responseMsg: TelegramBot.Message) => {
        // Check if the user is expected to enter a wallet address
        if (!userExpectingWalletAddress[Number(userId)]) return

        const text = responseMsg.text

        if (text?.startsWith('/')) {
          userExpectingWalletAddress[Number(userId)] = false
          return
        }

        const walletEntries = text
          ?.split('\n')
          .map((entry) => entry.trim())
          .filter(Boolean) // Split input by new lines, trim, and remove empty lines

        if (!walletEntries || walletEntries.length === 0) {
          this.bot.sendMessage(message.chat.id, 'No wallet addresses provided.')
          return
        }

        const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

        for (const entry of walletEntries) {
          const [walletAddress, walletName] = entry.split(' ')

          if (walletAddress.includes('orc') || walletAddress.includes('pump') || walletAddress.includes('Token')) {
            return this.bot.sendMessage(message.chat.id, GeneralMessages.botWalletError, {
              parse_mode: 'HTML',
              reply_markup: BotMiddleware.isGroup(message.chat.id) ? undefined : SUB_MENU,
            })
          }

          // check if user can add a wallet inside their plan limits
          const userWallets = await this.prismaWalletRepository.getUserWallets(userId)

          // check for bot wallets
          if (!base58Regex.test(walletAddress)) {
            this.bot.sendMessage(message.chat.id, `😾 Address provided is not a valid Solana wallet`)
            continue
          }

          const publicKeyWallet = new PublicKey(walletAddress)
          if (!PublicKey.isOnCurve(publicKeyWallet.toBytes())) {
            this.bot.sendMessage(message.chat.id, `😾 Address provided is not a valid Solana wallet`)
            continue
          }

          // const isValid =
          //   base58Regex.test(walletAddress as string) &&
          //   PublicKey.isOnCurve(new PublicKey(walletAddress as string).toBytes())

          // if (!isValid) {
          //   this.bot.sendMessage(message.chat.id, `😾 Address provided is not a valid Solana wallet`)
          //   continue
          // }

          // const latestWalletTxs = await this.rateLimit.last5MinutesTxs(walletAddress)

          // if (latestWalletTxs && latestWalletTxs >= MAX_5_MIN_TXS_ALLOWED) {
          //   this.bot.sendMessage(
          //     message.chat.id,
          //     `😾 Wallet ${walletAddress} is spamming too many transactions, try another wallet or try again later`,
          //   )
          //   continue
          // }

          const isWalletAlready = await this.prismaWalletRepository.getUserWalletById(userId, walletAddress)

          if (isWalletAlready) {
            this.bot.sendMessage(message.chat.id, `🙀 You already follow the wallet: ${walletAddress}`)
            continue
          }

          // Add wallet to the database
          const createdWallet = await this.prismaWalletRepository.create(userId!, walletAddress!, walletName)
          const createdWalletId = createdWallet?.id

          this.bot.sendMessage(message.chat.id, `🎉 Wallet ${walletAddress} has been added.`)

          await this.trackWallets.setupWalletWatcher({ event: 'create', walletId: createdWalletId })
        }

        // Remove the listener to avoid duplicate handling
        this.bot.removeListener('message', listener)

        // Reset the flag
        userExpectingWalletAddress[Number(userId)] = false
      }

      this.bot.once('message', listener)
    } catch (error) {
      this.bot.sendMessage(
        message.chat.id,
        `😾 Somthing went wrong when adding this wallet! please try with another address`,
      )
      return
    }
  }
}
