export interface SEOProps {
  title?: string;
  description?: string;
  canonicalURL?: string;
  ogType?: string;
}

export interface SEODefaults {
  siteName: string;
  defaultDescription: string;
  siteURL: string;
}

export interface SEOMeta {
  title: string;
  description: string;
  canonicalURL: string;
  ogType: string;
  ogTitle: string;
  ogDescription: string;
  ogSiteName: string;
}

const MAX_TITLE_LENGTH = 70;
const MAX_DESCRIPTION_LENGTH = 160;

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).trimEnd() + '...';
}

export function buildPageTitle(pageTitle: string | undefined, siteName: string): string {
  if (!pageTitle) return siteName;
  return truncate(`${pageTitle} | ${siteName}`, MAX_TITLE_LENGTH);
}

export function buildDescription(
  description: string | undefined,
  defaultDescription: string,
): string {
  const desc = description || defaultDescription;
  return truncate(desc, MAX_DESCRIPTION_LENGTH);
}

export function buildSEOMeta(props: SEOProps, defaults: SEODefaults): SEOMeta {
  const title = buildPageTitle(props.title, defaults.siteName);
  const description = buildDescription(props.description, defaults.defaultDescription);
  const canonicalURL = props.canonicalURL || defaults.siteURL;
  const ogType = props.ogType || 'website';

  return {
    title,
    description,
    canonicalURL,
    ogType,
    ogTitle: title,
    ogDescription: description,
    ogSiteName: defaults.siteName,
  };
}
