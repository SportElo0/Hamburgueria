import { MenuSection } from '@/components/menu/MenuSection';
import { MobileCartBar, SiteHeader } from '@/components/nav/SiteHeader';
import { LocationSection, SiteFooter, StorySection } from '@/components/sections/InfoSections';
import { CinematicStory } from '@/components/story/CinematicStory';
import { StaticStory } from '@/components/story/StaticStory';
import { products } from '@/content/menu';
import { restaurant } from '@/content/restaurant';

function JsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurant.name,
    slogan: restaurant.tagline,
    servesCuisine: ['Hambúrguer', 'Americana'],
    priceRange: 'R$',
    ...(restaurant.address ? { address: restaurant.address } : {}),
    hasMenu: {
      '@type': 'Menu',
      hasMenuItem: products.map((p) => ({
        '@type': 'MenuItem',
        name: p.name,
        ...(p.description ? { description: p.description } : {}),
        offers: { '@type': 'Offer', price: (p.price / 100).toFixed(2), priceCurrency: 'BRL' },
      })),
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function Home() {
  return (
    <>
      <JsonLd />
      <SiteHeader />
      <main>
        <CinematicStory />
        <StaticStory />
        <MenuSection />
        <StorySection />
        <LocationSection />
      </main>
      <SiteFooter />
      <MobileCartBar />
    </>
  );
}
