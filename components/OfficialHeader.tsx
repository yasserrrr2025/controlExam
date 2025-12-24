
import React from 'react';
import { APP_CONFIG } from '../constants';

const OfficialHeader: React.FC = () => {
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-start text-[12px] font-bold leading-relaxed">
        {/* الجزء الأيمن: بيانات الوزارة */}
        <div className="text-right">
          <p className="font-black text-[14px]">{APP_CONFIG.MINISTRY_NAME}</p>
          <p>{APP_CONFIG.ADMINISTRATION_NAME}</p>
          <p>{APP_CONFIG.SCHOOL_NAME}</p>
          <p className="text-[10px] mt-1 italic">الرقم الإداري: {APP_CONFIG.MINISTRY_ID}</p>
        </div>
        
        {/* الجزء الأيسر: بيانات التقرير */}
        <div className="text-left space-y-0.5">
          <p>التاريخ: {new Date().toLocaleDateString('ar-SA')}</p>
          <p>المرفقات: .................</p>
          <p>رقم التقرير: {Math.floor(Math.random() * 90000) + 10000}</p>
        </div>
      </div>
      <div className="w-full h-0.5 bg-slate-900 mt-4"></div>
    </div>
  );
};

export default OfficialHeader;
