import { ILocationRepository } from '../repositories/ILocationRepository';
import { LocationPermissionStatus, UserLocation } from '../entities/Location';

export class RequestLocationPermissionsUseCase {
  constructor(private locationRepository: ILocationRepository) {}
  async execute(): Promise<LocationPermissionStatus> {
    return this.locationRepository.requestPermissions();
  }
}

export class WatchLocationUseCase {
  constructor(private locationRepository: ILocationRepository) {}
  async execute(callback: (location: UserLocation) => void): Promise<() => void> {
    return this.locationRepository.watchLocation(callback);
  }
}
