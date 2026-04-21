export class ApiResponse<T> {
  success: boolean; 
  message: string;  
  data?: T;         
  error?: unknown;  

  constructor({
    success,
    message,
    data,
    error,
  }: {
    success: boolean;
    message: string;
    data?: T;
    error?: unknown;
  }) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.error = error;
  }

  static success<T>(message: string, data?: T): ApiResponse<T> {
    return new ApiResponse({
      success: true,
      message,
      data,
    });
  }

  static error(message: string, error?: unknown): ApiResponse<null> {
    return new ApiResponse({
      success: false,
      message,
      error,
    });
  }
}