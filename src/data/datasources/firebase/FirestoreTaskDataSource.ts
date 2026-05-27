/**
 * FirestoreTaskDataSource — Firestore CRUD + geohash-based spatial queries.
 * Implements the geohash query pattern from Firebase docs for proximity search.
 */
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  startAt,
  endAt,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Task, GeoPoint } from '../../../domain/entities/Task';
import { TaskDTO, toTask, toDTO } from '../../models/TaskDTO';
import { GeohashService } from '../../services/GeohashService';

const TASKS_COLLECTION = 'tasks';

export class FirestoreTaskDataSource {
  private geohashService = new GeohashService();

  async create(task: Omit<Task, 'id'>): Promise<Task> {
    const geohash = this.geohashService.encode(task.location);
    const dto = toDTO(task, geohash);
    const docRef = await addDoc(collection(db, TASKS_COLLECTION), dto);
    return toTask(docRef.id, dto);
  }

  async getByUser(userId: string): Promise<Task[]> {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => toTask(d.id, d.data() as TaskDTO));
  }

  async getById(taskId: string): Promise<Task | null> {
    const docSnap = await getDoc(doc(db, TASKS_COLLECTION, taskId));
    if (!docSnap.exists()) return null;
    return toTask(docSnap.id, docSnap.data() as TaskDTO);
  }

  /**
   * Geohash-based proximity query.
   * 1. Compute geohash bounds for the search radius
   * 2. Run parallel queries for each bound range
   * 3. Filter false positives by actual distance calculation
   * 4. Sort by distance ascending
   */
  async getNearby(userId: string, center: GeoPoint, radiusKm: number): Promise<Task[]> {
    const radiusMeters = radiusKm * 1000;
    const bounds = this.geohashService.getQueryBounds(center, radiusMeters);

    const queries = bounds.map((b) =>
      getDocs(
        query(
          collection(db, TASKS_COLLECTION),
          where('userId', '==', userId),
          where('status', '==', 'active'),
          orderBy('geohash'),
          startAt(b[0]),
          endAt(b[1]),
        ),
      ),
    );

    const snapshots = await Promise.all(queries);
    const tasks: (Task & { _distance: number })[] = [];

    for (const snap of snapshots) {
      for (const d of snap.docs) {
        const dto = d.data() as TaskDTO;
        const taskLocation: GeoPoint = { latitude: dto.lat, longitude: dto.lng };
        const distance = this.geohashService.distanceMeters(center, taskLocation);

        // Filter false positives — only include tasks within actual radius
        if (distance <= radiusMeters) {
          tasks.push({ ...toTask(d.id, dto), _distance: distance });
        }
      }
    }

    // De-duplicate (geohash ranges can overlap)
    const seen = new Set<string>();
    const unique = tasks.filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });

    // Sort by distance ascending
    return unique.sort((a, b) => a._distance - b._distance);
  }

  async update(task: Task): Promise<void> {
    const geohash = this.geohashService.encode(task.location);
    const dto = toDTO(task, geohash);
    await updateDoc(doc(db, TASKS_COLLECTION, task.id), {
      ...dto,
      updatedAt: Date.now(),
    });
  }

  async delete(taskId: string): Promise<void> {
    await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
  }

  async complete(taskId: string): Promise<void> {
    await updateDoc(doc(db, TASKS_COLLECTION, taskId), {
      status: 'completed',
      updatedAt: Date.now(),
    });
  }
}
