import { EventInput } from 'fullcalendar';

export type CalendarRecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type CalendarRecurrenceEndType = 'never' | 'until' | 'count';

export interface CalendarApiResponse<T> {
  data: T;
  msg: string[];
}

export interface CalendarEventType {
  id: number;
  name: string;
  slug: string;
  color: string;
  is_system: boolean;
  active: boolean;
  sort_order: number;
}

export interface CalendarEventLink {
  linkable_type: string;
  linkable_id: number;
  label: string;
  metadata?: Record<string, any>;
}

export interface CalendarLinkableRecord {
  id: number;
  label: string;
  subtitle: string | null;
  entity_type: string;
  metadata: Record<string, any>;
}

export interface CalendarEventExtendedProps {
  description?: string | null;
  location?: string | null;
  typeId?: number;
  typeName?: string;
  typeSlug?: string;
  isGlobal?: boolean;
  isHoliday?: boolean;
  isWorkingDay?: boolean;
  source?: string;
  holidayKey?: string;
  updatedAt?: string;
  updated_at?: string;
  timezone?: string;
  recurrenceRule?: string | null;
  links?: CalendarEventLink[];
}

export interface CalendarEventInput extends EventInput {
  startStr?: string;
  endStr?: string;
  extendedProps?: CalendarEventExtendedProps;
}

export interface CalendarEventPayload {
  id?: string;
  title: string;
  description: string | null;
  location: string | null;
  calendar_event_type_id: number;
  color: string | null;
  start_date: string;
  end_date: string;
  start_time?: string | null;
  end_time?: string | null;
  all_day: boolean;
  is_working_day: boolean;
  is_holiday?: boolean;
  holiday_key?: string | null;
  timezone: string;
  recurrence_type?: CalendarRecurrenceType;
  recurrence_rule?: string | null;
  recurrence_interval?: number;
  recurrence_days?: string[];
  recurrence_until?: string | null;
  recurrence_count?: number | null;
  links: CalendarEventLink[];
}

export const CALENDAR_COLORS = [
  '#e11d48',
  '#db2777',
  '#ef4444',
  '#f97316',
  '#fb923c',
  '#f59e0b',
  '#fbbf24',
  '#eab308',
  '#84cc16',
  '#65a30d',
  '#16a34a',
  '#059669',
  '#14b8a6',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#4f46e5',
  '#7c3aed',
  '#a855f7',
  '#a16207',
  '#737373',
  '#a3a3a3',
  '#8d6e63',
];

export const WEEK_DAYS = [
  { label: 'L', value: 'MO' },
  { label: 'M', value: 'TU' },
  { label: 'X', value: 'WE' },
  { label: 'J', value: 'TH' },
  { label: 'V', value: 'FR' },
  { label: 'S', value: 'SA' },
  { label: 'D', value: 'SU' },
];
