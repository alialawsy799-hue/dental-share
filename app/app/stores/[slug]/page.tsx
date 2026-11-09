import { addToCartAction } from "@/lib/actions/commerce";
import { Card, Money, PageIntro } from "@/components/kit";
import { SubmitButton } from "@/components/submit-button";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { getStore } from "@/lib/domain/commerce";
import { accessResponse } from "@/lib/ui/access";

export default async function StorePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string }> }) {
  const actor = await requireActor();
  const { slug } = await params;
  const { error } = await searchParams;
  try {
    const { store, products } = getStore(getDb(), actor, slug);
    return (
      <div>
        <PageIntro eyebrow={store.city} title={store.name} description={`${store.about} ${store.policy}`} />
        {error ? <p role="alert" className="mb-4 text-sm text-danger">{error}</p> : null}
        <p className="mb-4 text-sm text-muted">{store.deliveryNote}</p>
        <div className="grid gap-3">
          {products.map((product) => (
            <Card key={product.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-extrabold">{product.name}</h2>
                  <p className="text-sm text-muted">{product.brand} · {product.unit} · المتوفر {product.stock}</p>
                  <p className="mt-2 text-sm leading-7">{product.description}</p>
                </div>
                <Money value={product.priceIqd} />
              </div>
              <form action={addToCartAction} className="mt-3">
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="slug" value={store.slug} />
                <input type="hidden" name="qty" value="1" />
                <SubmitButton>{product.stock > 0 ? "أضف إلى السلة" : "غير متوفر"}</SubmitButton>
              </form>
            </Card>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    return accessResponse(error);
  }
}
