import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ExternalLink, ShieldAlert } from 'lucide-react';

export default function MitreAtlasBadge({ attackType }) {
  const [atlasData, setAtlasData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!attackType) return;
    
    const fetchData = async () => {
      try {
        const res = await axios.get(`https://aegis-backend-idbk.onrender.com/api/intelligence/mitre/${attackType}`);
        setAtlasData(res.data);
      } catch (e) {
        console.error('Failed to fetch MITRE ATLAS data', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [attackType]);

  if (loading || !atlasData) return null;
  if (atlasData.id === 'AML.UNKNOWN') return null; // Graceful fallback

  return (
    <a 
      href={atlasData.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="inline-flex items-center gap-3 bg-[#111827] text-white rounded border border-gray-800 border-l-[3px] border-l-[#FF8800] p-2 hover:bg-gray-800 transition-colors w-max shadow-sm"
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[9px] font-bold tracking-wider text-[#FF8800] uppercase font-mono">MITRE ATLAS</span>
          <span className="text-[10px] font-mono bg-gray-800 px-1 py-0.5 rounded text-gray-300">
            {atlasData.id}
          </span>
          <span className="text-[9px] font-bold tracking-wider bg-[#FF8800]/20 text-[#FF8800] px-1 py-0.5 rounded uppercase">
            {atlasData.tactic}
          </span>
        </div>
        <span className="text-xs font-medium text-gray-200">{atlasData.name}</span>
      </div>
      <ExternalLink className="w-3 h-3 text-gray-500 shrink-0 ml-1" />
    </a>
  );
}
