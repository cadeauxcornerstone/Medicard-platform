import prisma from "../config/database.js";


/*
|--------------------------------------------------------------------------
| CREATE WALLET
|--------------------------------------------------------------------------
*/

export const createWallet = async (patientId) => {
  const patient = await prisma.patient.findUnique({
    where: {
      id: patientId,
    },
  });

  if (!patient) {
    const error = new Error("Patient not found");
    error.statusCode = 404;
    throw error;
  }

  const existing = await prisma.wallet.findUnique({
    where: {
      patientId,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.wallet.create({
    data: {
      patientId,
      balance: 0,
      currency: "RWF",
    },
  });
};


/*
|--------------------------------------------------------------------------
| GET WALLET
|--------------------------------------------------------------------------
*/

export const getWallet = async (patientId) => {
  const wallet = await prisma.wallet.findUnique({
    where: {
      patientId,
    },

    include: {
      transactions: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!wallet) {
    const error = new Error("Wallet not found");
    error.statusCode = 404;
    throw error;
  }

  return wallet;
};


/*
|--------------------------------------------------------------------------
| TOP UP WALLET
|--------------------------------------------------------------------------
*/

export const topUpWallet = async ({
  patientId,
  amount,
  reference,
  description,
}) => {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    const error = new Error(
      "Top-up amount must be greater than zero"
    );

    error.statusCode = 400;
    throw error;
  }

  const wallet = await prisma.wallet.findUnique({
    where: {
      patientId,
    },
  });

  if (!wallet) {
    const error = new Error("Wallet not found");
    error.statusCode = 404;
    throw error;
  }

  if (wallet.status !== "ACTIVE") {
    const error = new Error("Wallet is not active");
    error.statusCode = 409;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    const currentBalance = Number(wallet.balance);

    const newBalance =
      currentBalance + numericAmount;

    const updatedWallet =
      await tx.wallet.update({
        where: {
          id: wallet.id,
        },

        data: {
          balance: newBalance,
        },
      });

    const transaction =
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "CREDIT",
          amount: numericAmount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          reference: reference || null,
          description:
            description || "Wallet top-up",
        },
      });

    return {
      wallet: updatedWallet,
      transaction,
    };
  });
};


/*
|--------------------------------------------------------------------------
| WALLET TRANSACTIONS
|--------------------------------------------------------------------------
*/

export const getWalletTransactions = async (
  patientId
) => {
  const wallet = await prisma.wallet.findUnique({
    where: {
      patientId,
    },
  });

  if (!wallet) {
    const error = new Error("Wallet not found");
    error.statusCode = 404;
    throw error;
  }

  return prisma.walletTransaction.findMany({
    where: {
      walletId: wallet.id,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};