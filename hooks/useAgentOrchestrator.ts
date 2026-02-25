import { useState, useCallback, useRef } from 'react';
import { AgentType, AgentTask, ProjectContext, GeneratedAsset } from '../types/agent.types';
import { routeToAgent, executeAgentTask, getAgentInfo, detectPipeline, executePipeline, PIPELINES } from '../services/agents';
import { ChatMessage, CanvasElement } from '../types';
import { assetsToCanvasElementsAtCenter } from '../utils/canvas-helpers';


interface AgentMessage extends ChatMessage {
  agentId?: AgentType;
  taskId?: string;
  assets?: GeneratedAsset[];
}

interface CanvasState {
  elements: CanvasElement[];
  pan: { x: number; y: number };
  zoom: number;
  showAssistant: boolean;
}

interface UseAgentOrchestratorOptions {
  projectContext: ProjectContext;
  canvasState?: CanvasState;
  onElementsUpdate?: (elements: CanvasElement[]) => void;
  onHistorySave?: (elements: CanvasElement[], markers: any[]) => void;
  autoAddToCanvas?: boolean;
}

/**
 * 增强版智能体编排Hook
 * 
 * 新功能:
 * - 自动将生成的资产添加到画布
 * - 智能居中放置
 * - 完整的生命周期管理
 * - 错误处理和重试
 * 
 * @example
 * const { processMessage, currentTask } = useAgentOrchestrator({
 *   projectContext,
 *   canvasState: { elements, pan, zoom, showAssistant },
 *   onElementsUpdate: setElements,
 *   onHistorySave: saveToHistory,
 *   autoAddToCanvas: true
 * });
 */
export function useAgentOrchestrator(options: UseAgentOrchestratorOptions) {
  const {
    projectContext,
    canvasState,
    onElementsUpdate,
    onHistorySave,
    autoAddToCanvas = true
  } = options;

  const [currentTask, setCurrentTask] = useState<AgentTask | null>(null);
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const conversationHistory = useRef<ChatMessage[]>([]);
  const messageQueue = useRef<Array<{ message: string; attachments?: File[] }>>([]);

  /**
   * 自动添加资产到画布
   */
  const addAssetsToCanvas = useCallback((assets: GeneratedAsset[]) => {
    if (!canvasState || !onElementsUpdate || !autoAddToCanvas) {
      console.log('[useAgentOrchestrator] Canvas integration disabled or not configured');
      return;
    }

    try {
      const containerW = window.innerWidth - (canvasState.showAssistant ? 400 : 0);
      const containerH = window.innerHeight;

      console.log('[useAgentOrchestrator] Adding', assets.length, 'assets to canvas');

      const newElements = assetsToCanvasElementsAtCenter(
        assets,
        containerW,
        containerH,
        canvasState.pan,
        canvasState.zoom,
        canvasState.elements.length
      );

      console.log('[useAgentOrchestrator] Created', newElements.length, 'canvas elements');

      const updatedElements = [...canvasState.elements, ...newElements];
      onElementsUpdate(updatedElements);

      // 保存到历史
      if (onHistorySave) {
        onHistorySave(updatedElements, []);
      }

      console.log('[useAgentOrchestrator] Canvas updated successfully');
    } catch (error) {
      console.error('[useAgentOrchestrator] Failed to add assets to canvas:', error);
    }
  }, [canvasState, onElementsUpdate, onHistorySave, autoAddToCanvas]);

  /**
   * 处理用户消息并执行智能体任务
   * 消息必达：任何用户输入都会被处理，不会被静默丢弃
   */
  const processMessage = useCallback(async (
    message: string,
    attachments?: File[],
    metadata?: Record<string, any>
  ): Promise<AgentTask | null> => {
    if (!message.trim()) return null;

    // 如果正在处理，将消息加入队列
    if (isProcessing) {
      messageQueue.current.push({ message, attachments });
      console.log('[useAgentOrchestrator] Message queued, queue size:', messageQueue.current.length);
      return null;
    }

    setIsProcessing(true);

    try {
      console.log('[useAgentOrchestrator] Processing message:', message.substring(0, 50));

      // Update context with current conversation
      const updatedContext = {
        ...projectContext,
        conversationHistory: conversationHistory.current
      };

      // Pipeline 检测：多智能体串联任务优先处理
      const pipelineId = detectPipeline(message);
      if (pipelineId && PIPELINES[pipelineId]) {
        const pipeline = PIPELINES[pipelineId];
        console.log('[useAgentOrchestrator] Pipeline detected:', pipeline.name);

        setCurrentTask({
          id: `pipeline-${Date.now()}`,
          agentId: pipeline.steps[0].agentId,
          status: 'analyzing',
          input: { message, context: updatedContext },
          createdAt: Date.now(),
          updatedAt: Date.now()
        });

        const pipelineResult = await executePipeline(pipeline, message, updatedContext, (stepIdx, stepResult) => {
          console.log(`[useAgentOrchestrator] Pipeline step ${stepIdx} done:`, stepResult.status);
          setCurrentTask(stepResult);
        });

        // 自动添加所有 Pipeline 生成的资产到画布
        if (pipelineResult.allAssets.length > 0) {
          addAssetsToCanvas(pipelineResult.allAssets);
        }

        const lastStep = pipelineResult.steps[pipelineResult.steps.length - 1];
        // 合并所有步骤的资产到最终结果
        if (lastStep && lastStep.output) {
          lastStep.output.assets = pipelineResult.allAssets;
        }
        setCurrentTask(lastStep || null);

        conversationHistory.current.push(
          { id: `msg-${Date.now()}`, role: 'user', text: message, timestamp: Date.now() },
          { id: `msg-${Date.now() + 1}`, role: 'model', text: lastStep?.output?.message || `${pipeline.name}完成`, timestamp: Date.now() }
        );

        return lastStep || null;
      }

      // 单智能体路由
      console.log('[useAgentOrchestrator] Routing to agent...');
      let decision = await routeToAgent(message, updatedContext);

      // 兜底：routeToAgent 内部已包含 localPreRoute，这里只做最终 poster fallback
      if (!decision) {
        console.warn('[useAgentOrchestrator] All routing failed, using poster fallback');
        decision = {
          targetAgent: 'poster' as AgentType,
          taskType: 'fallback',
          complexity: 'simple' as const,
          handoffMessage: `用户请求: ${message}`,
          confidence: 0.4
        };
      }

      console.log('[useAgentOrchestrator] Routed to:', decision.targetAgent);

      // Create task
      const task: AgentTask = {
        id: `task-${Date.now()}`,
        agentId: decision.targetAgent,
        status: 'pending',
        input: {
          message,
          attachments,
          context: updatedContext
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      setCurrentTask({ ...task, status: 'analyzing' });

      // Execute task — 先短暂显示"分析中"，然后切换到"生成中"
      console.log('[useAgentOrchestrator] Executing task...');

      // 200ms 后自动切换到 executing 状态（路由已完成，接下来是图片生成）
      const executingTimer = setTimeout(() => {
        setCurrentTask(prev => prev && prev.status === 'analyzing'
          ? { ...prev, status: 'executing' }
          : prev
        );
      }, 200);

      const result = await executeAgentTask(task);
      clearTimeout(executingTimer);
      console.log('[useAgentOrchestrator] Task result:', result.status);
      console.log('[useAgentOrchestrator] Has assets:', !!result.output?.assets);
      console.log('[useAgentOrchestrator] Has proposals:', !!result.output?.proposals);

      // 自动添加生成的资产到画布
      if (result.output?.assets && result.output.assets.length > 0) {
        console.log('[useAgentOrchestrator] Auto-adding assets to canvas...');
        addAssetsToCanvas(result.output.assets);
      }

      setCurrentTask(result);

      // Update conversation history
      conversationHistory.current.push({
        id: `msg-${Date.now()}`,
        role: 'user',
        text: message,
        timestamp: Date.now()
      });

      if (result.output?.message) {
        conversationHistory.current.push({
          id: `msg-${Date.now() + 1}`,
          role: 'model',
          text: result.output.message,
          timestamp: Date.now()
        });
      }

      return result;
    } catch (error) {
      console.error('[useAgentOrchestrator] Error:', error);
      // 错误时也要设置一个失败任务，而不是静默丢弃
      const errorTask: AgentTask = {
        id: `task-${Date.now()}`,
        agentId: 'coco' as AgentType,
        status: 'failed',
        input: { message, context: projectContext },
        output: {
          message: error instanceof Error
            ? `处理请求时遇到问题: ${error.message}。请稍后重试。`
            : '处理请求时遇到问题，请稍后重试。'
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setCurrentTask(errorTask);
      return errorTask;
    } finally {
      setIsProcessing(false);

      // 处理队列中的下一条消息
      if (messageQueue.current.length > 0) {
        const next = messageQueue.current.shift()!;
        // 使用 setTimeout 避免同步递归
        setTimeout(() => {
          processMessage(next.message, next.attachments);
        }, 300);
      }
    }
  }, [projectContext, addAssetsToCanvas, isProcessing]);

  /**
   * 执行选中的Proposal
   */
  const executeProposal = useCallback(async (proposalId: string): Promise<void> => {
    if (!currentTask || !currentTask.output?.proposals) {
      console.error('[useAgentOrchestrator] No current task or proposals');
      return;
    }

    const proposal = currentTask.output.proposals.find(p => p.id === proposalId);
    if (!proposal) {
      console.error('[useAgentOrchestrator] Proposal not found:', proposalId);
      return;
    }

    try {
      console.log('[useAgentOrchestrator] Executing proposal:', proposal.title);

      setCurrentTask(prev => prev ? { ...prev, status: 'executing' } : null);

      const task: AgentTask = {
        id: `task-${Date.now()}`,
        agentId: currentTask.agentId,
        status: 'executing',
        input: {
          message: `Execute proposal: ${proposal.title}`,
          context: projectContext
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const result = await executeAgentTask(task);
      console.log('[useAgentOrchestrator] Proposal execution result:', result.status);

      // 自动添加生成的资产到画布
      if (result.output?.assets && result.output.assets.length > 0) {
        console.log('[useAgentOrchestrator] Auto-adding proposal assets to canvas...');
        addAssetsToCanvas(result.output.assets);
      }

      setCurrentTask(result);
    } catch (error) {
      console.error('[useAgentOrchestrator] Proposal execution error:', error);
      setCurrentTask(prev => prev ? { ...prev, status: 'failed' } : null);
      throw error;
    }
  }, [currentTask, projectContext, addAssetsToCanvas]);

  const resetAgent = useCallback(() => {
    setCurrentTask(null);
    conversationHistory.current = [];
  }, []);

  return {
    currentTask,
    isAgentMode,
    setIsAgentMode,
    isProcessing,
    processMessage,
    executeProposal,
    addAssetsToCanvas,
    resetAgent,
    messages
  };
}
