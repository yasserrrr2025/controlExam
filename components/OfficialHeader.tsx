
import React from 'react';
import { APP_CONFIG } from '../constants';

const OfficialHeader: React.FC = () => {
  return (
    <div className="w-full flex flex-col items-center mb-6 no-print-padding">
      {/* Official Cliché Image */}
      <img 
        src={APP_CONFIG.CLICHE_URL} 
        alt="كليشة حكومية" 
        className="w-full max-w-4xl h-auto mb-4"
      />
      
      <div className="w-full grid grid-cols-3 gap-4 px-8 items-center border-b-2 border-slate-900 pb-4">
        <div className="text-[12px] font-bold text-right leading-tight">
          <p className="mb-1">{APP_CONFIG.MINISTRY_NAME}</p>
          <p className="mb-1">{APP_CONFIG.ADMINISTRATION_NAME}</p>
          <p className="mb-1">{APP_CONFIG.SCHOOL_NAME}</p>
          <p>الرقم الإداري: <span className="font-mono text-blue-800">{APP_CONFIG.MINISTRY_ID}</span></p>
        </div>
        
        <div className="flex justify-center">
          <img 
            src={APP_CONFIG.LOGO_URL} 
            alt="شعار الوزارة" 
            className="w-20 h-20 object-contain"
          />
        </div>

        <div className="text-[12px] font-bold text-left leading-tight">
          <p className="mb-1">التاريخ: {new Date().toLocaleDateString('ar-SA')}</p>
          <p className="mb-1">المرفقات: لا يوجد</p>
          <p>رقم التقرير: {Math.floor(Math.random() * 100000)}</p>
        </div>
      </div>
    </div>
  );
};

export default OfficialHeader;
