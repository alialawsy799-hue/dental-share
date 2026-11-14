import { addToCartAction } from "@/lib/actions/commerce";
import { Icon } from "@/components/icons";
import { Glass, PageTitle } from "@/components/purple";
import { LangPage } from "@/components/shell";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { listDepartmentProducts } from "@/lib/domain/commerce";
import { AccessError } from "@/lib/domain/errors";
import { has } from "@/lib/domain/guard";
import { departmentCategories, type StoreDepartmentId } from "@/lib/domain/store-departments";
import { formatMoney, getLang, t } from "@/lib/i18n";
import { accessResponse } from "@/lib/ui/access";

const titles: Record<StoreDepartmentId, { title: keyof ReturnType<typeof t>; hint?: keyof ReturnType<typeof t> }> = {
  disposable: { title: "storeDeptDisposable" },
  fillings: { title: "storeDeptFillings", hint: "storeDeptFillingsHint" },
  prostho: { title: "storeDeptProstho" },
  surgical: { title: "storeDeptSurgical" },
};

export async function StoreDepartmentPage({ dept }: { dept: StoreDepartmentId }) {
  const actor = await requireActor();
  if (!has(actor, "commerce.buy")) return accessResponse(new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل."));
  const lang = await getLang();
  const d = t(lang);
  const db = getDb();
  let products;
  try {
    products = listDepartmentProducts(db, actor, departmentCategories(dept));
  } catch (error) {
    return accessResponse(error);
  }
  const copy = titles[dept];
  const groups =
    dept === "fillings"
      ? [
          { title: d.regularFillings, items: products.filter((item) => item.category === "حشوات") },
          { title: d.rootFillings, items: products.filter((item) => item.category === "حشوات الجذر") },
        ]
      : [{ title: "", items: products }];

  return (
    <LangPage lang={lang}>
      <PageTitle title={d[copy.title]} subtitle={copy.hint ? d[copy.hint] : d.storesTagline} />
      {groups.map((group) => (
        <section key={group.title || dept} className={group.title ? "mt-6" : "mt-5"}>
          {group.title ? <h2 className="mb-3 text-[18px] font-extrabold text-plum">{group.title}</h2> : null}
          {group.items.length ? (
            <div className="grid gap-3">
              {group.items.map((product) => {
                const store = db.stores.find((item) => item.id === product.storeId);
                return (
                  <Glass key={product.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-[15px] font-extrabold text-plum">{product.name}</h3>
                        <p className="mt-1 text-[12px] text-muted">
                          {product.brand} · {product.unit} · {store?.name}
                        </p>
                        <p className="mt-2 text-[13px] leading-6 text-muted">{product.description}</p>
                      </div>
                      <p className="shrink-0 text-[14px] font-extrabold text-violet">{formatMoney(lang, product.priceIqd)}</p>
                    </div>
                    <form action={addToCartAction} className="mt-3 flex justify-end">
                      <input type="hidden" name="productId" value={product.id} />
                      <input type="hidden" name="qty" value="1" />
                      <input type="hidden" name="returnTo" value={`/app/stores/${dept}`} />
                      <button
                        type="submit"
                        disabled={product.stock <= 0}
                        className="btn-violet inline-flex h-10 items-center gap-1 rounded-xl px-4 text-[13px] font-bold disabled:opacity-50"
                      >
                        <Icon name="cart" className="h-4 w-4" />
                        {product.stock > 0 ? d.addToCart : "غير متوفر"}
                      </button>
                    </form>
                  </Glass>
                );
              })}
            </div>
          ) : (
            <Glass>
              <p className="text-sm text-muted">{d.noProducts}</p>
            </Glass>
          )}
        </section>
      ))}
    </LangPage>
  );
}
