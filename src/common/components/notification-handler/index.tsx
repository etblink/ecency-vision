import React, { Component } from 'react';
import { Global } from '../../store/global/types';
import { ActiveUser } from '../../store/active-user/types';
import { ToggleType, UI } from '../../store/ui/types';
import { Notifications } from '../../store/notifications/types';
import { NotificationsWebSocket } from '../../api/notifications-ws-api';
import { isSupported } from '@firebase/messaging';

interface Props {
  global: Global;
  activeUser: ActiveUser | null;
  ui: UI;
  notifications: Notifications;
  fetchNotifications: (since: string | null) => void;
  fetchUnreadNotificationCount: () => void;
  toggleUIProp: (what: ToggleType) => void;
  fetchNotificationsSettings: (username: string) => void;
}

export default class NotificationHandler extends Component<Props> {
  private nws = new NotificationsWebSocket();

  componentDidMount() {
    const {
      activeUser,
      notifications,
      fetchUnreadNotificationCount,
      fetchNotificationsSettings,
      fetchNotifications,
      global,
      toggleUIProp,
      ui
    } = this.props;

    isSupported().then(isSupported => {
      if (isSupported) {
        return;
      }

      this.nws
        .withActiveUser(activeUser)
        .withElectron(global.isElectron)
        .withSound(document.getElementById('notifications-audio') as HTMLAudioElement)
        .withCallbackOnMessage(() => {
          fetchUnreadNotificationCount();
          fetchNotifications(null);
        })
        .withToggleUi(toggleUIProp)
        .setHasUiNotifications(ui.notifications)
        .setHasNotifications(global.notifications)
        .connect();

    });

    if (activeUser) {
      fetchNotificationsSettings(activeUser!!.username);
    }
    if (activeUser && notifications.unreadFetchFlag) {
      fetchUnreadNotificationCount();
    }
  }

  componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<{}>, snapshot?: any) {
    const { activeUser, fetchUnreadNotificationCount, fetchNotificationsSettings } = this.props;
    if (!prevProps.activeUser && activeUser && activeUser.username) {
      this.nws.disconnect();
      isSupported().then(isSupported => {
        if (isSupported) {
          return;
        }
        this.nws.withActiveUser(activeUser).connect();
      });
      fetchUnreadNotificationCount();
    }

    if (activeUser?.username !== prevProps.activeUser?.username) {
      this.nws.disconnect();
      isSupported().then(isSupported => {
        if (isSupported) {
          return;
        }
        this.nws.withActiveUser(activeUser).connect();
      });

      if (activeUser) {
        fetchNotificationsSettings(activeUser!!.username);
        fetchUnreadNotificationCount();
      }
    }
  }

  render() {
    const notificationSound = this.props.global.isElectron ? "./img/notification.mp3" :  require("../../img/notification.mp3");
    return <audio id="notification-audio" autoPlay={false} src={notificationSound} muted={true} style={{display: 'none'}}/>;
  }
}
