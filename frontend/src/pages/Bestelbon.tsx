import { useEffect, useState } from "react";
import { Reveal } from "../components/motion/Reveal";
import { PageBanner } from "../components/ui/Divider";
import { OrderTicketForm } from "../components/ui/OrderTicketForm";
import { getCustomCakeOffer } from "../lib/supabase/customCake";
import { getProductsByCategory } from "../lib/supabase/products";
import type { CustomCakeOffer, Product } from "../lib/supabase/types";

export function Bestelbon() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customCake, setCustomCake] = useState<CustomCakeOffer | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getProductsByCategory("klassieker"),
      getProductsByCategory("klein-gebak"),
      getCustomCakeOffer(),
    ]).then(([classics, smallPastries, customCakeData]) => {
      if (cancelled) return;
      setProducts([...classics, ...smallPastries]);
      setCustomCake(customCakeData);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageBanner
        eyebrow="Bestelbon"
        title="Bestel een taart"
        intro="Vul je gegevens en wensen in — Sophie neemt binnen de 3 dagen persoonlijk contact met je op."
      />

      <section className="mx-auto max-w-3xl px-5 pb-20 sm:px-8">
        <Reveal>
          <OrderTicketForm products={products} customCake={customCake} />
        </Reveal>
      </section>
    </>
  );
}
