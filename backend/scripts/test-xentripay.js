
import 'dotenv/config';

async function main() {
  const requiredVariables = [
    'XENTRIPAY_API_KEY',
    'XENTRIPAY_TEST_PHONE',
    'XENTRIPAY_TEST_EMAIL',
    'XENTRIPAY_TEST_NAME',
  ];

  const missing = requiredVariables.filter(
    (key) => !process.env[key]
  );

  if (missing.length) {
    throw new Error(
      `Missing environment variables: ${missing.join(', ')}`
    );
  }

  const baseUrl =
    process.env.XENTRIPAY_BASE_URL ||
    'https://merchant.test.xentripay.com';

  const base = new URL(baseUrl);

  if (
    base.protocol !== 'https:' ||
    base.hostname !== 'merchant.test.xentripay.com'
  ) {
    throw new Error('Only the XentriPay test environment is allowed.');
  }

  const amount = Number(
    process.env.XENTRIPAY_TEST_AMOUNT || 100
  );

  if (!Number.isSafeInteger(amount) || amount < 100) {
    throw new Error('Amount must be a whole number of at least 100 RWF.');
  }

  const phone = process.env.XENTRIPAY_TEST_PHONE.replace(/\D/g, '');

  if (!/^250\d{9}$/.test(phone)) {
    throw new Error('Phone must use Rwanda international format: 250XXXXXXXXX.');
  }

  const localPhone = `0${phone.slice(3)}`;
  const customerRef = `MEDCARD-TEST-${Date.now()}`;

  const endpoint = new URL('/api/collections/initiate', base);

  const payload = {
    email: process.env.XENTRIPAY_TEST_EMAIL,
    cname: process.env.XENTRIPAY_TEST_NAME,
    amount,
    cnumber: localPhone,
    msisdn: phone,
    currency: 'RWF',
    pmethod: 'momo',
    customerRef,
    chargesIncluded: true,
    details: 'MedCard test payment',
  };

  console.log('Initiating XentriPay sandbox collection...');
  console.log(`Amount: ${amount} RWF`);
  console.log(`Customer reference: ${customerRef}`);

  const response = await fetch(endpoint, {
    method: 'POST',
    signal: AbortSignal.timeout(15000),
    headers: {
      'X-XENTRIPAY-KEY': process.env.XENTRIPAY_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `XentriPay returned HTTP ${response.status} with a non-JSON response. ` +
      'Check the API URL, API key permissions, and sandbox access.'
    );
  }

  if (!response.ok) {
    throw new Error(
      `XentriPay rejected the request (HTTP ${response.status}): ` +
      `${data.message || data.error || 'Unknown error'}`
    );
  }

  // Never log transaction authentication keys or API secrets.
  console.log('XentriPay response:', {
    success: data.success,
    retcode: data.retcode,
    tid: data.tid,
    refid: data.refid,
    reply: data.reply,
  });

  if (data.success !== 1 || data.retcode !== 0) {
    throw new Error('The collection was not accepted successfully.');
  }

  console.log(
    'Collection request accepted. This does not mean payment succeeded.'
  );
  console.log(
    'Verify the final payment status using the documented status endpoint.'
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
