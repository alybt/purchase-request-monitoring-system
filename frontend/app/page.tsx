"use client";

import { useEffect, useState } from 'react';

export default function Home() {
  const [backendData, setBackendData] = useState<any>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/test-connection`)
      .then((res) => res.json())
      .then((data) => setBackendData(data))
      .catch((err) => console.error("Connection failed:", err));
  }, []);

  return (
    <div style={{ padding: '3rem', fontFamily: 'sans-serif' }}>
      <h1>Next.js Frontend</h1>
      {backendData ? (
        <div style={{ border: '1px solid green', padding: '1rem', marginTop: '1rem' }}>
          <h3 style={{ color: 'green' }}>{backendData.status}!</h3>
          <p>{backendData.message}</p>
        </div>
      ) : (
        <p>Attempting to reach Laravel backend...</p>
      )}
    </div>
  );
}