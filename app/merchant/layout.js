import MerchantSidebar from "@/components/MerchantSidebar";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionFromCookies, isMerchant } from "@/lib/auth";

export default function MerchantLayout({ children }) {
  const session = getSessionFromCookies(cookies());
  if (!session) redirect("/login?next=/merchant");
  if (!isMerchant(session)) redirect("/?error=merchant-access-required");

  return (
    <div className="flex">
      <MerchantSidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
