'use strict';

const getPagination = (query) => {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};

const buildSort = (query, allowedFields = []) => {
  if (!query.sortBy) return { createdAt: -1 };
  const field     = allowedFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
  const direction = query.sortOrder === 'asc' ? 1 : -1;
  return { [field]: direction };
};

module.exports = { getPagination, buildSort };