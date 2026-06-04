import { mockPosts } from "@/mocks/post.mocks";
import type { Post } from "@/types/post";

const POSTS_STORAGE_KEY = "uet-marketplace-posts";

const canUseStorage = () => typeof window !== "undefined";

const readStoredPosts = (): Post[] | null => {
  if (!canUseStorage()) return null;

  try {
    const rawPosts = window.localStorage.getItem(POSTS_STORAGE_KEY);
    return rawPosts ? (JSON.parse(rawPosts) as Post[]) : null;
  } catch {
    return null;
  }
};

const writeStoredPosts = (posts: Post[]) => {
  if (!canUseStorage()) return;

  window.localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
};

export async function getPosts(): Promise<Post[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const storedPosts = readStoredPosts();

      if (storedPosts) {
        resolve(storedPosts);
        return;
      }

      writeStoredPosts(mockPosts);
      resolve(mockPosts);
    }, 500);
  });
}

export function savePost(post: Post): Post[] {
  const currentPosts = readStoredPosts() ?? mockPosts;
  const updatedPosts = [post, ...currentPosts];

  writeStoredPosts(updatedPosts);

  return updatedPosts;
}
