'use client';

import { MaturityIndex, MaturityIndexData } from '@/components/shared/MaturityIndex';

export default function TestMaturityPage() {
  // Blocca l'accesso in produzione
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold text-red-600">
          Development Page - Not available in production
        </h1>
      </div>
    );
  }
  // Dati di esempio per testare il componente
  const testData: MaturityIndexData = {
    otop: 45,
    ot: 25,
    ko: 15,
    new: 5,
    incomplete: 5,
    notOffTool: 5,
    trend: 'up',
    trendValue: 5.2,
    lastUpdated: new Date(),
  };

  const simpleData: MaturityIndexData = {
    otop: 60,
    ot: 30,
    ko: 10,
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Test Maturity Index Component</h1>
      
      {/* Test Extended Version */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Extended Version (Default)</h2>
        <MaturityIndex data={testData} />
      </div>

      {/* Test Compact Version */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Compact Version</h2>
        <div className="max-w-md">
          <MaturityIndex 
            data={testData} 
            variant="compact"
          />
        </div>
      </div>

      {/* Test Minimal Version - Badge Style */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Minimal Version - Badge Style</h2>
        <div className="space-y-2">
          <MaturityIndex 
        data={testData} 
        variant="minimal"
      />
      <br />
      <MaturityIndex 
        data={simpleData} 
        variant="minimal"
      />
      <br />
      <MaturityIndex 
        data={{ otop: 10, ot: 20, ko: 70 }} 
        variant="minimal"
          />
        </div>
      </div>

  {/* Test Minimal Version - Text Only */}
  <div>
    <h2 className="text-xl font-semibold mb-4">Minimal Version - Text Only</h2>
    <div className="space-y-2">
      <MaturityIndex 
        data={testData} 
        variant="minimal"
        hideTitle={true}
      />
      <br />
      <MaturityIndex 
        data={simpleData} 
        variant="minimal"
        hideTitle={true}
      />
    </div>
  </div>

      {/* Test Compact without labels */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Compact without Labels</h2>
        <div className="max-w-md">
          <MaturityIndex 
            data={simpleData} 
            variant="compact"
            showLabels={false}
            hideTitle={true}
          />
        </div>
      </div>

      {/* Test Different Data Scenarios */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Only OTOP/OT/KO Data</h2>
        <MaturityIndex 
          data={simpleData} 
          variant="extended"
          showTrend={false}
        />
      </div>
    </div>
  );
}