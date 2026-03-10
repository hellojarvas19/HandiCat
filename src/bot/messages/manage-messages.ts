import { WalletDetails } from '../../lib/wallet-details'
import { UserWallet } from '../../types/prisma-types'

export class ManageMessages {
  static manageMessage(userWallets: UserWallet[]) {
    const messageText = `
<b>Your wallets: ${userWallets.length}</b>

✅ - Wallet is active
⏳ - Wallet was sending too many txs and is paused

${userWallets
  .map((wallet, i) => {
    const icon =
      wallet.status === 'ACTIVE'
        ? '✅'
        : wallet.status === 'USER_PAUSED'
          ? '⏸️'
          : wallet.status === 'SPAM_PAUSED'
            ? '⏳'
            : ''
    return `${icon} ${i + 1}. <code>${wallet.wallet.address}</code> ${wallet.name ? `(${wallet.name})` : ''}`
  })
  .join('\n\n')}
`

    return messageText
  }
}
