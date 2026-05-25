/**
 * LocationRepositoryImpl — Delegates to ExpoLocationDataSource.
 */
import { UserLocation, LocationPermissionStatus } from '../../domain/entities/Location';
import { ILocationRepository } from '../../domain/repositories/ILocationRepository';
import { ExpoLocationDataSource } from '../datasources/location/ExpoLocationDataSource';

export class LocationRepositoryImpl implements ILocationRepository {
  private dataSource = new ExpoLocationDataSource();

  requestPermissions(): Promise<LocationPermissionStatus> {
    return this.dataSource.requestPermissions();
  }

  getCurrentLocation(): Promise<UserLocation> {
    return this.dataSource.getCurrentLocation();
  }

  watchLocation(callback: (location: UserLocation) => void): Promise<() => void> {
    return this.dataSource.watchLocation(callback);
  }

  getPermissionStatus(): Promise<LocationPermissionStatus> {
    return this.dataSource.getPermissionStatus();
  }
}
