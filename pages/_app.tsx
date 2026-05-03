import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { CartProvider } from '@/context/CartContext';
import Layout from '@/components/Layout';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CartProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </CartProvider>
  );
}