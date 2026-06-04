"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface Campaign {
  id: string;
  title: string;
  organizationName: string;
  createdAt: string;
  image: string;
  status: string;
  startDate?: string;
  endDate?: string;
  leaderEmail: string;
  leaderPhone: string;
  description: string;
}

interface CampaignImagePreview {
  fileName: string;
  previewUrl: string;
}

const CAMPAIGNS_STORAGE_KEY = "mockCampaigns";

const campaignData: Campaign[] = [
  {
    id: "C-001",
    title: "Chiến dịch Giảm Nhựa",
    organizationName: "CLB Xanh UET",
    createdAt: "12/05/2026",
    startDate: "12/05/2026",
    endDate: "30/06/2026",
    image:
      "https://images.unsplash.com/photo-1517153295760-4a94ff3fdef9?auto=format&fit=crop&w=800&q=80",
    status: "Đang chạy",
    leaderEmail: "lanh.leader@uet.edu.vn",
    leaderPhone: "0987 654 321",
    description:
      "Chiến dịch kêu gọi sinh viên hạn chế sử dụng đồ nhựa dùng một lần và tái chế đúng cách.",
  },
  {
    id: "C-002",
    title: "Quyên góp Sách Cũ",
    organizationName: "Tổ chức Sách Xanh",
    createdAt: "08/05/2026",
    startDate: "08/05/2026",
    endDate: "20/05/2026",
    image:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
    status: "Đã kết thúc",
    leaderEmail: "huong.nguyen@uet.edu.vn",
    leaderPhone: "0912 345 678",
    description:
      "Thu gom và phân phát sách cũ cho học sinh có hoàn cảnh khó khăn trong khu vực.",
  },
  {
    id: "C-003",
    title: "Thu gom Pin Cũ",
    organizationName: "CLB Kỹ thuật",
    createdAt: "20/05/2026",
    startDate: "20/06/2026",
    endDate: "30/06/2026",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
    status: "Sắp diễn ra",
    leaderEmail: "minh.tran@uet.edu.vn",
    leaderPhone: "0901 234 567",
    description:
      "Chiến dịch lập điểm thu gom pin cũ an toàn, giúp bảo vệ môi trường và tái chế đúng quy cách.",
  },
];

const statusStyles: Record<string, string> = {
  "Đang chạy": "bg-blue-100 text-blue-700",
  "Đã kết thúc": "bg-gray-100 text-gray-700",
  "Sắp diễn ra": "bg-green-100 text-green-700",
};

const parseCampaignDate = (dateValue?: string) => {
  if (!dateValue) return null;

  if (dateValue.includes("-")) {
    const parsedDate = new Date(dateValue);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  const [day, month, year] = dateValue.split("/").map(Number);

  if (!day || !month || !year) return null;

  return new Date(year, month - 1, day);
};

const toDateOnly = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const formatInputDate = (dateValue: string) =>
  new Date(dateValue).toLocaleDateString("vi-VN");

const getCampaignStatus = (campaign: Campaign) => {
  const startDate = parseCampaignDate(campaign.startDate ?? campaign.createdAt);
  const endDate = parseCampaignDate(campaign.endDate);

  if (!startDate || !endDate) {
    return campaign.status || "Đang chạy";
  }

  const today = toDateOnly(new Date());
  const normalizedStartDate = toDateOnly(startDate);
  const normalizedEndDate = toDateOnly(endDate);

  if (today < normalizedStartDate) return "Sắp diễn ra";
  if (today > normalizedEndDate) return "Đã kết thúc";

  return "Đang chạy";
};

const getCampaignStatusStyle = (status: string) => {
  if (status === "Sắp diễn ra") return "bg-green-100 text-green-700";
  if (status === "Đã kết thúc") return "bg-gray-100 text-gray-700";
  if (status === "Đang chạy") return "bg-blue-100 text-blue-700";

  return statusStyles[status] ?? "bg-slate-100 text-slate-700";
};

const normalizeCampaigns = (campaigns: Campaign[]) =>
  campaigns.map((campaign) => {
    const defaultCampaign = campaignData.find((item) => item.id === campaign.id);

    return {
      ...campaign,
      startDate: campaign.startDate ?? defaultCampaign?.startDate,
      endDate: campaign.endDate ?? defaultCampaign?.endDate,
    };
  });

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const getInitialCampaigns = () => {
  if (typeof window === "undefined") {
    return normalizeCampaigns(campaignData);
  }

  try {
    const storedCampaigns = window.localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
    return storedCampaigns
      ? normalizeCampaigns(JSON.parse(storedCampaigns) as Campaign[])
      : normalizeCampaigns(campaignData);
  } catch {
    return normalizeCampaigns(campaignData);
  }
};

export default function CampaignsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>(getInitialCampaigns);
  const [activeView, setActiveView] = useState("Layout");
  const [search, setSearch] = useState("");
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [selectedImages, setSelectedImages] = useState<CampaignImagePreview[]>(
    []
  );

  const filteredCampaigns = useMemo(() => {
    const normalizedSearch = search.toLowerCase();

    return campaigns.filter(
      (campaign) =>
        campaign.title.toLowerCase().includes(normalizedSearch) ||
        campaign.id.toLowerCase().includes(normalizedSearch) ||
        campaign.organizationName.toLowerCase().includes(normalizedSearch)
    );
  }, [campaigns, search]);

  const isAdmin = user?.role === "ADMIN";
  const isStudent = user?.role === "STUDENT";
  const isOrganisation = user?.role === "CLUB";
  const canCreateCampaign = isOrganisation && Boolean(user?.organization);

  useEffect(() => {
    try {
      window.localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
    } catch {
      console.warn("Không thể lưu campaign mock vào localStorage.");
    }
  }, [campaigns]);

  const handleCreateCampaign = () => {
    setIsCreatingCampaign(true);
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const previews = await Promise.all(
      files.map(async (file) => ({
        fileName: file.name,
        previewUrl: await readFileAsDataUrl(file),
      }))
    );

    setSelectedImages(previews);
  };

  const handleCancelCampaign = () => {
    setSelectedImages([]);
    setIsCreatingCampaign(false);
  };

  const handleSubmitCampaign = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const startDate = String(formData.get("startDate") ?? "");
    const endDate = String(formData.get("endDate") ?? "");
    const campaignIndex = campaigns.length + 1;

    const newCampaign: Campaign = {
      id: `C-${String(campaignIndex).padStart(3, "0")}`,
      title,
      organizationName: user?.organization?.name ?? "Tổ chức của bạn",
      createdAt: new Date().toLocaleDateString("vi-VN"),
      startDate: startDate ? formatInputDate(startDate) : undefined,
      endDate: endDate ? formatInputDate(endDate) : undefined,
      image:
        selectedImages[0]?.previewUrl ??
        "https://placehold.co/800x400/e0f2fe/0f172a?text=Campaign",
      status: "Sắp diễn ra",
      leaderEmail: user?.organization?.leaderEmail ?? user?.email ?? "",
      leaderPhone: user?.organization?.leaderPhone ?? "",
      description: description || "Chiến dịch mới đang chờ cập nhật mô tả.",
    };

    setCampaigns((currentCampaigns) => [newCampaign, ...currentCampaigns]);
    setSelectedImages([]);
    event.currentTarget.reset();
    setIsCreatingCampaign(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-500">UET Marketplace</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Campaigns
            </h1>
          </div>

          <button
            type="button"
            onClick={handleCreateCampaign}
            disabled={!canCreateCampaign}
            className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold shadow-sm transition ${
              canCreateCampaign
                ? "bg-cyan-500 text-slate-900 hover:bg-cyan-400"
                : "cursor-not-allowed bg-slate-200 text-slate-400"
            }`}
          >
            + Tạo chiến dịch
          </button>
        </div>

        {isAdmin && (
          <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Admin view: dùng khu vực này để chuẩn bị chức năng duyệt/quản lý
            campaign sau.
          </p>
        )}

        {isStudent && (
          <p className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            User view: bạn có thể xem campaign, nhưng không thể tạo campaign.
          </p>
        )}

        {isOrganisation && (
          <p className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Organisation view: bạn có thể tạo campaign cho{" "}
            {user?.organization?.name ?? "tổ chức của bạn"}.
          </p>
        )}

        {!user && (
          <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Vui lòng đăng nhập để xem thông tin chi tiết và tạo campaign nếu
            bạn là đại diện tổ chức.
          </p>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Bố cục", value: "Layout" },
              { label: "Bộ lọc", value: "Filter" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setActiveView(item.value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeView === item.value
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nhập từ khóa để tìm kiếm..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {isCreatingCampaign && (
        <form
          onSubmit={handleSubmitCampaign}
          className="rounded-[28px] bg-white p-4 shadow-sm"
        >
          <div className="space-y-4 rounded-[24px] bg-slate-100 p-4">
            <input
              name="title"
              required
              placeholder="* Nhập Tiêu đề Chiến dịch..."
              className="w-full rounded-full border-0 bg-white/70 px-6 py-4 text-center text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 focus:bg-white"
            />

            <textarea
              name="description"
              rows={2}
              placeholder="Nhập Mô tả Chiến dịch..."
              className="w-full resize-none rounded-full border-0 bg-white/70 px-6 py-4 text-center text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:bg-white"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <input
                name="startDate"
                type="date"
                required
                className="w-full rounded-full border-0 bg-white/70 px-6 py-4 text-center text-sm font-semibold text-slate-500 outline-none focus:bg-white"
              />
              <input
                name="endDate"
                type="date"
                required
                className="w-full rounded-full border-0 bg-white/70 px-6 py-4 text-center text-sm font-semibold text-slate-500 outline-none focus:bg-white"
              />
            </div>

            <div className="rounded-[24px] bg-white/70 p-4">
              <p className="mb-2 text-sm font-semibold italic text-slate-900">
                Chọn hình ảnh
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {selectedImages.map((image) => (
                  <div
                    key={image.previewUrl}
                    title={image.fileName}
                    className="h-16 w-16 rounded-sm bg-cover bg-center"
                    style={{ backgroundImage: `url(${image.previewUrl})` }}
                  />
                ))}

                {selectedImages.length === 0 && (
                  <>
                    <div className="h-16 w-16 rounded-sm bg-cyan-300" />
                    <div className="h-16 w-16 rounded-sm bg-cyan-300" />
                  </>
                )}

                <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-sm bg-slate-300 text-3xl text-slate-900 transition hover:bg-slate-400">
                  +
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelCampaign}
                className="rounded-full bg-red-400 px-8 py-2 text-sm font-bold text-slate-900 transition hover:bg-red-500"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-full bg-cyan-400 px-8 py-2 text-sm font-bold text-slate-900 transition hover:bg-cyan-500"
              >
                Đăng bài
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredCampaigns.map((campaign) => {
          const campaignStatus = getCampaignStatus(campaign);

          return (
            <div
              key={campaign.id}
              className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 shadow-sm"
            >
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{campaign.id}</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  getCampaignStatusStyle(campaignStatus)
                }`}
              >
                {campaignStatus}
              </span>
            </div>

            <img
              src={campaign.image}
              alt={campaign.title}
              className="mt-5 h-44 w-full rounded-3xl object-cover"
            />

            <div className="mt-5 space-y-3">
              <div>
                <p className="text-xl font-semibold text-slate-900">
                  {campaign.title}
                </p>
                <p className="text-sm text-slate-500">
                  {campaign.organizationName}
                </p>
              </div>

              <div className="grid gap-3 rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                <div className="flex justify-between gap-4">
                  <span className="font-medium text-slate-600">Ngày tạo</span>
                  <span>{campaign.createdAt}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="font-medium text-slate-600">
                    Email liên hệ
                  </span>
                  <span>{campaign.leaderEmail}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="font-medium text-slate-600">
                    SĐT leader
                  </span>
                  <span>{campaign.leaderPhone}</span>
                </div>
              </div>

              <p className="text-sm leading-6 text-slate-600">
                {campaign.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push(`/campaigns/${campaign.id}`)}
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Xem chi tiết chiến dịch
            </button>
            </div>
          );
        })}

        {filteredCampaigns.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            Không tìm thấy chiến dịch phù hợp.
          </div>
        )}
      </div>
    </div>
  );
}
