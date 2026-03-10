import { WalletWithUsers } from '../types/swap-types'

export class WalletPool {
  static subscriptions = new Map<string, number>()
  static wallets: WalletWithUsers[] = []
}
