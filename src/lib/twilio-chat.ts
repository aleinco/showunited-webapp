'use client';

import { Client, Conversation, Message, Participant } from '@twilio/conversations';

let clientInstance: Client | null = null;
let currentIdentity: string | null = null;

export async function initTwilioClient(
  twilioToken: string,
  identity: string,
  onTokenExpiring: () => Promise<string>
): Promise<Client> {
  if (clientInstance && currentIdentity === identity) {
    return clientInstance;
  }

  if (clientInstance) {
    await clientInstance.shutdown();
    clientInstance = null;
  }

  const client = new Client(twilioToken);
  currentIdentity = identity;

  await new Promise<void>((resolve, reject) => {
    client.on('initialized', () => resolve());
    client.on('initFailed', ({ error }) =>
      reject(new Error(`Twilio init failed: ${error?.message}`))
    );
  });

  client.on('tokenAboutToExpire', async () => {
    try {
      const newToken = await onTokenExpiring();
      await client.updateToken(newToken);
    } catch (err) {
      console.error('Failed to refresh Twilio token:', err);
    }
  });

  client.on('tokenExpired', async () => {
    try {
      const newToken = await onTokenExpiring();
      await client.updateToken(newToken);
    } catch (err) {
      console.error('Failed to refresh expired Twilio token:', err);
    }
  });

  clientInstance = client;
  return client;
}

export function getTwilioClient(): Client | null {
  return clientInstance;
}

export async function shutdownTwilioClient(): Promise<void> {
  if (clientInstance) {
    await clientInstance.shutdown();
    clientInstance = null;
    currentIdentity = null;
  }
}

export type { Client, Conversation, Message, Participant };
