import { useState } from 'react';
import { moodBand } from './mood';
import { usePiquiVitals } from './lib/usePiquiVitals';
import { usePiquiMischief } from './lib/usePiquiMischief';
import Header from './components/Header';
import PiquiStage from './components/PiquiStage';
import Tabs, { type TabId } from './components/Tabs';
import FeaturePanel from './components/FeaturePanel';
import Chat from './components/Chat';
import SettingsPanel from './components/SettingsPanel';
import ToastHost from './components/ToastHost';
import MoodDevControl from './components/MoodDevControl';

export default function App() {
  // Loop tamagotchi: mood+hunger persistentes con decay (alimenta el Wrapped vía bandas).
  const { mood, hunger, setMood, setHunger, feed, paused, setPaused } = usePiquiVitals();
  const [tab, setTab] = useState<TabId>('actions');
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Maldades cuando está enojado (cierra tabs / rickroll).
  usePiquiMischief(mood);

  const band = moodBand(mood);

  return (
    <div className="relative flex min-h-screen flex-col bg-canvas text-ink">
      <Header onSettings={() => setSettingsOpen(true)} />
      <main className="flex flex-1 flex-col gap-4 px-4 pb-4">
        <PiquiStage band={band} mood={mood} hunger={hunger} />
        <Tabs value={tab} onChange={setTab} />
        {tab === 'actions' ? (
          <FeaturePanel
            mood={mood}
            feed={feed}
            onOpenSettings={() => setSettingsOpen(true)}
            onPreguntadosComplete={() => setMood(100)}
          />
        ) : (
          <Chat mood={mood} hunger={hunger} onOpenSettings={() => setSettingsOpen(true)} />
        )}
      </main>
      {/* dev-only — borrar para producción */}
      <MoodDevControl
        mood={mood}
        hunger={hunger}
        onMood={setMood}
        onHunger={setHunger}
        paused={paused}
        onTogglePaused={() => setPaused(!paused)}
      />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ToastHost />
    </div>
  );
}
