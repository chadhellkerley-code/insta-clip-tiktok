export interface Account {
  id: string
  username: string
  email: string | null
  password: string
  twoFaCode: string | null
  proxyIp: string | null
  proxyPort: string | null
  proxyUser: string | null
  proxyPass: string | null
  status: string
  lastLoginAt: Date | null
  createdAt: Date
}

export interface Lead {
  id: string
  tiktokUrl: string
  username: string
  displayName: string | null
  status: string
  accountId: string | null
  notes: string | null
  createdAt: Date
}

export interface Message {
  id: string
  content: string
  order: number
  active: boolean
}

export interface CampaignSetting {
  id: string
  workers: number
  browsersPerWorker: number
  minDelaySeconds: number
  maxDelaySeconds: number
  messagesPerAccount: number
  failureThreshold: number
}

export interface Campaign {
  id: string
  status: string
  startedAt: Date | null
  stoppedAt: Date | null
  totalSent: number
  totalFailed: number
  activeAccounts: number
  blockedAccounts: number
}

export interface MetricData {
  date: string
  sent: number
  failed: number
  contacted: number
  rejected: number
}
