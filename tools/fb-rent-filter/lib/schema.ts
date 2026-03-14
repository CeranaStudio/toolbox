import { z } from "zod";

export const rentRecordSchema = z.object({
  title: z.string().describe("房源標題，自動生成摘要"),
  price: z.number().nullable().describe("月租金（TWD），沒有就 null"),
  deposit: z.string().nullable().describe("押金描述"),
  district: z.string().nullable().describe("地區/行政區"),
  address: z.string().nullable().describe("詳細地址"),
  size: z.number().nullable().describe("坪數，沒有就 null"),
  roomType: z
    .string()
    .nullable()
    .describe("房型，如：整層、套房、雅房、分租套房"),
  floor: z.string().nullable().describe("樓層描述"),
  features: z.array(z.string()).describe("特色 tags，如：近捷運、附冷氣、寵物友善"),
  contact: z.string().nullable().describe("聯絡方式"),
  moveInDate: z.string().nullable().describe("可入住時間"),
  originalText: z.string().describe("原始貼文（截斷到 200 字）"),
  extractedAt: z.string().describe("萃取時間 ISO string"),
  status: z
    .enum(["interested", "contacted", "visited", "rejected"])
    .default("interested"),
  notes: z.string().nullable().describe("備註，沒有就 null"),
});

export type RentRecord = z.infer<typeof rentRecordSchema> & { id: string };

export const STATUS_CONFIG = {
  interested: { label: "想看", color: "#3B82F6" },
  contacted: { label: "已聯絡", color: "#F59E0B" },
  visited: { label: "已看房", color: "#10B981" },
  rejected: { label: "已放棄", color: "#9CA3AF" },
} as const;

export type RecordStatus = keyof typeof STATUS_CONFIG;

export const analyzeRequestSchema = z.object({
  posts: z.array(z.string().min(1)),
});
