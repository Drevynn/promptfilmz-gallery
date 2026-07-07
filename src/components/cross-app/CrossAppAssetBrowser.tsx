import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { CREATIVE_SOVEREIGNTY_BRAND } from '@/lib/creativeSovereignty';

export interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'metadata';
  sourceApp: string;
  data: any;
  createdAt: number;
}

export const CrossAppAssetBrowser: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssets() {
      if (!auth.currentUser) return;
      
      const q = query(collection(db, `users/${auth.currentUser.uid}/shared_assets`));
      const querySnapshot = await getDocs(q);
      const fetched: Asset[] = [];
      querySnapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as Asset);
      });
      setAssets(fetched);
      setLoading(false);
    }
    fetchAssets();
  }, []);

  if (loading) return <div>Loading shared assets...</div>;

  return (
    <div className={`p-4 rounded-lg bg-[${CREATIVE_SOVEREIGNTY_BRAND.secondaryColor}] text-white`}>
      <h2 className="text-xl mb-4 font-bold">Cross-App Asset Browser</h2>
      <div className="grid grid-cols-2 gap-4">
        {assets.map((asset) => (
          <div key={asset.id} className="p-2 border border-gray-600 rounded">
            <h3>{asset.name}</h3>
            <p>From: {asset.sourceApp}</p>
            <button className="mt-2 bg-primary px-2 py-1 rounded">Import</button>
          </div>
        ))}
      </div>
    </div>
  );
};
