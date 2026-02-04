/**
 * Distributed AI Framework - Task Queue with Spare Capacity Usage
 * Manages analysis tasks and utilizes idle processing power
 */

import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import {
  AnalysisTask,
  TaskQueue,
  WorkerStatus,
  IssueAnalysis,
  Argument,
  FrameworkConfig,
} from './types';
import { AIClient } from './ai-client';
import { AnalysisGenerator } from './analysis-generator';
import { PageGenerator } from './page-generator';

export class DistributedTaskQueue extends EventEmitter {
  private queue: AnalysisTask[] = [];
  private completedTasks: AnalysisTask[] = [];
  private workers: Map<string, WorkerStatus> = new Map();
  private config: FrameworkConfig;
  private aiClient: AIClient;
  private analysisGenerator: AnalysisGenerator;
  private pageGenerator: PageGenerator;
  private isRunning: boolean = false;
  private workerId: string;
  private monitorInterval?: NodeJS.Timeout;
  private processInterval?: NodeJS.Timeout;
  private persistPath: string;

  constructor(
    config: FrameworkConfig,
    aiClient: AIClient,
    analysisGenerator: AnalysisGenerator,
    pageGenerator: PageGenerator
  ) {
    super();
    this.config = config;
    this.aiClient = aiClient;
    this.analysisGenerator = analysisGenerator;
    this.pageGenerator = pageGenerator;
    this.workerId = `worker-${os.hostname()}-${process.pid}`;
    this.persistPath = path.join(config.output.outputDir, '.task-queue.json');

    // Initialize this worker
    this.workers.set(this.workerId, {
      id: this.workerId,
      status: 'idle',
      completedCount: 0,
      lastHeartbeat: new Date(),
      systemInfo: this.getSystemInfo(),
    });
  }

  /**
   * Start the task queue processing
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log(`[TaskQueue] Starting worker: ${this.workerId}`);

    // Load persisted state
    this.loadState();

    // Start resource monitoring
    this.monitorInterval = setInterval(() => this.updateSystemInfo(), 5000);

    // Start task processing loop
    this.processInterval = setInterval(() => this.processNextTask(), 1000);

    this.emit('started', this.workerId);
  }

  /**
   * Stop the task queue processing
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    console.log(`[TaskQueue] Stopping worker: ${this.workerId}`);

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
    if (this.processInterval) {
      clearInterval(this.processInterval);
    }

    // Save state before stopping
    this.saveState();

    this.emit('stopped', this.workerId);
  }

  /**
   * Add a new analysis task to the queue
   */
  addTask(task: Omit<AnalysisTask, 'id' | 'status' | 'createdAt'>): string {
    const newTask: AnalysisTask = {
      ...task,
      id: this.generateTaskId(),
      status: 'pending',
      createdAt: new Date(),
    };

    // Insert based on priority (higher priority first)
    const insertIndex = this.queue.findIndex(t => t.priority < newTask.priority);
    if (insertIndex === -1) {
      this.queue.push(newTask);
    } else {
      this.queue.splice(insertIndex, 0, newTask);
    }

    console.log(`[TaskQueue] Added task: ${newTask.id} (priority: ${newTask.priority})`);
    this.emit('taskAdded', newTask);
    this.saveState();

    return newTask.id;
  }

  /**
   * Add a full analysis task for a thesis
   */
  addAnalysisTask(thesis: string, priority: number = 5): string {
    return this.addTask({
      type: 'full_analysis',
      input: { thesis },
      priority,
    });
  }

  /**
   * Add an argument expansion task
   */
  addExpansionTask(
    argument: Argument,
    parentAnalysisId: string,
    depth: number,
    priority: number = 3
  ): string {
    return this.addTask({
      type: 'argument_expansion',
      input: {
        argument,
        parentAnalysisId,
        depth,
        maxDepth: this.config.analysis.maxDepth,
      },
      priority,
    });
  }

  /**
   * Process the next task in the queue
   */
  private async processNextTask(): Promise<void> {
    if (!this.isRunning) return;

    // Check if we should process based on system resources
    if (!this.hasSpareCapacity()) {
      return;
    }

    // Get next pending task
    const task = this.queue.find(t => t.status === 'pending');
    if (!task) return;

    // Check if already processing max concurrent tasks
    const processingCount = this.queue.filter(t => t.status === 'processing').length;
    if (processingCount >= this.config.queue.maxConcurrentTasks) {
      return;
    }

    // Start processing
    task.status = 'processing';
    task.startedAt = new Date();
    task.workerId = this.workerId;

    const worker = this.workers.get(this.workerId);
    if (worker) {
      worker.status = 'processing';
      worker.currentTaskId = task.id;
    }

    console.log(`[TaskQueue] Processing task: ${task.id} (${task.type})`);
    this.emit('taskStarted', task);

    try {
      // Process based on task type
      let result: IssueAnalysis | Argument | undefined;

      switch (task.type) {
        case 'full_analysis':
          if (task.input.thesis) {
            result = await this.analysisGenerator.generateFullAnalysis(task.input.thesis);

            // Generate pages for the analysis
            if (result) {
              await this.pageGenerator.generateAllPages(result as IssueAnalysis);

              // Queue expansion tasks for high-scoring arguments
              this.queueArgumentExpansions(result as IssueAnalysis, task.id);
            }
          }
          break;

        case 'argument_expansion':
          if (task.input.argument && task.input.parentAnalysisId) {
            const expandedAnalysis = await this.analysisGenerator.expandArgument(
              task.input.argument,
              '', // Parent thesis not needed here
              task.input.depth || 0
            );
            if (expandedAnalysis) {
              result = expandedAnalysis;
              await this.pageGenerator.generatePage(expandedAnalysis);
            }
          }
          break;

        case 'evidence_research':
          // Future: implement evidence research task
          break;

        case 'sub_argument_analysis':
          // Future: implement sub-argument analysis task
          break;
      }

      // Mark task as completed
      task.status = 'completed';
      task.completedAt = new Date();
      task.result = result;

      // Move to completed list
      this.queue = this.queue.filter(t => t.id !== task.id);
      this.completedTasks.push(task);

      if (worker) {
        worker.status = 'idle';
        worker.currentTaskId = undefined;
        worker.completedCount++;
      }

      console.log(`[TaskQueue] Completed task: ${task.id}`);
      this.emit('taskCompleted', task);

    } catch (error) {
      // Handle failure
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
      task.completedAt = new Date();

      if (worker) {
        worker.status = 'idle';
        worker.currentTaskId = undefined;
      }

      console.error(`[TaskQueue] Task failed: ${task.id}`, task.error);
      this.emit('taskFailed', task);

      // Retry if under max attempts
      const retryCount = (task as unknown as { retryCount?: number }).retryCount || 0;
      if (retryCount < this.config.queue.retryAttempts) {
        console.log(`[TaskQueue] Retrying task: ${task.id} (attempt ${retryCount + 1})`);
        task.status = 'pending';
        (task as unknown as { retryCount: number }).retryCount = retryCount + 1;
      }
    }

    this.saveState();
  }

  /**
   * Queue argument expansion tasks for a completed analysis
   */
  private queueArgumentExpansions(analysis: IssueAnalysis, parentTaskId: string): void {
    const depth = 1; // Arguments from main analysis are at depth 1

    // Queue pro arguments
    for (const arg of analysis.reasonsToAgree) {
      const score = arg.score.strengthening || 0;
      if (score >= this.config.analysis.minScoreForExpansion) {
        this.addExpansionTask(arg, analysis.id, depth, Math.floor(score / 20));
      }
    }

    // Queue con arguments
    for (const arg of analysis.reasonsToDisagree) {
      const score = Math.abs(arg.score.weakening || 0);
      if (score >= this.config.analysis.minScoreForExpansion) {
        this.addExpansionTask(arg, analysis.id, depth, Math.floor(score / 20));
      }
    }
  }

  /**
   * Check if system has spare processing capacity
   */
  private hasSpareCapacity(): boolean {
    const systemInfo = this.getSystemInfo();

    // Don't process if CPU usage is above 70%
    if (systemInfo.cpuUsage > 70) {
      return false;
    }

    // Don't process if memory usage is above 80%
    if (systemInfo.memoryUsage > 80) {
      return false;
    }

    return true;
  }

  /**
   * Get current system resource information
   */
  private getSystemInfo(): WorkerStatus['systemInfo'] {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    // Calculate CPU usage (simplified - based on load average)
    const loadAvg = os.loadavg()[0]; // 1 minute average
    const cpuUsage = Math.min(100, (loadAvg / cpus.length) * 100);

    // Calculate memory usage
    const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;

    return {
      platform: os.platform(),
      cpuUsage: Math.round(cpuUsage),
      memoryUsage: Math.round(memoryUsage),
      gpuAvailable: false, // Would need external library to detect
    };
  }

  /**
   * Update system info for this worker
   */
  private updateSystemInfo(): void {
    const worker = this.workers.get(this.workerId);
    if (worker) {
      worker.systemInfo = this.getSystemInfo();
      worker.lastHeartbeat = new Date();
    }
  }

  /**
   * Save queue state to disk
   */
  private saveState(): void {
    try {
      const state: TaskQueue = {
        tasks: this.queue,
        completedTasks: this.completedTasks.slice(-100), // Keep last 100
        workers: Array.from(this.workers.values()),
      };

      fs.mkdirSync(path.dirname(this.persistPath), { recursive: true });
      fs.writeFileSync(this.persistPath, JSON.stringify(state, null, 2));
    } catch (error) {
      console.warn('[TaskQueue] Failed to save state:', error);
    }
  }

  /**
   * Load queue state from disk
   */
  private loadState(): void {
    try {
      if (fs.existsSync(this.persistPath)) {
        const content = fs.readFileSync(this.persistPath, 'utf-8');
        const state: TaskQueue = JSON.parse(content);

        // Restore pending tasks only
        this.queue = state.tasks.filter(t => t.status === 'pending');

        // Reset any processing tasks to pending (they were interrupted)
        const processingTasks = state.tasks.filter(t => t.status === 'processing');
        for (const task of processingTasks) {
          task.status = 'pending';
          this.queue.push(task);
        }

        console.log(`[TaskQueue] Loaded ${this.queue.length} pending tasks from state`);
      }
    } catch (error) {
      console.warn('[TaskQueue] Failed to load state:', error);
    }
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get queue status
   */
  getStatus(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    workers: WorkerStatus[];
    systemInfo: WorkerStatus['systemInfo'];
  } {
    return {
      pending: this.queue.filter(t => t.status === 'pending').length,
      processing: this.queue.filter(t => t.status === 'processing').length,
      completed: this.completedTasks.filter(t => t.status === 'completed').length,
      failed: this.completedTasks.filter(t => t.status === 'failed').length,
      workers: Array.from(this.workers.values()),
      systemInfo: this.getSystemInfo(),
    };
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): AnalysisTask | undefined {
    return this.queue.find(t => t.id === taskId) ||
           this.completedTasks.find(t => t.id === taskId);
  }

  /**
   * Clear completed tasks
   */
  clearCompleted(): void {
    this.completedTasks = [];
    this.saveState();
  }

  /**
   * Cancel a pending task
   */
  cancelTask(taskId: string): boolean {
    const index = this.queue.findIndex(t => t.id === taskId && t.status === 'pending');
    if (index !== -1) {
      this.queue.splice(index, 1);
      console.log(`[TaskQueue] Cancelled task: ${taskId}`);
      this.emit('taskCancelled', taskId);
      this.saveState();
      return true;
    }
    return false;
  }

  /**
   * Wait for all tasks to complete
   */
  async waitForCompletion(timeoutMs?: number): Promise<void> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkComplete = () => {
        const pending = this.queue.filter(t =>
          t.status === 'pending' || t.status === 'processing'
        ).length;

        if (pending === 0) {
          resolve();
          return;
        }

        if (timeoutMs && Date.now() - startTime > timeoutMs) {
          reject(new Error('Timeout waiting for tasks to complete'));
          return;
        }

        setTimeout(checkComplete, 1000);
      };

      checkComplete();
    });
  }
}

/**
 * Background daemon for processing tasks using spare capacity
 */
export class BackgroundDaemon {
  private taskQueue: DistributedTaskQueue;
  private isRunning: boolean = false;
  private checkInterval?: NodeJS.Timeout;

  constructor(taskQueue: DistributedTaskQueue) {
    this.taskQueue = taskQueue;
  }

  /**
   * Start the background daemon
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('[BackgroundDaemon] Starting background processing daemon');

    // Start the task queue
    this.taskQueue.start();

    // Periodic status logging
    this.checkInterval = setInterval(() => {
      const status = this.taskQueue.getStatus();
      console.log(`[BackgroundDaemon] Status: ${status.pending} pending, ${status.processing} processing, ${status.completed} completed`);
      console.log(`[BackgroundDaemon] System: CPU ${status.systemInfo.cpuUsage}%, Memory ${status.systemInfo.memoryUsage}%`);
    }, 30000);
  }

  /**
   * Stop the background daemon
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    console.log('[BackgroundDaemon] Stopping background processing daemon');

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.taskQueue.stop();
  }

  /**
   * Check if daemon is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}
