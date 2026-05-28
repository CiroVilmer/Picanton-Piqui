import { useState } from 'react';
import { moodBand } from './mood';
import Header from './components/Header';
import PiquiStage from './components/PiquiStage';
import Tabs, { type TabId } from './components/Tabs';
import FeaturePanel from './components/FeaturePanel';
import Chat from './components/Chat';
import Footer from './components/Footer';
import ToastHost from './components/ToastHost';
import MoodDevControl from './components/MoodDevControl';

export default function App() {
  // Hardcoded placeholders (manifest §8.4) — esperando lógica real.
  const [mood, setMood] = useState(65);
  const [hunger, setHunger] = useState(40);
  const [tab, setTab] = useState<TabId>('actions');

  const band = moodBand(mood);

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <Header />
      <main className="flex flex-1 flex-col gap-4 px-4 pb-4">
        <PiquiStage band={band} mood={mood} hunger={hunger} />
        <Tabs value={tab} onChange={setTab} />
        {tab === 'actions' ? <FeaturePanel mood={mood} /> : <Chat />}
      </main>
      {/* dev-only — borrar para producción */}
      <MoodDevControl mood={mood} hunger={hunger} onMood={setMood} onHunger={setHunger} />
      <Footer />
      <ToastHost />
    </div>
  );
}
