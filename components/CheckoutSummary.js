export default function CheckoutSummary({ cart }) {
  return (
    <div className="bg-white border rounded-md p-4 flex flex-col gap-2 h-fit">
      <h2 className="font-semibold mb-1">Order Summary</h2>
      {cart.lines.map((line) => (
        <div key={line.productId} className="flex justify-between text-sm">
          <span className="text-gray-600">
            {line.name} × {line.quantity}
            {line.aiQuantity > 0 && <span className="text-purple-600"> (AI suggested: {line.aiQuantity})</span>}
          </span>
          <span>₹{line.lineTotal.toLocaleString("en-IN")}</span>
        </div>
      ))}
      <div className="border-t pt-2 flex justify-between text-sm">
        <span className="text-gray-600">Original Cart Value</span>
        <span>₹{cart.organicTotal.toLocaleString("en-IN")}</span>
      </div>
      {cart.aiGeneratedRevenue > 0 && (
        <div className="flex justify-between text-sm text-purple-600">
          <span>✨ AI Added Revenue</span>
          <span>+ ₹{cart.aiGeneratedRevenue.toLocaleString("en-IN")}</span>
        </div>
      )}
      <div className="border-t pt-2 flex justify-between font-bold">
        <span>Total</span>
        <span>₹{cart.total.toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}
