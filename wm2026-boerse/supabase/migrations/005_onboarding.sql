-- Migration 005: Onboarding-Flag in profiles
alter table profiles add column if not exists onboarding_completed boolean default false;
