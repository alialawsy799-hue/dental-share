import { publishProductAction } from "@/lib/actions/commerce";
import { ProductForm } from "@/components/forms/product-form";
import { Card, Money, PageIntro, Pill } from "@/components/kit";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { listOwnProducts } from "@/lib/domain/commerce";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const actor = await requireActor();
  const { error } = await searchParams;
  const products = listOwnProducts(getDb(), actor);
  return (
    <div>
      <PageIntro title="المنتجات" description="الإضافة والتعديل داخل متجرك فقط." />
      {error ? <p role="alert" className="mb-4 text-sm text-danger">{error}</p> : null}
      <div className="grid gap-3">
        {products.map((product) => (
          <Card key={product.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-extrabold">{product.name}</h2>
                <p className="text-sm text-muted">{product.sku} · المخزون {product.stock}</p>
              </div>
              <div className="text-end">
                <Money value={product.priceIqd} />
                <div className="mt-1"><Pill tone={product.published ? "teal" : "mist"}>{product.published ? "منشور" : "مخفي"}</Pill></div>
              </div>
            </div>
            <form action={publishProductAction} className="mt-3">
              <input type="hidden" name="id" value={product.id} />
              <input type="hidden" name="published" value={product.published ? "false" : "true"} />
              <button className="h-10 rounded-xl bg-mist px-3 text-sm font-bold" type="submit">{product.published ? "إخفاء" : "نشر"}</button>
            </form>
          </Card>
        ))}
      </div>
      <Card className="mt-4">
        <h2 className="mb-3 font-extrabold">منتج جديد</h2>
        <ProductForm />
      </Card>
    </div>
  );
}
