// utils/redis.js

const inMemoryStore = new Map();

const redis = {
  async get(key) {
    const data = inMemoryStore.get(key);
    if (!data) return null;

    const { value, expiry } = data;

    if (Date.now() > expiry) {
      inMemoryStore.delete(key);
      return null;
    }

    return value;
  },

  async setex(key, ttlSeconds, value) {
    const expiry = Date.now() + ttlSeconds * 1000;
    inMemoryStore.set(key, { value, expiry });
  }
};

export default redis;
