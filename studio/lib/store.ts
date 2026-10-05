import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";

/**
 * Minimaler Dokumentenspeicher mit zwei Varianten:
 *  - Upstash Redis (für Vercel/gemeinsame Nutzung), wenn die REST-Variablen gesetzt sind
 *  - sonst JSON-Dateien im Ordner ./data (lokal, nicht im Git)
 */
export interface Store {
  readonly kind: "upstash" | "datei";
  list<T>(collection: string): Promise<T[]>;
  get<T>(collection: string, id: string): Promise<T | null>;
  put<T extends { id: string }>(collection: string, item: T): Promise<void>;
  remove(collection: string, id: string): Promise<void>;
}

class FileStore implements Store {
  readonly kind = "datei" as const;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private dir: string) {}

  private file(collection: string) {
    return path.join(this.dir, `${collection}.json`);
  }

  private async read<T>(collection: string): Promise<Record<string, T>> {
    try {
      const raw = await fs.readFile(this.file(collection), "utf8");
      return JSON.parse(raw) as Record<string, T>;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return {};
      throw err;
    }
  }

  private async write<T>(collection: string, data: Record<string, T>) {
    await fs.mkdir(this.dir, { recursive: true });
    const target = this.file(collection);
    const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await fs.rename(tmp, target);
  }

  /** Schreibzugriffe nacheinander ausführen, damit sich parallele Requests nicht überschreiben. */
  private serial<R>(fn: () => Promise<R>): Promise<R> {
    const next = this.queue.then(fn, fn);
    this.queue = next.catch(() => undefined);
    return next;
  }

  async list<T>(collection: string) {
    return Object.values(await this.read<T>(collection));
  }

  async get<T>(collection: string, id: string) {
    return (await this.read<T>(collection))[id] ?? null;
  }

  put<T extends { id: string }>(collection: string, item: T) {
    return this.serial(async () => {
      const data = await this.read<T>(collection);
      data[item.id] = item;
      await this.write(collection, data);
    });
  }

  remove(collection: string, id: string) {
    return this.serial(async () => {
      const data = await this.read<unknown>(collection);
      delete data[id];
      await this.write(collection, data);
    });
  }
}

class UpstashStore implements Store {
  readonly kind = "upstash" as const;
  constructor(private redis: Redis) {}

  private key(collection: string) {
    return `studio:${collection}`;
  }

  async list<T>(collection: string) {
    const all = await this.redis.hgetall<Record<string, T>>(this.key(collection));
    return all ? Object.values(all) : [];
  }

  async get<T>(collection: string, id: string) {
    return (await this.redis.hget<T>(this.key(collection), id)) ?? null;
  }

  async put<T extends { id: string }>(collection: string, item: T) {
    await this.redis.hset(this.key(collection), { [item.id]: item });
  }

  async remove(collection: string, id: string) {
    await this.redis.hdel(this.key(collection), id);
  }
}

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

function dataDir() {
  // Auf Vercel ist nur /tmp beschreibbar – und flüchtig. Darum dort Upstash verwenden.
  if (process.env.VERCEL) return "/tmp/sichtwerk-studio";
  return path.join(process.cwd(), "data");
}

let store: Store | null = null;

export function getStore(): Store {
  if (!store) {
    const cfg = redisConfig();
    store = cfg ? new UpstashStore(new Redis(cfg)) : new FileStore(dataDir());
  }
  return store;
}

/** True, wenn Daten auf diesem Host verloren gehen können (Vercel ohne Upstash). */
export function storeIsEphemeral() {
  return !redisConfig() && Boolean(process.env.VERCEL);
}
