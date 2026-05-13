import si from 'systeminformation';

export interface TelemetryData {
  cpu: {
    usage: number;
    load: number[];
    cores: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    active: number;
  };
  disk: {
    total: number;
    used: number;
    available: number;
    usePercent: number;
  };
  network: {
    interface: string;
    rx_sec: number;
    tx_sec: number;
  }[];
  os: {
    platform: string;
    distro: string;
    release: string;
    hostname: string;
    uptime: number;
  };
  processes: {
    all: number;
    running: number;
    blocked: number;
    sleeping: number;
  };
}

export async function getRuntimeTelemetry(): Promise<TelemetryData> {
  try {
    const [cpuLoad, cpuInfo, mem, fsSize, networkStats, osInfo, proc] = await Promise.all([
      si.currentLoad(),
      si.cpu(),
      si.mem(),
      si.fsSize(),
      si.networkStats(),
      si.osInfo(),
      si.processes()
    ]);

    // Calculate disk stats (sum of all physical drives or primary)
    const primaryFs = fsSize.find(f => f.mount === '/') || fsSize[0];

    return {
      cpu: {
        usage: cpuLoad.currentLoad,
        load: [cpuLoad.avgLoad, 0, 0], // avgLoad is often a single value or we can use loadavg
        cores: cpuInfo.cores,
        model: `${cpuInfo.manufacturer} ${cpuInfo.brand}`
      },
      memory: {
        total: mem.total,
        used: mem.used,
        free: mem.free,
        active: mem.active
      },
      disk: {
        total: primaryFs?.size || 0,
        used: primaryFs?.used || 0,
        available: primaryFs?.available || 0,
        usePercent: primaryFs?.use || 0
      },
      network: networkStats.map(net => ({
        interface: net.iface,
        rx_sec: net.rx_sec,
        tx_sec: net.tx_sec
      })),
      os: {
        platform: osInfo.platform,
        distro: osInfo.distro,
        release: osInfo.release,
        hostname: osInfo.hostname,
        uptime: si.time().uptime
      },
      processes: {
        all: proc.all,
        running: proc.running,
        blocked: proc.blocked,
        sleeping: proc.sleeping
      }
    };
  } catch (error) {
    console.error('Error fetching system telemetry:', error);
    throw error;
  }
}
