/**
 * PÁGINA DE CATEGORIA (CategoryPage.tsx)
 *
 * Um recorte do índice por categoria (Sports, Sciences, Community…):
 *
 *   cabeçalho  — nome, descrição, números e a figura "onde a comunidade os
 *                coloca": a distribuição por região dos perfis da categoria;
 *   subáreas   — cápsulas com contagem (não existem em Community);
 *   filtros    — região (cromossomo), fenótipo e ordenação;
 *   grade      — doze cartões por página, com paginação em cápsula;
 *   outras categorias, com contagem, para seguir navegando.
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronDown } from "lucide-react";
import { AppLayout, Crumbs } from "@/components/AppLayout";
import { PhenotypeCard } from "@/components/PhenotypeCard";
import { RegionFilter, SortTabs } from "@/components/kt/RegionFilter";
import { SC } from "@/components/kt/Misc";
import {
  EmptySheet,
  GRID_CLASS,
  GridSkeleton,
  LISTING_SORTS,
  Pagination,
  RegionShareFigure,
  SORT_LABEL,
  chipClass,
  sortListing,
  type ListingSort,
} from "@/components/kt/Listing";
import { useIndexProfiles } from "@/hooks/use-index";
import {
  CATEGORY_DESCRIPTIONS,
  CATEGORY_OPTIONS,
  CATEGORY_SLUG_MAP,
  SLUG_TO_CATEGORY,
  SUBCATEGORIES,
} from "@/constants/categories";
import { profileContinent, type Continent } from "@/constants/regions";
import { cn } from "@/lib/utils";

const PER_PAGE = 12;

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const slug = category ?? "";
  const dbCategory = SLUG_TO_CATEGORY[slug];
  const isCommunity = slug === "community";
  const displayName = isCommunity ? "Community" : dbCategory;
  const description = CATEGORY_DESCRIPTIONS[slug];
  const subcategoryOptions = isCommunity || !dbCategory ? [] : SUBCATEGORIES[dbCategory] ?? [];

  const { profiles, isLoading } = useIndexProfiles();
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [region, setRegion] = useState<Continent | null>(null);
  const [phenotype, setPhenotype] = useState("");
  const [sort, setSort] = useState<ListingSort>("popular");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setSubcategory(null);
    setRegion(null);
    setPhenotype("");
    setPage(1);
  }, [slug]);

  useEffect(() => setPage(1), [subcategory, region, phenotype, sort]);

  const categoryProfiles = useMemo(
    () => profiles.filter((profile) => profile.category === dbCategory),
    [profiles, dbCategory]
  );

  const subCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categoryProfiles.forEach((profile) => {
      if (profile.subcategory) counts[profile.subcategory] = (counts[profile.subcategory] || 0) + 1;
    });
    return counts;
  }, [categoryProfiles]);

  const phenotypeOptions = useMemo(
    () =>
      [...new Set(categoryProfiles.map((profile) => profile.most_voted_phenotype).filter(Boolean) as string[])].sort(),
    [categoryProfiles]
  );

  const filtered = useMemo(() => {
    const list = categoryProfiles.filter((profile) => {
      if (subcategory && profile.subcategory !== subcategory) return false;
      if (region && profileContinent(profile) !== region) return false;
      if (phenotype && profile.most_voted_phenotype !== phenotype) return false;
      return true;
    });
    return sortListing(list, sort);
  }, [categoryProfiles, subcategory, region, phenotype, sort]);

  const otherCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    profiles.forEach((profile) => {
      counts[profile.category] = (counts[profile.category] || 0) + 1;
    });
    return [{ label: "Community", value: "User Profiles", slug: "community" }]
      .concat(CATEGORY_OPTIONS.map((name) => ({ label: name, value: name, slug: CATEGORY_SLUG_MAP[name] })))
      .filter((item) => item.slug !== slug)
      .map((item) => ({ ...item, count: counts[item.value] || 0 }))
      .sort((a, b) => b.count - a.count);
  }, [profiles, slug]);

  const totalVotes = categoryProfiles.reduce((sum, profile) => sum + profile.vote_count, 0);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const hasFilters = Boolean(subcategory || region || phenotype);

  if (!dbCategory) {
    return (
      <AppLayout>
        <h1 className="m-0 text-[40px] font-medium text-kt-ink">Category not found</h1>
        <p className="mt-2 text-[18px] text-kt-body">
          There’s no category at this address. <Link to="/explore">Explore the index</Link> instead.
        </p>
      </AppLayout>
    );
  }

  const catTitle = `${displayName} Phenotypes | Phindex`;
  const catDescription = `Browse ${displayName} phenotype profiles on Phindex. See physical trait classifications and vote on characteristics.`;
  const catUrl = `https://www.phenotypeindex.com/category/${slug}`;
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: catTitle,
    url: catUrl,
    description: catDescription,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: filtered.length,
      itemListElement: visible.map((profile, index) => ({
        "@type": "ListItem",
        position: (page - 1) * PER_PAGE + index + 1,
        url: `https://www.phenotypeindex.com/user-profile/${profile.slug}`,
        name: profile.name,
      })),
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.phenotypeindex.com" },
      { "@type": "ListItem", position: 2, name: displayName, item: catUrl },
    ],
  };

  return (
    <AppLayout>
      <Helmet>
        <title>{catTitle}</title>
        <meta name="description" content={catDescription} />
        <link rel="canonical" href={catUrl} />
        <meta property="og:title" content={catTitle} />
        <meta property="og:description" content={catDescription} />
        <meta property="og:url" content={catUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Phindex - Phenotype Index" />
        <meta property="og:image" content="https://www.phenotypeindex.com/og-phindex-faces.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@phenotypeindex" />
        <meta name="twitter:title" content={catTitle} />
        <meta name="twitter:description" content={catDescription} />
        <meta name="twitter:image" content="https://www.phenotypeindex.com/og-phindex-faces.png" />
        <script type="application/ld+json">{JSON.stringify(collectionSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <Crumbs items={[{ label: "Discover", to: "/community" }, { label: "Categories", to: "/explore" }, { label: displayName }]} />

      <div className="mt-5 flex flex-wrap items-end justify-between gap-x-14 gap-y-7 border-b-[1.5px] border-kt-ink pb-[30px]">
        <div className="min-w-0">
          <SC as="p" className="m-0 text-[16px] text-kt-teal">
            {isCommunity ? "category · anonymous community" : "category · famous people"}
          </SC>
          <h1 className="mb-0 mt-1 text-[clamp(52px,6.2vw,88px)] font-medium leading-[0.95] tracking-[-0.028em] text-kt-ink">
            {displayName}
          </h1>
          {description && <p className="mb-0 mt-3 text-[20px] italic text-kt-body">{description}.</p>}
          <p className="mb-0 mt-3.5 flex flex-wrap gap-x-5 gap-y-1 text-[16px] text-kt-body">
            <span>
              <span className="text-kt-ink">{isLoading ? "…" : categoryProfiles.length}</span> profiles
            </span>
            {!isCommunity && (
              <span>
                <span className="text-kt-ink">{subcategoryOptions.length}</span> subfields
              </span>
            )}
            <span>
              <span className="text-kt-ink">{isLoading ? "…" : totalVotes.toLocaleString("en-US")}</span> votes cast
            </span>
          </p>
        </div>
        <RegionShareFigure profiles={categoryProfiles} caption="where the community places them" />
      </div>

      {subcategoryOptions.length > 0 && (
        <div role="group" aria-label="Subfield" className="mt-6 flex flex-wrap gap-2">
          <button type="button" aria-pressed={subcategory === null} onClick={() => setSubcategory(null)} className={chipClass(subcategory === null)}>
            All subfields
          </button>
          {subcategoryOptions.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={subcategory === option}
              onClick={() => setSubcategory(subcategory === option ? null : option)}
              className={chipClass(subcategory === option)}
            >
              {option}
              <span className={cn("text-[14px]", subcategory === option ? "text-kt-b50" : "text-kt-body")}>
                {subCounts[option] || 0}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3.5 border-y border-kt-rule py-3.5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-3">
          <RegionFilter value={region} onChange={setRegion} short size="sm" />
          <div className="flex items-center gap-2.5">
            <label htmlFor="cat-pheno" className="font-sc text-[14px] tracking-[0.06em] text-kt-body">
              phenotype
            </label>
            <div className="relative">
              <select
                id="cat-pheno"
                value={phenotype}
                onChange={(event) => setPhenotype(event.target.value)}
                className="h-[42px] appearance-none rounded-full border border-kt-rule bg-white pl-4 pr-10 font-[inherit] text-[16px] text-kt-ink"
              >
                <option value="">All phenotypes</option>
                {phenotypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-kt-slate"
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
        <SortTabs options={LISTING_SORTS} value={sort} onChange={(value) => setSort(value)} />
      </div>

      <div className="mb-3.5 mt-[18px] flex flex-wrap items-baseline justify-between gap-3">
        <p className="m-0 text-[15px] text-kt-body" role="status">
          {isLoading
            ? "Loading profiles…"
            : filtered.length === 0
            ? "No profiles match"
            : `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filtered.length)} of ${filtered.length} · sorted by ${SORT_LABEL[sort]}`}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSubcategory(null);
              setRegion(null);
              setPhenotype("");
            }}
            className="border-0 bg-transparent p-0 font-[inherit] text-[15px] text-kt-teal underline underline-offset-4"
          >
            clear filters
          </button>
        )}
      </div>

      {isLoading ? (
        <GridSkeleton />
      ) : visible.length === 0 ? (
        <EmptySheet title={categoryProfiles.length === 0 ? "No faces in this category yet" : "Nothing matches these filters"}>
          {categoryProfiles.length === 0
            ? "Be the first to add one — use “add a face” at the top of the page."
            : "Try another region or phenotype, or clear the filters."}
        </EmptySheet>
      ) : (
        <section aria-label={`${displayName} profiles`} className={GRID_CLASS}>
          {visible.map((profile, index) => (
            <PhenotypeCard key={profile.id} profile={profile} variant="grid" priority={index < 4} />
          ))}
        </section>
      )}

      <Pagination
        page={page}
        pageCount={pageCount}
        onChange={(value) => {
          setPage(value);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      <section aria-labelledby="other-cats" className="mt-[52px] border-t-[1.5px] border-kt-ink pt-[22px]">
        <h2 id="other-cats" className="mb-3.5 mt-0 font-sc text-[17px] font-semibold tracking-[0.06em] text-kt-ink">
          other categories
        </h2>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {otherCategories.map((item) => (
            <li key={item.slug}>
              <Link to={`/category/${item.slug}`} className={chipClass(false)}>
                {item.label}
                <span className="text-[14px] text-kt-body">{item.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </AppLayout>
  );
}
