/**
 * ExpoLocationDataSource — Wraps expo-location for GPS access.
 * Handles web platform gracefully where location watching may not be supported.
 */
import * as ExpoLocation from 'expo-location';
import { Platform } from 'react-native';
import { UserLocation, LocationPermissionStatus } from '../../domain/entities/Location';
import { ILocationRepository } from '../../domain/repositories/ILocationRepository';

function mapCoords(loc: ExpoLocation.LocationObject): UserLocation {
  return {
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    altitude: loc.coords.altitude,
    accuracy: loc.coords.accuracy,
    heading: loc.coords.heading,
    speed: loc.coords.speed,
    timestamp: loc.timestamp,
  };
}

export class ExpoLocationDataSource implements ILocationRepository {
  async requestPermissions(): Promise<LocationPermissionStatus> {
    try {
      const fg = await ExpoLocation.requestForegroundPermissionsAsync();
      return {
        foreground: fg.status === 'granted' ? 'granted' : fg.status === 'denied' ? 'denied' : 'undetermined',
        background: 'undetermined',
      };
    } catch (err) {
      // On web, permissions may fail; treat as undetermined
      console.warn('[Location] Permission request failed:', err);
      return { foreground: 'undetermined', background: 'undetermined' };
    }
  }

  async getPermissionStatus(): Promise<LocationPermissionStatus> {
    try {
      const fg = await ExpoLocation.getForegroundPermissionsAsync();
      return {
        foreground: fg.status === 'granted' ? 'granted' : fg.status === 'denied' ? 'denied' : 'undetermined',
        background: 'undetermined',
      };
    } catch {
      return { foreground: 'undetermined', background: 'undetermined' };
    }
  }

  async getCurrentLocation(): Promise<UserLocation> {
    const location = await ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.Balanced,
    });
    return mapCoords(location);
  }

  async watchLocation(callback: (location: UserLocation) => void): Promise<() => void> {
    try {
      const subscription = await ExpoLocation.watchPositionAsync(
        {
          accuracy: ExpoLocation.Accuracy.Balanced,
          distanceInterval: 50,
          timeInterval: 10000,
        },
        (loc) => callback(mapCoords(loc)),
      );

      // Return a safe cleanup function
      return () => {
        try {
          if (subscription && typeof subscription.remove === 'function') {
            subscription.remove();
          }
        } catch (err) {
          console.warn('[Location] Subscription cleanup failed (safe to ignore):', err);
        }
      };
    } catch (err) {
      console.warn('[Location] watchPositionAsync failed:', err);
      // Return a no-op cleanup
      return () => {};
    }
  }
}
