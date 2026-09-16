
export interface AuthorProfile {
  _id: string;
  name: string;
  profession: string;
  link: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Post {
  _id: string;
  /** Stored slug. Unique at the database level — the public URL depends on it. */
  slug?: string;
  title: string;
  description: string;
  content: string;
  photo: string;
  readTime?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  author: string;
  authorId?: string | null;
  authorDetails?: AuthorProfile | null;
  __v?: number;
  /**
   * "guide" publishes the post as a pillar reference guide at /learn/<slug>
   * instead of /blogs/<slug>. Absent on records created before the field
   * existed, which the public site reads as "post".
   */
  type?: "post" | "guide";
  /** Controlled taxonomy slug driving the category hubs. */
  category?: string | null;
  /** Second byline for guides: who checked the content. */
  reviewerId?: string | null;
  reviewerDetails?: AuthorProfile | null;
  /** Course ids for the call-to-action block on the public site. */
  relatedCourses?: number[];
  /** Supporting article ids mapped to a pillar guide. */
  relatedPosts?: string[];
  /** Overrides the values the public site would otherwise derive. */
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    canonicalOverride?: string;
    ogImage?: string;
    noindex?: boolean;
    focusKeyword?: string;
    schemaOverride?: string;
  } | null;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
}

export type AppState = {
  posts: Post[];
  currentUser: User | null;
  selectedPost: Post | null;
};
