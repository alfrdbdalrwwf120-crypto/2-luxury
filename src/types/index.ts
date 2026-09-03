export type ServiceKey =
  | 'logo'
  | 'logo_update'
  | 'brand_identity'
  | 'brand_identity_update'
  | 'pattern'
  | 'business_card'
  | 'packaging'
  | 'stamp'
  | 'brochure'
  | 'certificate'
  | 'billboard'
  | 'letterhead'
  | 'bag'
  | 'notebook'
  | 'stickers'
  | 'book_cover'
  | 'flyer'
  | 'magazine';

export interface ServiceDefinition {
  key: ServiceKey;
  emoji: string;
  name: string;
  minPrice: number;
  maxPrice: number;
  perPage?: boolean;
  needsSize: boolean;
  sizeOptions?: string[];
  active: boolean;
}

export type OrderStatus =
  | 'pending' // قيد المراجعة
  | 'accepted' // تم قبول الطلب
  | 'in_progress' // قيد التنفيذ
  | 'completed' // مكتمل
  | 'cancelled'; // ملغي

export interface OrderRecord {
  id: number;
  order_number: number;
  telegram_user_id: number;
  customer_name: string | null;
  username: string | null;
  service_key: ServiceKey;
  project_name: string | null;
  project_field: string | null;
  idea_description: string | null;
  wants_colors: boolean | null;
  colors_text: string | null;
  has_references: boolean | null;
  usage_notes: string | null;
  size_choice: string | null;
  custom_size: string | null;
  price_min: number;
  price_max: number;
  final_price: number | null;
  status: OrderStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

// Draft order kept in-memory / in DB while user is going through the wizard
export interface OrderDraft {
  service_key: ServiceKey;
  step: string;
  project_name?: string;
  project_field?: string;
  idea_description?: string;
  wants_colors?: boolean;
  colors_text?: string;
  has_references?: boolean;
  usage_notes?: string;
  size_choice?: string;
  custom_size?: string;
}

export interface SessionData {
  draft: OrderDraft | null;
  awaitingAdminAction?: {
    type: 'search_order' | 'search_customer' | 'set_price' | 'admin_note' | 'contact_customer';
    orderNumber?: number;
    serviceKey?: string;
  };
}
