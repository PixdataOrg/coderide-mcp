import { BroadcastableStdioServerTransport } from './stdio-transport.js'

const HEARTBEAT_INTERVAL = 30000 // 30 seconds

export class HeartbeatManager {
  private transports: Set<BroadcastableStdioServerTransport> = new Set()
  private intervalId: NodeJS.Timeout | null = null

  public add(transport: BroadcastableStdioServerTransport) {
    this.transports.add(transport)
    this.start()
  }

  public remove(transport: BroadcastableStdioServerTransport) {
    this.transports.delete(transport)
    if (this.transports.size === 0) {
      this.stop()
    }
  }

  private start() {
    if (this.intervalId === null) {
      this.intervalId = setInterval(() => this.sendHeartbeat(), HEARTBEAT_INTERVAL)
    }
  }

  private stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private sendHeartbeat() {
    for (const transport of this.transports) {
      transport.sendNotification({
        method: '$/heartbeat',
      })
    }
  }
}
