import { getServiceByKeyDb } from '../db/services-repo.js';
import { STATUS_LABELS } from '../config/status.js';
import type { OrderRecord } from '../types/index.js';

export async function formatOrderCard(order: OrderRecord, includeCustomer = false): Promise<string> {
  const service = await getServiceByKeyDb(order.service_key);
  const serviceLabel = service ? `${service.emoji} ${service.name}` : order.service_key;
  const priceLine = order.final_price
    ? `💰 السعر النهائي: ${order.final_price} د.ل`
    : `💰 السعر التقديري: من ${order.price_min} إلى ${order.price_max} د.ل`;

  const lines = [
    `📦 طلب #${order.order_number}`,
    `الحالة: ${STATUS_LABELS[order.status]}`,
    `الخدمة: ${serviceLabel}`,
  ];

  if (includeCustomer) {
    const customerLabel = order.username
      ? `@${order.username}`
      : order.customer_name || `آيدي: ${order.telegram_user_id}`;
    lines.push(`العميل: ${customerLabel}`);
  }

  if (order.project_name) lines.push(`المشروع: ${order.project_name}`);
  lines.push(priceLine);

  if (order.admin_notes) {
    lines.push(`📝 ملاحظة: ${order.admin_notes}`);
  }

  const date = new Date(order.created_at);
  lines.push(`📅 تاريخ الطلب: ${date.toLocaleDateString('ar-LY')}`);

  return lines.join('\n');
}

export async function formatOrderFullDetails(order: OrderRecord): Promise<string> {
  const service = await getServiceByKeyDb(order.service_key);
  const serviceLabel = service ? `${service.emoji} ${service.name}` : order.service_key;
  const customerLabel = order.username
    ? `@${order.username}`
    : order.customer_name || `بدون اسم`;

  const lines = [
    `📦 طلب #${order.order_number}`,
    `الحالة: ${STATUS_LABELS[order.status]}`,
    '',
    `👤 العميل: ${customerLabel}`,
    `🆔 آيدي تيليجرام: ${order.telegram_user_id}`,
    '',
    `الخدمة: ${serviceLabel}`,
  ];

  if (order.project_name) lines.push(`اسم المشروع: ${order.project_name}`);
  if (order.project_field) lines.push(`مجال المشروع: ${order.project_field}`);
  if (order.idea_description) lines.push(`الفكرة: ${order.idea_description}`);

  if (order.wants_colors === true) {
    lines.push(`الألوان: ${order.colors_text || 'غير محددة'}`);
  } else if (order.wants_colors === false) {
    lines.push('الألوان: يختارها المصمم');
  }

  if (order.has_references === true) {
    lines.push('لديه مراجع/ملفات: نعم');
  } else if (order.has_references === false) {
    lines.push('لديه مراجع/ملفات: لا');
  }

  if (order.size_choice) {
    const sizeText = order.size_choice === 'مقاس خاص' ? order.custom_size : order.size_choice;
    lines.push(`المقاس: ${sizeText}`);
  }

  lines.push('');
  const priceLine = order.final_price
    ? `💰 السعر النهائي: ${order.final_price} د.ل`
    : `💰 السعر التقديري: من ${order.price_min} إلى ${order.price_max} د.ل`;
  lines.push(priceLine);

  if (order.admin_notes) {
    lines.push(`📝 ملاحظات إدارية: ${order.admin_notes}`);
  }

  const created = new Date(order.created_at);
  lines.push('');
  lines.push(`📅 تاريخ الطلب: ${created.toLocaleString('ar-LY')}`);

  return lines.join('\n');
}
