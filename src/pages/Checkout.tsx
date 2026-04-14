import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { ShoppingBag } from "lucide-react";

const Checkout = () => {
  const { items, subtotal } = useCart();

  return (
    <>
      <Helmet>
        <title>תשלום | Checkout</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />
      <main className="min-h-[60vh] flex items-center justify-center px-4 py-20" dir="rtl">
        <div className="text-center max-w-md mx-auto space-y-6">
          <ShoppingBag className="w-16 h-16 mx-auto text-primary opacity-60" />
          <h1 className="text-3xl font-serif font-bold text-foreground">עמוד תשלום</h1>
          <p className="text-muted-foreground">
            {items.length > 0
              ? `${items.length} פריטים בסל • סה״כ ₪${subtotal.toLocaleString()}`
              : "הסל ריק"}
          </p>
          <p className="text-sm text-muted-foreground">
            עמוד זה בבנייה – שלב התשלום יושלם בקרוב.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Checkout;
