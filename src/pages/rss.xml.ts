import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { filterDrafts, sortByDate } from '../utils/content';
import siteData from '../data/site.json';

export async function GET(context: APIContext) {
  const allPosts = await getCollection('blog');
  const published = filterDrafts(allPosts, true);
  const sorted = sortByDate(published);

  return rss({
    title: `${siteData.name} — Blog`,
    description: siteData.tagline,
    site: context.site!.toString(),
    items: sorted.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/blog/${post.id}`,
    })),
  });
}
