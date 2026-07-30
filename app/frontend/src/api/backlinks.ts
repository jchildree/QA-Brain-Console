import { createRecordApi } from './client';
import { TYPES } from './relatedRecords';

export interface Backlink {
  type: string;
  id: string;
  filename: string;
}

export async function findBacklinks(targetId: string): Promise<Backlink[]> {
  const lists = await Promise.all(
    TYPES.map(({ type, urlSlug }) =>
      createRecordApi(urlSlug)
        .list()
        .then((records) =>
          records
            .filter((r) => Array.isArray(r.related_documents) && (r.related_documents as string[]).includes(targetId))
            .map((r) => ({ type, id: r.id, filename: r.filename }))
        )
    )
  );
  return lists.flat();
}
