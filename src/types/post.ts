export type PostType = "TRAO_DOI" | "MUA_BAN" | "QUYEN_GOP";

export type Post = {
  id: number;
  title: string;
  sellerName: string;
  type: PostType;
  category: string;
  price: number;
  location: string;
  image: string;
};
