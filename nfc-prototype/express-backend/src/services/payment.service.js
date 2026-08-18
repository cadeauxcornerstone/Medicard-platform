import prisma from "../config/database.js";

/*
|--------------------------------------------------------------------------
| PAYMENT AUDIT HELPER
|--------------------------------------------------------------------------
*/

const createPaymentAudit = async ({
  tx,
  paymentId,
  action,
  previousStatus = null,
  newStatus = null,
  amount = null,
  currency = null,
  reference = null,
  reason = null,
  actorId = null,
  metadata = null,
}) => {
  return tx.paymentAuditLog.create({
    data: {
      paymentId,
      action,
      previousStatus,
      newStatus,
      amount,
      currency,
      reference,
      reason,
      actorId,
      metadata,
    },
  });
};


/*
|--------------------------------------------------------------------------
| CREATE PAYMENT
|--------------------------------------------------------------------------
*/

export const createPayment = async ({
  chargeId,
  patientId,
  amount,
  method,
  reference,
  notes,
  actorId = null,
}) => {
  if (!chargeId) {
    const error = new Error("chargeId is required");
    error.statusCode = 400;
    throw error;
  }

  if (!patientId) {
    const error = new Error("patientId is required");
    error.statusCode = 400;
    throw error;
  }

  if (!method) {
    const error = new Error("Payment method is required");
    error.statusCode = 400;
    throw error;
  }

  const paymentAmount = Number(amount);

  if (
    !Number.isFinite(paymentAmount) ||
    paymentAmount <= 0
  ) {
    const error = new Error(
      "Payment amount must be greater than zero"
    );

    error.statusCode = 400;
    throw error;
  }


  /*
  |--------------------------------------------------------------------------
  | IDEMPOTENCY
  |--------------------------------------------------------------------------
  | If the same payment reference already exists, return the
  | original payment instead of charging the wallet again.
  |--------------------------------------------------------------------------
  */

  if (reference) {
    const existingPayment =
      await prisma.payment.findUnique({
        where: {
          reference,
        },

        include: {
          charge: {
            include: {
              service: true,
            },
          },
        },
      });

    if (existingPayment) {
      return {
        payment: existingPayment,
        alreadyProcessed: true,
      };
    }
  }


  /*
  |--------------------------------------------------------------------------
  | FIND CHARGE
  |--------------------------------------------------------------------------
  */

  const charge = await prisma.charge.findUnique({
    where: {
      id: chargeId,
    },
  });

  if (!charge) {
    const error = new Error("Charge not found");
    error.statusCode = 404;
    throw error;
  }


  /*
  |--------------------------------------------------------------------------
  | PATIENT VALIDATION
  |--------------------------------------------------------------------------
  */

  if (charge.patientId !== patientId) {
    const error = new Error(
      "Patient does not belong to this charge"
    );

    error.statusCode = 400;
    throw error;
  }


  /*
  |--------------------------------------------------------------------------
  | CHARGE VALIDATION
  |--------------------------------------------------------------------------
  */

  if (charge.status === "CANCELLED") {
    const error = new Error(
      "Cannot pay a cancelled charge"
    );

    error.statusCode = 409;
    throw error;
  }


  /*
  |--------------------------------------------------------------------------
  | EXISTING PAYMENTS
  |--------------------------------------------------------------------------
  */

  const existingPayments =
    await prisma.payment.findMany({
      where: {
        chargeId,
        status: "COMPLETED",
      },
    });

  const alreadyPaid =
    existingPayments.reduce(
      (sum, payment) =>
        sum + Number(payment.amount),
      0
    );

  const patientAmount =
    Number(charge.patientAmount);

  const remaining =
    patientAmount - alreadyPaid;


  /*
  |--------------------------------------------------------------------------
  | ALREADY FULLY PAID
  |--------------------------------------------------------------------------
  */

  if (remaining <= 0) {
    const error = new Error(
      "Charge has already been fully paid"
    );

    error.statusCode = 409;
    throw error;
  }


  /*
  |--------------------------------------------------------------------------
  | PAYMENT AMOUNT VALIDATION
  |--------------------------------------------------------------------------
  */

  if (paymentAmount > remaining) {
    const error = new Error(
      `Payment exceeds remaining balance of ${remaining} RWF`
    );

    error.statusCode = 400;
    throw error;
  }


  /*
  |--------------------------------------------------------------------------
  | MEDCARD WALLET PAYMENT
  |--------------------------------------------------------------------------
  */

  if (method === "MEDCARD") {
    return prisma.$transaction(
      async (tx) => {

        /*
        |--------------------------------------------------------------------------
        | DOUBLE-CHECK IDEMPOTENCY INSIDE TRANSACTION
        |--------------------------------------------------------------------------
        */

        if (reference) {
          const existingPayment =
            await tx.payment.findUnique({
              where: {
                reference,
              },

              include: {
                charge: {
                  include: {
                    service: true,
                  },
                },
              },
            });

          if (existingPayment) {
            return {
              payment: existingPayment,
              alreadyProcessed: true,
            };
          }
        }


        /*
        |--------------------------------------------------------------------------
        | FIND WALLET
        |--------------------------------------------------------------------------
        */

        const wallet =
          await tx.wallet.findUnique({
            where: {
              patientId,
            },
          });

        if (!wallet) {
          const error = new Error(
            "Patient does not have a MedCard wallet"
          );

          error.statusCode = 404;
          throw error;
        }


        /*
        |--------------------------------------------------------------------------
        | WALLET STATUS
        |--------------------------------------------------------------------------
        */

        if (wallet.status !== "ACTIVE") {
          const error = new Error(
            "MedCard wallet is not active"
          );

          error.statusCode = 409;
          throw error;
        }


        /*
        |--------------------------------------------------------------------------
        | WALLET BALANCE
        |--------------------------------------------------------------------------
        */

        const walletBalance =
          Number(wallet.balance);

        if (walletBalance < paymentAmount) {
          const error = new Error(
            `Insufficient wallet balance. Available: ${walletBalance} RWF`
          );

          error.statusCode = 400;
          throw error;
        }


        const balanceAfter =
          walletBalance -
          paymentAmount;


        /*
        |--------------------------------------------------------------------------
        | DEBIT WALLET
        |--------------------------------------------------------------------------
        */

        await tx.wallet.update({
          where: {
            id: wallet.id,
          },

          data: {
            balance: balanceAfter,
          },
        });


        /*
        |--------------------------------------------------------------------------
        | WALLET LEDGER
        |--------------------------------------------------------------------------
        */

        const walletTransaction =
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,

              type: "DEBIT",

              amount: paymentAmount,

              balanceBefore:
                walletBalance,

              balanceAfter,

              reference:
                reference || null,

              description:
                notes ||
                `Payment for ${
                  charge.description ||
                  "medical service"
                }`,
            },
          });


        /*
        |--------------------------------------------------------------------------
        | PAYMENT RECORD
        |--------------------------------------------------------------------------
        */

        const payment =
          await tx.payment.create({
            data: {
              chargeId,

              patientId,

              amount:
                paymentAmount,

              currency:
                charge.currency,

              method,

              status:
                "COMPLETED",

              reference:
                reference || null,

              notes:
                notes || null,

              paidAt:
                new Date(),
            },

            include: {
              charge: {
                include: {
                  service: true,
                },
              },
            },
          });


        /*
        |--------------------------------------------------------------------------
        | PAYMENT AUDIT
        |--------------------------------------------------------------------------
        */

        const auditLog =
          await createPaymentAudit({
            tx,

            paymentId:
              payment.id,

            action:
              "CREATED",

            previousStatus:
              null,

            newStatus:
              "COMPLETED",

            amount:
              paymentAmount,

            currency:
              charge.currency,

            reference:
              reference || null,

            reason:
              notes ||
              "MedCard wallet payment",

            actorId:
              actorId || null,

            metadata: {
              method,
              chargeId,
              patientId,
              walletTransactionId:
                walletTransaction.id,
            },
          });


        /*
        |--------------------------------------------------------------------------
        | UPDATE CHARGE
        |--------------------------------------------------------------------------
        */

        const newPaidAmount =
          alreadyPaid +
          paymentAmount;

        const newStatus =
          newPaidAmount >= patientAmount
            ? "PAID"
            : "PARTIALLY_PAID";

        const updatedCharge =
          await tx.charge.update({
            where: {
              id: chargeId,
            },

            data: {
              status:
                newStatus,
            },
          });


        return {
          payment,

          charge:
            updatedCharge,

          wallet: {
            balanceBefore:
              walletBalance,

            amountDebited:
              paymentAmount,

            balanceAfter,
          },

          walletTransaction,

          auditLog,

          calculation: {
            patientAmount,

            previouslyPaid:
              alreadyPaid,

            paymentAmount,

            remainingBalance:
              Math.max(
                patientAmount -
                  newPaidAmount,
                0
              ),
          },

          alreadyProcessed:
            false,
        };
      }
    );
  }


  /*
  |--------------------------------------------------------------------------
  | NON-WALLET PAYMENT
  |--------------------------------------------------------------------------
  */

  const payment =
    await prisma.payment.create({
      data: {
        chargeId,

        patientId,

        amount:
          paymentAmount,

        currency:
          charge.currency,

        method,

        status:
          "COMPLETED",

        reference:
          reference || null,

        notes:
          notes || null,

        paidAt:
          new Date(),
      },

      include: {
        charge: {
          include: {
            service: true,
          },
        },
      },
    });


  /*
  |--------------------------------------------------------------------------
  | AUDIT NON-WALLET PAYMENT
  |--------------------------------------------------------------------------
  */

  const auditLog =
    await prisma.paymentAuditLog.create({
      data: {
        paymentId:
          payment.id,

        action:
          "CREATED",

        previousStatus:
          null,

        newStatus:
          "COMPLETED",

        amount:
          paymentAmount,

        currency:
          charge.currency,

        reference:
          reference || null,

        reason:
          notes ||
          "Payment",

        actorId:
          actorId || null,

        metadata: {
          method,
          chargeId,
          patientId,
        },
      },
    });


  /*
  |--------------------------------------------------------------------------
  | UPDATE CHARGE
  |--------------------------------------------------------------------------
  */

  const newPaidAmount =
    alreadyPaid +
    paymentAmount;

  const newStatus =
    newPaidAmount >= patientAmount
      ? "PAID"
      : "PARTIALLY_PAID";

  const updatedCharge =
    await prisma.charge.update({
      where: {
        id: chargeId,
      },

      data: {
        status:
          newStatus,
      },
    });


  return {
    payment,

    charge:
      updatedCharge,

    auditLog,

    calculation: {
      patientAmount,

      previouslyPaid:
        alreadyPaid,

      paymentAmount,

      remainingBalance:
        Math.max(
          patientAmount -
            newPaidAmount,
          0
        ),
    },

    alreadyProcessed:
      false,
  };
};


/*
|--------------------------------------------------------------------------
| GET PAYMENTS BY CHARGE
|--------------------------------------------------------------------------
*/

export const getPaymentsByCharge = async (
  chargeId
) => {
  if (!chargeId) {
    const error = new Error(
      "chargeId is required"
    );

    error.statusCode = 400;

    throw error;
  }

  const payments =
    await prisma.payment.findMany({
      where: {
        chargeId,
      },

      include: {
        charge: {
          include: {
            service: true,
          },
        },

        auditLogs: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  return payments;
};


/*
|--------------------------------------------------------------------------
| GET CHARGE BALANCE
|--------------------------------------------------------------------------
*/

export const getChargeBalance = async (
  chargeId
) => {
  if (!chargeId) {
    const error = new Error(
      "chargeId is required"
    );

    error.statusCode = 400;

    throw error;
  }

  const charge =
    await prisma.charge.findUnique({
      where: {
        id: chargeId,
      },
    });

  if (!charge) {
    const error = new Error(
      "Charge not found"
    );

    error.statusCode = 404;

    throw error;
  }


  const payments =
    await prisma.payment.findMany({
      where: {
        chargeId,

        status: "COMPLETED",
      },
    });


  const totalPaid =
    payments.reduce(
      (sum, payment) =>
        sum + Number(payment.amount),
      0
    );


  const patientAmount =
    Number(charge.patientAmount);

  const remainingBalance =
    Math.max(
      patientAmount -
        totalPaid,
      0
    );


  let status;

  if (remainingBalance === 0) {
    status = "PAID";
  } else if (totalPaid > 0) {
    status = "PARTIALLY_PAID";
  } else {
    status = charge.status;
  }


  return {
    chargeId,

    patientAmount,

    totalPaid,

    remainingBalance,

    status,

    currency:
      charge.currency,
  };
};


/*
|--------------------------------------------------------------------------
| REFUND PAYMENT
|--------------------------------------------------------------------------
*/

export const refundPayment = async ({
  paymentId,
  reason,
  reference,
  actorId = null,
}) => {
  if (!paymentId) {
    const error = new Error(
      "paymentId is required"
    );

    error.statusCode = 400;

    throw error;
  }


  const payment =
    await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },

      include: {
        charge: true,
      },
    });


  if (!payment) {
    const error = new Error(
      "Payment not found"
    );

    error.statusCode = 404;

    throw error;
  }


  /*
  |--------------------------------------------------------------------------
  | PREVENT DUPLICATE REFUND
  |--------------------------------------------------------------------------
  */

  if (payment.status === "REFUNDED") {
    const error = new Error(
      "Payment has already been refunded"
    );

    error.statusCode = 409;

    throw error;
  }


  if (payment.status !== "COMPLETED") {
    const error = new Error(
      "Only completed payments can be refunded"
    );

    error.statusCode = 409;

    throw error;
  }


  /*
  |--------------------------------------------------------------------------
  | MEDCARD WALLET REFUND
  |--------------------------------------------------------------------------
  */

  if (payment.method === "MEDCARD") {
    return prisma.$transaction(
      async (tx) => {

        /*
        |--------------------------------------------------------------------------
        | RECHECK PAYMENT INSIDE TRANSACTION
        |--------------------------------------------------------------------------
        */

        const currentPayment =
          await tx.payment.findUnique({
            where: {
              id: paymentId,
            },

            include: {
              charge: true,
            },
          });


        if (!currentPayment) {
          const error = new Error(
            "Payment not found"
          );

          error.statusCode = 404;

          throw error;
        }


        if (
          currentPayment.status ===
          "REFUNDED"
        ) {
          const error = new Error(
            "Payment has already been refunded"
          );

          error.statusCode = 409;

          throw error;
        }


        if (
          currentPayment.status !==
          "COMPLETED"
        ) {
          const error = new Error(
            "Only completed payments can be refunded"
          );

          error.statusCode = 409;

          throw error;
        }


        /*
        |--------------------------------------------------------------------------
        | FIND WALLET
        |--------------------------------------------------------------------------
        */

        const wallet =
          await tx.wallet.findUnique({
            where: {
              patientId:
                currentPayment.patientId,
            },
          });


        if (!wallet) {
          const error = new Error(
            "Patient does not have a MedCard wallet"
          );

          error.statusCode = 404;

          throw error;
        }


        if (wallet.status !== "ACTIVE") {
          const error = new Error(
            "MedCard wallet is not active"
          );

          error.statusCode = 409;

          throw error;
        }


        const walletBalance =
          Number(wallet.balance);

        const refundAmount =
          Number(currentPayment.amount);


        const balanceAfter =
          walletBalance +
          refundAmount;


        /*
        |--------------------------------------------------------------------------
        | CREDIT WALLET
        |--------------------------------------------------------------------------
        */

        await tx.wallet.update({
          where: {
            id: wallet.id,
          },

          data: {
            balance:
              balanceAfter,
          },
        });


        /*
        |--------------------------------------------------------------------------
        | REFUND LEDGER
        |--------------------------------------------------------------------------
        */

        const walletTransaction =
          await tx.walletTransaction.create({
            data: {
              walletId:
                wallet.id,

              type:
                "REFUND",

              amount:
                refundAmount,

              balanceBefore:
                walletBalance,

              balanceAfter,

              reference:
                reference ||
                `REFUND-${currentPayment.id}`,

              description:
                reason ||
                `Refund for payment ${currentPayment.id}`,
            },
          });


        /*
        |--------------------------------------------------------------------------
        | MARK PAYMENT REFUNDED
        |--------------------------------------------------------------------------
        */

        const updatedPayment =
          await tx.payment.update({
            where: {
              id:
                currentPayment.id,
            },

            data: {
              status:
                "REFUNDED",
            },

            include: {
              charge: {
                include: {
                  service: true,
                },
              },
            },
          });


        /*
        |--------------------------------------------------------------------------
        | AUDIT REFUND
        |--------------------------------------------------------------------------
        */

        const auditLog =
          await createPaymentAudit({
            tx,

            paymentId:
              currentPayment.id,

            action:
              "REFUNDED",

            previousStatus:
              "COMPLETED",

            newStatus:
              "REFUNDED",

            amount:
              refundAmount,

            currency:
              currentPayment.currency,

            reference:
              reference ||
              `REFUND-${currentPayment.id}`,

            reason:
              reason ||
              `Refund for payment ${currentPayment.id}`,

            actorId:
              actorId || null,

            metadata: {
              paymentMethod:
                currentPayment.method,

              chargeId:
                currentPayment.chargeId,

              patientId:
                currentPayment.patientId,

              walletTransactionId:
                walletTransaction.id,
            },
          });


        /*
        |--------------------------------------------------------------------------
        | RECALCULATE CHARGE STATUS
        |--------------------------------------------------------------------------
        */

        const chargePayments =
          await tx.payment.findMany({
            where: {
              chargeId:
                currentPayment.chargeId,

              status:
                "COMPLETED",
            },
          });


        const totalPaid =
          chargePayments.reduce(
            (sum, item) =>
              sum + Number(item.amount),
            0
          );


        const patientAmount =
          Number(
            currentPayment
              .charge
              .patientAmount
          );


        let chargeStatus;


        if (
          totalPaid >= patientAmount
        ) {
          chargeStatus =
            "PAID";
        } else if (
          totalPaid > 0
        ) {
          chargeStatus =
            "PARTIALLY_PAID";
        } else if (
          Number(
            currentPayment
              .charge
              .insuranceAmount
          ) > 0
        ) {
          chargeStatus =
            "INSURANCE_CALCULATED";
        } else {
          chargeStatus =
            "PENDING";
        }


        const updatedCharge =
          await tx.charge.update({
            where: {
              id:
                currentPayment.chargeId,
            },

            data: {
              status:
                chargeStatus,
            },
          });


        return {
          payment:
            updatedPayment,

          charge:
            updatedCharge,

          wallet: {
            balanceBefore:
              walletBalance,

            amountRefunded:
              refundAmount,

            balanceAfter,
          },

          walletTransaction,

          auditLog,

          alreadyProcessed:
            false,
        };
      }
    );
  }


  /*
  |--------------------------------------------------------------------------
  | NON-WALLET REFUND
  |--------------------------------------------------------------------------
  */

  const updatedPayment =
    await prisma.payment.update({
      where: {
        id:
          payment.id,
      },

      data: {
        status:
          "REFUNDED",
      },

      include: {
        charge: {
          include: {
            service: true,
          },
        },
      },
    });


  const auditLog =
    await prisma.paymentAuditLog.create({
      data: {
        paymentId:
          payment.id,

        action:
          "REFUNDED",

        previousStatus:
          "COMPLETED",

        newStatus:
          "REFUNDED",

        amount:
          Number(payment.amount),

        currency:
          payment.currency,

        reference:
          reference ||
          `REFUND-${payment.id}`,

        reason:
          reason ||
          `Refund for payment ${payment.id}`,

        actorId:
          actorId || null,

        metadata: {
          paymentMethod:
            payment.method,

          chargeId:
            payment.chargeId,

          patientId:
            payment.patientId,
        },
      },
    });


  return {
    payment:
      updatedPayment,

    auditLog,

    alreadyProcessed:
      false,
  };
};


/*
|--------------------------------------------------------------------------
| GET PAYMENT AUDIT LOGS
|--------------------------------------------------------------------------
*/

export const getPaymentAuditLogs = async (
  paymentId
) => {
  if (!paymentId) {
    const error = new Error(
      "paymentId is required"
    );

    error.statusCode = 400;

    throw error;
  }


  const payment =
    await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },

      select: {
        id: true,
      },
    });


  if (!payment) {
    const error = new Error(
      "Payment not found"
    );

    error.statusCode = 404;

    throw error;
  }


  return prisma.paymentAuditLog.findMany({
    where: {
      paymentId,
    },

    orderBy: {
      createdAt: "asc",
    },
  });
};