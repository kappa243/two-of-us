
export enum ConnectionErrorType {
  NotConnected,
  FailedToConnect
};

export class ConnectionError extends Error {
  private errorType: ConnectionErrorType;

  constructor(type: ConnectionErrorType) {
    super();
    this.errorType = type;
  }

  getErrorType() {
    return this.errorType;
  }
};