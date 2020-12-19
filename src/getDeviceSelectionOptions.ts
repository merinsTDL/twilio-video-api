
export function getDevicesOfKind(deviceInfos: MediaDeviceInfo[], kind: string) {
  return deviceInfos.filter(function(deviceInfo) {
    return deviceInfo.kind === kind;
  });
}

export async function ensureMediaPermissions() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const shouldAskForMediaPermissions = devices.every(function (device) {
    return !(device.deviceId && device.label);
  });
  if (shouldAskForMediaPermissions) {
    return navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(function (mediaStream) {
      mediaStream.getTracks().forEach(function (track) {
        track.stop();
      });
    });
  }
}

export type DeviceSelectionOptions = {
  audioinput: MediaDeviceInfo[];
  audiooutput: MediaDeviceInfo[];
  videoinput: MediaDeviceInfo[];
};

export async function getDeviceSelectionOptions(): Promise<DeviceSelectionOptions> {
  // before calling enumerateDevices, get media permissions (.getUserMedia)
  // w/o media permissions, browsers do not return device Ids and/or labels.
  await ensureMediaPermissions();
  const deviceInfos = await navigator.mediaDevices.enumerateDevices();
  return {
    audioinput: getDevicesOfKind(deviceInfos, 'audioinput'),
    audiooutput: getDevicesOfKind(deviceInfos, 'audiooutput'),
    videoinput: getDevicesOfKind(deviceInfos, 'videoinput'),
  }
}
