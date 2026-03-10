import cron from 'node-cron'
import { TokenUtils } from './token-utils'
import { WatchTransaction } from './watch-transactions'
import { RpcConnectionManager } from '../providers/solana'
import { TrackWallets } from './track-wallets'
import dotenv from 'dotenv'
import { WalletPool } from '../config/wallet-pool'

dotenv.config()

export class CronJobs {
  private walletWatcher: WatchTransaction
  private trackWallets: TrackWallets

  private static cachedPrice: string | undefined = undefined
  private static lastFetched: number = 0
  private static readonly refreshInterval: number = 5 * 60 * 1000 // 5 minutes
  constructor() {
    this.walletWatcher = new WatchTransaction()
    this.trackWallets = new TrackWallets()
  }

  public async updateSolPrice(): Promise<string | undefined> {
    const now = Date.now()

    if (CronJobs.cachedPrice && now - CronJobs.lastFetched < CronJobs.refreshInterval) {
      return CronJobs.cachedPrice
    }

    try {
      let solPrice = await TokenUtils.getSolPriceGecko()

      if (!solPrice) {
        solPrice = await TokenUtils.getSolPriceRpc()
      }

      if (solPrice) {
        CronJobs.cachedPrice = solPrice
        CronJobs.lastFetched = now
      }

      return CronJobs.cachedPrice!
    } catch (error) {
      console.error('Error fetching Solana price:', error)

      if (CronJobs.cachedPrice) {
        return CronJobs.cachedPrice
      }

      return
    }
  }

  public async unsubscribeAllWallets() {
    cron.schedule('*/1 * * * *', async () => {
      console.log('Triggering resetLogConnection...')
      RpcConnectionManager.resetLogConnection()
      WalletPool.subscriptions.clear()
      await this.trackWallets.setupWalletWatcher({ event: 'initial' })
    })
  }

  static getSolPrice() {
    return this.cachedPrice
  }
}
