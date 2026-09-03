import { InlineKeyboard } from 'grammy';
import type { OrderRecord, ServiceDefinition } from '../types/index.js';
import { STATUS_ORDER, STATUS_LABELS } from '../config/status.js';

export function adminMainMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('🆕 الطلبات الجديدة', 'admin:new_orders')
    .row()
    .text('📋 كل الطلبات', 'admin:all_orders')
    .row()
    .text('🔍 بحث برقم الطلب', 'admin:search_order')
    .text('🔍 بحث باسم العميل', 'admin:search_customer')
    .row()
    .text('🛠️ إدارة الخدمات', 'admin:services')
    .row()
    .text('⬅️ إغلاق لوحة التحكم', 'admin:close');
}

export function adminOrderActionsKeyboard(order: OrderRecord): InlineKeyboard {
  const kb = new InlineKeyboard();
  kb.text('🔄 تغيير الحالة', `admin:order:${order.order_number}:status_menu`).row();
  kb.text('💰 تعديل السعر', `admin:order:${order.order_number}:price`).row();
  kb.text('📝 إضافة ملاحظة', `admin:order:${order.order_number}:note`).row();
  kb.text('✉️ مراسلة العميل', `admin:order:${order.order_number}:contact`).row();
  kb.text('⬅️ رجوع للوحة التحكم', 'admin:main');
  return kb;
}

export function adminStatusMenuKeyboard(orderNumber: number): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const status of STATUS_ORDER) {
    kb.text(STATUS_LABELS[status], `admin:order:${orderNumber}:set_status:${status}`).row();
  }
  kb.text('⬅️ رجوع', `admin:order:${orderNumber}:view`);
  return kb;
}

export function adminOrdersListKeyboard(orders: OrderRecord[]): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const o of orders) {
    kb.text(`#${o.order_number} — ${STATUS_LABELS[o.status]}`, `admin:order:${o.order_number}:view`).row();
  }
  kb.text('⬅️ رجوع للوحة التحكم', 'admin:main');
  return kb;
}

export function adminServicesListKeyboard(services: ServiceDefinition[]): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const s of services) {
    const statusIcon = s.active ? '✅' : '🚫';
    kb.text(`${statusIcon} ${s.emoji} ${s.name}`, `admin:service:${s.key}:view`).row();
  }
  kb.text('⬅️ رجوع للوحة التحكم', 'admin:main');
  return kb;
}

export function adminServiceActionsKeyboard(service: ServiceDefinition): InlineKeyboard {
  const kb = new InlineKeyboard();
  if (service.active) {
    kb.text('🚫 تعطيل الخدمة', `admin:service:${service.key}:disable`).row();
  } else {
    kb.text('✅ تفعيل الخدمة', `admin:service:${service.key}:enable`).row();
  }
  kb.text('💰 تعديل نطاق السعر', `admin:service:${service.key}:price`).row();
  kb.text('⬅️ رجوع لقائمة الخدمات', 'admin:services');
  return kb;
}

export function backToAdminMainKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text('⬅️ رجوع للوحة التحكم', 'admin:main');
}
