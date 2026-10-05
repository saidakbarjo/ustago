import { Hero } from "@/components/landing/hero";
import { BecomeSpecialist, Categories, CitiesSection, FAQ, FinalCTA, HowItWorks, PopularServices, Testimonials, TopSpecialists, TrustSafety, WhyUs } from "@/components/landing/sections";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/utils";
import { getServerT } from "@/lib/i18n/server";

export default async function HomePage() {
  const { raw } = await getServerT();
  const faq = raw<{ q: string; a: string }[]>("faq.items");
  return (
    <>
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Organization", name: "USTAGO", url: SITE_URL, logo: `${SITE_URL}/icon.svg`, sameAs: ["https://t.me/ustago", "https://instagram.com/ustago.uz"], contactPoint: { "@type": "ContactPoint", telephone: "+998-71-200-00-00", contactType: "customer support", areaServed: "UZ", availableLanguage: ["uz", "ru", "en"] } },
        { "@context": "https://schema.org", "@type": "WebSite", name: "USTAGO", url: SITE_URL, potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/search?q={search_term_string}`, "query-input": "required name=search_term_string" } },
        { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
      ]} />
      <Hero />
      <Categories />
      <HowItWorks />
      <TopSpecialists />
      <PopularServices />
      <WhyUs />
      <TrustSafety />
      <CitiesSection />
      <BecomeSpecialist />
      <Testimonials />
      <FAQ />
      <FinalCTA />
    </>
  );
}
