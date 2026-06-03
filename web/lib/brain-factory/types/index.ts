// Types para Brain Factory

export type BrainDomain = 'nutrition' | 'training' | 'physiotherapy' | 'development';
export type BrainStatus = 'ready' | 'processing' | 'error' | 'syncing';
export type DocumentSource = 'user' | 'github' | 'skill' | 'conversation' | 'url';

export interface Brain {
  id: string;
  name: string;
  domain: BrainDomain;
  description: string;
  status: BrainStatus;
  totalDocuments: number;
  embeddingsCount: number;
  queryCount: number;
  successRate: number;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt?: Date;
  githubSource?: string; // URL del archivo en GitHub
  nextUpdate?: Date;
}

export interface BrainDocument {
  id: string;
  brainId: string;
  title: string;
  content: string;
  source: DocumentSource;
  sourceUrl?: string;
  sourcePath?: string; // Para archivos GitHub
  chunkCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrainQuery {
  id: string;
  brainId: string;
  query: string;
  response: string;
  retrievedDocuments: number;
  confidence: number;
  hasGap: boolean;
  gapDescription?: string;
  createdAt: Date;
}

export interface BrainEmbedding {
  id: string;
  brainId: string;
  documentId: string;
  chunkIndex: number;
  chunkText: string;
  embedding: number[];
}

export interface BrainConfig {
  autoSync?: boolean;
  syncInterval?: number; // minutos
  githubPath?: string;
  temperature?: number;
  topK?: number;
}

export interface BrainMetrics {
  brainId: string;
  totalQueries: number;
  queriesPerDay: number;
  successRate: number;
  averageConfidence: number;
  gapRate: number;
  totalDocuments: number;
  totalTokens: number;
  avgResponseTime: number;
  p95ResponseTime: number;
}

export interface GitHubSyncResult {
  status: 'success' | 'error';
  documentsAdded: number;
  documentsUpdated: number;
  documentsDeleted: number;
  timestamp: Date;
  error?: string;
}

export interface BrainResponse {
  text: string;
  domain: BrainDomain;
  confidence: number;
  relevantDocuments: {
    title: string;
    excerpt: string;
  }[];
  disclaimers?: string[];
  suggestedFollowUps?: string[];
  sourceMetadata: {
    documentsUsed: number;
    tokensUsed: number;
    responseTime: number;
  };
}
