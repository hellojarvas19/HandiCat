import { User, WalletStatus } from '@prisma/client'

export type UserWallet = {
  wallet: {
    id: string
    address: string
  }
  userId: string
  walletId: string
  name: string
  status: WalletStatus
}

export type UserPrisma = {
  id: string
  personalWalletPubKey: string
  personalWalletPrivKey: string
  _count: {
    userWallets: number
  }
} | null
