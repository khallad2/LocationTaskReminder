import { UserLocation } from '../entities/Location';
import { ILocationRepository } from '../repositories/ILocationRepository';

/**
 * GetCurrentLocationUseCase — Retrieves user's current GPS position.
 */
export class GetCurrentLocationUseCase {
  constructor(private locationRepository: ILocationRepository) {}

  async execute(): Promise<UserLocation> {
    const permissions = await this.locationRepository.getPermissionStatus();
    if (permissions.foreground !== 'granted') {
      await this.locationRepository.requestPermissions();
    }
    return this.locationRepository.getCurrentLocation();
  }
}
