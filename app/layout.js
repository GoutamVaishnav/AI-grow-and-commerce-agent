import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "ShopAgent AI — Your AI-powered storefront",
  description: "Your AI-powered storefront for the next generation of buyers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-900 antialiased">
        <Navbar />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
