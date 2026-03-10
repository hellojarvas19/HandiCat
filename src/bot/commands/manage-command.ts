import TelegramBot from 'node-telegram-bot-api'
import { PrismaWalletRepository } from '../../repositories/prisma/wallet'
import { ManageMessages } from '../messages/manage-messages'
import { MANAGE_SUB_MENU } from '../../config/bot-menus'
import { BotMiddleware } from '../../config/bot-middleware'

export class ManageCommand {
  private prismaWalletRepository: PrismaWalletRepository
  private manageMessages: ManageMessages
  constructor(private bot: TelegramBot) {
    this.bot = bot

    this.prismaWalletRepository = new PrismaWalletRepository()
    this.manageMessages = new ManageMessages()
  }

  public async manageCommandHandler() {
    this.bot.onText(/\/manage/, async (msg) => {
      await this.manage({ message: msg, isButton: false })
    })
  }

  public async manageButtonHandler(msg: TelegramBot.Message) {
    await this.manage({ message: msg, isButton: true })
  }

  public async manage({ message, isButton }: { message: TelegramBot.Message; isButton: boolean }) {
    const userId = message.chat.id.toString()

    const userWallets = await this.prismaWalletRepository.getUserWallets(userId)

    const messageText = ManageMessages.manageMessage(userWallets || [])

    if (isButton) {
      this.bot.editMessageText(messageText, {
        chat_id: message.chat.id,
        message_id: message.message_id,
        reply_markup: BotMiddleware.isGroup(message.chat.id) ? undefined : MANAGE_SUB_MENU,
        parse_mode: 'HTML',
      })
    } else {
      this.bot.sendMessage(message.chat.id, messageText, {
        reply_markup: BotMiddleware.isGroup(message.chat.id) ? undefined : MANAGE_SUB_MENU,
        parse_mode: 'HTML',
      })
    }
  }
}
