import type { Metadata } from 'next';
import { getBlogPost } from '@/data/blog-posts';
import { pageMeta, SITE_NAME } from '@/lib/site';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: 'Post not found', robots: { index: false } };
  const meta = pageMeta({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    image: post.image,
  });
  return { ...meta, title: { absolute: `${post.title} | ${SITE_NAME}` } };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
