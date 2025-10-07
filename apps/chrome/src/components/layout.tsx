import { Header } from './app-header';

interface LayoutProps extends React.PropsWithChildren {
  connectionStatus?:
    | 'connected'
    | 'connecting'
    | 'disconnected'
    | 'reconnecting';
  onDiscordRpcToggle?: (enabled: boolean) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  connectionStatus = 'disconnected',
  onDiscordRpcToggle,
}) => {
  return (
    <div className="w-[400px] min-h-[320px] bg-background text-foreground font-sans">
      <Header
        connectionStatus={connectionStatus}
        onDiscordRpcToggle={onDiscordRpcToggle}
      />
      <div className="px-6 pb-6">{children}</div>
    </div>
  );
};
