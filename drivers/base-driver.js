/**
 * interface that all signature device drivers should implement (extend)
 * all child classes should implement this methods
 */
export class BaseDriver {
  connect() {}
  disconnect() {}
}
