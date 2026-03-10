import { PrismaClient } from '@prisma/client'
import * as fs from 'fs/promises'

const prisma = new PrismaClient()

async function seedDatabase() {
  try {
    console.log('Cleaning up the database...')

    await prisma.userWallet.deleteMany()
    await prisma.wallet.deleteMany()
    await prisma.user.deleteMany()

    console.log('Database cleaned successfully!')

    const data = await fs.readFile('database_backup.json', 'utf-8')
    const backupData = JSON.parse(data)
    const { users, wallets, userWallets } = backupData

    for (const user of users) {
      await prisma.user.create({
        data: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          personalWalletPubKey: user.personalWalletPubKey,
          personalWalletPrivKey: user.personalWalletPrivKey,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        },
      })
    }

    for (const wallet of wallets) {
      await prisma.wallet.create({
        data: {
          id: wallet.id,
          address: wallet.address,
        },
      })
    }

    for (const userWallet of userWallets) {
      await prisma.userWallet.create({
        data: {
          userId: userWallet.userId,
          walletId: userWallet.walletId,
          name: userWallet.name,
          address: userWallet.address,
          handiCatStatus: userWallet.handiCatStatus,
          status: userWallet.status,
        },
      })
    }

    console.log('Database successfully seeded from backup!')
  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedDatabase()
