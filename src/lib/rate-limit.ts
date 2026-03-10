import { Connection, PublicKey } from '@solana/web3.js'

import { RateLimitMessages } from '../bot/messages/rate-limit-messages'
import { TxPerSecondCapInterface } from '../types/general-interfaces'
import { MAX_5_MIN_TXS_ALLOWED, MAX_TPS_ALLOWED, WALLET_SLEEP_TIME } from '../constants/handi-cat'
import { PrismaWalletRepository } from '../repositories/prisma/wallet'
import { RpcConnectionManager } from '../providers/solana'

export class RateLimit {
  private prismaWalletRepository: PrismaWalletRepository

  constructor(private subscriptions: Map<string, number>) {
    this.prismaWalletRepository = new PrismaWalletRepository()
  }

  public async last5MinutesTxs(walletAddress: string) {
    const currentTime = Date.now()

    // Calculate the time 5 minutes ago
    const fiveMinutesAgo = currentTime - 1 * 60 * 1000

    const signatures = await RpcConnectionManager.getRandomConnection().getSignaturesForAddress(
      new PublicKey(walletAddress),
      {
        limit: MAX_5_MIN_TXS_ALLOWED,
      },
    )

    // Filter the transactions that occurred in the last 5 minutes
    const recentTransactions = signatures.filter((signatureInfo) => {
      const transactionTime = signatureInfo.blockTime! * 1000 // Convert seconds to milliseconds
      return transactionTime >= fiveMinutesAgo
    })

    return recentTransactions.length
  }

  public async txPerSecondCap({ bot, excludedWallets, wallet, walletData }: TxPerSecondCapInterface): Promise<boolean> {
    walletData.count++
    const elapsedTime = (Date.now() - walletData.startTime) / 1000 // seconds

    if (elapsedTime >= 1) {
      const tps = walletData.count / elapsedTime
      console.log(`TPS for wallet ${wallet.address}: ${tps.toFixed(2)}`)

      if (tps >= MAX_TPS_ALLOWED) {
        excludedWallets.set(wallet.address, true)
        console.log(`Wallet ${wallet.address} excluded for 2 hours due to high TPS.`)

        for (const user of wallet.userWallets) {
          this.prismaWalletRepository.pauseUserWalletSpam(wallet.id, 'SPAM_PAUSED') // update database
          bot.sendMessage(user.userId, RateLimitMessages.walletWasPaused(wallet.address), { parse_mode: 'HTML' })
        }

        setTimeout(async () => {
          excludedWallets.delete(wallet.address)

          for (const user of wallet.userWallets) {
            const walletUpdated = await this.prismaWalletRepository.resumeUserWallet(user.userId, wallet.id) // update database
            if (!walletUpdated) return
            bot.sendMessage(user.userId, RateLimitMessages.walletWasResumed(wallet.address), {
              parse_mode: 'HTML',
            })
          }

          console.log(`Wallet ${wallet.address} re-included after 2 hours.`)
        }, WALLET_SLEEP_TIME)

        // Stop processing for this wallet
        return true
      }

      // Reset for next interval
      walletData.count = 0
      walletData.startTime = Date.now()
    }

    return false
  }
}
