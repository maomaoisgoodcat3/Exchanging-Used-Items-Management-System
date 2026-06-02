// Tệp: src/mocks/post.mock.ts
import type { Post } from "@/types/post";

export const mockPosts: Post[] = [
  {
    id: 1,
    title: "Thanh lý sách Java cơ bản & Đồ dùng học tập",
    sellerName: "Nguyễn A",
    sellerEmail: "nguyena@student.edu.vn",
    sellerPhone: "0901234567",
    type: "MUA_BAN",
    category: "Sách vở",
    price: 50000,
    location: "Cơ sở Hà Nội",
    condition: "Đã sử dụng - Còn mới 90%",
    description: "Mình vừa qua môn nên cần pass lại cuốn Java cơ bản này. Sách mình bọc nilon cẩn thận nên không bị nhăn mép. Tiện thể mình thanh lý luôn bộ thước kẻ kỹ thuật chưa dùng tới nhé.",
    images: [
      "https://placehold.co/600x400/2563eb/white?text=Sach+Java",
      "https://placehold.co/600x400/cbd5e1/black?text=Mat+Sau+Sach",
      "https://placehold.co/600x400/cbd5e1/black?text=Bo+Thuoc+Ke"
    ],
    products: [
      { id: "p1-1", name: "Sách Lập trình Java Cơ bản", price: 50000, quantity: 1 },
      { id: "p1-2", name: "Bộ thước kẻ kỹ thuật eKe", price: 15000, quantity: 1 },
    ]
  },
  {
    id: 2,
    title: "Áo hoodie đồng phục trường X (Size L)",
    sellerName: "Trần B",
    sellerEmail: "tranb@student.edu.vn",
    type: "TRAO_DOI",
    category: "Quần áo",
    price: 0, // Trao đổi không tính tiền
    location: "Cơ sở Cầu Giấy",
    condition: "Như mới",
    description: "Mình pass áo hoodie đồng phục trường size L. Áo mình mặc hơi rộng nên muốn trao đổi lấy áo tương tự size M, hoặc đổi lấy balo đi học cũng được ạ.",
    images: [
      "https://placehold.co/600x400/f59e0b/white?text=Ao+Hoodie+Truong"
    ],
    products: [
      { id: "p2-1", name: "Áo Hoodie đồng phục (Size L)", price: 0, quantity: 1 }
    ]
  },
  {
    id: 3,
    title: "Ủng hộ tập vở & Bút viết cho vùng cao",
    sellerName: "Câu lạc bộ Tình Nguyện",
    sellerEmail: "volunteer.club@edu.vn",
    sellerPhone: "0988776655",
    type: "QUYEN_GOP",
    category: "Đồ học tập",
    price: 0,
    location: "Phòng Sinh viên - Đống Đa",
    condition: "Mới 100%",
    campaignId: "CAMP_001",
    campaignName: "Mùa Hè Xanh 2026", // Có gắn chiến dịch để test UI
    description: "CLB Tình nguyện đang nhận quyên góp tập vở và đồ dùng học tập để gửi tặng các em nhỏ vùng cao. Bạn nào có nhu cầu đóng góp vui lòng thêm vào giỏ hàng ảo để chúng mình xác nhận số lượng nhé!",
    images: [
      "https://placehold.co/600x400/10b981/white?text=Quyen+Gop+Vo",
      "https://placehold.co/600x400/a7f3d0/black?text=But+Viet"
    ],
    products: [
      { id: "p3-1", name: "Tập vở ô ly 96 trang", price: 0, quantity: 10 },
      { id: "p3-2", name: "Hộp bút bi Thiên Long", price: 0, quantity: 5 }
    ]
  },
  {
    id: 4,
    title: "Bình nước giữ nhiệt 500ml",
    sellerName: "Lê Huyền",
    sellerEmail: "huyenl@student.edu.vn",
    type: "TRAO_DOI",
    category: "Khác",
    price: 0,
    location: "Xuân Thủy",
    condition: "Sử dụng vừa phải",
    description: "Bình nước giữ nhiệt xài rất tốt, giữ đá được 6 tiếng. Mình mới mua bình to hơn nên pass lại bình này. Muốn đổi lấy một quyển sổ tay lò xo nhé.",
    images: [
      "https://placehold.co/600x400/8b5cf6/white?text=Binh+Nuoc"
    ],
    products: [
      { id: "p4-1", name: "Bình nước giữ nhiệt vỏ tre", price: 0, quantity: 1 }
    ]
  }
];