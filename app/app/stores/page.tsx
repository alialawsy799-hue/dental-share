import Link from "next/link";
import { addToCartAction } from "@/lib/actions/commerce";
import { Icon } from "@/components/icons";
import { ProductArt } from "@/components/product-art";
import { Glass, PageTitle, SectionHead } from "@/components/purple";
import { LangPage } from "@/components/shell";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { listCatalog, listStores } from "@/lib/domain/commerce";
import { formatMoney, getLang, t, type Lang } from "@/lib/i18n";
import { accessResponse } from "@/lib/ui/access";

const chips: { id: string; label: Record<Lang, string>; match: string[] }[] = [
  { id: "", label: { ar: "الكل", en: "All" }, match: [] },
  { id: "restorative", label: { ar: "مواد ترميم", en: "Restorative" }, match: ["زركونيا", "مواد طبع"] },
  { id: "equipment", label: { ar: "أجهزة ومعدات", en: "Equipment" }, match: ["أجهزة", "أدوات"] },
  { id: "supplies", label: { ar: "مستلزمات عامة", en: "Supplies" }, match: ["وقاية"] },
];

type Art = "impression" | "zirconia" | "burs" | "led" | "gloves" | "mask";

const faces: Record<string, { en: string; art: Art }> = {
  prod_alg: { en: "Impression Material", art: "impression" },
  prod_zir: { en: "Zirconia Disc", art: "zirconia" },
  prod_bur: { en: "Diamond Burs Set", art: "burs" },
  prod_led: { en: "LED Curing Light", art: "led" },
  prod_glove: { en: "Nitrile Gloves", art: "gloves" },
  prod_mask: { en: "Face Masks", art: "mask" },
};

const storeEn: Record<string, { name: string; about: string; delivery: string; categories: Record<string, string> }> = {
  basma: {
    name: "Dental Imprint",
    about: "Consumables and restorations for clinics.",
    delivery: "Delivery inside Baghdad within two business days",
    categories: { زركونيا: "Zirconia", "مواد طبع": "Impression", وقاية: "Protection" },
  },
  naqa: {
    name: "Naqaa Medical",
    about: "Tools and devices for dental clinics.",
    delivery: "Pickup from the Mansour warehouse",
    categories: { أجهزة: "Devices", أدوات: "Instruments" },
  },
};

export default async function StoresPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; notice?: string; error?: string }> }) {
  const actor = await requireActor();
  const lang = await getLang();
  const d = t(lang);
  const { q = "", category = "", notice = "", error = "" } = await searchParams;
  const db = getDb();
  let stores;
  let products;
  try {
    stores = listStores(db, actor, q);
    products = listCatalog(db, actor);
  } catch (caught) {
    return accessResponse(caught);
  }
  const chip = chips.find((item) => item.id === category) ?? chips[0];
  const visible = stores.filter((store) => !chip.match.length || store.categories.some((item) => chip.match.includes(item)));
  const needle = q.trim().toLowerCase();
  if (needle && lang === "en") {
    for (const store of stores) {
      const face = storeEn[store.slug];
      if (face && !visible.includes(store) && `${face.name} ${face.about}`.toLowerCase().includes(needle)) visible.push(store);
    }
  }
  const featured = products
    .filter((product) => faces[product.id] && product.stock > 0)
    .filter((product) => !chip.match.length || visible.some((store) => store.id === product.storeId))
    .slice(0, 6);
  const hrefFor = (id: string) => {
    const params = new URLSearchParams();
    if (id) params.set("category", id);
    if (q) params.set("q", q);
    const query = params.toString();
    return `/app/stores${query ? `?${query}` : ""}`;
  };

  return (
    <LangPage lang={lang}>
      <PageTitle title={d.storesTitle} subtitle={d.storesTagline} />

      <form action="/app/stores" className="mt-4 flex items-center gap-2">
        <label className="glass flex h-12 flex-1 items-center gap-2 rounded-2xl px-3 shadow-card">
          <Icon name="search" className="h-5 w-5 text-muted" />
          <input
            name="q"
            defaultValue={q}
            placeholder={d.searchStores}
            aria-label={d.searchStores}
            className="h-full w-full bg-transparent text-[13px] text-plum outline-none placeholder:text-muted"
          />
        </label>
        {category ? <input type="hidden" name="category" value={category} /> : null}
        <button type="submit" aria-label={d.filter} className="btn-violet grid h-12 w-12 shrink-0 place-items-center rounded-2xl">
          <Icon name="sliders" className="h-5 w-5" />
        </button>
      </form>

      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {chips.map((item) => {
          const on = chip.id === item.id;
          return (
            <Link
              key={item.id}
              href={hrefFor(item.id)}
              aria-current={on ? "true" : undefined}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold ${on ? "btn-violet" : "glass text-plum"}`}
            >
              {item.label[lang]}
            </Link>
          );
        })}
      </div>

      {notice === "cart_updated" ? (
        <p className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-lavender-deep px-4 py-3 text-sm font-bold text-plum">
          {d.addedToCart}
          <Link href="/app/cart" className="btn-violet inline-flex h-9 items-center rounded-xl px-3 text-[12px]">
            {d.viewCart}
          </Link>
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3">
        {visible.length ? (
          visible.map((store) => {
            const face = lang === "en" ? storeEn[store.slug] : undefined;
            return (
              <Glass key={store.id}>
                <div className="flex items-start gap-3">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#ede7ff] to-[#d9ccff] text-[22px] font-extrabold text-violet">
                    {(face?.name ?? store.name).trim()[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[16px] font-extrabold text-plum">{face?.name ?? store.name}</h2>
                    <p className="text-[12px] leading-5 text-muted">{face?.about ?? store.about}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {store.categories.map((item) => (
                        <span key={item} className="rounded-full bg-lavender px-2 py-0.5 text-[11px] font-bold text-violet">
                          {face?.categories[item] ?? item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                  <p className="flex min-w-0 items-center gap-1.5 text-[12px] text-muted">
                    <Icon name="truck" className="h-4 w-4 shrink-0 text-violet" />
                    <span className="truncate">{face?.delivery ?? store.deliveryNote}</span>
                  </p>
                  <Link href={`/app/stores/${store.slug}`} className="btn-violet inline-flex h-9 shrink-0 items-center rounded-xl px-4 text-[12px] font-bold">
                    {d.browseStore}
                  </Link>
                </div>
              </Glass>
            );
          })
        ) : (
          <Glass>
            <p className="text-sm text-muted">{d.noStores}</p>
          </Glass>
        )}
      </div>

      {featured.length ? (
        <section className="mt-7">
          <SectionHead title={d.featured} action={{ href: `/app/stores/${db.stores.find((store) => store.id === featured[0].storeId)?.slug ?? "basma"}`, label: d.more }} />
          <div className="grid grid-cols-2 gap-3">
            {featured.map((product) => {
              const face = faces[product.id];
              const label = lang === "en" ? face.en : product.name;
              return (
                <article key={product.id} className="glass flex flex-col rounded-[22px] p-3 shadow-card">
                  <div className="flex h-28 items-center justify-center rounded-2xl bg-lavender">
                    <ProductArt kind={face.art} />
                  </div>
                  <h3 className="mt-2 line-clamp-2 text-[13px] font-extrabold leading-5 text-plum">{label}</h3>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <p className="text-[13px] font-extrabold text-violet">{formatMoney(lang, product.priceIqd)}</p>
                    <form action={addToCartAction}>
                      <input type="hidden" name="productId" value={product.id} />
                      <input type="hidden" name="qty" value="1" />
                      <input type="hidden" name="returnTo" value={hrefFor(chip.id)} />
                      <button type="submit" aria-label={`${d.addToCart}: ${label}`} className="btn-violet grid h-9 w-9 place-items-center rounded-xl">
                        <Icon name="cart" className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </LangPage>
  );
}
