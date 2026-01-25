
import { Post } from '@/types';

export const INITIAL_POSTS: Post[] = [
  {
    // Fix: 'id' is not a property of 'Post', use '_id' instead
    _id: '1',
    title: 'The Future of AI in Web Development',
    description: 'Exploring how generative models are reshaping the landscape of frontend engineering and UI design.',
    content: 'Artificial Intelligence is no longer just a buzzword; it is becoming the core of modern development workflows. From copilot tools to automated testing, the role of the developer is evolving into one of orchestration rather than just manual coding...',
    // Fix: 'imageUrl' is not a property of 'Post', use 'photo' instead
    photo: 'https://picsum.photos/seed/ai-future/1200/600',
    tags: ['AI', 'Tech', 'Frontend'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    // Fix: 'updatedAt' is a required property in 'Post'
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    author: 'Admin'
  },
  {
    // Fix: 'id' is not a property of 'Post', use '_id' instead
    _id: '2',
    title: 'Mastering Dark Mode Aesthetics',
    description: 'A deep dive into color theory, contrast ratios, and why deep zinc palettes are the new standard for professional apps.',
    content: 'Designing for dark mode is more than just inverting colors. It requires careful consideration of luminosity, accessibility, and visual fatigue. In this post, we look at how to use depth and shadows effectively in a dark-first environment...',
    // Fix: 'imageUrl' is not a property of 'Post', use 'photo' instead
    photo: 'https://picsum.photos/seed/dark-mode/1200/600',
    tags: ['Design', 'UI/UX', 'Color Theory'],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    // Fix: 'updatedAt' is a required property in 'Post'
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    author: 'Admin'
  }
];

export const ADMIN_CREDENTIALS = {
  username: 'admin_root',
  password: 'admin123'
};
