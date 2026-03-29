import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface CpvDescriptionProps {
  code: string;
  className?: string;
}

export function CpvDescription({ code, className = "" }: CpvDescriptionProps) {
  const [description, setDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDescription = async () => {
      if (!code || code.length < 3) {
        setDescription(null);
        return;
      }

      setLoading(true);
      try {
        // CPV codes are stored as bigint in the database.
        // If the code is numeric, we convert it to a number to handle leading zeros correctly.
        const numericCode = parseInt(code, 10);
        
        const { data, error } = await (supabase as any)
          .from('cpv_codes')
          .select('description_ca')
          .eq('code_numeric', isNaN(numericCode) ? code : numericCode)
          .maybeSingle();

        if (error) throw error;
        setDescription(data?.description_ca || null);
      } catch (err) {
        console.error('Error fetching CPV description:', err);
        setDescription(null);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchDescription, 500);
    return () => clearTimeout(timer);
  }, [code]);

  if (!code || (!loading && !description)) return null;

  return (
    <div className={`text-xs mt-1 transition-all duration-200 ${className}`}>
      {loading ? (
        <span className="text-slate-400 animate-pulse italic">Cercant descripció...</span>
      ) : (
        <span 
          className="text-blue-600 font-medium italic block truncate" 
          title={description || ''}
        >
          {description}
        </span>
      )}
    </div>
  );
}
