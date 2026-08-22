export class ApiResponse {
  static success(res, message = 'Success', data = null, statusCode = 200, meta = null) {
    const responsePayload = {
      success: true,
      message,
      data,
    };
    if (meta) {
      responsePayload.meta = meta;
    }
    return res.status(statusCode).json(responsePayload);
  }

  static created(res, message = 'Resource created successfully', data = null) {
    return ApiResponse.success(res, message, data, 201);
  }

  static paginated(res, message = 'Success', data = [], pagination = {}) {
    return res.status(200).json({
      success: true,
      message,
      data,
      meta: {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        totalItems: pagination.totalItems || data.length,
        totalPages: Math.ceil((pagination.totalItems || data.length) / (pagination.limit || 10)) || 1,
        hasMore: (pagination.page * pagination.limit) < pagination.totalItems,
      },
    });
  }
}
