import { getCentralMemory } from './central-memory';

export interface DynamicAgent {
  id: string;
  name: string;
  description: string;
  skills: string[];
  priority: number; // 1 = highest priority
  available: boolean;
  enabled: boolean;
  costPerRun: number; // Estimated tokens
  createdAt: Date;
  dependencies?: string[];
  parallel?: boolean;
}

class AgentLoader {
  private centralMemory = getCentralMemory();
  private agentCache: Map<string, DynamicAgent[]> = new Map();
  private lastLoadTime: Map<string, number> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  async loadAllAgents(): Promise<DynamicAgent[]> {
    const now = Date.now();
    const lastLoad = this.lastLoadTime.get('all') || 0;

    // Return cached agents if still valid
    if (now - lastLoad < this.cacheTTL && this.agentCache.has('all')) {
      return this.agentCache.get('all') || [];
    }

    try {
      const agents = await this.centralMemory.getContext('agents:all');

      if (Array.isArray(agents)) {
        this.agentCache.set('all', agents);
        this.lastLoadTime.set('all', now);
        return agents;
      }

      console.warn('Invalid agents format from Central Memory');
      return [];
    } catch (error) {
      console.error('Error loading agents from Central Memory:', error);
      // Return fallback hardcoded agents
      return this.getFallbackAgents();
    }
  }

  async loadAgentsBySystem(systemType: number): Promise<DynamicAgent[]> {
    const allAgents = await this.loadAllAgents();

    // Filter agents appropriate for this system type
    const systemAgents = allAgents.filter((agent) => {
      // Basic filtering logic - can be customized
      const isEnabled = agent.enabled && agent.available;
      return isEnabled;
    });

    return systemAgents;
  }

  async loadAgentsByKeyword(keyword: string): Promise<DynamicAgent[]> {
    const allAgents = await this.loadAllAgents();

    const filtered = allAgents.filter((agent) => {
      const keywordLower = keyword.toLowerCase();
      return (
        agent.name.toLowerCase().includes(keywordLower) ||
        agent.description.toLowerCase().includes(keywordLower) ||
        agent.skills.some((s) => s.toLowerCase().includes(keywordLower))
      );
    });

    return filtered.sort((a, b) => a.priority - b.priority);
  }

  async getAgentById(agentId: string): Promise<DynamicAgent | null> {
    const allAgents = await this.loadAllAgents();
    return allAgents.find((a) => a.id === agentId) || null;
  }

  async createAgent(agent: DynamicAgent): Promise<void> {
    try {
      const agents = await this.loadAllAgents();
      agents.push(agent);

      // Update Central Memory
      await this.centralMemory.setContext('agents:all', agents);

      // Invalidate cache
      this.agentCache.delete('all');
      this.lastLoadTime.delete('all');

      console.log(`✅ Agent ${agent.id} created`);
    } catch (error) {
      console.error(`Error creating agent ${agent.id}:`, error);
      throw error;
    }
  }

  async updateAgent(agentId: string, updates: Partial<DynamicAgent>): Promise<void> {
    try {
      const agents = await this.loadAllAgents();
      const index = agents.findIndex((a) => a.id === agentId);

      if (index === -1) {
        throw new Error(`Agent ${agentId} not found`);
      }

      agents[index] = { ...agents[index], ...updates };

      // Update Central Memory
      await this.centralMemory.setContext('agents:all', agents);

      // Invalidate cache
      this.agentCache.delete('all');
      this.lastLoadTime.delete('all');

      console.log(`✅ Agent ${agentId} updated`);
    } catch (error) {
      console.error(`Error updating agent ${agentId}:`, error);
      throw error;
    }
  }

  async disableAgent(agentId: string): Promise<void> {
    await this.updateAgent(agentId, { enabled: false });
  }

  async enableAgent(agentId: string): Promise<void> {
    await this.updateAgent(agentId, { enabled: true });
  }

  private getFallbackAgents(): DynamicAgent[] {
    // Fallback hardcoded agents if Central Memory is unavailable
    return [
      {
        id: 'spec-organizer',
        name: 'Specification Organizer',
        description: 'Deduplica y jerarquiza objetivos dinámicamente',
        skills: ['agent-specification', 'agent-architecture', 'goal-planner'],
        priority: 1,
        available: true,
        enabled: true,
        costPerRun: 2000,
        createdAt: new Date(),
        dependencies: [],
        parallel: false,
      },
      {
        id: 'spec-analyzer',
        name: 'Specification Analyzer',
        description: 'Analiza input del usuario y crea especificación',
        skills: ['agent-specification', 'agent-arch-system-design', 'gpt-taste'],
        priority: 1,
        available: true,
        enabled: true,
        costPerRun: 2000,
        createdAt: new Date(),
        dependencies: ['spec-organizer'],
        parallel: false,
      },
      {
        id: 'design-intel',
        name: 'Design Intelligence',
        description: 'Evalúa y mejora diseño visual y UX',
        skills: ['design-taste-frontend', 'high-end-visual-design', 'ui-ux-pro-max'],
        priority: 1,
        available: true,
        enabled: true,
        costPerRun: 2500,
        createdAt: new Date(),
        dependencies: ['spec-analyzer'],
        parallel: true,
      },
      {
        id: 'asset-gen',
        name: 'Asset Generator',
        description: 'Genera imágenes, iconos y assets visuales',
        skills: ['imagegen-frontend-web', 'imagegen-frontend-mobile'],
        priority: 2,
        available: true,
        enabled: true,
        costPerRun: 3000,
        createdAt: new Date(),
        dependencies: ['design-intel'],
        parallel: true,
      },
      {
        id: 'frontend-dev',
        name: 'Frontend Developer',
        description: 'Desarrolla componentes React y UI',
        skills: ['cult-ui', 'image-to-code', 'ckm-ui-styling'],
        priority: 1,
        available: true,
        enabled: true,
        costPerRun: 2500,
        createdAt: new Date(),
        dependencies: ['design-intel', 'asset-gen'],
        parallel: false,
      },
      {
        id: 'backend-arch',
        name: 'Backend Architect',
        description: 'Diseña API y estructura backend',
        skills: ['agent-dev-backend-api', 'agent-integration'],
        priority: 2,
        available: true,
        enabled: true,
        costPerRun: 2000,
        createdAt: new Date(),
        dependencies: ['spec-analyzer'],
        parallel: true,
      },
    ];
  }

  clearCache(): void {
    this.agentCache.clear();
    this.lastLoadTime.clear();
  }
}

// Singleton
let instance: AgentLoader | null = null;

export function getAgentLoader(): AgentLoader {
  if (!instance) {
    instance = new AgentLoader();
  }
  return instance;
}
