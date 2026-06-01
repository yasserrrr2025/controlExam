import React from 'react';

export const APP_CONFIG = {
  CLICHE_URL: 'https://www.raed.net/img?id=1488645',
  MINISTRY_ID: '1057275826',
  LOGO_URL: 'https://www.raed.net/img?id=1488645',
  MINISTRY_NAME: 'وزارة التعليم',
  ADMINISTRATION_NAME: 'إدارة التعليم بمحافظة جدة',
  SCHOOL_NAME: 'نظام كنترول الاختبارات',
};

export const ROLES_ARABIC: Record<string, string> = {
  ADMIN: 'مدير النظام',
  CONTROL_MANAGER: 'رئيس الكنترول',
  PROCTOR: 'مراقب',
  CONTROL: 'كنترول استلام',
  ASSISTANT_CONTROL: 'مساعد الكنترول',
  COUNSELOR: 'موجه طلابي',
};

export const PERIODS = [
  { id: 1, name: 'الفترة الأولى', time: '07:00 - 09:00' },
  { id: 2, name: 'الفترة الثانية', time: '09:30 - 11:30' },
];

export const GRADE_OPTIONS = ['الأول المتوسط', 'الثاني المتوسط', 'الثالث المتوسط'];

export const MOEIcon = () => (
  <img src={APP_CONFIG.LOGO_URL} alt="وزارة التعليم" className="w-full h-full object-contain" />
);
