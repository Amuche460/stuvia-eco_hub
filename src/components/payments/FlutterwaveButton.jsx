import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';

const FLW_PUBLIC_KEY = 'FLWPUBK_TEST-c205afdee32e3692aded6100a3823f10-X';

export default function FlutterwaveButton({ amount, student, paymentType, onSuccess, onClose, disabled, loading, onBeforePay }) {
  useEffect(() => {
    if (!document.getElementById('flutterwave-script')) {
      const script = document.createElement('script');
      script.id = 'flutterwave-script';
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handlePay = () => {
    if (onBeforePay && !onBeforePay()) return;
    if (!window.FlutterwaveCheckout) {
      alert('Payment gateway is loading, please try again in a moment.');
      return;
    }

    const txRef = `NESA-${paymentType.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    window.FlutterwaveCheckout({
      public_key: FLW_PUBLIC_KEY,
      tx_ref: txRef,
      amount: parseFloat(amount),
      currency: 'NGN',
      payment_options: 'card, banktransfer, ussd',
      customer: {
        email: student.email,
        name: student.full_name,
        phone_number: student.phone || '',
      },
      meta: {
        student_id: student.id,
        reg_no: student.reg_no,
        matric_no: student.matric_no || '',
        level: student.level,
        payment_type: paymentType,
      },
      customizations: {
        title: 'NESA Payment',
        description: paymentType === 'dues' ? 'NESA Dues Payment' : 'NESA Love Foundation Donation',
        logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998637834968a098c6b2721/ce06469b5_IMG_20260217_123243_461.jpg',
      },
      callback: (response) => {
        if (response.status === 'successful' || response.status === 'completed') {
          onSuccess({ txRef, flwRef: response.flw_ref, amount: parseFloat(amount), response });
        }
      },
      onclose: () => {
        if (onClose) onClose();
      },
    });
  };

  const colorClass = paymentType === 'dues'
    ? 'bg-emerald-700 hover:bg-emerald-800 shadow-emerald-200'
    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200';

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
          Pay ₦{parseFloat(amount || 0).toLocaleString()} Now
        </>
      )}
    </Button>
  );
}