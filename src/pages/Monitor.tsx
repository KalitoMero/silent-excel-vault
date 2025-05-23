
import { ElectronInfo } from '@/components/ElectronInfo';

// Define the OrderEntry interface and export it
export interface OrderEntry {
  auftragsnummer: string;
  prioritaet: 1 | 2;
  zeitstempel: Date;
  zusatzDaten: Record<string, any>;
}

const Monitor = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Monitor</h1>
      <ElectronInfo />
    </div>
  );
};

export default Monitor;
