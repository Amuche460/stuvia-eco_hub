import { base44 } from '@/api/base44Client';

const NESA_ACCOUNT_NUMBER = '0520003964';
const NESA_BANK_KEYWORD = 'covenant';
const MIN_DUES = 6000;
const MIN_DONATION = 100;
const DATE_WINDOW_DAYS = 60;

/**
 * Extracts data from an uploaded receipt image/PDF using AI vision,
 * then validates it against NESA compliance rules.
 *
 * @param {string} fileUrl - URL of the uploaded receipt file
 * @param {object} student - the student profile record
 * @param {string} paymentType - 'dues' | 'donation' (default: 'dues')
 * @returns {Promise<{ data: object, errors: string[], valid: boolean }>}
 */
export async function validateReceipt(fileUrl, student, paymentType = 'dues') {
  const response = await base44.integrations.Core.InvokeLLM({
    model: 'gpt_5_mini',
    prompt: `Extract these fields from this payment document as JSON: amount (number, Naira), date (YYYY-MM-DD), description, bank_name (destination bank — null if this is a hand-written cash paper), account_number (destination account — null if hand-written cash paper), account_name (beneficiary name), sender_name (person who paid). Also detect has_fs_approval (boolean — true if the document contains "approved by the Financial Secretary" or similar wording approving this payment by a financial secretary). Use null for any unreadable field. Return only JSON.`,
    file_urls: [fileUrl],
    response_json_schema: {
      type: 'object',
      properties: {
        amount: { type: 'number' },
        date: { type: 'string' },
        description: { type: 'string' },
        bank_name: { type: 'string' },
        account_number: { type: 'string' },
        account_name: { type: 'string' },
        sender_name: { type: 'string' },
        has_fs_approval: { type: 'boolean' },
      }
    }
  });

  const data = response || {};
  const errors = [];
  const isDonation = paymentType === 'donation';
  const minAmount = isDonation ? MIN_DONATION : MIN_DUES;
  const isFSApproved = data.has_fs_approval === true;

  // 1. Amount check
  if (!data.amount || data.amount < minAmount) {
    errors.push(
      `Amount must be at least ₦${minAmount.toLocaleString()}. ` +
      `Detected: ${data.amount ? '₦' + Number(data.amount).toLocaleString() : 'not found'}.`
    );
  }

  // 2. Date is current (within last 7 days, not future)
  if (!data.date) {
    errors.push('No payment date found on the receipt.');
  } else {
    const receiptDate = new Date(data.date);
    if (isNaN(receiptDate.getTime())) {
      errors.push(`Could not read a valid date from the receipt ("${data.date}").`);
    } else {
      const now = new Date();
      const diffDays = (now - receiptDate) / (1000 * 60 * 60 * 24);
      if (diffDays > DATE_WINDOW_DAYS) {
        errors.push(
          `Receipt is too old — dated ${data.date}. Payments must be made within the last 2 months.`
        );
      } else if (diffDays < -1) {
        errors.push(`Receipt date (${data.date}) is in the future. Please upload a current receipt.`);
      }
    }
  }

  // 3. Beneficiary check — must be NIGERIAN ECONOMIC STUDENT ASSOSIATI
  const acctName = (data.account_name || '').toLowerCase();
  const hasBeneficiary =
    acctName.includes('nigerian') &&
    acctName.includes('economic') &&
    acctName.includes('student') &&
    (acctName.includes('assoc') || acctName.includes('assos'));
  if (!hasBeneficiary) {
    errors.push(
      `Beneficiary must be "NIGERIAN ECONOMIC STUDENT ASSOSIATI". Detected: "${data.account_name || 'not found'}".`
    );
  }

  // 4. Addressed to NESA account: Covenant Microfinance Bank, 0520003964
  //    Paper receipts approved by the Financial Secretary are no longer accepted
  if (isFSApproved) {
    errors.push(
      'Paper receipts stamped or signed by the Financial Secretary are no longer accepted. Please pay by bank transfer to the NESA account and upload that receipt.'
    );
  }
  const bank = (data.bank_name || '').toLowerCase();
  const acct = (data.account_number || '').replace(/\s/g, '');
  if (!bank.includes(NESA_BANK_KEYWORD)) {
    errors.push(
      `Payment must be to Covenant Microfinance Bank. Detected bank: "${data.bank_name || 'not found'}".`
    );
  }
  if (acct !== NESA_ACCOUNT_NUMBER) {
    errors.push(
      `Account number must be ${NESA_ACCOUNT_NUMBER}. Detected: "${data.account_number || 'not found'}".`
    );
  }

  // Sender names are retained for review, not compared with student profiles.
  // A parent or another person may pay on the student's behalf.
  return { data, errors, valid: errors.length === 0 };
}