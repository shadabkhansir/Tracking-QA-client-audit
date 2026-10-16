// The Growth Folks® links used across the extension UI. utm_content says where in the UI a click came from.
export const TGF = {
  name: 'The Growth Folks®',
  extension: 'Tracking QA & Client Audit',
  slug: 'tracking-qa',
  email: 'team@thegrowthfolks.com',
};

const SITE = 'https://thegrowthfolks.com';

export function tgfUrl(path, content) {
  const u = new URL(path, SITE);
  u.searchParams.set('utm_source', 'chrome-extension');
  u.searchParams.set('utm_medium', 'referral');
  u.searchParams.set('utm_campaign', TGF.slug);
  if (content) u.searchParams.set('utm_content', content);
  return u.toString();
}

export const LINKS = {
  landing: content => tgfUrl(`/tools/${TGF.slug}`, content),
  welcome: content => tgfUrl(`/tools/${TGF.slug}/welcome`, content),
  privacy: content => tgfUrl(`/tools/${TGF.slug}/privacy`, content),
  learn: content => tgfUrl('/learn', content),
  contact: `mailto:${TGF.email}?subject=${encodeURIComponent(TGF.extension)}`,
};

// Fills <a data-tgf="landing|privacy|learn|contact"> with the right href for this surface.
// data-tgf-content on a link overrides the surface's utm_content.
export function wireTgfLinks(root, content) {
  for (const a of root.querySelectorAll('a[data-tgf]')) {
    const key = a.dataset.tgf;
    a.href = key === 'contact' ? LINKS.contact : LINKS[key](a.dataset.tgfContent || content);
    if (key !== 'contact') { a.target = '_blank'; a.rel = 'noopener'; }
  }
}
