// mobile/src/services/notifications.ts
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  TriggerType,
  TimestampTrigger,
} from '@notifee/react-native';

let channelId: string | null = null;

export const Notifications = {
  async init() {
    await notifee.requestPermission();
    channelId = await notifee.createChannel({
      id: 'pfa_main',
      name: 'PersonalFinApp',
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      sound: 'default',
      vibration: true,
    });
    // Bill/EMI reminder channel
    await notifee.createChannel({
      id: 'pfa_reminders',
      name: 'Bill & EMI Reminders',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });
  },

  async send(title: string, body: string, channelIdOverride?: string) {
    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId: channelIdOverride || channelId || 'pfa_main',
        smallIcon: 'ic_notification',
        color: '#D4A843',
        pressAction: { id: 'default' },
      },
    });
  },

  async scheduleReminder(id: string, title: string, body: string, dueDate: string) {
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: new Date(dueDate).setHours(8, 0, 0, 0), // 8AM on due date
    };
    await notifee.createTriggerNotification(
      { id, title, body, android: { channelId: 'pfa_reminders', smallIcon: 'ic_notification', color: '#D4A843' } },
      trigger
    );
  },

  async cancelReminder(id: string) {
    await notifee.cancelNotification(id);
  },

  async checkAndFireReminders(reminders: any[]) {
    const today = new Date().toISOString().slice(0, 10);
    for (const r of reminders.filter(rem => rem.enabled)) {
      const days = Math.ceil((new Date(r.due_date).getTime() - Date.now()) / 864e5);
      if (days === 3) await this.send(`⚠️ Due in 3 days: ${r.title}`, r.amount > 0 ? `LKR ${Math.round(r.amount).toLocaleString()} due on ${r.due_date}` : 'Check your reminder');
      if (days === 1) await this.send(`🔴 Due Tomorrow: ${r.title}`, r.amount > 0 ? `LKR ${Math.round(r.amount).toLocaleString()} due tomorrow` : 'Due tomorrow!');
      if (days === 0) await this.send(`🚨 DUE TODAY: ${r.title}`, r.amount > 0 ? `LKR ${Math.round(r.amount).toLocaleString()} due today` : 'Due today!');
    }
  },
};
