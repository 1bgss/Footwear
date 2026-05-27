import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { OrderStatus } from "@/context/AppContext";
import { SETTINGS_KEYS } from "@/utils/settings";

const ORDER_CHANNEL_ID = "order-updates";

type OrderNotificationStep = {
  status: Exclude<OrderStatus, "processing">;
  seconds: number;
  title: string;
  body: string;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function prepareOrderNotifications() {
  if (Platform.OS === "web") return false;

  const notificationPreference = await AsyncStorage.getItem(SETTINGS_KEYS.NOTIFICATIONS);
  if (notificationPreference === "false") return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(ORDER_CHANNEL_ID, {
      name: "Order Updates",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#00B4FF",
    });
  }

  const currentPermissions = await Notifications.getPermissionsAsync();
  if (currentPermissions.granted) return true;

  const requestedPermissions = await Notifications.requestPermissionsAsync();
  return requestedPermissions.granted;
}

export async function showOrderPlacedNotification(invoiceId: string) {
  const canNotify = await prepareOrderNotifications();
  if (!canNotify) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Order placed successfully",
      body: `Invoice ${invoiceId} is confirmed. We are preparing your shoes now.`,
      data: { invoiceId, status: "processing" },
    },
    trigger: null,
  });
}

export async function scheduleOrderStatusNotifications(
  orderId: string,
  invoiceId: string,
  onStatusDue?: (status: OrderStatus) => void
) {
  const canNotify = await prepareOrderNotifications();
  if (!canNotify) return;

  const steps: OrderNotificationStep[] = [
    {
      status: "shipped",
      seconds: 8,
      title: "Your order has shipped",
      body: `Invoice ${invoiceId} has left the Footwear hub.`,
    },
    {
      status: "out_for_delivery",
      seconds: 16,
      title: "Out for delivery",
      body: `Invoice ${invoiceId} is on the way to your address.`,
    },
    {
      status: "delivered",
      seconds: 24,
      title: "Delivered",
      body: `Invoice ${invoiceId} has arrived. Enjoy your new shoes!`,
    },
  ];

  await Promise.all(
    steps.map((step) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: step.title,
          body: step.body,
          data: { orderId, invoiceId, status: step.status },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: step.seconds,
          channelId: ORDER_CHANNEL_ID,
        },
      })
    )
  );

  if (onStatusDue) {
    steps.forEach((step) => {
      setTimeout(() => onStatusDue(step.status), step.seconds * 1000);
    });
  }
}
