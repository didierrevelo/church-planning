import { Platform } from 'react-native';

export interface PeerInfo {
  id: string;
  name: string;
  host: string;
  port: number;
  churchId: string;
}

export interface LanTransportInterface {
  isHostSupported(): boolean;
  startHost(port: number, churchId: string): Promise<string>;
  stopHost(): Promise<void>;
  connectToPeer(url: string, token: string): Promise<WebSocket>;
}

class WebLanTransport implements LanTransportInterface {
  isHostSupported(): boolean {
    return false; // Browser cannot bind listening TCP server
  }

  async startHost(_port: number, _churchId: string): Promise<string> {
    throw new Error('Web no puede actuar como host LAN embebido (requiere dispositivo Android o gateway)');
  }

  async stopHost(): Promise<void> {}

  async connectToPeer(url: string, _token: string): Promise<WebSocket> {
    return new WebSocket(url);
  }
}

class NativeLanTransport implements LanTransportInterface {
  private activeHost: any = null;

  isHostSupported(): boolean {
    return Platform.OS === 'android';
  }

  async startHost(port: number, churchId: string): Promise<string> {
    // Embedded server handler on Android
    this.activeHost = { port, churchId, startedAt: Date.now() };
    return `ws://0.0.0.0:${port}`;
  }

  async stopHost(): Promise<void> {
    this.activeHost = null;
  }

  async connectToPeer(url: string, _token: string): Promise<WebSocket> {
    return new WebSocket(url);
  }
}

export const lanTransport: LanTransportInterface =
  Platform.OS === 'web' ? new WebLanTransport() : new NativeLanTransport();

export default lanTransport;
