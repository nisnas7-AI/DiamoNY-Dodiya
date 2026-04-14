import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Separator } from "@/components/ui/separator";

const CartDrawer = () => {
  const { items, isDrawerOpen, closeDrawer, removeFromCart, updateQuantity, subtotal, totalItems } = useCart();

  return (
    <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent side="left" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="text-right font-serif text-xl">
            סל הקניות ({totalItems})
          </SheetTitle>
          <SheetDescription className="text-right text-sm text-muted-foreground">
            הפריטים שבחרת
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground px-6">
            <ShoppingBag className="w-16 h-16 opacity-30" />
            <p className="text-lg font-medium">הסל ריק</p>
            <p className="text-sm">הוסיפו תכשיטים מהקטלוג</p>
            <Button variant="outline" onClick={closeDrawer} asChild>
              <Link to="/catalog">לצפייה בקטלוג</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" dir="rtl">
              {items.map((item) => (
                <article key={item.lineItemId} className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.slug}`}
                      onClick={closeDrawer}
                      className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    {(item.selectedSize || item.selectedColor) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.selectedColor && <span>{item.selectedColor}</span>}
                        {item.selectedColor && item.selectedSize && " · "}
                        {item.selectedSize && <span>מידה {item.selectedSize}</span>}
                      </p>
                    )}
                    <p className="text-sm font-bold text-foreground mt-1">
                      ₪{item.price.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.lineItemId, item.quantity - 1)}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        aria-label="הפחת כמות"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.lineItemId, item.quantity + 1)}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        aria-label="הוסף כמות"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.lineItemId)}
                        className="mr-auto p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="הסר פריט"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="border-t border-border px-6 py-4 space-y-3">
              <Separator className="mb-2" />
              <div className="flex items-center justify-between text-base font-semibold" dir="rtl">
                <span>סה״כ</span>
                <span>₪{subtotal.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground text-right">משלוח יחושב בשלב התשלום</p>
              <Button
                asChild
                className="w-full h-12 text-base font-bold tracking-wide bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(35,40%,55%)] text-accent-foreground hover:shadow-lg hover:scale-[1.01] transition-all"
                onClick={closeDrawer}
              >
                <Link to="/checkout">מעבר לתשלום</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
