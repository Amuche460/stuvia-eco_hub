import React, { useState } from 'react';
import FlutterwaveButton from './FlutterwaveButton';
import PaystackButton from './PaystackButton';

/**
 * Lets the user pick their preferred payment gateway (Flutterwave or Paystack)
 * then renders the chosen button.
 */
export default function PaymentGatewaySelector({ amount, student, paymentType, onSuccess, loading, disabled }) {
  const [gateway, setGateway] = useState('flutterwave');

  return (
    <div className="space-y-4">
      {/* Gateway picker */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Choose Payment Gateway</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'flutterwave', label: 'Flutterwave', badge: 'Card · Bank · USSD', color: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
            { key: 'paystack',    label: 'Paystack',    badge: 'Card · Bank · USSD', color: 'border-blue-500 bg-blue-50 text-blue-800' },
          ].map(g => (
            <button
              key={g.key}
              type="button"
              onClick={() => setGateway(g.key)}
              className={`rounded-xl border-2 p-3 text-left transition-all ${gateway === g.key ? g.color + ' border-2' : 'border-gray-200 bg-white text-gray-600'}`}
            >
              <p className="font-bold text-sm">{g.label}</p>
              <p className="text-xs opacity-70 mt-0.5">{g.badge}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Active button */}
      {gateway === 'flutterwave' ? (
        <FlutterwaveButton
          amount={amount}
          student={student}
          paymentType={paymentType}
          onSuccess={onSuccess}
          loading={loading}
          disabled={disabled}
        />
      ) : (
        <PaystackButton
          amount={amount}
          student={student}
          paymentType={paymentType}
          onSuccess={onSuccess}
          loading={loading}
          disabled={disabled}
        />
      )}

      <p className="text-center text-xs text-gray-400">
        🔒 End-to-end encrypted · PCI DSS compliant · No card details stored
      </p>
    </div>
  );
}