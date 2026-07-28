import prisma from "@/lib/prisma";
import { ALLOCATION_STRATEGIES, DEFAULT_STRATEGY, type AllocationStrategy } from "@/lib/cloud/allocation-config";

export { ALLOCATION_STRATEGIES, DEFAULT_STRATEGY };
export type { AllocationStrategy };

export type AccountInput = {
  id: string;
  quotaTotal: number | string | null;
  quotaUsed: number | string | null;
};

type EnrichedAccount = {
  id: string;
  total: number;
  used: number;
  freeSpace: number;
  usedRatio: number;
};

function enrich(account: AccountInput): EnrichedAccount {
  const total = Number(account.quotaTotal || 0);
  const used = Number(account.quotaUsed || 0);
  return {
    id: account.id,
    total,
    used,
    freeSpace: Math.max(0, total - used),
    usedRatio: total > 0 ? used / total : 1,
  };
}

async function getActiveAccounts(userId: string): Promise<AccountInput[]> {
  const rows = await prisma.cloudAccount.findMany({
    where: { userId, provider: "google_drive", status: "active" },
    select: { id: true, quotaTotal: true, quotaUsed: true },
    orderBy: { createdAt: "asc" },
  });
  return rows;
}

function orderedByCustom(
  accounts: EnrichedAccount[],
  order: string[]
): EnrichedAccount[] {
  const byId = new Map(accounts.map((a) => [a.id, a]));
  const ordered: EnrichedAccount[] = [];
  order.forEach((id) => {
    if (byId.has(id)) {
      ordered.push(byId.get(id)!);
      byId.delete(id);
    }
  });
  // Append any accounts not present in the custom order
  byId.forEach((a) => ordered.push(a));
  return ordered;
}

function buildResult(selected: EnrichedAccount, all: EnrichedAccount[]) {
  const fallbackChain = all
    .filter((a) => a.id !== selected.id)
    .sort((a, b) => b.freeSpace - a.freeSpace);
  return { selected, fallbackChain };
}

export type AllocationResult = {
  selected: EnrichedAccount;
  fallbackChain: EnrichedAccount[];
};

/**
 * Pick the best Google Drive account for an upload based on the user's
 * allocation strategy.
 */
export async function selectBestAccount(
  userId: string,
  requiredBytes = 0
): Promise<AllocationResult> {
  const raw = await getActiveAccounts(userId);
  if (raw.length === 0) {
    throw new Error("Tidak ada akun Google Drive yang aktif");
  }

  const accounts = raw.map(enrich);
  const required = Number(requiredBytes) || 0;

  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: {
      allocationStrategy: true,
      allocationOrder: true,
      allocationRrCursor: true,
      allocationSwrrState: true,
    },
  });

  const strategy: AllocationStrategy =
    (settings?.allocationStrategy as AllocationStrategy) || DEFAULT_STRATEGY;
  const order: string[] = settings?.allocationOrder
    ? JSON.parse(settings.allocationOrder)
    : [];

  let selected: EnrichedAccount;
  let rrCursor = settings?.allocationRrCursor ?? 0;
  let swrrState: Record<string, number> = settings?.allocationSwrrState
    ? JSON.parse(settings.allocationSwrrState)
    : {};

  switch (strategy) {
    case "round_robin": {
      const count = accounts.length;
      const start = ((rrCursor % count) + count) % count;
      let chosen = -1;
      for (let step = 0; step < count; step++) {
        const idx = (start + step) % count;
        if (accounts[idx].freeSpace >= required) {
          chosen = idx;
          break;
        }
      }
      if (chosen === -1) chosen = start;
      rrCursor = (chosen + 1) % count;
      selected = accounts[chosen];
      break;
    }
    case "weighted_round_robin": {
      const eligible = accounts.filter((a) => a.freeSpace >= required);
      const pool = eligible.length ? eligible : accounts;
      const weights = pool.map((a) => Math.max(1, a.total || 1));
      const totalWeight = weights.reduce((s, w) => s + w, 0);
      let chosenIndex = 0;
      let maxCurrent = -Infinity;
      const current: Record<string, number> = {};
      pool.forEach((a, i) => {
        const prev = Number(swrrState[a.id]) || 0;
        const value = prev + weights[i];
        current[a.id] = value;
        if (value > maxCurrent) {
          maxCurrent = value;
          chosenIndex = i;
        }
      });
      current[pool[chosenIndex].id] -= totalWeight;
      swrrState = current;
      selected = pool[chosenIndex];
      break;
    }
    case "least_used": {
      const eligible = accounts.filter((a) => a.freeSpace >= required);
      const pool = eligible.length ? eligible : accounts;
      selected = [...pool].sort((a, b) => a.usedRatio - b.usedRatio)[0];
      break;
    }
    case "most_free": {
      selected = [...accounts].sort((a, b) => b.freeSpace - a.freeSpace)[0];
      break;
    }
    case "custom":
    default: {
      const ordered = orderedByCustom(accounts, order);
      selected =
        ordered.find((a) => a.freeSpace >= required) || ordered[0] || accounts[0];
      break;
    }
  }

  await prisma.userSettings.upsert({
    where: { userId },
    update: {
      allocationRrCursor: rrCursor,
      allocationSwrrState: JSON.stringify(swrrState),
    },
    create: {
      userId,
      allocationRrCursor: rrCursor,
      allocationSwrrState: JSON.stringify(swrrState),
    },
  });

  return buildResult(selected, accounts);
}
