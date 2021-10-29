export async function setupAudioSyncDevices(container: HTMLElement, setSinkId: (deviceId: string) => Promise<any>) {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const audioDevices = devices.filter(device => device.kind === 'audiooutput');
  audioDevices.forEach(device => {
    const btn = document.createElement('button') as HTMLButtonElement;
    btn.innerHTML = device.label;
    container.appendChild(btn);
    btn.onclick = async () => {
      try {
        await setSinkId(device.deviceId);
        console.log('Successfully setSinkId');
      } catch (error) {
        console.warn('Failed to setSinkId: ', error);
      }
    }
  });
}
