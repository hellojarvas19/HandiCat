import { UserPrisma } from '../../types/prisma-types'
import { UserGroup } from '../../types/general-interfaces'

const MAX_USER_GROUPS = 5

export class GeneralMessages {
  constructor() {}

  static startMessage(user: UserPrisma): string {
    const messageText = `
🐱 Handi Cat | Wallet Tracker

Get real time activity notifications for any wallet you add!

You are currently tracking <b>${user?._count.userWallets || 0} wallets</b> ✨

Track unlimited wallets - completely free! 🚀
`

    return messageText
  }

  static startMessageGroup = `
🐱 Handi Cat | Wallet Tracker

Get real time activity notifications for any wallet you add!

<b>These are the commands available:</b>
- /add Add a new wallet
- /delete Delete a wallet
- /manage View all wallets
`

  static insufficientBalanceMessage: string = `
😿 Ooops it seems that you don't have sufficient balance to perform this transaction.

You can try by adding some <b>SOL</b> to your Handi Cat personal wallet 😺
`

  static walletLimitMessageError(walletName: string | undefined, walletAddress: string): string {
    const messageText = `
😾 Could not add wallet: <code>${walletName ? walletName : walletAddress}</code>
`

    return messageText
  }

  static generalMessageError: string = `
😿 Ooops it seems that something went wrong while processing the transaction.

You probaly don't have sufficient balance in your wallet or it can't cover the transaction fees.

Maybe try adding some <b>SOL</b> to your Handi Cat personal wallet 😺
`

  static botWalletError: string = `
😿 Oops! it seems that this wallet is spamming to many tps, Please enter another wallet or try again later.
`

  static groupsMessage(userGroups: UserGroup[]) {
    const groupsContent =
      userGroups.length === 0
        ? `     
<i>You do not have any groups yet.</i>
`
        : userGroups
            .map(
              (group, i) => `
✅ Group Name: <b>${group.name}</b>
🔗 Group ID: <code>${group.id}</code>

`,
            )
            .join('\n\n')

    const messageText = `
You can now use <b>Handi Cat</b> in any group chat!

Your groups: (${userGroups.length} / ${MAX_USER_GROUPS})
${groupsContent}
Learn how to add <b>Handi Cat</b> to a group chat: /help_group
`
    return messageText
  }

  static groupChatNotStarted = `
🚫 You cannot change Handi Cat settings in this group

Bot is not initiated. Send /start
`

  static groupChatNotActivated = `
🚫 You cannot change Handi Cat settings in this group

Bot is not activated. Send /activate
`

  static userNotAuthorizedInGroup = `
🚫 You cannot change Handi Cat settings in this group

you are not authorized to perform this action.
`

  static deleteGroupMessage = `
To <b>remove</b> a group from your list, simply send me the <u>Group ID</u> of the group you'd like to delete.
`

  static groupDeletedMessage = `
This group has been deleted from your list!
`
  static failedToDeleteGroupMessage = `
Failed to delete group, make sure you provided a valid <b>Group ID</b>
`

  static userGroupsLimit = `
😾 You have reached the maximum number of groups (${MAX_USER_GROUPS}).

Delete a group first to add a new one.
`
}
