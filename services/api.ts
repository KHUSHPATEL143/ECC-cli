
import { APPS_SCRIPT_URL } from '../constants';
import { ApiResponse, FileUploadPayload, PortfolioItem, PortfolioHistoryPoint } from '../types';

// Generic fetch wrapper
async function fetchApi<T>(params: Record<string, string> | null, body: any = null): Promise<ApiResponse<T>> {
  try {
    let url = APPS_SCRIPT_URL;
    const options: RequestInit = {
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Apps Script requires text/plain often to avoid CORS preflight issues
      },
    };

    if (body) {
      options.method = 'POST';
      options.body = JSON.stringify(body);
    } else if (params) {
      options.method = 'GET';
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }

    const response = await fetch(url, options);
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error("API Error:", error);
    return {
      status: 'error',
      data: {} as T,
      message: error.message || 'Network error',
    };
  }
}

export const api = {
  signIn: (email: string, password: string) => 
    fetchApi<{ isAuthenticated: boolean; email: string; isAdmin: boolean }>(null, { action: 'signIn', email, password }),

  signUp: (data: { name: string; email: string; mobile: string; password: string }) =>
    fetchApi<{ message: string }>(null, { action: 'requestSignUp', ...data }),

  getDashboard: () => fetchApi<any>({ page: 'dashboard' }),
  
  getPortfolio: () => fetchApi<PortfolioItem[]>({ page: 'portfolio' }),
  
  getPortfolioHistory: () => fetchApi<{ labels: string[]; data: number[]; points: PortfolioHistoryPoint[] }>({ page: 'portfolioHistory' }),
  
  getMembers: () => fetchApi<any[]>({ page: 'members' }),
  
  getUserDetails: (email: string) => fetchApi<any>({ page: 'userDetails', email }),
  
  updateUserProfile: (email: string, name: string, mobile: string) =>
    fetchApi<{ message: string }>(null, { action: 'updateUserProfile', email, name, mobile }),

  getNotifications: (email: string) => fetchApi<any[]>({ page: 'getNotifications', email }),

  uploadFile: (payload: Omit<FileUploadPayload, 'action'>) => 
    fetchApi<{ message: string }>(null, { action: 'uploadFile', ...payload }),

  // Admin endpoints
  getAdminDashboard: (adminEmail: string) => fetchApi<any>({ page: 'adminDashboard', adminEmail }),
  
  getPendingUsers: (adminEmail: string) => fetchApi<any[]>({ page: 'getPendingUsers', adminEmail }),
  
  approveUser: (email: string, adminEmail: string) => 
    fetchApi<{ message: string }>(null, { action: 'approveUser', email, adminEmail }),
    
  rejectUser: (email: string, adminEmail: string) => 
    fetchApi<{ message: string }>(null, { action: 'rejectUser', email, adminEmail }),
    
  sendNotification: (message: string, targetEmail: string, adminEmail: string) =>
    fetchApi<{ message: string }>(null, { action: 'addNotification', message, targetEmail, adminEmail }),

  getNotificationsAdmin: (adminEmail: string) => 
    fetchApi<any[]>({ page: 'getNotificationsAdmin', adminEmail }),

  deleteNotification: (id: string, adminEmail: string) =>
    fetchApi<{ message: string }>(null, { action: 'deleteNotification', id, adminEmail }),

  // Admin Management Features
  addContribution: (userEmail: string, amount: number, date: string, notes: string, isMonthly: boolean, adminEmail: string) =>
    fetchApi<{ message: string }>(null, { action: 'addUserContribution', userEmail, amount, date, notes, isMonthly, adminEmail }),

  addHolding: (holding: Partial<PortfolioItem>, adminEmail: string) =>
    fetchApi<{ message: string }>(null, { action: 'addPortfolioHolding', holding, adminEmail }),

  updateHolding: (rowIndex: number, holding: Partial<PortfolioItem>, adminEmail: string) =>
    fetchApi<{ message: string }>(null, { action: 'updatePortfolioHolding', rowIndex, holding, adminEmail }),

  deleteHolding: (stockName: string, adminEmail: string) =>
    fetchApi<{ message: string }>(null, { action: 'deletePortfolioHolding', stockName, adminEmail }),

  addHistoryPoint: (date: string, value: number, adminEmail: string) =>
    fetchApi<{ message: string }>(null, { action: 'addPortfolioHistory', date, value, adminEmail }),

  updateHistoryPoint: (rowIndex: number, point: { date: string, value: number }, adminEmail: string) =>
    fetchApi<{ message: string }>(null, { action: 'updatePortfolioHistory', rowIndex, point, adminEmail }),
    
  deleteHistoryPoint: (rowIndex: number, adminEmail: string) =>
    fetchApi<{ message: string }>(null, { action: 'deletePortfolioHistory', rowIndex, adminEmail }),
};
