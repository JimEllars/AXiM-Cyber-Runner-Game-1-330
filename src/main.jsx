import { StrictMode } from 'react';

import { WagmiProvider, createConfig, http, fallback } from 'wagmi';
import { arbitrum } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';


const queryClient = new QueryClient();

const config = createConfig({
  chains: [arbitrum],
  transports: {
    [arbitrum.id]: fallback([
      http('https://arbitrum.llamarpc.com'),
      http('https://rpc.ankr.com/arbitrum'),
      http('https://1rpc.io/arb')
    ])
  }
});
createRoot(document.getElementById('root')).render(
<StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
</StrictMode>
);