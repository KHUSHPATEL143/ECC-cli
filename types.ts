
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
}

export interface User {
  email: string;
  isAuthenticated: boolean;
  isAdmin: boolean;
  name?: string;
}

export interface DashboardData {
  "Total Fund Value"?: number;
  "Total Return"?: number;
  "Return Percentage"?: string;
  "Invested in Stocks"?: number;
  "aiInsight"?: string;
  "expectedReturn"?: string;
}

export interface PortfolioItem {
  "Stock Name": string;
  "Company Name"?: string;
  "Ticker"?: string;
  "Type"?: string; // Added Type field
  "Shares": number;
  "Purchase Price": number;
  "Current Price": number | string; // Can be string/number depending on sheet state
  rowIndex?: number;
}

export interface Member {
  "Name": string;
  "Email": string;
  "Join Date": string;
  "Contribution": number;
  "Role"?: string;
}

export interface UserDetails {
  name: string;
  email: string;
  accountStatus: string;
  isAdmin: boolean;
  joinDate: string;
  totalContribution: number;
  lastContributionDate: string;
  lastContributionAmount: number;
  userTotalFundValue: number;
  userInvestedInStocks: number;
  userTotalReturn: number;
  userReturnPercentage: string;
  contributionHistory: ContributionHistoryItem[];
}

export interface ContributionHistoryItem {
  date: string;
  amount: number;
  status: string;
  notes: string;
  isMonthly: boolean;
}

export interface PortfolioHistoryPoint {
  date: string;
  value: number;
  rowIndex?: number;
}

export interface ProofItem {
  fileName: string;
  fileType: string;
  uploadDate: string;
  uploadedBy: string;
  fileUrl: string;
}

export interface Notification {
  id: string;
  message: string;
  targetEmail?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface PendingUser {
  Name: string;
  Email: string;
  Status: string;
}

export interface FileUploadPayload {
  action: 'uploadFile';
  fileName: string;
  fileType: string;
  mimeType: string;
  data: string; // Base64
  uploadedBy: string;
}
