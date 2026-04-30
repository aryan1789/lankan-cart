import { useSearchParams, Link } from 'react-router-dom';

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 pb-24 md:pb-10 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mb-4">✓</div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Payment received</h1>
      <p className="text-gray-600 text-sm max-w-sm mb-2">
        Thank you for your order. We will follow up by email with delivery or pickup details.
      </p>
      {sessionId && (
        <p className="text-xs text-gray-400 mb-6 break-all max-w-md">Reference: {sessionId}</p>
      )}
      <Link
        to="/"
        className="inline-block bg-[#00B140] text-white px-8 py-3 rounded-lg font-semibold text-sm hover:bg-[#039A5A] transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
