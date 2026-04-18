export class ApiResponse {
    /**
     * Generate a response for the given data.
     * Detects the type of data and formats accordingly.
     *
     * @param data - The data to include in the response.
     * @param message - Optional message for create, update, or delete operations.
     * @param error - Optional error flag for create, update, or delete operations.
     * @param success - Optional success flag for create, update, or delete operations.
     */
    static prepare(data: any = null, message: string = '', error: any = null, success: boolean = true): object {
        if (Array.isArray(data)) {
            return {
                data: {
                    count: data.length,
                    data: data
                }
            };
        }

        if (data && typeof data === 'object') {
            return {
                data: data
            };
        }

        // For create, update, delete operations or when no data is passed
        return {
            data: {
                error: error,
                success: success,
                message: message
            }
        };
    }
}