export default function PaymentModal({ status, order, failureReason, onClose, onRetry, onViewOrder }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-md max-w-sm w-full p-6 text-center flex flex-col items-center gap-3">
        {status === "processing" && (
          <>
            <div className="w-10 h-10 border-4 border-flip-blue border-t-transparent rounded-full animate-spin" />
            <p className="font-medium">Processing payment…</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-2xl">✓</div>
            <p className="text-lg font-semibold">Payment Successful</p>
            <p className="text-2xl font-bold">₹{order?.total?.toLocaleString("en-IN")}</p>
            <p className="text-sm text-gray-500">Order ID: {order?.orderId}</p>
            <button onClick={onViewOrder} className="mt-3 w-full bg-flip-blue text-white font-semibold py-2 rounded">
              View Order
            </button>
          </>
        )}

        {status === "failure" && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-2xl">✕</div>
            <p className="text-lg font-semibold">Payment Failed</p>
            <p className="text-sm text-gray-500">{failureReason || "Your payment could not be completed."}</p>
            <p className="text-sm font-medium text-gray-700">Your order has NOT been charged. Your cart is safe.</p>
            <div className="flex gap-2 w-full mt-3">
              <button onClick={onClose} className="flex-1 border py-2 rounded font-medium">Close</button>
              <button onClick={onRetry} className="flex-1 bg-flip-blue text-white py-2 rounded font-semibold">
                Retry Payment
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
