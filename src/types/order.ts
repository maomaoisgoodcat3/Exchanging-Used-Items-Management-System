export type PosterStatus = "Pending" | "Accepted" | "Denied" | "Ready for pickup" | "Successful";
export type RequesterStatus = "Pending" | "Accepted" | "Denied" | "Deposited" | "Successful" | "Unsuccessful";

export interface Order {
  transaction_id: string; // Khớp với transaction_id
  post_id: number;
  requester_email: string;
  service_fee: number;
  poster_status: PosterStatus;
  requester_status: RequesterStatus;
  transaction_date: string;
  post_title?: string; // Để hiển thị tên bài đăng khi list đơn
}