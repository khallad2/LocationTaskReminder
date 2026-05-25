import { UserLocation, LocationPermissionStatus } from '../entities/Location';

/**
 * Location Repository Interface — Domain layer contract for GPS services.
 */
export interface ILocationRepository {
  requestPermissions(): Promise<LocationPermissionStatus>;
  getCurrentLocation(): Promise<UserLocation>;
  watchLocation(callback: (location: UserLocation) => void): Promise<() => void>;
  getPermissionStatus(): Promise<LocationPermissionStatus>;
}
