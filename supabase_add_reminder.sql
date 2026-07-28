-- Run this once in Supabase SQL Editor to support daily reminder alarms.
-- Stores the reminder time as 'HH:MM' text (24-hour), e.g. '08:30'.
-- NULL means no reminder is set for that habit.

alter table habits
  add column if not exists reminder_time text;
