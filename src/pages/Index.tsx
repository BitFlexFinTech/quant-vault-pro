import { useDerivWebSocket } from '@/hooks/useDerivWebSocket';
import { ControlSidebar } from '@/components/ControlSidebar';
import { TopMetrics } from '@/components/TopMetrics';
import { ProfitTimeline } from '@/components/ProfitTimeline';
import { AssetTable } from '@/components/AssetTable';
import { ActivePositions } from '@/components/ActivePositions';
import { AISignalCard } from '@/components/AISignalCard';
import { ActivityTerminal } from '@/components/ActivityTerminal';

const Index = () => {
  const {
    state,
    settings,
    setSettings,
    startTrading,
    stopTrading,
    panicClose,
  } = useDerivWebSocket();

  const winRate = state.winCount + state.lossCount > 0
    ? (state.winCount / (state.winCount + state.lossCount)) * 100
    : 0;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Left Sidebar - Controls */}
      <ControlSidebar
        settings={settings}
        onSettingsChange={setSettings}
        isRunning={state.isRunning}
        isConnected={state.isConnected}
        isAuthorized={state.isAuthorized}
        onStart={startTrading}
        onStop={stopTrading}
        onPanic={panicClose}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Metrics Bar */}
        <TopMetrics
          balance={state.balance}
          totalProfit={state.totalProfit}
          winRate={winRate}
          vaultBalance={state.vaultBalance}
          winStreak={state.winStreak}
        />

        {/* Center Workspace */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="grid h-full gap-4 lg:grid-cols-2">
            {/* Profit Timeline */}
            <ProfitTimeline data={state.profitTimeline} />
            
            {/* Asset Performance */}
            <AssetTable performance={state.assetPerformance} />
          </div>
        </main>

        {/* Footer - Active Positions + AI Signal */}
        <footer className="border-t border-border bg-card/50 p-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Active Positions */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground">Active Positions</h3>
              <ActivePositions positions={state.activePositions} />
            </div>
            
            {/* AI Signal */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground">Trading Signal</h3>
              <AISignalCard signal={state.currentSignal} />
            </div>
          </div>
        </footer>
      </div>

      {/* Right Panel - Activity Terminal */}
      <ActivityTerminal logs={state.logs} />
    </div>
  );
};

export default Index;
