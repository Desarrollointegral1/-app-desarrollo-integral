// Exportar todo desde brain-factory
export { BrainFactory, getBrainFactory } from './core/BrainFactory';
export { NotebookLMIntegration, getNotebookLM } from './core/NotebookLMIntegration';
export { SkillCapture, autoCaptureSkillOutput } from './core/SkillCapture';
export { Specialists, initializeSpecialists } from './core/Specialists';
export { GitHubSync, initializeGitHubSync, stopGitHubSync } from './github/sync';
export { initializeBrainFactory, syncBrainsNow, getBrainFactoryStatus } from './init';

export type {
  Brain,
  BrainDocument,
  BrainQuery,
  BrainDomain,
  BrainStatus,
  DocumentSource,
  BrainConfig,
  BrainMetrics,
  BrainResponse,
  GitHubSyncResult,
} from './types';

export type {
  SpecialistConfig,
} from './core/Specialists';
