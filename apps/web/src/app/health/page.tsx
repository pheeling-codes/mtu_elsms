'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchApi } from '@/lib/api';

export default function HealthPage() {
  const [apiStatus, setApiStatus] = useState<string>('Loading...');
  const [dbStatus, setDbStatus] = useState<string>('Loading...');

  useEffect(() => {
    // Check API Status
    fetchApi('/api/health') // Based on NestJS global prefix
      .then(() => setApiStatus('✅ Connected'))
      .catch((err) => setApiStatus('❌ Disconnected'));

    // Check DB Status Direct via Supabase
    const checkDb = async () => {
      try {
        const { error } = await supabase.from('users').select('id').limit(1);
        if (error && error.code !== 'PGRST116') {
          // It might error because no active anon_key is present, but hitting endpoint is enough proof sometimes.
          throw error;
        }
        setDbStatus('✅ Connected');
      } catch (err: any) {
        setDbStatus(`❌ Error: ${err.message}`);
      }
    };
    checkDb();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800 p-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">ELSMS Diagnostics</h1>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
            <span className="font-semibold text-gray-700">API Connection</span>
            <span className="font-medium text-sm">{apiStatus}</span>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
            <span className="font-semibold text-gray-700">Supabase DB</span>
            <span className="font-medium text-sm">{dbStatus}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
