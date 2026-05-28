import { useState } from 'react';
import { moodBand } from './mood';
import { useTrackedMood } from './lib/useTrackedMood';
import Header from './components/Header';
import PiquiStage from './components/PiquiStage';
import Tabs, { type TabId } from './components/Tabs';
import FeaturePanel from './components/FeaturePanel';
import Chat from './components/Chat';
import SettingsPanel from './components/SettingsPanel';
import ToastHost from './components/ToastHost';
import MoodDevControl from './components/MoodDevControl';

export default function App() {
  // mood: trackeado en local:mood-segments para alimentar el Wrapped.
  const [mood, setMood] = useTrackedMood(65);
  const [hunger, setHunger] = useState(40);
  const [tab, setTab] = useState<TabId>('actions');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const band = moodBand(mood);

  return (
    <div className="relative flex min-h-screen flex-col bg-canvas text-ink">
      <Header onSettings={() => setSettingsOpen(true)} />
      <main className="flex flex-1 flex-col gap-4 px-4 pb-4">
        <PiquiStage band={band} mood={mood} hunger={hunger} />
        <Tabs value={tab} onChange={setTab} />
        {tab === 'actions' ? (
          <FeaturePanel mood={mood} onOpenSettings={() => setSettingsOpen(true)} />
        ) : (
          <Chat mood={mood} hunger={hunger} onOpenSettings={() => setSettingsOpen(true)} />
        )}
      </main>
      {/* dev-only — borrar para producción */}
      <MoodDevControl mood={mood} hunger={hunger} onMood={setMood} onHunger={setHunger} />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ToastHost />
    </div>
  );
}
