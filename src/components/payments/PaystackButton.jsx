import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';

const PAYSTACK_PUBLIC_KEY = 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; // Replace with real Paystack public key

export default function PaystackButton({ amount, student, paymentType, onSuccess, onClose, disabled, loading }) {
  useEffect(() => {
    if (!document.getElementById('paystack-script')) {
      const script = document.createElement('script');
      script.id = 'paystack-script';
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handlePay = () => {
    if (!window.PaystackPop) {
      alert('Paystack is loading, please try again in a moment.');
      return;
    }

    const amountKobo = Math.round(parseFloat(amount) * 100); // Paystack uses kobo (minor unit)
    const ref = `NESA-${paymentType.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: student.email,
      amount: amountKobo,
      currency: 'NGN',
      ref,
      metadata: {
        student_id: student.id,
        reg_no: student.reg_no,
        matric_no: student.matric_no || '',
        level: student.level,
        payment_type: paymentType,
        custom_fields: [
          { display_name: 'Student Name', variable_name: 'student_name', value: student.full_name },
          { display_name: 'Reg No', variable_name: 'reg_no', value: student.reg_no },
          { display_name: 'Level', variable_name: 'level', value: `${student.level}L` },
        ],
      },
      callback: (response) => {
        if (response.status === 'success') {
          onSuccess({ txRef: ref, flwRef: response.reference, amount: parseFloat(amount), response });
        }
      },
      onClose: () => {
        if (onClose) onClose();
      },
    });

    handler.openIframe();
  };

  const colorClass = paymentType === 'dues'
    ? 'bg-blue-700 hover:bg-blue-800 shadow-blue-200'
    : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200';

  return (
    <Button
      type="button"
      onClick={handlePay}
      disabled={disabled || loading || !amount || parseFloat(amount) <= 0}
      className={`w-full ${colorClass} rounded-xl h-12 text-base shadow-lg`}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          Pay ₦{parseFloat(amount || 0).toLocaleString()} via Paystack
        </>
      )}
    </Button>
  );
}