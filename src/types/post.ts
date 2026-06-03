export type PostType = "TRAO_DOI" | "MUA_BAN" | "QUYEN_GOP";

export type Post = {
  id: number;
  ownerId: string;
  title: string;
  sellerName: string;
  type: PostType;
  category: string;
  price: number;
  location: string;
  image: string;
};
