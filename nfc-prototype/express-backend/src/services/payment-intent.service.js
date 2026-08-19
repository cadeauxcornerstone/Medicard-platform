import prisma from "../config/database.js";

import {
  createPayment,
} from "./payment.service.js";


/*
|--------------------------------------------------------------------------
| PAYMENT INTENT — CREATE
|--------------------------------------------------------------------------
|
| Creates a payment request.
|
| IMPORTANT:
| This does NOT charge the patient's wallet.
|
| The wallet is only touched after the patient's
| second NFC tap.
|
|--------------------------------------------------------------------------
*/

export const createPaymentIntent = async ({
  chargeId,
  patientId,
  facilityId,
  createdById = null,
}) => {

  if (!chargeId) {
    const error = new Error(
      "chargeId is required"
    );

    error.statusCode = 400;

    throw error;
  }


  if (!patientId) {
    const error = new Error(
      "patientId is required"
    );

    error.statusCode = 400;

    throw error;
  }


  if (!facilityId) {
    const error = new Error(
      "facilityId is required"
    );

    error.statusCode = 400;

    throw error;
  }


  /*
  |--------------------------------------------------------------------------
  | FIND CHARGE
  |--------------------------------------------------------------------------
  */

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


  /*
  |--------------------------------------------------------------------------
  | VERIFY PATIENT
  |--------------------------------------------------------------------------
  */

  if (
    charge.patientId !== patientId
  ) {
    const error = new Error(
      "Charge does not belong to this patient"
    );

    error.statusCode = 400;

    throw error;
  }


  /*
  |--------------------------------------------------------------------------
  | VERIFY FACILITY THROUGH ENCOUNTER
  |--------------------------------------------------------------------------
  |
  | Charge does not directly contain facilityId.
  | Facility belongs to the encounter.
  |
  |--------------------------------------------------------------------------
  */

  const encounter =
    await prisma.encounter.findUnique({
      where: {
        id: charge.encounterId,
      },
      select: {
        id: true,
        facilityId: true,
      },
    });


  if (!encounter) {
    const error = new Error(
      "Encounter associated with charge not found"
    );

    error.statusCode = 404;

    throw error;
  }


  if (
    encounter.facilityId !== facilityId
  ) {
    const error = new Error(
      "Charge does not belong to this facility"
    );

    error.statusCode = 403;

    throw error;
  }


  /*
  |--------------------------------------------------------------------------
  | VERIFY CHARGE STATUS
  |--------------------------------------------------------------------------
  */

  if (
    charge.status === "CANCELLED"
  ) {
    const error = new Error(
      "Cannot create payment intent for a cancelled charge"
    );

    error.statusCode = 409;

    throw error;
  }


  if (
    charge.status === "PAID"
  ) {
    const error = new Error(
      "Charge has already been fully paid"
    );

    error.statusCode = 409;

    throw error;
  }


  /*
  |--------------------------------------------------------------------------
  | CALCULATE REMAINING BALANCE
  |--------------------------------------------------------------------------
  */

  const payments =
    await prisma.payment.findMany({
      where: {
        chargeId,
        status: "COMPLETED",
      },

      select: {
        amount: true,
      },
    });


  const alreadyPaid =
    payments.reduce(
      (sum, payment) =>
        sum + Number(payment.amount),
      0
    );


  const patientAmount =
    Number(charge.patientAmount);


  const remainingBalance =
    patientAmount - alreadyPaid;


  if (remainingBalance <= 0) {
    const error = new Error(
      "Charge has already been fully paid"
    );

    error.statusCode = 409;

    throw error;
  }


  /*
  |--------------------------------------------------------------------------
  | CHECK EXISTING ACTIVE INTENT
  |--------------------------------------------------------------------------
  |
  | We don't want the doctor to accidentally create
  | five payment requests for the same charge.
  |
  |--------------------------------------------------------------------------
  */

  /*
|--------------------------------------------------------------------------
| EXPIRE OLD READY-TO-TAP INTENTS
|--------------------------------------------------------------------------
|
| An expired READY_FOR_TAP intent must never be reused.
|
*/

await prisma.paymentIntent.updateMany({
  where: {
    chargeId,

    status: "READY_FOR_TAP",

    expiresAt: {
      not: null,
      lte: new Date(),
    },
  },

  data: {
    status: "EXPIRED",
  },
});


/*
|--------------------------------------------------------------------------
| CHECK EXISTING ACTIVE INTENT
|--------------------------------------------------------------------------
|
| Only an unexpired intent can be reused.
|
*/

const existingIntent =
  await prisma.paymentIntent.findFirst({
    where: {
      chargeId,

      status: {
        in: [
          "READY_FOR_TAP",
          "CARD_DETECTED",
          "PROCESSING",
        ],
      },

      OR: [
        {
          expiresAt: null,
        },

        {
          expiresAt: {
            gt: new Date(),
          },
        },
      ],
    },

    orderBy: {
      createdAt: "desc",
    },
  });


   










  if (existingIntent) {
    return {
      paymentIntent:
        existingIntent,

      alreadyExists: true,
    };
  }


  /*
  |--------------------------------------------------------------------------
  | GENERATE REFERENCE
  |--------------------------------------------------------------------------
  */

  const reference =
    `PI-${Date.now()}-${Math.floor(
      Math.random() * 100000
    )}`;


  /*
  |--------------------------------------------------------------------------
  | PAYMENT INTENT EXPIRATION
  |--------------------------------------------------------------------------
  |
  | Five minutes.
  |
  |--------------------------------------------------------------------------
  */

  const expiresAt =
    new Date(
      Date.now() +
      5 * 60 * 1000
    );


  /*
  |--------------------------------------------------------------------------
  | CREATE PAYMENT INTENT
  |--------------------------------------------------------------------------
  */

  const paymentIntent =
    await prisma.paymentIntent.create({

      data: {

        chargeId,

        patientId,

        facilityId,

        createdById:
          createdById || null,

        amount:
          remainingBalance,

        currency:
          charge.currency,

        status:
          "READY_FOR_TAP",

        reference,

        expiresAt,
      },

      include: {

        charge: {
          include: {
            service: true,
          },
        },

        patient: true,

      },

    });


  return {
    paymentIntent,

    alreadyExists: false,
  };
};


/*
|--------------------------------------------------------------------------
| GET PAYMENT INTENT
|--------------------------------------------------------------------------
*/

export const getPaymentIntent = async (
  paymentIntentId
) => {

  if (!paymentIntentId) {
    const error = new Error(
      "paymentIntentId is required"
    );

    error.statusCode = 400;

    throw error;
  }


  const paymentIntent =
    await prisma.paymentIntent.findUnique({

      where: {
        id: paymentIntentId,
      },

      include: {

        charge: {
          include: {
            service: true,
          },
        },

        patient: true,

        facility: true,

        createdBy: true,

        payment: true,

      },

    });


  if (!paymentIntent) {
    const error = new Error(
      "Payment intent not found"
    );

    error.statusCode = 404;

    throw error;
  }


  /*
  |--------------------------------------------------------------------------
  | EXPIRE STALE INTENT
  |--------------------------------------------------------------------------
  */

  if (
    paymentIntent.status ===
      "READY_FOR_TAP" &&
    paymentIntent.expiresAt &&
    paymentIntent.expiresAt < new Date()
  ) {

    return prisma.paymentIntent.update({

      where: {
        id: paymentIntent.id,
      },

      data: {
        status: "EXPIRED",
      },

      include: {

        charge: {
          include: {
            service: true,
          },
        },

        patient: true,

        facility: true,

      },

    });

  }


  return paymentIntent;
};


/*
|--------------------------------------------------------------------------
| CANCEL PAYMENT INTENT
|--------------------------------------------------------------------------
*/

export const cancelPaymentIntent = async (
  paymentIntentId
) => {

  const paymentIntent =
    await getPaymentIntent(
      paymentIntentId
    );


  if (
    ![
      "READY_FOR_TAP",
      "CARD_DETECTED",
    ].includes(
      paymentIntent.status
    )
  ) {

    const error = new Error(
      `Payment intent cannot be cancelled while ${paymentIntent.status}`
    );

    error.statusCode = 409;

    throw error;
  }


  return prisma.paymentIntent.update({

    where: {
      id: paymentIntentId,
    },

    data: {
      status: "CANCELLED",
    },

  });
};


/*
|--------------------------------------------------------------------------
| PROCESS PAYMENT INTENT
|--------------------------------------------------------------------------
|
| THIS IS THE SECOND NFC TAP.
|
| cardUid comes directly from the NFC reader.
|
|--------------------------------------------------------------------------
*/

export const processPaymentIntent = async ({
  paymentIntentId,
  cardUid,
  actorId = null,
}) => {

  if (!paymentIntentId) {
    const error = new Error(
      "paymentIntentId is required"
    );

    error.statusCode = 400;

    throw error;
  }


  if (!cardUid) {
    const error = new Error(
      "cardUid is required"
    );

    error.statusCode = 400;

    throw error;
  }


  /*
  |--------------------------------------------------------------------------
  | FIND INTENT
  |--------------------------------------------------------------------------
  */

  const paymentIntent =
    await prisma.paymentIntent.findUnique({

      where: {
        id: paymentIntentId,
      },

      include: {
        charge: true,
        patient: true,
      },

    });


  if (!paymentIntent) {
    const error = new Error(
      "Payment intent not found"
    );

    error.statusCode = 404;

    throw error;
  }


  /*
  |--------------------------------------------------------------------------
  | IDEMPOTENCY
  |--------------------------------------------------------------------------
  |
  | If payment has already completed, NEVER charge again.
  |
  |--------------------------------------------------------------------------
  */

  if (
    paymentIntent.status ===
    "COMPLETED"
  ) {

    const payment =
      paymentIntent.paymentId
        ? await prisma.payment.findUnique({
            where: {
              id: paymentIntent.paymentId,
            },
          })
        : null;


    return {
      alreadyProcessed: true,

      paymentIntent,

      payment,
    };
  }


  /*
  |--------------------------------------------------------------------------
  | INTENT MUST BE READY
  |--------------------------------------------------------------------------
  */

  if (
    paymentIntent.status !==
    "READY_FOR_TAP"
  ) {

    const error = new Error(
      `Payment intent is ${paymentIntent.status}`
    );

    error.statusCode = 409;

    throw error;
  }


  /*
  |--------------------------------------------------------------------------
  | CHECK EXPIRATION
  |--------------------------------------------------------------------------
  */

  if (
    paymentIntent.expiresAt &&
    paymentIntent.expiresAt < new Date()
  ) {

    await prisma.paymentIntent.update({

      where: {
        id: paymentIntent.id,
      },

      data: {
        status: "EXPIRED",
      },

    });


    const error = new Error(
      "Payment intent has expired"
    );

    error.statusCode = 409;

    throw error;
  }


  /*
  |--------------------------------------------------------------------------
  | FIND CARD
  |--------------------------------------------------------------------------
  */

  const card =
    await prisma.patientCard.findUnique({

      where: {
        cardUid,
      },

      include: {
        patient: true,
      },

    });


  if (!card) {
    const error = new Error(
      "Card not registered"
    );

    error.statusCode = 404;

    throw error;
  }


  /*
  |--------------------------------------------------------------------------
  | CARD STATUS
  |--------------------------------------------------------------------------
  */

  if (
    card.status !==
    "ACTIVE"
  ) {

    const error = new Error(
      `Card is ${card.status.toLowerCase()}`
    );

    error.statusCode = 403;

    throw error;
  }


  /*
  |--------------------------------------------------------------------------
  | VERIFY CARD OWNER
  |--------------------------------------------------------------------------
  */

  if (
    card.patientId !==
    paymentIntent.patientId
  ) {

    const error = new Error(
      "This card does not belong to the patient for this payment"
    );

    error.statusCode = 403;

    throw error;
  }


  /*
  |--------------------------------------------------------------------------
  | CARD DETECTED
  |--------------------------------------------------------------------------
  */

  await prisma.paymentIntent.update({

    where: {
      id: paymentIntent.id,
    },

    data: {
      status: "CARD_DETECTED",
    },

  });


  /*
  |--------------------------------------------------------------------------
  | PROCESSING
  |--------------------------------------------------------------------------
  */

  await prisma.paymentIntent.update({

    where: {
      id: paymentIntent.id,
    },

    data: {
      status: "PROCESSING",
    },

  });


  try {

    /*
    |--------------------------------------------------------------------------
    | CREATE ACTUAL PAYMENT
    |--------------------------------------------------------------------------
    |
    | We deliberately reuse createPayment().
    |
    | This preserves:
    |
    | - wallet balance validation
    | - wallet debit
    | - wallet ledger
    | - payment record
    | - charge status
    | - payment audit
    | - idempotency
    |
    |--------------------------------------------------------------------------
    */

    const result =
      await createPayment({

        chargeId:
          paymentIntent.chargeId,

        patientId:
          paymentIntent.patientId,

        amount:
          Number(paymentIntent.amount),

        method:
          "MEDCARD",

        reference:
          paymentIntent.reference,

        notes:
          `Payment Intent ${paymentIntent.id}`,

        actorId:
          actorId || null,

      });


    /*
    |--------------------------------------------------------------------------
    | FIND ACTUAL PAYMENT
    |--------------------------------------------------------------------------
    */

    const actualPayment =
      result.payment;


    /*
    |--------------------------------------------------------------------------
    | MARK INTENT COMPLETED
    |--------------------------------------------------------------------------
    */

    const completedIntent =
      await prisma.paymentIntent.update({

        where: {
          id: paymentIntent.id,
        },

        data: {

          status:
            "COMPLETED",

          paymentId:
            actualPayment?.id ||
            null,

        },

        include: {

          payment: true,

          charge: {
            include: {
              service: true,
            },
          },

          patient: true,

        },

      });


    return {

      alreadyProcessed:
        result.alreadyProcessed ||
        false,

      payment:
        actualPayment,

      paymentIntent:
        completedIntent,

      result,

    };

  } catch (error) {

    /*
    |--------------------------------------------------------------------------
    | PAYMENT FAILED
    |--------------------------------------------------------------------------
    */

    await prisma.paymentIntent.update({

      where: {
        id: paymentIntent.id,
      },

      data: {
        status: "FAILED",
      },

    });


    throw error;
  }
};