import type { OrderStatus } from '../types/index.js';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '🟡 قيد المراجعة',
  accepted: '🔵 تم قبول الطلب',
  in_progress: '🟣 قيد التنفيذ',
  completed: '🟢 مكتمل',
  cancelled: '🔴 ملغي',
};

export const STATUS_ORDER: OrderStatus[] = [
  'pending',
  'accepted',
  'in_progress',
  'completed',
  'cancelled',
];

export function statusNotificationText(orderNumber: number, status: OrderStatus): string {
  switch (status) {
    case 'accepted':
      return `🔵 تحديث على طلبك #${orderNumber}\nتم قبول طلبك، وسيتم البدء في مراجعته وتجهيزه.`;
    case 'in_progress':
      return `🟣 تحديث على طلبك #${orderNumber}\nتم البدء في تنفيذ طلبك.`;
    case 'completed':
      return `🎉 تم الانتهاء من طلبك #${orderNumber}\nشكراً لاختيارك خدماتنا.`;
    case 'cancelled':
      return `🔴 تحديث على طلبك #${orderNumber}\nتم إلغاء الطلب. تواصل معنا إذا كان لديك أي استفسار.`;
    case 'pending':
      return `🟡 طلبك #${orderNumber} قيد المراجعة حالياً.`;
  }
}
