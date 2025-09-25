import { GongRecords } from "../types/gong.js";

// Helper: build pagination query params from args
export function buildPaginationParams(args: { pageNumber?: number; pageSize?: number; cursor?: string }): Record<string, any> {
    const params: Record<string, any> = {};
    if (typeof args.pageNumber === 'number') params.pageNumber = args.pageNumber;
    if (typeof args.pageSize === 'number') params.pageSize = args.pageSize;
    if (typeof args.cursor === 'string' && args.cursor.length > 0) params.cursor = args.cursor;
    return params;
  }
  
// Helper: compute pagination metrics and render summary line
export function computeAndFormatPagination(records: GongRecords, fallbackPageNumber: number, fallbackPageSize: number, totalRecordsFromItems: number): { summary: string } {
    const totalRecords = typeof records.totalRecords === 'number' ? records.totalRecords : totalRecordsFromItems;
    const currentPage = typeof records.currentPageNumber === 'number' ? records.currentPageNumber : fallbackPageNumber;
    const currentPageSize = typeof records.currentPageSize === 'number' ? records.currentPageSize : fallbackPageSize;
    const totalPages = currentPageSize > 0 ? Math.ceil(totalRecords / currentPageSize) : undefined;
    const cursor = records.cursor as string | undefined;
    const hasMore = typeof totalPages === 'number' ? (currentPage + 1 < totalPages) : Boolean(cursor);
    const nextPageNumber = hasMore && typeof totalPages === 'number' ? currentPage + 1 : null;
  
    const summary = `Pagination: page ${currentPage}${typeof totalPages === 'number' ? ` of ${totalPages}` : ''}, size ${currentPageSize}, total ${totalRecords}` +
      `${nextPageNumber !== null ? `\nnextPageNumber: ${nextPageNumber}` : ''}` +
      `${cursor ? `\ncursor: ${cursor}` : ''}`;
    return { summary };
  }