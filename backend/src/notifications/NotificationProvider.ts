import { INotification } from "../models/Notification";
import { logger } from "../config/logger";

export interface NotificationProvider {
  send(notification: INotification): Promise<void>;
}

/** In-app notifications need no external delivery - they become visible the moment the row exists. */
class InAppProvider implements NotificationProvider {
  async send(): Promise<void> {
    // no-op: GET /api/notifications is the delivery mechanism
  }
}

/**
 * Placeholder provider for channels with no delivery integration configured
 * yet (push/email). Intentionally deferred external integrations - wiring
 * FCM/APNs or an email service later only requires implementing this
 * interface and swapping it in below, no controller/route changes.
 */
class UnconfiguredProvider implements NotificationProvider {
  constructor(private channel: string) {}
  async send(notification: INotification): Promise<void> {
    logger.warn(`No provider configured for channel "${this.channel}" - notification queued but not delivered`, {
      notificationId: notification._id.toString(),
    });
  }
}

const inApp = new InAppProvider();
const providers: Record<string, NotificationProvider> = {
  in_app: inApp,
  push: new UnconfiguredProvider("push"),
  email: new UnconfiguredProvider("email"),
};

export function getProvider(channel: string): NotificationProvider {
  return providers[channel] ?? inApp;
}
