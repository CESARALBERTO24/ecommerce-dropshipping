const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ecommerce-dropshipping-api.your-account.workers.dev';

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

export const api = {
  products: {
    list: async (params?: { category?: string; search?: string; limit?: number; offset?: number }) => {
      const query = new URLSearchParams();
      if (params?.category) query.set('category', params.category);
      if (params?.search) query.set('search', params.search);
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.offset) query.set('offset', String(params.offset));
      const queryString = query.toString();
      return fetchAPI<any[]>(`/api/products${queryString ? `?${queryString}` : ''}`);
    },

    get: async (id: string) => {
      return fetchAPI<any>(`/api/products/${id}`);
    },

    create: async (product: Partial<any>) => {
      return fetchAPI<any>('/api/products', {
        method: 'POST',
        body: JSON.stringify(product),
      });
    },

    update: async (id: string, product: Partial<any>) => {
      return fetchAPI<any>(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(product),
      });
    },

    delete: async (id: string) => {
      return fetchAPI<any>(`/api/products/${id}`, {
        method: 'DELETE',
      });
    },
  },

  suppliers: {
    list: async () => {
      return fetchAPI<any[]>('/api/suppliers');
    },

    get: async (id: string) => {
      return fetchAPI<any>(`/api/suppliers/${id}`);
    },
  },

  dropship: {
    sync: async (supplierId: string) => {
      return fetchAPI<any>('/api/dropship/sync', {
        method: 'POST',
        body: JSON.stringify({ supplier_id: supplierId }),
      });
    },

    createOrder: async (orderId: string) => {
      return fetchAPI<any>('/api/dropship/create-order', {
        method: 'POST',
        body: JSON.stringify({ order_id: orderId }),
      });
    },
  },

  health: async () => {
    return fetchAPI<{ status: string; timestamp: string }>('/api/health');
  },
};