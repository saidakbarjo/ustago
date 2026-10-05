"use client";
import { useI18n } from "@/lib/i18n/provider";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { NotificationList } from "@/components/notifications";
export default function NotificationsPage() {
  const { t } = useI18n();
  return <div className="max-w-3xl"><PageHeader title={t("notif.title")} /><NotificationList audience="user" /></div>;
}
