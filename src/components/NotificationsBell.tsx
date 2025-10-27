"use client";

import React, { useState, useEffect } from 'react';
import { Bell, XCircle, CalendarCheck, Wallet } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format, addDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';

// Define types for data
type ScheduledTransaction = {
  id: string;
  user_id: string;
  date: string; // ISO string
  account: string;
  vendor: string;
  category: string;
  amount: number;
  frequency: string;
  remarks: string | null;
  created_at: string;
  last_processed_date: string | null;
  recurrence_end_date: string | null;
};

type Budget = {
  id: string;
  user_id: string;
  category_id: string;
  currency: string;
  target_amount: number;
  start_date: string; // ISO string
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  end_date: string | null; // ISO string
  is_active: boolean;
  created_at: string;
};

type Transaction = {
  id: string;
  user_id: string;
  date: string;
  account: string;
  currency: string;
  vendor: string | null;
  amount: number;
  remarks: string | null;
  category: string;
  created_at: string;
  is_scheduled_origin: boolean | null;
  recurrence_id: string | null;
  recurrence_frequency: string | null;
  recurrence_end_date: string | null;
};

type Category = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

type NotificationItem = {
  id: string;
  type: 'scheduled_transaction' | 'budget_alert';
  message: string;
  link: string;
  date?: Date; // For scheduled transactions
  categoryName?: string; // For budget alerts
};

const NotificationsBell: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [clearedNotifications, setClearedNotifications] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUserId();
  }, []);

  const fetchScheduledTransactions = async () => {
    if (!userId) return [];
    const today = new Date();
    const nextSevenDays = addDays(today, 7);

    const { data, error } = await supabase
      .from('scheduled_transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', format(today, 'yyyy-MM-dd'))
      .lte('date', format(nextSevenDays, 'yyyy-MM-dd'));

    if (error) {
      console.error("Error fetching scheduled transactions:", error);
      toast.error("Failed to load scheduled transactions.");
      return [];
    }

    return data.map(tx => ({
      id: tx.id,
      type: 'scheduled_transaction',
      message: `Upcoming: ${tx.vendor} - ${tx.amount} ${tx.currency || 'USD'} on ${format(parseISO(tx.date), 'MMM dd')}`,
      link: `/transactions?scheduledId=${tx.id}`, // Example link
      date: parseISO(tx.date),
    })) as NotificationItem[];
  };

  const fetchBudgetAlerts = async () => {
    if (!userId) return [];

    const { data: budgets, error: budgetError } = await supabase
      .from('budgets')
      .select('*, categories(name)')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (budgetError) {
      console.error("Error fetching budgets:", budgetError);
      toast.error("Failed to load budget data.");
      return [];
    }

    const alerts: NotificationItem[] = [];
    const today = new Date();

    for (const budget of budgets) {
      const categoryName = (budget.categories as Category)?.name || 'Unknown Category';
      const budgetStartDate = parseISO(budget.start_date);
      let periodStart: Date;
      let periodEnd: Date;

      // For simplicity, assuming monthly budgets for now for alert calculation
      // A more robust solution would handle different frequencies
      periodStart = startOfMonth(today);
      periodEnd = endOfMonth(today);
      
      // Ensure the budget's start date is within or before the current period
      if (budgetStartDate > periodEnd) continue;

      const { data: transactions, error: transactionError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('category', categoryName)
        .gte('date', format(periodStart, 'yyyy-MM-dd'))
        .lte('date', format(periodEnd, 'yyyy-MM-dd'));

      if (transactionError) {
        console.error(`Error fetching transactions for budget ${budget.id}:`, transactionError);
        continue;
      }

      const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0);
      const percentageSpent = (totalSpent / budget.target_amount) * 100;

      if (percentageSpent >= 80 && percentageSpent < 100) {
        alerts.push({
          id: `budget-alert-${budget.id}`,
          type: 'budget_alert',
          message: `Budget for ${categoryName} is ${percentageSpent.toFixed(0)}% spent!`,
          link: `/budgets?budgetId=${budget.id}`, // Example link
          categoryName: categoryName,
        });
      } else if (percentageSpent >= 100) {
        alerts.push({
          id: `budget-alert-${budget.id}-over`,
          type: 'budget_alert',
          message: `Budget for ${categoryName} is OVERSPENT!`,
          link: `/budgets?budgetId=${budget.id}`,
          categoryName: categoryName,
        });
      }
    }
    return alerts;
  };

  const { data: scheduledTxData, isLoading: isLoadingScheduled } = useQuery<NotificationItem[]>({
    queryKey: ['scheduledTransactions', userId],
    queryFn: fetchScheduledTransactions,
    enabled: !!userId,
  });

  const { data: budgetAlertsData, isLoading: isLoadingBudgets } = useQuery<NotificationItem[]>({
    queryKey: ['budgetAlerts', userId],
    queryFn: fetchBudgetAlerts,
    enabled: !!userId,
  });

  useEffect(() => {
    if (scheduledTxData || budgetAlertsData) {
      const allNotifications = [
        ...(scheduledTxData || []),
        ...(budgetAlertsData || []),
      ].filter(notif => !clearedNotifications.has(notif.id));
      setNotifications(allNotifications.sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0)));
    }
  }, [scheduledTxData, budgetAlertsData, clearedNotifications]);

  const handleClearAllNotifications = () => {
    const newCleared = new Set(clearedNotifications);
    notifications.forEach(notif => newCleared.add(notif.id));
    setClearedNotifications(newCleared);
    setNotifications([]);
    toast.success("Notifications cleared for this session.");
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    navigate(notification.link);
    // Optionally close popover here
  };

  const unreadCount = notifications.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 rounded-full">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex items-center justify-between p-4">
          <h4 className="font-medium text-sm">Notifications ({unreadCount})</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearAllNotifications} className="text-xs h-auto px-2 py-1">
              Clear All
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[200px]">
          {isLoadingScheduled || isLoadingBudgets ? (
            <div className="p-4 text-center text-sm text-gray-500">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">No new notifications.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-2 p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  {notification.type === 'scheduled_transaction' ? (
                    <CalendarCheck className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                  ) : (
                    <Wallet className="h-4 w-4 text-orange-500 mt-1 flex-shrink-0" />
                  )}
                  <div className="flex-grow">
                    <p className="text-sm font-medium leading-none">{notification.message}</p>
                    {notification.date && (
                      <p className="text-xs text-gray-500 mt-1">
                        {format(notification.date, 'PPP')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;