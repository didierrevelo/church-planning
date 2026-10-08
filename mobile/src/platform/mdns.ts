import { Platform } from 'react-native';

export interface DiscoveredPeer {
  id: string;
  name: string;
  host: string;
  port: number;
  churchId: string;
  lastSeen: number;
}

export interface MdnsDiscoveryInterface {
  startDiscovery(onPeerFound: (peer: DiscoveredPeer) => void): Promise<void>;
  stopDiscovery(): Promise<void>;
  parseQrCode(payload: string): DiscoveredPeer | null;
  generateQrPayload(peer: DiscoveredPeer): string;
}

class WebMdnsDiscovery implements MdnsDiscoveryInterface {
  async startDiscovery(_onPeerFound: (peer: DiscoveredPeer) => void): Promise<void> {
    // Browsers cannot perform mDNS directly; manual IP/QR pairing is used
  }

  async stopDiscovery(): Promise<void> {}

  parseQrCode(payload: string): DiscoveredPeer | null {
    try {
      const data = JSON.parse(payload);
      if (data.host && data.port && data.churchId) {
        return {
          id: data.id || `${data.host}:${data.port}`,
          name: data.name || 'Dispositivo Remoto',
          host: data.host,
          port: Number(data.port),
          churchId: data.churchId,
          lastSeen: Date.now(),
        };
      }
    } catch {
      // Not JSON, check ws:// URL format
      const match = payload.match(/^ws:\/\/([^:]+):(\d+)\/?\?churchId=([^&]+)/);
      if (match) {
        return {
          id: `${match[1]}:${match[2]}`,
          name: 'Host LAN',
          host: match[1],
          port: parseInt(match[2], 10),
          churchId: match[3],
          lastSeen: Date.now(),
        };
      }
    }
    return null;
  }

  generateQrPayload(peer: DiscoveredPeer): string {
    return `ws://${peer.host}:${peer.port}?churchId=${peer.churchId}&id=${peer.id}`;
  }
}

class NativeMdnsDiscovery implements MdnsDiscoveryInterface {
  private discovering = false;

  async startDiscovery(onPeerFound: (peer: DiscoveredPeer) => void): Promise<void> {
    this.discovering = true;
    // Android NsdManager integration hook
  }

  async stopDiscovery(): Promise<void> {
    this.discovering = false;
  }

  parseQrCode(payload: string): DiscoveredPeer | null {
    return new WebMdnsDiscovery().parseQrCode(payload);
  }

  generateQrPayload(peer: DiscoveredPeer): string {
    return new WebMdnsDiscovery().generateQrPayload(peer);
  }
}

export const mdnsDiscovery: MdnsDiscoveryInterface =
  Platform.OS === 'web' ? new WebMdnsDiscovery() : new NativeMdnsDiscovery();

export default mdnsDiscovery;
