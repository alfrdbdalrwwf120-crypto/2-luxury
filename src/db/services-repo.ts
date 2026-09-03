import { supabase } from './client.js';
import { SERVICES } from '../config/services.js';
import type { ServiceDefinition, ServiceKey } from '../types/index.js';

interface ServiceRow {
  key: string;
  emoji: string;
  name: string;
  min_price: number;
  max_price: number;
  per_page: boolean;
  needs_size: boolean;
  size_options: string[] | null;
  active: boolean;
}

function rowToService(row: ServiceRow): ServiceDefinition {
  return {
    key: row.key as ServiceKey,
    emoji: row.emoji,
    name: row.name,
    minPrice: row.min_price,
    maxPrice: row.max_price,
    perPage: row.per_page,
    needsSize: row.needs_size,
    sizeOptions: row.size_options ?? undefined,
    active: row.active,
  };
}

/** Ensures the services table has a row for every statically-defined service. */
export async function seedServicesIfNeeded(): Promise<void> {
  const { data, error } = await supabase.from('services').select('key');
  if (error) {
    console.error('Failed to check services table:', error.message);
    return;
  }

  const existingKeys = new Set((data ?? []).map((r) => r.key));
  const missing = SERVICES.filter((s) => !existingKeys.has(s.key));

  if (missing.length === 0) return;

  const rows = missing.map((s) => ({
    key: s.key,
    emoji: s.emoji,
    name: s.name,
    min_price: s.minPrice,
    max_price: s.maxPrice,
    per_page: s.perPage ?? false,
    needs_size: s.needsSize,
    size_options: s.sizeOptions ?? [],
    active: s.active,
  }));

  const { error: insertError } = await supabase.from('services').insert(rows);
  if (insertError) {
    console.error('Failed to seed services:', insertError.message);
  } else {
    console.log(`Seeded ${rows.length} services into Supabase.`);
  }
}

export async function getAllServices(): Promise<ServiceDefinition[]> {
  const { data, error } = await supabase.from('services').select('*').order('key');
  if (error || !data) {
    console.error('Failed to load services, falling back to static list:', error?.message);
    return SERVICES;
  }
  return (data as ServiceRow[]).map(rowToService);
}

export async function getActiveServices(): Promise<ServiceDefinition[]> {
  const all = await getAllServices();
  return all.filter((s) => s.active);
}

export async function getServiceByKeyDb(key: string): Promise<ServiceDefinition | undefined> {
  const { data, error } = await supabase.from('services').select('*').eq('key', key).single();
  if (error || !data) return undefined;
  return rowToService(data as ServiceRow);
}

export async function setServiceActive(key: string, active: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('services')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('key', key);
  return !error;
}

export async function updateServicePriceRange(
  key: string,
  minPrice: number,
  maxPrice: number,
): Promise<boolean> {
  const { error } = await supabase
    .from('services')
    .update({ min_price: minPrice, max_price: maxPrice, updated_at: new Date().toISOString() })
    .eq('key', key);
  return !error;
}
