/**
 * GeohashService — Wraps geofire-common for geohash encoding and
 * range query bound computation.
 */
import {
  geohashForLocation,
  geohashQueryBounds,
  distanceBetween,
} from 'geofire-common';
import { GeoPoint } from '../../domain/entities/Task';

export class GeohashService {
  /**
   * Encode a lat/lng pair into a geohash string.
   */
  encode(point: GeoPoint): string {
    return geohashForLocation([point.latitude, point.longitude]);
  }

  /**
   * Compute the geohash query bounds for a radius-based filter.
   * Returns an array of [startHash, endHash] pairs.
   */
  getQueryBounds(center: GeoPoint, radiusMeters: number): [string, string][] {
    return geohashQueryBounds(
      [center.latitude, center.longitude],
      radiusMeters / 1000, // geofire-common expects km
    );
  }

  /**
   * Calculate distance between two points in meters.
   */
  distanceMeters(a: GeoPoint, b: GeoPoint): number {
    return (
      distanceBetween(
        [a.latitude, a.longitude],
        [b.latitude, b.longitude],
      ) * 1000 // geofire-common returns km
    );
  }
}
