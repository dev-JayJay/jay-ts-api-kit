interface RouteMetrics {
  route: string;
  totalRequests: number;
  totalDurationMs: number;
  statusCodes: Record<number, number>;
}

type TelemetryStore = Map<string, RouteMetrics>;

class OpsTelemetry {
  private store: TelemetryStore = new Map();

  recordRequest(route: string, statusCode: number, durationMs: number): void {
    const existing = this.store.get(route);
    if (existing) {
      existing.totalRequests += 1;
      existing.totalDurationMs += durationMs;
      existing.statusCodes[statusCode] = (existing.statusCodes[statusCode] ?? 0) + 1;
    } else {
      this.store.set(route, {
        route,
        totalRequests: 1,
        totalDurationMs: durationMs,
        statusCodes: { [statusCode]: 1 },
      });
    }
  }

  snapshot(): RouteMetrics[] {
    return Array.from(this.store.values()).map((m) => ({
      ...m,
      avgDurationMs: m.totalRequests > 0 ? Math.round(m.totalDurationMs / m.totalRequests) : 0,
    }));
  }

  sloSnapshot(): Record<string, unknown> {
    const metrics = this.snapshot();
    const totalRequests = metrics.reduce((sum, m) => sum + m.totalRequests, 0);
    const errorRequests = metrics.reduce(
      (sum, m) => sum + Object.entries(m.statusCodes).reduce(
        (s, [code, count]) => s + (Number(code) >= 500 ? count : 0), 0
      ), 0
    );
    return {
      totalRequests,
      errorRate: totalRequests > 0 ? Number((errorRequests / totalRequests * 100).toFixed(2)) : 0,
      routes: metrics,
    };
  }

  alertCandidates(): Array<{ route: string; errorRate: number; totalRequests: number }> {
    const alerts: Array<{ route: string; errorRate: number; totalRequests: number }> = [];
    for (const m of this.store.values()) {
      const total = m.totalRequests;
      const errors = Object.entries(m.statusCodes).reduce(
        (s, [code, count]) => s + (Number(code) >= 500 ? count : 0), 0
      );
      const errorRate = total > 0 ? (errors / total) * 100 : 0;
      if (errorRate > 10 && total > 10) {
        alerts.push({ route: m.route, errorRate: Math.round(errorRate * 100) / 100, totalRequests: total });
      }
    }
    return alerts;
  }

  reset(): void {
    this.store.clear();
  }
}

export const opsTelemetry = new OpsTelemetry();
