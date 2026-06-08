import { dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import type { Day } from "date-fns";
import { zhCN } from "date-fns/locale/zh-CN";

const locales = {
  "zh-CN": zhCN,
};

const customStartOfWeek = (date: Date, _culture?: string, options?: { weekStartsOn?: Day }) =>
  startOfWeek(date, { weekStartsOn: options?.weekStartsOn ?? 1 });

export const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: customStartOfWeek,
  getDay,
  locales,
});
