import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { Notification, JSONRPC_VERSION } from '@modelcontextprotocol/sdk/types.js'

export class BroadcastableStdioServerTransport extends StdioServerTransport {
  public sendNotification(notification: Notification): Promise<void> {
    return super.send({ ...notification, jsonrpc: JSONRPC_VERSION })
  }
}
