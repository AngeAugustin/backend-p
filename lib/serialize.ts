type WithDates = {
  id: string;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  coverUrl?: string | null;
  imageUrl?: string | null;
};

export function serializeEntry<T extends WithDates>(entry: T) {
  const { coverUrl, ...rest } = entry;
  const coverSource = rest.imageUrl || coverUrl || null;
  return {
    ...rest,
    publishedAt: entry.publishedAt?.toISOString() ?? null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    cover: coverSource ? { url: coverSource } : null,
  };
}

export function listResponse<T>(data: T[]) {
  return {
    data,
    meta: {
      pagination: {
        page: 1,
        pageSize: data.length,
        pageCount: 1,
        total: data.length,
      },
    },
  };
}
