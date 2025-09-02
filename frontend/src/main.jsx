import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'
import { SubscriptionProvider } from './context/SubscriptionContext.jsx'
import { AIProvider } from './context/AIContext.jsx'
import { Toaster } from 'react-hot-toast'
import { NotificationManager } from './components/Notifications/NotificationToast.jsx'
// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <SubscriptionProvider>
                <AIProvider>
                  <SocketProvider>
                    <App />
                    <Toaster
                      position="top-right"
                      toastOptions={{
                        duration: 4000,
                        className: 'toast',
                        success: {
                          duration: 3000,
                          iconTheme: {
                            primary: '#10b981',
                            secondary: '#ffffff',
                          },
                        },
                        error: {
                          duration: 5000,
                          iconTheme: {
                            primary: '#ef4444',
                            secondary: '#ffffff',
                          },
                        },
                      }}
                    />
                    <NotificationManager />
                  </SocketProvider>
                </AIProvider>
              </SubscriptionProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
        </QueryClientProvider>
      </HelmetProvider>
  </StrictMode>,
)
