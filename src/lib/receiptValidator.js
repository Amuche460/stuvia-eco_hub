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
    prompt: `You are a receipt validation assistant. Analyze this payment receipt carefully and extract the following information as JSON:

- amount: The payment amount as a number (in Naira, no commas or currency symbol)
- date: The payment date (in YYYY-MM-DD format if possible, otherwise as shown on the receipt)
- description: The payment description / narration / reason / remark text
- bank_name: The name of the bank receiving the payment (the destination bank)
- account_number: The account number receiving the payment (the destination account)
- account_name: The name on the receiving account
- sender_name: The name of the person who sent / made the payment

Look very carefully at the receipt. If a field is not visible or unreadable, use null for that field. Return only the JSON object, no other text.`,
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
      }
    }
  });

  const data = response || {};
  const errors = [];
  const isDonation = paymentType === 'donation';
  const minAmount = isDonation ? MIN_DONATION : MIN_DUES;

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

  // 3. Beneficiary check — must be The Nigerian Economic Student Association
  const acctName = (data.account_name || '').toLowerCase();
  const hasBeneficiary =
    acctName.includes('nigerian') &&
    acctName.includes('economic') &&
    (acctName.includes('student') || acctName.includes('students')) &&
    acctName.includes('association');
  if (!hasBeneficiary) {
    errors.push(
      `Beneficiary must be "The Nigerian Economic Student Association". Detected: "${data.account_name || 'not found'}".`
    );
  }

  // 4. Addressed to NESA account: Covenant Microfinance Bank, 0520003964
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

  // 5. Sender name matches student profile name
  const sender = (data.sender_name || '').toLowerCase().trim();
  const studentName = (student.full_name || '').toLowerCase().trim();
  if (!sender) {
    errors.push('Could not find the sender name on the receipt.');
  } else if (studentName) {
    const senderParts = sender.split(/\s+/);
    const studentParts = studentName.split(/\s+/);
    const senderLast = senderParts[senderParts.length - 1];
    const studentLast = studentParts[studentParts.length - 1];
    const matches =
      senderLast === studentLast ||
      sender.includes(studentLast) ||
      studentName.includes(senderLast) ||
      sender === studentName;
    if (!matches) {
      errors.push(
        `Name on receipt ("${data.sender_name}") does not match your profile name ("${student.full_name}").`
      );
    }
  }

  return { data, errors, valid: errors.length === 0 };
}